import {AssetLoader} from '@antha/asset';
import {
    AnthaEngine,
    ModExecutionTriggerType,
    type ModExecuteParams,
    type ModInstanceId,
} from '@antha/engine';
import {EntityStore2d} from '@antha/entity-2d';
import {createMockPixi} from '@antha/graphics-2d';
import {
    createMultiplayerPlayerId,
    emptyApiAndRoomConnectionState,
    type ClientId,
} from '@antha/multiplayer-core';
import {P2pLockStepMultiplayerController} from '@antha/multiplayer-p2p-lock-step';
import {assert, assertWrap, check} from '@augment-vir/assert';
import {applyBrand, getObjectTypedValues, SeededRandom, type AnyObject} from '@augment-vir/common';
import {describe, it} from '@augment-vir/test';
import {Graphics} from 'pixi.js';
import {LocalPlayerPosition, type FullGameState, type GameState} from '../game-state/game-state.js';
import {clampToGameWorld, gameWorldSize} from '../game-state/game-world.js';
import {type MultiplayerPacket} from '../game-state/multiplayer-packet.js';
import {clampPlayer, PlayerEntity, playerRadius} from './player.entity.js';

const localClientId = applyBrand<ClientId>('c_blue');

const playerIds = {
    blue: createMultiplayerPlayerId({
        clientId: localClientId,
        playerPosition: LocalPlayerPosition.One,
    }),
    green: createMultiplayerPlayerId({
        clientId: applyBrand<ClientId>('c_green'),
        playerPosition: LocalPlayerPosition.Two,
    }),
};

function createEntityUpdateParams<State extends AnyObject>({
    msSinceLastExecute,
    state,
}: Readonly<{
    msSinceLastExecute: number;
    state: Partial<State>;
}>) {
    const engine = new AnthaEngine();

    return {
        currentTick: 0,
        engine,
        executionTrigger: {
            type: ModExecutionTriggerType.Tick,
        },
        hostElement: document.createElement('div'),
        lastExecution: undefined,
        modInstanceId: applyBrand<ModInstanceId>('player-entity-test'),
        msSinceLastExecute,
        state,
        ticksSinceLastExecute: 0,
        trigger: undefined,
    } satisfies ModExecuteParams<State>;
}

function createPlayerEntityStore({
    isMultiplayerRoomConnected = false,
}: Readonly<{
    isMultiplayerRoomConnected?: boolean | undefined;
}> = {}) {
    const controller = new P2pLockStepMultiplayerController<MultiplayerPacket>({
        gameId: 'player-collision-test',
    });

    controller.startSingleplayer();
    if (isMultiplayerRoomConnected) {
        Object.defineProperty(controller, 'roomId', {
            configurable: true,
            get() {
                return 'test-room';
            },
        });
    }
    const state = {
        menuState: {
            activeMenu: undefined,
            returnTo: [],
        },
        players: {},
        saveState: undefined,
        seededRandom: SeededRandom.fromSeed('player collision test'),
        multiplayerP2pLockStep: {
            connectionState: emptyApiAndRoomConnectionState,
            multiplayerController: controller,
        },
    } satisfies GameState & Pick<FullGameState, 'multiplayerP2pLockStep'>;

    return {
        controller,
        entityStore: new EntityStore2d({
            assetLoader: new AssetLoader(),
            pixi: createMockPixi(),
            state,
        }),
        state,
    };
}

