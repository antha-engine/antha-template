import {AssetLoader} from '@antha/asset';
import {EntityStore2d} from '@antha/entity-2d';
import {createMockPixi} from '@antha/graphics-2d';
import {createMultiplayerPlayerId, emptyApiAndRoomConnectionState} from '@antha/multiplayer-core';
import {
    MultiplayerControllerFrameEvent,
    P2pLockStepMultiplayerController,
    type MultiplayerFramePacket,
} from '@antha/multiplayer-p2p-lock-step';
import {assert, assertWrap} from '@augment-vir/assert';
import {wait} from '@augment-vir/common';
import {describe, it} from '@augment-vir/test';
import {parseUrl} from 'url-vir';
import {PlayerEntity} from '../player/player.entity.js';
import {LocalPlayerPosition, type FullGameState} from './game-state.js';
import {MultiplayerPacketType, type MultiplayerPacket} from './multiplayer-packet.js';
import {
    createDevelopmentMultiplayerBackendOrigin,
    createMultiplayerError,
    startLocalGame,
    startMultiplayerGame,
} from './multiplayer-session.js';

describe(startLocalGame.name, () => {
    it('starts with only the first local player', async () => {
        const controller = new P2pLockStepMultiplayerController<MultiplayerPacket>({
            frameDuration: {
                milliseconds: 1,
            },
            gameId: 'antha-template-start-local-game-test',
        });
        const gameState: Partial<FullGameState> = {
            multiplayerP2pLockStep: {
                connectionState: emptyApiAndRoomConnectionState,
                multiplayerController: controller,
            },
            players: {},
        };
        const receivedFrames: Array<ReadonlyArray<MultiplayerFramePacket<MultiplayerPacket>>> = [];

        controller.listen(MultiplayerControllerFrameEvent, ({detail}) => {
            if (detail.packets.length) {
                receivedFrames.push(detail.packets);
            }
        });

        try {
            startMultiplayerGame(gameState);
            startLocalGame(gameState);
            const clientId = assertWrap.isDefined(controller.getClientId());

            await wait({
                milliseconds: 5,
            });

            assert.deepEquals(receivedFrames, [
                [
                    {
                        packet: {
                            playerPosition: LocalPlayerPosition.One,
                            type: MultiplayerPacketType.SpawnPlayer,
                        },
                        sourceClientId: clientId,
                    },
                ],
            ]);
            assert.deepEquals(
                {
                    multiplayerSimulationTick: gameState.multiplayerLockstepTick,
                },
                {
                    multiplayerSimulationTick: 0,
                },
            );
        } finally {
            controller.destroy();
        }
    });
});

describe(startMultiplayerGame.name, () => {
    it('resets the multiplayer simulation frame count', () => {
        const gameState: Partial<FullGameState> = {
            multiplayerLockstepTick: 10,
        };

        startMultiplayerGame(gameState);

        assert.deepEquals(
            {
                multiplayerSimulationTick: gameState.multiplayerLockstepTick,
            },
            {
                multiplayerSimulationTick: 0,
            },
        );
    });

    it('queues every existing local player', async () => {
        const controller = new P2pLockStepMultiplayerController<MultiplayerPacket>({
            frameDuration: {
                milliseconds: 1,
            },
            gameId: 'antha-template-start-multiplayer-game-test',
        });
        const gameState: Partial<FullGameState> = {
            multiplayerP2pLockStep: {
                connectionState: emptyApiAndRoomConnectionState,
                multiplayerController: controller,
            },
            players: {},
        };
        const entityStore = new EntityStore2d({
            assetLoader: new AssetLoader(),
            pixi: createMockPixi(),
            state: gameState,
        });

        gameState.entityStore = entityStore;
        controller.startSingleplayer();
        const localClientId = assertWrap.isDefined(controller.getClientId());
        const firstPlayer = await entityStore.addEntity(PlayerEntity, {
            playerId: createMultiplayerPlayerId({
                clientId: localClientId,
                playerPosition: LocalPlayerPosition.One,
            }),
            x: 100,
            y: 200,
        });
        const secondPlayer = await entityStore.addEntity(PlayerEntity, {
            playerId: createMultiplayerPlayerId({
                clientId: localClientId,
                playerPosition: LocalPlayerPosition.Two,
            }),
            x: 300,
            y: 400,
        });
        const receivedFrames: Array<ReadonlyArray<MultiplayerFramePacket<MultiplayerPacket>>> = [];

        gameState.players = {
            [firstPlayer.params.playerId]: {
                clientId: localClientId,
                playerEntity: firstPlayer,
                playerPosition: LocalPlayerPosition.One,
            },
            [secondPlayer.params.playerId]: {
                clientId: localClientId,
                playerEntity: secondPlayer,
                playerPosition: LocalPlayerPosition.Two,
            },
        };
        controller.listen(MultiplayerControllerFrameEvent, ({detail}) => {
            if (detail.packets.length) {
                receivedFrames.push(detail.packets);
            }
        });

        try {
            startMultiplayerGame(gameState);

            await wait({
                milliseconds: 5,
            });

            assert.deepEquals(receivedFrames, [
                [
                    {
                        packet: {
                            playerPosition: LocalPlayerPosition.One,
                            type: MultiplayerPacketType.SpawnPlayer,
                        },
                        sourceClientId: localClientId,
                    },
                    {
                        packet: {
                            playerPosition: LocalPlayerPosition.Two,
                            type: MultiplayerPacketType.SpawnPlayer,
                        },
                        sourceClientId: localClientId,
                    },
                ],
            ]);
        } finally {
            controller.destroy();
            entityStore.destroy();
        }
    });
});

describe(createDevelopmentMultiplayerBackendOrigin.name, () => {
    it('uses the frontend hostname with the local multiplayer server port', () => {
        const backendUrl = parseUrl(createDevelopmentMultiplayerBackendOrigin('192.0.2.10'));

        assert.deepEquals(
            {
                hostname: backendUrl.hostname,
                port: backendUrl.port,
            },
            {
                hostname: '192.0.2.10',
                port: '9348',
            },
        );
    });
});

describe(createMultiplayerError.name, () => {
    it('retains an original error while adding the multiplayer context', () => {
        const originalError = new Error('Room is unavailable.');
        const multiplayerError = createMultiplayerError(originalError);

        assert.strictEquals(multiplayerError, originalError);
        assert.strictEquals(multiplayerError.message, 'Multiplayer failed: Room is unavailable.');
    });
});
