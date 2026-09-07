import {NavController} from '@antha/input';
import {emptyApiAndRoomConnectionState} from '@antha/multiplayer-core';
import {P2pLockStepMultiplayerController} from '@antha/multiplayer-p2p-lock-step';
import {assert, assertWrap} from '@augment-vir/assert';
import {describe, it, testWeb} from '@augment-vir/test';
import {html, testIdSelector} from 'element-vir';
import {GameMenuKey, type FullGameState} from '../game-state/game-state.js';
import {type MultiplayerPacket} from '../game-state/multiplayer-packet.js';
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

describe(GamePauseMenu.tagName, () => {
    it('restarts a local game from the pause menu', async () => {
        const multiplayerController = new P2pLockStepMultiplayerController<MultiplayerPacket>({
            gameId: 'game-pause-menu-test',
        });
        const gameState: Pick<
            FullGameState,
            'menuState' | 'multiplayerP2pLockStep' | 'navController' | 'players'
        > = {
            menuState: {
                activeMenu: GameMenuKey.Pause,
                returnTo: undefined,
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
                    menuState: {
                        activeMenu: undefined,
                        returnTo: undefined,
                    },
                },
            );
            assert.strictEquals(restartButton.textContent.trim(), 'Restart');
        } finally {
            multiplayerController.destroy();
            testWeb.cleanupRender();
        }
    });
});