describe('player collisions', () => {
    it('gives local players distinct colors', async () => {
        const {controller, entityStore} = createPlayerEntityStore();

        try {
            const playerColors = await Promise.all(
                getObjectTypedValues(LocalPlayerPosition).map(async (playerPosition, index) => {
                    const player = await entityStore.addEntity(PlayerEntity, {
                        playerId: createMultiplayerPlayerId({
                            clientId: localClientId,
                            playerPosition,
                        }),
                        x: 100 + index * playerRadius * 3,
                        y: 100,
                    });

                    assert.instanceOf(player.view, Graphics);
                    const fillStyle = assertWrap.isDefined(player.view.context.instructions[0]).data
                        .style;

                    return check.isNumber(fillStyle) ? fillStyle : fillStyle.color;
                }),
            );

            assert.strictEquals(new Set(playerColors).size, playerColors.length);
        } finally {
            controller.destroy();
        }
    });

    it('updates visual positions without delaying authoritative positions', async () => {
        const {controller, entityStore, state} = createPlayerEntityStore();

        try {
            const player = await entityStore.addEntity(PlayerEntity, {
                playerId: playerIds.blue,
                x: 100,
                y: 100,
            });

            player.params.x = 200;
            player.params.y = 300;

            await entityStore.updateAllEntities(
                createEntityUpdateParams({
                    msSinceLastExecute: 0,
                    state,
                }),
            );

            assert.deepEquals(
                {
                    hitbox: {
                        x: assertWrap.isDefined(player.hitbox).x,
                        y: assertWrap.isDefined(player.hitbox).y,
                    },
                    params: player.params,
                    view: {
                        x: player.view.x,
                        y: player.view.y,
                    },
                },
                {
                    hitbox: {
                        x: 200,
                        y: 300,
                    },
                    params: {
                        playerId: playerIds.blue,
                        x: 200,
                        y: 300,
                    },
                    view: {
                        x: 100,
                        y: 100,
                    },
                },
            );

            player.render({
                msSinceLastExecute: 15,
            });

            assert.deepEquals(
                {
                    x: player.view.x,
                    y: player.view.y,
                },
                {
                    x: 150,
                    y: 200,
                },
            );
        } finally {
            controller.destroy();
        }
    });

    it('separates overlapping players through the entity collision suite', async () => {
        const {controller, entityStore, state} = createPlayerEntityStore();

        try {
            const bluePlayer = await entityStore.addEntity(PlayerEntity, {
                playerId: playerIds.blue,
                x: 100,
                y: 100,
            });
            const greenPlayer = await entityStore.addEntity(PlayerEntity, {
                playerId: playerIds.green,
                x: 100 + playerRadius,
                y: 100,
            });
            const expectedSeededRandom = state.seededRandom.clone();

            expectedSeededRandom.next();

            await entityStore.updateAllEntities(
                createEntityUpdateParams({
                    msSinceLastExecute: 0,
                    state,
                }),
            );

            assert.deepEquals(
                {
                    bluePlayer: bluePlayer.params,
                    greenPlayer: greenPlayer.params,
                },
                {
                    bluePlayer: {
                        playerId: playerIds.blue,
                        x: 91,
                        y: 100,
                    },
                    greenPlayer: {
                        playerId: playerIds.green,
                        x: 127,
                        y: 100,
                    },
                },
            );
            assert.deepEquals(state.seededRandom.exportState(), expectedSeededRandom.exportState());
        } finally {
            controller.destroy();
        }
    });

    it('separates overlapping players while in a multiplayer room', async () => {
        const {controller, entityStore, state} = createPlayerEntityStore({
            isMultiplayerRoomConnected: true,
        });

        try {
            const bluePlayer = await entityStore.addEntity(PlayerEntity, {
                playerId: playerIds.blue,
                x: 100,
                y: 100,
            });
            const greenPlayer = await entityStore.addEntity(PlayerEntity, {
                playerId: playerIds.green,
                x: 100 + playerRadius,
                y: 100,
            });
            const expectedSeededRandom = state.seededRandom.clone();

            expectedSeededRandom.next();

            await entityStore.updateAllEntities(
                createEntityUpdateParams({
                    msSinceLastExecute: 20,
                    state,
                }),
            );

            assert.deepEquals(
                {
                    bluePlayer: bluePlayer.params,
                    greenPlayer: greenPlayer.params,
                    randomState: state.seededRandom.exportState(),
                },
                {
                    bluePlayer: {
                        playerId: playerIds.blue,
                        x: 91,
                        y: 100,
                    },
                    greenPlayer: {
                        playerId: playerIds.green,
                        x: 127,
                        y: 100,
                    },
                    randomState: expectedSeededRandom.exportState(),
                },
            );
        } finally {
            controller.destroy();
        }
    });

    it('does not move players when their hitboxes only touch', async () => {
        const {controller, entityStore, state} = createPlayerEntityStore();

        try {
            const bluePlayer = await entityStore.addEntity(PlayerEntity, {
                playerId: playerIds.blue,
                x: 100,
                y: 100,
            });
            const greenPlayer = await entityStore.addEntity(PlayerEntity, {
                playerId: playerIds.green,
                x: 100 + playerRadius * 2,
                y: 100,
            });

            await entityStore.updateAllEntities(
                createEntityUpdateParams({
                    msSinceLastExecute: 0,
                    state,
                }),
            );

            assert.deepEquals(
                {
                    bluePlayer: bluePlayer.params,
                    greenPlayer: greenPlayer.params,
                },
                {
                    bluePlayer: {
                        playerId: playerIds.blue,
                        x: 100,
                        y: 100,
                    },
                    greenPlayer: {
                        playerId: playerIds.green,
                        x: 100 + playerRadius * 2,
                        y: 100,
                    },
                },
            );
        } finally {
            controller.destroy();
        }
    });

    it('adds a quickly decaying bounce after separating colliding players', async () => {
        const {controller, entityStore, state} = createPlayerEntityStore();

        try {
            const bluePlayer = await entityStore.addEntity(PlayerEntity, {
                playerId: playerIds.blue,
                x: 100,
                y: 100,
            });
            const greenPlayer = await entityStore.addEntity(PlayerEntity, {
                playerId: playerIds.green,
                x: 100 + playerRadius,
                y: 100,
            });

            await entityStore.updateAllEntities(
                createEntityUpdateParams({
                    msSinceLastExecute: 0,
                    state,
                }),
            );

            const positionsAfterCollision = {
                blue: bluePlayer.params.x,
                green: greenPlayer.params.x,
            };

            await entityStore.updateAllEntities(
                createEntityUpdateParams({
                    msSinceLastExecute: 20,
                    state,
                }),
            );

            const positionsAfterFirstBounceUpdate = {
                blue: bluePlayer.params.x,
                green: greenPlayer.params.x,
            };

            await entityStore.updateAllEntities(
                createEntityUpdateParams({
                    msSinceLastExecute: 20,
                    state,
                }),
            );

            assert.isAbove(positionsAfterCollision.blue, positionsAfterFirstBounceUpdate.blue);
            assert.isAbove(positionsAfterFirstBounceUpdate.green, positionsAfterCollision.green);
            assert.isBelow(
                Math.abs(positionsAfterFirstBounceUpdate.blue - bluePlayer.params.x),
                Math.abs(positionsAfterCollision.blue - positionsAfterFirstBounceUpdate.blue),
            );
            assert.isBelow(
                Math.abs(positionsAfterFirstBounceUpdate.green - greenPlayer.params.x),
                Math.abs(positionsAfterFirstBounceUpdate.green - positionsAfterCollision.green),
            );
        } finally {
            controller.destroy();
        }
    });

    it('clamps player positions to the shared game world', () => {
        assert.deepEquals(
            {
                maximum: clampPlayer({
                    position: {
                        x: gameWorldSize.width + 1,
                        y: gameWorldSize.height + 1,
                    },
                }),
                minimum: clampPlayer({
                    position: {
                        x: -1,
                        y: -1,
                    },
                }),
                withoutOffset: clampToGameWorld({
                    position: {
                        x: -1,
                        y: gameWorldSize.height + 1,
                    },
                }),
            },
            {
                maximum: {
                    x: gameWorldSize.width - playerRadius,
                    y: gameWorldSize.height - playerRadius,
                },
                minimum: {
                    x: playerRadius,
                    y: playerRadius,
                },
                withoutOffset: {
                    x: 0,
                    y: gameWorldSize.height,
                },
            },
        );
    });

    it('accumulates collision bounces and clears them after their durations elapse', async () => {
        const {controller, entityStore, state} = createPlayerEntityStore();

        try {
            const bluePlayer = await entityStore.addEntity(PlayerEntity, {
                playerId: playerIds.blue,
                x: 100,
                y: 100,
            });
            const greenPlayer = await entityStore.addEntity(PlayerEntity, {
                playerId: playerIds.green,
                x: 100 + playerRadius,
                y: 100,
            });

            await entityStore.updateAllEntities(
                createEntityUpdateParams({
                    msSinceLastExecute: 0,
                    state,
                }),
            );

            greenPlayer.params.x = bluePlayer.params.x + playerRadius;

            await entityStore.updateAllEntities(
                createEntityUpdateParams({
                    msSinceLastExecute: 0,
                    state,
                }),
            );

            const positionsBeforeStackedBounce = {
                blue: bluePlayer.params.x,
                green: greenPlayer.params.x,
            };

            await entityStore.updateAllEntities(
                createEntityUpdateParams({
                    msSinceLastExecute: 20,
                    state,
                }),
            );

            assert.isAbove(Math.abs(bluePlayer.params.x - positionsBeforeStackedBounce.blue), 10);
            assert.isAbove(Math.abs(greenPlayer.params.x - positionsBeforeStackedBounce.green), 10);

            await entityStore.updateAllEntities(
                createEntityUpdateParams({
                    msSinceLastExecute: 160,
                    state,
                }),
            );

            const positionsAfterBounceExpiry = {
                blue: bluePlayer.params.x,
                green: greenPlayer.params.x,
            };

            await entityStore.updateAllEntities(
                createEntityUpdateParams({
                    msSinceLastExecute: 20,
                    state,
                }),
            );

            assert.deepEquals(
                {
                    blue: bluePlayer.params.x,
                    green: greenPlayer.params.x,
                },
                positionsAfterBounceExpiry,
            );
        } finally {
            controller.destroy();
        }
    });
});
