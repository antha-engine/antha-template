import {AssetLoader} from '@antha/asset';
import {AnthaEngine} from '@antha/engine';
import {EntityStore2d} from '@antha/entity-2d';
import {createMockPixi} from '@antha/graphics-2d';
import {emptyApiAndRoomConnectionState, type ClientId} from '@antha/multiplayer-core';
import {
    MultiplayerControllerFrameEvent,
    P2pLockStepMultiplayerController,
} from '@antha/multiplayer-p2p-lock-step';
import {assert, assertWrap} from '@augment-vir/assert';
import {applyBrand, SeededRandom} from '@augment-vir/common';
import {describe, it} from '@augment-vir/test';
import {createPlayerId} from '../player/player-id.js';
import {PlayerEntity, playerRadius} from '../player/player.entity.js';
import {LocalPlayerPosition, type FullGameState} from './game-state.js';
import {multiplayerLockstepMod} from './multiplayer-lockstep.mod.js';
import {MultiplayerPacketType, type MultiplayerPacket} from './multiplayer-packet.js';

const playerIds = {
    blue: createPlayerId({
        clientId: applyBrand<ClientId>('c_blue'),
        playerPosition: LocalPlayerPosition.One,
    }),
    green: createPlayerId({
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
            disableEntityUpdates: true,
            menuState: {
                activeMenu: undefined,
                returnTo: undefined,
            },
            multiplayerLockstepTick: 0,
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
        detail: actions.map((packet) => {
            return {
                packet,
                sourceClientId: applyBrand<ClientId>('c_blue'),
            };
        }),
    });
}

describe(multiplayerLockstepMod.modName, () => {
    it('applies local frames without running multiplayer entity simulation', async () => {
        const singleplayerSimulation = await createMultiplayerSimulation({
            roomId: undefined,
        });
        const localSecondPlayerId = createPlayerId({
            clientId: applyBrand<ClientId>('c_blue'),
            playerPosition: LocalPlayerPosition.Two,
        });

        try {
            singleplayerSimulation.engine.dispatch(
                createMultiplayerFrameEvent([
                    {
                        playerPosition: LocalPlayerPosition.Two,
                        type: MultiplayerPacketType.SpawnPlayer,
                    },
                ]),
            );
            await singleplayerSimulation.engine.runSingleTick();

            assertWrap.isDefined(singleplayerSimulation.state.players?.[localSecondPlayerId]);
            assert.strictEquals(
                singleplayerSimulation.entityStore.getEntities(PlayerEntity).size,
                3,
            );
            assert.strictEquals(singleplayerSimulation.state.multiplayerLockstepTick, 0);
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
                    simulationTick: batchedSimulation.state.multiplayerLockstepTick,
                },
                {
                    bluePlayer: separateSimulation.bluePlayer.params,
                    greenPlayer: separateSimulation.greenPlayer.params,
                    randomState: assertWrap
                        .isDefined(separateSimulation.state.seededRandom)
                        .exportState(),
                    simulationTick: separateSimulation.state.multiplayerLockstepTick,
                },
            );
            assert.deepEquals(
                [
                    batchedSimulation.state.multiplayerLockstepTick,
                    separateSimulation.state.multiplayerLockstepTick,
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
