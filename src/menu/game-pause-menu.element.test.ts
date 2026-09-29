import {NavController} from '@antha/input';
import {createMultiplayerId, emptyApiAndRoomConnectionState} from '@antha/multiplayer-core';
import {
    MultiplayerControllerFrameEvent,
    P2pLockStepMultiplayerController,
} from '@antha/multiplayer-p2p-lock-step';
import {LocalPlayerPosition} from '@antha/util';
import {assert, assertWrap} from '@augment-vir/assert';
import {describe, it, testWeb} from '@augment-vir/test';
import {html, testIdSelector} from 'element-vir';
import {GameMenuKey, type FullGameState} from '../game-state/game-state.js';
import {MultiplayerPacketType, type MultiplayerPacket} from '../game-state/multiplayer-packet.js';
import {GamePauseMenu} from './game-pause-menu.element.js';
import {VirGameButton} from './vir-game-button.element.js';

function activateGamePauseButton({
    gamePauseMenu,
    testId,
}: Readonly<{
    gamePauseMenu: InstanceType<typeof GamePauseMenu>;
    testId: string;
}>) {
    const gameButton = assertWrap.instanceOf(
        assertWrap.isDefined(gamePauseMenu.shadowRoot).querySelector(testIdSelector(testId)),
        VirGameButton,
    );

    [
        'mousedown',
        'mouseup',
    ].forEach((eventType) => {
        gameButton.dispatchEvent(
            new MouseEvent(eventType, {
                bubbles: true,
            }),
        );
    });

    return gameButton;
}

function createGameState({
    multiplayerController,
}: Readonly<{
    multiplayerController: P2pLockStepMultiplayerController<MultiplayerPacket>;
}>): Pick<FullGameState, 'menuState' | 'multiplayerP2pLockStep' | 'navController' | 'players'> {
    return {
        menuState: {
            menuHistory: [
                GameMenuKey.Pause,
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
        players: {},
    };
}

describe(GamePauseMenu.tagName, () => {
    it('restarts a local game from the pause menu', async () => {
        const multiplayerController = new P2pLockStepMultiplayerController<MultiplayerPacket>({
            gameId: 'game-pause-menu-test',
        });
        const gameState = createGameState({
            multiplayerController,
        });

        try {
            const renderedElement = await testWeb.render(html`
                <${GamePauseMenu.assign({
                    gameState,
                })}></${GamePauseMenu}>
            `);
            const gamePauseMenu = assertWrap.instanceOf(renderedElement, GamePauseMenu);

            const restartButton = activateGamePauseButton({
                gamePauseMenu,
                testId: GamePauseMenu.testIds.restartButton,
            });

            assert.deepEquals(
                {
                    isConnected: multiplayerController.isConnected(),
                    menuState: gameState.menuState,
                },
                {
                    isConnected: true,
                    menuState: undefined,
                },
            );
            assert.strictEquals(restartButton.textContent.trim(), 'Restart');
        } finally {
            multiplayerController.destroy();
            testWeb.cleanupRender();
        }
    });

    it('shows Leave instead of Host and Join while in a multiplayer room', async () => {
        const multiplayerController = new P2pLockStepMultiplayerController<MultiplayerPacket>({
            gameId: 'mock',
        });
        Object.defineProperty(multiplayerController, 'roomId', {
            value: createMultiplayerId.room(),
        });

        try {
            const renderedElement = await testWeb.render(html`
                <${GamePauseMenu.assign({
                    gameState: createGameState({
                        multiplayerController,
                    }),
                })}></${GamePauseMenu}>
            `);
            const gamePauseMenu = assertWrap.instanceOf(renderedElement, GamePauseMenu);

            assert.deepEquals(
                {
                    hasHostButton: !!gamePauseMenu.shadowRoot.querySelector(
                        testIdSelector(GamePauseMenu.testIds.hostButton),
                    ),
                    hasJoinButton: !!gamePauseMenu.shadowRoot.querySelector(
                        testIdSelector(GamePauseMenu.testIds.joinButton),
                    ),
                    hasLeaveButton: !!gamePauseMenu.shadowRoot.querySelector(
                        testIdSelector(GamePauseMenu.testIds.leaveButton),
                    ),
                },
                {
                    hasHostButton: false,
                    hasJoinButton: false,
                    hasLeaveButton: true,
                },
            );
        } finally {
            multiplayerController.destroy();
            testWeb.cleanupRender();
        }
    });

    it('drops out a non-first local player instead of restarting', async () => {
        const multiplayerController = new P2pLockStepMultiplayerController<MultiplayerPacket>({
            gameId: 'game-pause-menu-test',
        });
        const gameState: ReturnType<typeof createGameState> = {
            ...createGameState({
                multiplayerController,
            }),
            menuState: {
                menuHistory: [
                    GameMenuKey.Pause,
                ],
                openedBy: {
                    activeBinding: {
                        actCount: 1,
                        holdDuration: {
                            milliseconds: 0,
                        },
                        lastActDuration: {
                            milliseconds: 0,
                        },
                        rawInputs: [],
                        value: 1,
                    },
                    playerPosition: LocalPlayerPosition.Two,
                },
            },
        };
        const sentPackets: MultiplayerPacket[] = [];

        multiplayerController.listen(MultiplayerControllerFrameEvent, ({detail}) => {
            sentPackets.push(
                ...detail.packets.map(({packet}) => {
                    return packet;
                }),
            );
        });
        multiplayerController.startSingleplayer();

        try {
            const renderedElement = await testWeb.render(html`
                <${GamePauseMenu.assign({
                    gameState,
                })}></${GamePauseMenu}>
            `);
            const gamePauseMenu = assertWrap.instanceOf(renderedElement, GamePauseMenu);

            assert.isNull(
                gamePauseMenu.shadowRoot.querySelector(
                    testIdSelector(GamePauseMenu.testIds.restartButton),
                ),
            );

            activateGamePauseButton({
                gamePauseMenu,
                testId: GamePauseMenu.testIds.dropOutButton,
            });
            multiplayerController.runFrame();

            assert.deepEquals(
                {
                    menuState: gameState.menuState,
                    sentPackets,
                },
                {
                    menuState: undefined,
                    sentPackets: [
                        {
                            playerPosition: LocalPlayerPosition.Two,
                            type: MultiplayerPacketType.DespawnPlayer,
                        },
                    ],
                },
            );
        } finally {
            multiplayerController.destroy();
            testWeb.cleanupRender();
        }
    });
});
