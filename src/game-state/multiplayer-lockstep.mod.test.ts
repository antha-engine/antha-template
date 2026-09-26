import {AssetLoader} from '@antha/asset';
import {AnthaEngine} from '@antha/engine';
import {EntityStore2d} from '@antha/entity-2d';
import {createMockPixi} from '@antha/graphics-2d';
import {
    createMultiplayerPlayerId,
    emptyApiAndRoomConnectionState,
    MultiplayerControllerClientStatusEvent,
    type ClientId,
} from '@antha/multiplayer-core';
import {
    MultiplayerControllerFrameEvent,
    P2pLockStepMultiplayerController,
} from '@antha/multiplayer-p2p-lock-step';
import {LocalPlayerPosition} from '@antha/util';
import {assert, assertWrap} from '@augment-vir/assert';
import {applyBrand, SeededRandom} from '@augment-vir/common';
import {describe, it} from '@augment-vir/test';
import {PlayerEntity, playerRadius} from '../player/player.entity.js';
import {type FullGameState} from './game-state.js';
import {multiplayerLockstepMod} from './multiplayer-lockstep.mod.js';
import {
    createStateSync,
    loadStateSync,
    MultiplayerPacketType,
    type MultiplayerPacket,
} from './multiplayer-packet.js';

const playerIds = {
    blue: createMultiplayerPlayerId({
        clientId: applyBrand<ClientId>('c_blue'),
        playerPosition: LocalPlayerPosition.One,
    }),
    green: createMultiplayerPlayerId({
        clientId: applyBrand<ClientId>('c_green'),
        playerPosition: LocalPlayerPosition.One,
    }),
};

async function createMultiplayerSimulation(
    {
        roomId,
    }: Readonly<{
        roomId?: string | undefined;
    }> = {
        roomId: 'test-room',
    },
) {
    const controller = new P2pLockStepMultiplayerController<MultiplayerPacket>({
        gameId: 'multiplayer-simulation-test',
    });

    controller.startSingleplayer();
    if (roomId) {
        Object.defineProperty(controller, 'roomId', {
            configurable: true,
            get() {
                return roomId;
            },
        });
    }

    const engine = new AnthaEngine<FullGameState>({
        hostElement: document.createElement('div'),
        initState: {
            menuState: {
                activeMenu: undefined,
                returnTo: [],
            },
            multiplayerP2pLockStep: {
                connectionState: emptyApiAndRoomConnectionState,
                multiplayerController: controller,
            },
            players: {},
            seededRandom: SeededRandom.fromSeed('multiplayer-simulation-test'),
        },
        mods: [
            multiplayerLockstepMod,
        ],
    });
    const entityStore = new EntityStore2d({
        assetLoader: new AssetLoader(),
        pixi: createMockPixi(),
        state: engine.state,
    });

    engine.state.entityStore = entityStore;

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

    engine.state.players = {
        [playerIds.blue]: {
            clientId: applyBrand<ClientId>('c_blue'),
            playerEntity: bluePlayer,
            playerPosition: LocalPlayerPosition.One,
        },
        [playerIds.green]: {
            clientId: applyBrand<ClientId>('c_green'),
            playerEntity: greenPlayer,
            playerPosition: LocalPlayerPosition.One,
        },
    };

    return {
        bluePlayer,
        controller,
        engine,
        entityStore,
        greenPlayer,
        state: engine.state,
    };
}

function createMultiplayerFrameEvent(actions: ReadonlyArray<MultiplayerPacket>) {
    return new MultiplayerControllerFrameEvent<MultiplayerPacket>({
        detail: {
            packets: actions.map((packet) => {
                return {
                    packet,
                    sourceClientId: applyBrand<ClientId>('c_blue'),
                };
            }),
        },
    });
}

