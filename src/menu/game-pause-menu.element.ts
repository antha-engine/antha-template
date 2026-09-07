import {nav} from '@antha/input';
import {createNewRoom} from '@antha/multiplayer-core';
import {randomString, type MaybePromise} from '@augment-vir/common';
import {css, defineElement, html, nothing, testId} from 'element-vir';
import {LoaderAnimated24Icon, noNativeSpacing, ViraIcon, viraTheme} from 'vira';
import {GameMenuKey, type FullGameState} from '../game-state/game-state.js';
import {
    createMultiplayerError,
    initializeMultiplayer,
    startLocalGame,
} from '../game-state/multiplayer-session.js';
import {VirGameButton} from './vir-game-button.element.js';

/** Provides paused-game actions for resuming, restarting, and multiplayer setup. */
export const GamePauseMenu = defineElement<{
    gameState: Partial<FullGameState>;
}>()({
    tagName: 'game-pause-menu',
    testIds: [
        'restartButton',
    ],
    state() {
        return {
            isInitializingMultiplayer: false,
            multiplayerError: undefined as Error | undefined,
        };
    },
    styles: css`
        :host {
            align-items: center;
            display: flex;
            flex-direction: column;
            gap: 16px;
        }

        h1,
        p,
        ul {
            ${noNativeSpacing}
        }

        h1 {
            font-size: 48px;
        }

        ul {
            display: flex;
            flex-direction: column;
            gap: 8px;
            list-style: none;
        }

        .loading {
            align-items: center;
            display: flex;
            gap: 8px;
        }

        .error {
            max-width: 360px;
            font-weight: bold;
            color: ${viraTheme.colors['vira-red-foreground-non-body'].foreground.value};
            text-align: center;
        }
    `,
    render({host, inputs, state, testIds, updateState}) {
        const navController = inputs.gameState.navController;

        if (!navController) {
            return nothing;
        } else if (state.isInitializingMultiplayer) {
            return html`
                <h1>Paused</h1>
                <div class="loading">
                    <${ViraIcon.assign({
                        icon: LoaderAnimated24Icon,
                    })}></${ViraIcon}>
                    <span>Connecting to multiplayer...</span>
                </div>
            `;
        }

        const isOnlineMultiplayer =
            !!inputs.gameState.multiplayerP2pLockStep?.multiplayerController.roomId;

        const gameButtonDefinitions: ReadonlyArray<
            Readonly<{
                autoFocus?: boolean | undefined;
                label: string;
                onActivate: () => MaybePromise<void>;
                testId?: string | undefined;
            }>
        > = [
            {
                autoFocus: true,
                label: 'Resume',
                onActivate() {
                    inputs.gameState.menuState = {
                        activeMenu: undefined,
                        returnTo: undefined,
                    };
                },
            },
            {
                label: 'Options',
                onActivate() {
                    inputs.gameState.menuState = {
                        activeMenu: GameMenuKey.Options,
                        returnTo: GameMenuKey.Pause,
                    };
                },
            },
            {
                label: 'Host',
                async onActivate() {
                    updateState({
                        isInitializingMultiplayer: true,
                        multiplayerError: undefined,
                    });

                    try {
                        const multiplayerController = await initializeMultiplayer(inputs.gameState);

                        if (multiplayerController.roomId) {
                            startLocalGame(inputs.gameState);
                        }

                        await multiplayerController.joinOrCreateRoom(
                            createNewRoom({
                                roomName: [
                                    'Room',
                                    randomString(4),
                                ].join(' '),
                            }),
                        );
                        inputs.gameState.menuState = {
                            activeMenu: undefined,
                            returnTo: undefined,
                        };
                    } catch (error) {
                        updateState({
                            multiplayerError: createMultiplayerError(error),
                        });
                    } finally {
                        updateState({
                            isInitializingMultiplayer: false,
                        });
                        host.requestUpdate();
                    }
                },
            },
            ...(isOnlineMultiplayer
                ? []
                : [
                      {
                          label: 'Join',
                          async onActivate() {
                              updateState({
                                  isInitializingMultiplayer: true,
                                  multiplayerError: undefined,
                              });

                              try {
                                  await initializeMultiplayer(inputs.gameState);
                                  inputs.gameState.menuState = {
                                      activeMenu: GameMenuKey.MultiplayerRooms,
                                      returnTo: GameMenuKey.Pause,
                                  };
                              } catch (error) {
                                  updateState({
                                      multiplayerError: createMultiplayerError(error),
                                  });
                              } finally {
                                  updateState({
                                      isInitializingMultiplayer: false,
                                  });
                                  host.requestUpdate();
                              }
                          },
                      },
                  ]),
            {
                label: 'Restart',
                onActivate() {
                    startLocalGame(inputs.gameState);
                },
                testId: testIds.restartButton,
            },
        ];

        return html`
            <h1>Paused</h1>
            ${state.multiplayerError
                ? html`
                      <p class="error">${state.multiplayerError.message}</p>
                  `
                : nothing}
            <ul>
                ${gameButtonDefinitions.map((buttonDefinition, index) => {
                    return html`
                        <li>
                            <${VirGameButton}
                                ${buttonDefinition.testId
                                    ? testId(buttonDefinition.testId)
                                    : nothing}
                                ${nav(navController, {
                                    autoFocus: buttonDefinition.autoFocus,
                                    listeners: {
                                        async activate({enabled}) {
                                            if (enabled) {
                                                await buttonDefinition.onActivate();
                                            }
                                        },
                                    },
                                    y: index,
                                })}
                            >
                                ${buttonDefinition.label}
                            </${VirGameButton}>
                        </li>
                    `;
                })}
            </ul>
        `;
    },
});
