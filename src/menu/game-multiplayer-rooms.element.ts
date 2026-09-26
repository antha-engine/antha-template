import {nav, popAnthaMenuState} from '@antha/input';
import {type MultiplayerClientRooms} from '@antha/multiplayer-core';
import {getObjectTypedValues, type EmptyFunction} from '@augment-vir/common';
import {css, defineElement, html, nothing, testId} from 'element-vir';
import {LoaderAnimated24Icon, lucideIcons, ViraIcon} from 'vira';
import {type FullGameState} from '../game-state/game-state.js';
import {
    createMultiplayerError,
    initializeMultiplayer,
    startMultiplayerGame,
} from '../game-state/multiplayer-session.js';
import {VirGameButton} from './vir-game-button.element.js';

/** Lists available multiplayer rooms so players can choose a session to join. */
export const GameMultiplayerRooms = defineElement<{
    gameState: Partial<FullGameState>;
}>()({
    tagName: 'game-multiplayer-rooms',
    testIds: [
        'backButton',
    ],
    state() {
        return {
            cleanup: undefined as undefined | EmptyFunction,
            joiningRoom: undefined as undefined | string,
            multiplayerError: undefined as undefined | Error,
            rooms: undefined as undefined | MultiplayerClientRooms,
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
            margin: 0;
        }

        h1 {
            font-size: 48px;
        }

        ul {
            display: flex;
            flex-direction: column;
            gap: 8px;
            list-style: none;
            padding: 0;
        }

        li,
        .loading,
        .room {
            align-items: center;
            display: flex;
            gap: 8px;
        }

        .room {
            flex-grow: 1;
        }
    `,
    init({inputs, state, updateState}) {
        if (!inputs.gameState.multiplayerP2pLockStep) {
            throw new Error('Cannot list multiplayer rooms: multiplayer controller is missing.');
        }

        if (!state.cleanup) {
            updateState({
                cleanup:
                    inputs.gameState.multiplayerP2pLockStep.multiplayerController.startRoomUpdates(
                        (rooms) => {
                            updateState({
                                rooms,
                            });
                        },
                    ),
            });
        }
    },
    cleanup({state, updateState, inputs}) {
        inputs.gameState.multiplayerP2pLockStep?.multiplayerController.stopRoomUpdates();
        state.cleanup?.();
        updateState({
            cleanup: undefined,
        });
    },
    render({host, inputs, state, testIds, updateState}) {
        const navController = inputs.gameState.navController;

        if (!navController) {
            return nothing;
        } else if (state.joiningRoom) {
            return html`
                <h1>Join game</h1>
                <div class="loading">
                    <${ViraIcon.assign({
                        icon: LoaderAnimated24Icon,
                    })}></${ViraIcon}>
                    <span>Joining ${state.joiningRoom}...</span>
                </div>
            `;
        } else if (!state.rooms) {
            return html`
                <h1>Join game</h1>
                <div class="loading">
                    <${ViraIcon.assign({
                        icon: LoaderAnimated24Icon,
                    })}></${ViraIcon}>
                    <span>Loading rooms...</span>
                </div>
            `;
        }

        const roomList = getObjectTypedValues(state.rooms)
            .filter((room) => {
                return (
                    room.roomId !==
                    inputs.gameState.multiplayerP2pLockStep?.multiplayerController.roomId
                );
            })
            .sort((firstRoom, secondRoom) => {
                return firstRoom.roomName.localeCompare(secondRoom.roomName);
            });
        const roomTemplates = roomList.map((room, roomIndex) => {
            const lockedTemplate = room.hasRoomPassword
                ? html`
                      <${ViraIcon.assign({
                          icon: lucideIcons.Lock,
                      })}></${ViraIcon}>
                  `
                : nothing;

            return html`
                <li>
                    <span class="room">${room.roomName} (${room.clientCount})</span>
                    ${lockedTemplate}
                    <${VirGameButton}
                        ${nav(navController, {
                            autoFocus: roomIndex === 0,
                            listeners: {
                                async activate({enabled}) {
                                    if (!enabled) {
                                        return;
                                    }

                                    updateState({
                                        joiningRoom: room.roomName,
                                    });
                                    host.requestUpdate();

                                    try {
                                        const multiplayerController = await initializeMultiplayer(
                                            inputs.gameState,
                                        );

                                        await multiplayerController.joinOrCreateRoom({
                                            roomId: room.roomId,
                                            roomName: room.roomName,
                                            roomPassword: '',
                                        });
                                        startMultiplayerGame(inputs.gameState);
                                        inputs.gameState.menuState = {
                                            activeMenu: undefined,
                                            returnTo: [],
                                        };
                                    } catch (error) {
                                        updateState({
                                            joiningRoom: undefined,
                                            multiplayerError: createMultiplayerError(error),
                                        });
                                        host.requestUpdate();
                                    }
                                },
                            },
                            y: roomIndex + 1,
                        })}
                    >
                        Join
                    </${VirGameButton}>
                </li>
            `;
        });

        return html`
            <h1>Join game</h1>
            ${state.multiplayerError
                ? html`
                      <p>${state.multiplayerError.message}</p>
                  `
                : nothing}
            <${VirGameButton}
                ${testId(testIds.backButton)}
                ${nav(navController, {
                    autoFocus: roomTemplates.length === 0,
                    listeners: {
                        activate({enabled}) {
                            if (enabled) {
                                inputs.gameState.menuState = popAnthaMenuState(
                                    inputs.gameState.menuState,
                                );
                            }
                        },
                    },
                    y: 0,
                })}
            >
                Back
            </${VirGameButton}>
            ${roomTemplates.length
                ? html`
                      <ul>
                          ${roomTemplates}
                      </ul>
                  `
                : html`
                      <p>No rooms are available.</p>
                  `}
        `;
    },
});
