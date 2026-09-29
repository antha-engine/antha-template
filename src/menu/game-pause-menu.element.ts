import {nav, pushAnthaMenuState} from '@antha/input';
import {createNewRoom} from '@antha/multiplayer-core';
import {isMultiplayerRoomConnected} from '@antha/multiplayer-p2p-lock-step';
import {LocalPlayerPosition} from '@antha/util';
import {randomString, type MaybePromise} from '@augment-vir/common';
import {css, defineElement, html, nothing, testId} from 'element-vir';
import {LoaderAnimated24Icon, noNativeSpacing, ViraIcon, viraTheme} from 'vira';
import {GameMenuKey, type FullGameState} from '../game-state/game-state.js';
import {MultiplayerPacketType} from '../game-state/multiplayer-packet.js';
import {
    createMultiplayerError,
    initializeMultiplayer,
    multiplayerConnectionTimeoutOptions,
    startLocalGame,
    startMultiplayerGame,
} from '../game-state/multiplayer-session.js';
import {VirGameButton} from './vir-game-button.element.js';

/**
 * Provides paused-game actions for resuming, restarting, and multiplayer setup. Players other than
 * player one get "Drop out" in place of "Restart".
 */
export const GamePauseMenu = defineElement<{
    gameState: Partial<FullGameState>;
}>()({
    tagName: 'game-pause-menu',
    testIds: [
        'dropOutButton',
        'hostButton',
        'joinButton',
        'leaveButton',
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

        const isInMultiplayerRoom = isMultiplayerRoomConnected(inputs.gameState);
        const pausedBy = inputs.gameState.menuState?.openedBy?.playerPosition;

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
                    inputs.gameState.menuState = undefined;
                },
            },
            {
                label: 'Options',
                onActivate() {
                    inputs.gameState.menuState = pushAnthaMenuState(
                        inputs.gameState.menuState,
                        GameMenuKey.Options,
                    );
                },
            },
            ...(isInMultiplayerRoom
                ? [
                      {
                          label: 'Leave',
                          onActivate() {
                              startLocalGame(inputs.gameState);
                          },
                          testId: testIds.leaveButton,
                      },
                  ]
                : [
                      {
                          label: 'Host',
                          async onActivate() {
                              updateState({
                                  isInitializingMultiplayer: true,
                                  multiplayerError: undefined,
                              });

                              try {
                                  const multiplayerController = await initializeMultiplayer(
                                      inputs.gameState,
                                  );

                                  await multiplayerController.joinOrCreateRoom(
                                      createNewRoom({
                                          roomName: [
                                              'Room',
                                              randomString(4),
                                          ].join(' '),
                                      }),
                                      multiplayerConnectionTimeoutOptions,
                                  );
                                  startMultiplayerGame(inputs.gameState);
                                  inputs.gameState.menuState = undefined;
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
                          testId: testIds.hostButton,
                      },
                      {
                          label: 'Join',
                          async onActivate() {
                              updateState({
                                  isInitializingMultiplayer: true,
                                  multiplayerError: undefined,
                              });

                              try {
                                  await initializeMultiplayer(inputs.gameState);
                                  inputs.gameState.menuState = pushAnthaMenuState(
                                      inputs.gameState.menuState,
                                      GameMenuKey.MultiplayerRooms,
                                  );
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
                          testId: testIds.joinButton,
                      },
                  ]),
            pausedBy == undefined || pausedBy === LocalPlayerPosition.One
                ? {
                      label: 'Restart',
                      onActivate() {
                          startLocalGame(inputs.gameState);
                      },
                      testId: testIds.restartButton,
                  }
                : {
                      label: 'Drop out',
                      onActivate() {
                          inputs.gameState.multiplayerP2pLockStep?.multiplayerController.act({
                              playerPosition: pausedBy,
                              type: MultiplayerPacketType.DespawnPlayer,
                          });
                          inputs.gameState.menuState = undefined;
                      },
                      testId: testIds.dropOutButton,
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
