import {AssetLoader} from '@antha/asset';
import {
    AnthaEngine,
    createEngineTime,
    type ModExecuteParams,
    type ModInstanceId,
} from '@antha/engine';
import {EntityStore2d} from '@antha/entity-2d';
import {createMockPixi} from '@antha/graphics-2d';
import {emptyApiAndRoomConnectionState, type ClientId} from '@antha/multiplayer-core';
import {P2pLockStepMultiplayerController} from '@antha/multiplayer-p2p-lock-step';
import {assert, assertWrap, check} from '@augment-vir/assert';
import {applyBrand, getObjectTypedValues, SeededRandom, type AnyObject} from '@augment-vir/common';
import {describe, it} from '@augment-vir/test';
import {Graphics} from 'pixi.js';
import {LocalPlayerPosition, type FullGameState, type GameState} from '../game-state/game-state.js';
import {type MultiplayerPacket} from '../game-state/multiplayer-packet.js';
import {createPlayerId} from './player-id.js';
import {PlayerEntity, playerRadius} from './player.entity.js';

const localClientId = applyBrand<ClientId>('c_blue');

const playerIds = {
    blue: createPlayerId({
        clientId: localClientId,
        playerPosition: LocalPlayerPosition.One,
    }),
    green: createPlayerId({
        clientId: applyBrand<ClientId>('c_green'),
        playerPosition: LocalPlayerPosition.Two,
    }),
};

function createEntityUpdateParams<State extends AnyObject>({
    engineTime = 0,
    msSinceLastExecute,
    state,
}: Readonly<{
    engineTime?: number;
    msSinceLastExecute: number;
    state: Partial<State>;
}>) {
    const engine = new AnthaEngine();

    engine.engineTime = createEngineTime({
        milliseconds: engineTime,
    });

    return {
        currentTick: 0,
        engine,
        executeImmediately: false,
        frequency: undefined,
        hostElement: document.createElement('div'),
        lastExecution: undefined,
        modInstanceId: applyBrand<ModInstanceId>('player-entity-test'),
        msSinceLastExecute,
        state,
        ticksSinceLastExecute: 0,
    } satisfies ModExecuteParams<State>;
}

function createPlayerEntityStore() {
    const controller = new P2pLockStepMultiplayerController<MultiplayerPacket>({
        gameId: 'player-collision-test',
    });

    controller.startSingleplayer();
    const state = {
        menuState: {
            activeMenu: undefined,
            returnTo: undefined,
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
                        playerId: createPlayerId({
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

    it('interpolates visual positions without delaying authoritative positions', async () => {
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
                    engineTime: 0,
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

            await entityStore.updateAllEntities(
                createEntityUpdateParams({
                    engineTime: 5,
                    msSinceLastExecute: 0,
                    state,
                }),
            );

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

    it('keeps collision bounces within the screen', async () => {
        const {controller, entityStore, state} = createPlayerEntityStore();

        try {
            entityStore.pixi.screen.height = playerRadius * 4;
            entityStore.pixi.screen.width = playerRadius * 4;
            const bluePlayer = await entityStore.addEntity(PlayerEntity, {
                playerId: playerIds.blue,
                x: playerRadius,
                y: playerRadius * 2,
            });
            const greenPlayer = await entityStore.addEntity(PlayerEntity, {
                playerId: playerIds.green,
                x: playerRadius * 2,
                y: playerRadius * 2,
            });

            await entityStore.updateAllEntities(
                createEntityUpdateParams({
                    msSinceLastExecute: 0,
                    state,
                }),
            );
            await entityStore.updateAllEntities(
                createEntityUpdateParams({
                    msSinceLastExecute: 160,
                    state,
                }),
            );

            assert.deepEquals(
                {
                    blue: bluePlayer.params,
                    green: greenPlayer.params,
                },
                {
                    blue: {
                        playerId: playerIds.blue,
                        x: playerRadius,
                        y: playerRadius * 2,
                    },
                    green: {
                        playerId: playerIds.green,
                        x: playerRadius * 3,
                        y: playerRadius * 2,
                    },
                },
            );
        } finally {
            controller.destroy();
        }
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
