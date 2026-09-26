import {type ModExecuteParams} from '@antha/engine';
import {
    position2dParamsShape,
    type BaseEntity2d,
    type Collision,
    type ViewCreation2d,
} from '@antha/entity-2d';
import {Graphics} from '@antha/graphics-2d';
import {
    extractMultiplayerPlayerIdParts,
    multiplayerPlayerIdShape,
    type MultiplayerPlayerId,
} from '@antha/multiplayer-core';
import {selectItemByHash} from '@antha/util';
import {assertWrap} from '@augment-vir/assert';
import {clamp, getObjectTypedValues, type AtLeastTuple, type Coords} from '@augment-vir/common';
import {Circle} from 'detect-collisions';
import {getGamepads} from 'input-device-handler';
import {intersectShape} from 'object-shape-tester';
import {GameAudioKey, playGameAudio} from '../audio/game-audio.js';
import {playerGamepadDeviceKeys} from '../game-state/default-bindings.js';
import {defineEntity} from '../game-state/game-entity.mod.js';
import {LocalPlayerPosition} from '../game-state/game-state.js';
import {clampToGameWorld} from '../game-state/game-world.js';

export const playerRadius = 18;

export function clampPlayer({
    position,
}: Readonly<{
    position: Coords;
}>) {
    return clampToGameWorld({
        edgeOffset: playerRadius,
        position,
    });
}

const playerColorPalette = [
    '#14d7fe',
    '#30d158',
    '#ff9f0a',
    '#ff2d55',
    '#bf5af2',
    '#ffd60a',
    '#0067a5',
    '#be0032',
    '#008856',
    '#b3446c',
    '#8db600',
    '#264653',
    '#f99379',
    '#604e97',
    '#a66a00',
    '#848482',
] as const satisfies Readonly<AtLeastTuple<string, 4>>;

const playerCollisionBounceSpeedPxPerMs = 3;
const playerCollisionBounceDurationMs = 160;
const playerCollisionBounceDecayMs = 40;
/** Softens lockstep position changes without affecting authoritative state. */
const playerRenderInterpolationDurationMs = 30;

const playerCollisionAudio = [
    GameAudioKey.PlayerCollisionOne,
    GameAudioKey.PlayerCollisionTwo,
    GameAudioKey.PlayerCollisionThree,
] as const satisfies ReadonlyArray<GameAudioKey>;

function selectPlayerColor({playerId}: Readonly<{playerId: MultiplayerPlayerId}>) {
    const playerIdParts = extractMultiplayerPlayerIdParts({
        playerId,
    });
    const playerPosition = assertWrap.isEnumValue(
        playerIdParts.playerPosition,
        LocalPlayerPosition,
    );
    const firstColor = selectItemByHash({
        items: playerColorPalette,
        key: playerIdParts.clientId,
    });
    const firstColorIndex = playerColorPalette.indexOf(firstColor);
    const playerPositionIndex = getObjectTypedValues(LocalPlayerPosition).indexOf(playerPosition);

    return assertWrap.isDefined(
        playerColorPalette[(firstColorIndex + playerPositionIndex) % playerColorPalette.length],
    );
}

/** Converts a player entity collision into a vector for bouncing the entities apart. */
function createPlayerCollisionOverlapVector({
    collision,
    firstPlayerId,
    secondPlayerId,
}: Readonly<{
    collision: Readonly<Collision>;
    firstPlayerId: string;
    secondPlayerId: string;
}>) {
    if (collision.overlapV.x || collision.overlapV.y) {
        return collision.overlapV;
    }

    return {
        x: firstPlayerId.localeCompare(secondPlayerId) < 0 ? collision.overlap : -collision.overlap,
        y: 0,
    };
}

function createPlayerCollisionBounceVector({
    overlapVector,
}: Readonly<{
    overlapVector: Coords;
}>) {
    const overlapMagnitude = Math.hypot(overlapVector.x, overlapVector.y);

    return {
        x: (-overlapVector.x / overlapMagnitude) * playerCollisionBounceSpeedPxPerMs,
        y: (-overlapVector.y / overlapMagnitude) * playerCollisionBounceSpeedPxPerMs,
    };
}