describe(multiplayerLockstepMod.modName, () => {
    it('removes the players of lost peers', async () => {
        const simulation = await createMultiplayerSimulation();
        const lostClientId = applyBrand<ClientId>('c_lost');
        const lifecyclePackets: MultiplayerPacket[] = [];

        simulation.controller.listen(MultiplayerControllerFrameEvent, ({detail}) => {
            lifecyclePackets.push(
                ...detail.packets.map(({packet}) => {
                    return packet;
                }),
            );
        });

        try {
            simulation.engine.dispatch(
                new MultiplayerControllerClientStatusEvent({
                    detail: {
                        lostMember: lostClientId,
                    },
                }),
            );
            await simulation.engine.runSingleTick();
            simulation.controller.runFrame();

            assert.deepEquals(lifecyclePackets, [
                {
                    clientId: lostClientId,
                    type: MultiplayerPacketType.DespawnPlayers,
                },
            ]);
        } finally {
            simulation.controller.destroy();
            simulation.entityStore.destroy();
        }
    });

    it('loads the host state into a joining peer', async () => {
        const hostSimulation = await createMultiplayerSimulation();
        const joiningSimulation = await createMultiplayerSimulation();

        try {
            hostSimulation.bluePlayer.params.x = 321;
            hostSimulation.state.seededRandom?.next();
            joiningSimulation.bluePlayer.immediatelyDestroy();

            await loadStateSync({
                state: joiningSimulation.state,
                stateSync: createStateSync(hostSimulation.state),
            });

            assert.deepEquals(
                {
                    entityHash: joiningSimulation.entityStore.hashEntities(),
                    playerIds: Object.keys(joiningSimulation.state.players || {}),
                    randomState: joiningSimulation.state.seededRandom?.exportState(),
                },
                {
                    entityHash: hostSimulation.entityStore.hashEntities(),
                    playerIds: [
                        playerIds.blue,
                        playerIds.green,
                    ],
                    randomState: hostSimulation.state.seededRandom?.exportState(),
                },
            );
        } finally {
            hostSimulation.controller.destroy();
            hostSimulation.entityStore.destroy();
            joiningSimulation.controller.destroy();
            joiningSimulation.entityStore.destroy();
        }
    });

    it('simulates singleplayer frames', async () => {
        const singleplayerSimulation = await createMultiplayerSimulation({
            roomId: undefined,
        });

        try {
            singleplayerSimulation.greenPlayer.params.x = 100 + playerRadius;
            singleplayerSimulation.engine.dispatch(createMultiplayerFrameEvent([]));
            await singleplayerSimulation.engine.runSingleTick();

            assert.isBelow(singleplayerSimulation.bluePlayer.params.x, 100);
            assert.isAbove(singleplayerSimulation.greenPlayer.params.x, 100 + playerRadius);
            assert.strictEquals(singleplayerSimulation.controller.frameCount, 1);
        } finally {
            singleplayerSimulation.controller.destroy();
            singleplayerSimulation.entityStore.destroy();
        }
    });

    it('simulates batched multiplayer frames individually', async () => {
        const batchedSimulation = await createMultiplayerSimulation();
        const separateSimulation = await createMultiplayerSimulation();
        const firstFrameActions = [
            {
                playerPosition: LocalPlayerPosition.One,
                type: MultiplayerPacketType.PlayerMovement,
                x: 18,
                y: 0,
            },
        ] satisfies ReadonlyArray<MultiplayerPacket>;

        try {
            batchedSimulation.engine.dispatch(createMultiplayerFrameEvent(firstFrameActions));
            batchedSimulation.engine.dispatch(createMultiplayerFrameEvent([]));
            await batchedSimulation.engine.runSingleTick();

            separateSimulation.engine.dispatch(createMultiplayerFrameEvent(firstFrameActions));
            await separateSimulation.engine.runSingleTick();
            separateSimulation.engine.dispatch(createMultiplayerFrameEvent([]));
            await separateSimulation.engine.runSingleTick();

            assert.deepEquals(
                {
                    bluePlayer: batchedSimulation.bluePlayer.params,
                    greenPlayer: batchedSimulation.greenPlayer.params,
                    randomState: assertWrap
                        .isDefined(batchedSimulation.state.seededRandom)
                        .exportState(),
                    simulationTick: batchedSimulation.controller.frameCount,
                },
                {
                    bluePlayer: separateSimulation.bluePlayer.params,
                    greenPlayer: separateSimulation.greenPlayer.params,
                    randomState: assertWrap
                        .isDefined(separateSimulation.state.seededRandom)
                        .exportState(),
                    simulationTick: separateSimulation.controller.frameCount,
                },
            );
            assert.deepEquals(
                [
                    batchedSimulation.controller.frameCount,
                    separateSimulation.controller.frameCount,
                ],
                [
                    2,
                    2,
                ],
            );
            assert.isBelow(batchedSimulation.bluePlayer.params.x, 100);
            assert.isAbove(batchedSimulation.greenPlayer.params.x, 100 + playerRadius * 2);
        } finally {
            batchedSimulation.controller.destroy();
            batchedSimulation.entityStore.destroy();
            separateSimulation.controller.destroy();
            separateSimulation.entityStore.destroy();
        }
    });
});
