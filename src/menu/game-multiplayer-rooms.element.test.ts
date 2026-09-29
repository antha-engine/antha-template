import {NavController} from '@antha/input';
import {
    createMockRoomHandlerServerApiClient,
    createMultiplayerId,
    emptyApiAndRoomConnectionState,
    MultiplayerControllerRoomListEvent,
} from '@antha/multiplayer-core';
import {P2pLockStepMultiplayerController} from '@antha/multiplayer-p2p-lock-step';
import {assert, assertWrap, waitUntil} from '@augment-vir/assert';
import {wait} from '@augment-vir/common';
import {describe, it, testWeb} from '@augment-vir/test';
import {NavDirection} from 'device-navigation';
import {html, testIdSelector} from 'element-vir';
import {GameMenuKey, type FullGameState} from '../game-state/game-state.js';
import {type MultiplayerPacket} from '../game-state/multiplayer-packet.js';
import {GameMultiplayerRooms} from './game-multiplayer-rooms.element.js';
import {VirGameButton} from './vir-game-button.element.js';

describe(GameMultiplayerRooms.tagName, () => {
    it('navigates up from the first room to Back', async () => {
        const roomId = createMultiplayerId.room();
        const multiplayerController = new P2pLockStepMultiplayerController<MultiplayerPacket>({
            gameId: 'mock',
        });
        const mockApiClient = createMockRoomHandlerServerApiClient({
            rooms: {
                [roomId]: {
                    clientCount: 1,
                    hasRoomPassword: false,
                    roomId,
                    roomName: 'Test room',
                },
            },
        });
        const navController = new NavController(document.body, {
            alwaysRequireFocused: true,
        });
        const gameState: Pick<
            FullGameState,
            'menuState' | 'multiplayerP2pLockStep' | 'navController'
        > = {
            menuState: {
                menuHistory: [
                    GameMenuKey.Pause,
                    GameMenuKey.MultiplayerRooms,
                ],
                openedBy: undefined,
            },
            multiplayerP2pLockStep: {
                connectionState: emptyApiAndRoomConnectionState,
                multiplayerController,
            },
            navController,
        };

        try {
            await multiplayerController.initMultiplayer({
                backendOrigin: mockApiClient.baseUrl,
                multiplayerApiClient: mockApiClient,
                roomUpdateInterval: {
                    milliseconds: 1,
                },
            });

            const renderedElement = await testWeb.render(html`
                <${GameMultiplayerRooms.assign({
                    gameState,
                })}></${GameMultiplayerRooms}>
            `);
            const multiplayerRooms = assertWrap.instanceOf(renderedElement, GameMultiplayerRooms);
            const backButton = assertWrap.instanceOf(
                await waitUntil.isDefined(() => {
                    return multiplayerRooms.shadowRoot.querySelector(
                        testIdSelector(GameMultiplayerRooms.testIds.backButton),
                    );
                }),
                VirGameButton,
            );

            await waitUntil.isDefined(() => navController.currentNavEntry);
            const navigationResult = navController.navigate({
                allowWrapping: false,
                direction: NavDirection.Up,
            });

            assert.deepEquals(
                {
                    reachesBackButton:
                        navigationResult.success && navigationResult.newElement === backButton,
                    success: navigationResult.success,
                },
                {
                    reachesBackButton: true,
                    success: true,
                },
            );
        } finally {
            multiplayerController.destroy();
            testWeb.cleanupRender();
        }
    });

    it('stops polling rooms once removed', async () => {
        const multiplayerController = new P2pLockStepMultiplayerController<MultiplayerPacket>({
            gameId: 'mock',
        });
        const mockApiClient = createMockRoomHandlerServerApiClient();
        const gameState: Pick<
            FullGameState,
            'menuState' | 'multiplayerP2pLockStep' | 'navController'
        > = {
            menuState: {
                menuHistory: [
                    GameMenuKey.Pause,
                    GameMenuKey.MultiplayerRooms,
                ],
                openedBy: undefined,
            },
            multiplayerP2pLockStep: {
                connectionState: emptyApiAndRoomConnectionState,
                multiplayerController,
            },
            navController: new NavController(document.body, {
                alwaysRequireFocused: true,
            }),
        };
        const roomListEvents: MultiplayerControllerRoomListEvent[] = [];

        multiplayerController.listen(MultiplayerControllerRoomListEvent, (event) => {
            roomListEvents.push(event);
        });

        try {
            await multiplayerController.initMultiplayer({
                backendOrigin: mockApiClient.baseUrl,
                multiplayerApiClient: mockApiClient,
                roomUpdateInterval: {
                    milliseconds: 10,
                },
            });

            await testWeb.render(html`
                <${GameMultiplayerRooms.assign({
                    gameState,
                })}></${GameMultiplayerRooms}>
            `);
            await waitUntil.isLengthAtLeast(1, () => roomListEvents);

            testWeb.cleanupRender();
            /** Let any poll already in flight finish before counting. */
            await wait({
                milliseconds: 100,
            });
            const eventCountAfterRemoval = roomListEvents.length;
            await wait({
                milliseconds: 100,
            });

            assert.isLengthExactly(roomListEvents, eventCountAfterRemoval);
        } finally {
            multiplayerController.destroy();
            testWeb.cleanupRender();
        }
    });
});
