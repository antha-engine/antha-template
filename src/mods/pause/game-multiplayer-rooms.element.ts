import {nav, type NavController} from '@antha/input';
import {type MultiplayerClientRooms} from '@antha/multiplayer-core';
import {getObjectTypedValues, type EmptyFunction} from '@augment-vir/common';
import {css, defineElement, html, nothing} from 'element-vir';
import {LoaderAnimated24Icon, lucideIcons, ViraButton, ViraColorVariant, ViraIcon} from 'vira';
import {type FullGameState} from '../../data/game-state.js';

export const GameMultiplayerRooms = defineElement<{
    gameState: Partial<FullGameState>;
    navController: NavController;
}>()({
    tagName: 'game-multiplayer-rooms',
    state() {
        return {
            cleanup: undefined as undefined | EmptyFunction,
            rooms: undefined as undefined | MultiplayerClientRooms,
            joiningRoom: undefined as undefined | string,
        };
    },
    styles: css`
        .loading {
            display: flex;
            align-items: center;
            gap: 8px;
        }
    `,
    init({inputs, state, updateState}) {
        if (!inputs.gameState.multiplayerP2pLockStep) {
            throw new Error('Cannot list multiplayer rooms, no multiplayer controller.');
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
    cleanup({state, updateState}) {
        state.cleanup?.();
        updateState({
            cleanup: undefined,
        });
    },
    render({state, inputs, updateState}) {
        if (state.joiningRoom) {
            return html`
                <div class="loading">
                    <${ViraIcon.assign({
                        icon: LoaderAnimated24Icon,
                    })}></${ViraIcon}>
                    <span>Joining room ${state.joiningRoom}...</span>
                </div>
            `;
        } else if (!state.rooms) {
            return html`
                <div class="loading">
                    <${ViraIcon.assign({
                        icon: LoaderAnimated24Icon,
                    })}></${ViraIcon}>
                    <span>Loading Rooms...</span>
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
            .sort((a, b) => {
                return a.roomId.localeCompare(b.roomId);
            });

        if (roomList.length) {
            const roomTemplates = roomList.map((room) => {
                const lockedTemplate = room.hasRoomPassword
                    ? html`
                          <${ViraIcon.assign({
                              icon: lucideIcons.Lock,
                          })}></${ViraIcon}>
                      `
                    : nothing;
                return html`
                    <li>
                        <span>${room.roomName}</span>
                        <span>(${room.clientCount})</span>
                        ${lockedTemplate}
                        <${ViraButton.assign({
                            text: 'Join',
                            color: ViraColorVariant.Neutral,
                        })}
                            ${nav(inputs.navController, {
                                listeners: {
                                    activate: async ({enabled}) => {
                                        if (!enabled) {
                                            return;
                                        } else if (!inputs.gameState.multiplayerP2pLockStep) {
                                            throw new Error(
                                                'Cannot join room, no multiplayer controller found.',
                                            );
                                        }

                                        updateState({
                                            joiningRoom: room.roomName,
                                        });

                                        try {
                                            await inputs.gameState.multiplayerP2pLockStep.multiplayerController.joinOrCreateRoom(
                                                {
                                                    roomId: room.roomId,
                                                    roomName: room.roomName,
                                                    roomPassword: '',
                                                },
                                            );
                                            inputs.gameState.pauseMenuState = undefined;
                                        } finally {
                                            updateState({
                                                joiningRoom: undefined,
                                            });
                                        }
                                    },
                                },
                            })}
                        ></${ViraButton}>
                    </li>
                `;
            });

            return html`
                <ul>
                    ${roomTemplates}
                </ul>
            `;
        } else {
            return html`
                <p>No rooms found</p>
            `;
        }
    },
});