/** The player's entity. Handles collision and rendering. */
export class PlayerEntity extends defineEntity({
    key: 'PlayerEntity',
    paramsShape: intersectShape(position2dParamsShape, {
        playerId: multiplayerPlayerIdShape,
    }),
    paramsMap: {
        hitbox: {
            x: true,
            y: true,
        },
    },
    collidesWith: {
        collidesWithSelf: true,
    },
}) {
    protected bounceVectors: Array<Coords & {remainingDurationMs: number}> = [];

    public override createView(): ViewCreation2d {
        return {
            hitbox: new Circle(
                {
                    x: 0,
                    y: 0,
                },
                playerRadius,
            ),
            view: new Graphics({
                position: {
                    x: this.params.x,
                    y: this.params.y,
                },
            })
                .clear()
                .circle(0, 0, playerRadius)
                .fill({
                    color: selectPlayerColor({
                        playerId: this.params.playerId,
                    }),
                })
                .stroke({
                    color: '#eee',
                    width: 4,
                }),
        };
    }

    public override update({msSinceLastExecute}: Readonly<ModExecuteParams>) {
        this.bounceVectors = this.bounceVectors.flatMap((bounceVector) => {
            const bounceElapsedMs = Math.min(msSinceLastExecute, bounceVector.remainingDurationMs);
            const decayMultiplier = Math.exp(-bounceElapsedMs / playerCollisionBounceDecayMs);
            const bounceDistanceMultiplier = playerCollisionBounceDecayMs * (1 - decayMultiplier);
            const remainingDurationMs = bounceVector.remainingDurationMs - bounceElapsedMs;

            this.params.x += bounceVector.x * bounceDistanceMultiplier;
            this.params.y += bounceVector.y * bounceDistanceMultiplier;

            return remainingDurationMs > 0
                ? [
                      {
                          ...bounceVector,
                          remainingDurationMs,
                          x: bounceVector.x * decayMultiplier,
                          y: bounceVector.y * decayMultiplier,
                      },
                  ]
                : [];
        });
        this.clampPosition();
    }

    /** Advances only the Pixi view toward this player's authoritative position. */
    public override render({
        msSinceLastExecute,
    }: Readonly<Pick<ModExecuteParams, 'msSinceLastExecute'>>) {
        const interpolationProgress = clamp(
            msSinceLastExecute / playerRenderInterpolationDurationMs,
            {
                min: 0,
                max: 1,
            },
        );

        this.view.x += (this.params.x - this.view.x) * interpolationProgress;
        this.view.y += (this.params.y - this.view.y) * interpolationProgress;
    }

    public override collide(otherEntity: BaseEntity2d, collision: Readonly<Collision>): void {
        if (!(otherEntity instanceof PlayerEntity) || !collision.overlap) {
            return;
        }

        const overlapVector = createPlayerCollisionOverlapVector({
            collision,
            firstPlayerId: this.params.playerId,
            secondPlayerId: otherEntity.params.playerId,
        });

        this.params.x -= overlapVector.x / 2;
        this.params.y -= overlapVector.y / 2;
        this.clampPosition();
        const collisionBounceVector = createPlayerCollisionBounceVector({
            overlapVector,
        });

        this.bounceVectors = [
            ...this.bounceVectors,
            {
                remainingDurationMs: playerCollisionBounceDurationMs,
                x: collisionBounceVector.x,
                y: collisionBounceVector.y,
            },
        ];

        if (this.params.playerId.localeCompare(otherEntity.params.playerId) < 0) {
            const collisionAudio = assertWrap.isDefined(
                playerCollisionAudio[
                    Math.floor(this.state.seededRandom.next() * playerCollisionAudio.length)
                ],
            );

            void playGameAudio(this.state, collisionAudio);
        }

        this.vibrateController();
    }

    protected clampPosition() {
        const position = clampPlayer({
            position: {
                x: this.params.x,
                y: this.params.y,
            },
        });

        this.params.x = position.x;
        this.params.y = position.y;
    }

    protected vibrateController() {
        const localClientId = this.state.multiplayerP2pLockStep.multiplayerController.getClientId();
        const playerIdParts = extractMultiplayerPlayerIdParts({
            playerId: this.params.playerId,
        });
        const playerPosition = assertWrap.isEnumValue(
            playerIdParts.playerPosition,
            LocalPlayerPosition,
        );

        if (!localClientId || playerIdParts.clientId !== localClientId) {
            return;
        }

        const gamepad = getGamepads()[playerGamepadDeviceKeys[playerPosition]];

        if (!gamepad?.vibrationActuator) {
            return;
        }

        void gamepad.vibrationActuator
            .playEffect('dual-rumble', {
                duration: 100,
                strongMagnitude: 0.5,
                weakMagnitude: 0.5,
            })
            .catch(() => {});
    }
}
