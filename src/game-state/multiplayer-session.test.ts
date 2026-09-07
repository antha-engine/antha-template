import {emptyApiAndRoomConnectionState} from '@antha/multiplayer-core';
import {
    MultiplayerControllerFrameEvent,
    P2pLockStepMultiplayerController,
    type FrameEventDetail,
} from '@antha/multiplayer-p2p-lock-step';
import {assert, assertWrap} from '@augment-vir/assert';
import {wait} from '@augment-vir/common';
import {describe, it} from '@augment-vir/test';
import {parseUrl} from 'url-vir';
import {LocalPlayerPosition, type FullGameState} from './game-state.js';
import {MultiplayerPacketType, type MultiplayerPacket} from './multiplayer-packet.js';
import {
    createDevelopmentMultiplayerBackendOrigin,
    createMultiplayerError,
    startLocalGame,
} from './multiplayer-session.js';

describe(startLocalGame.name, () => {
    it('starts with only the first local player', async () => {
        const controller = new P2pLockStepMultiplayerController<MultiplayerPacket>({
            frameDuration: {
                milliseconds: 1,
            },
            gameId: 'antha-template-start-local-game-test',
        });
        const gameState = {
            multiplayerP2pLockStep: {
                connectionState: emptyApiAndRoomConnectionState,
                multiplayerController: controller,
            },
            players: {},
        } satisfies Pick<FullGameState, 'multiplayerP2pLockStep' | 'players'>;
        const receivedFrames: Array<ReadonlyArray<FrameEventDetail<MultiplayerPacket>>> = [];

        controller.listen(MultiplayerControllerFrameEvent, ({detail}) => {
            if (detail.length) {
                receivedFrames.push(detail);
            }
        });

        try {
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
        } finally {
            controller.destroy();
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
