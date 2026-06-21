import {nav} from '@antha/input';
import {listenToObject} from '@antha/util';
import {type EmptyFunction} from '@augment-vir/common';
import {css, defineElement, html, nothing} from 'element-vir';
import {ViraButton, ViraColorVariant, ViraSize} from 'vira';
import {type FullGameState} from '../../data/game-state.js';
import {GameDefaultPauseMenu} from './game-default-pause-menu.element.js';
import {GameMultiplayerRooms} from './game-multiplayer-rooms.element.js';

export const GamePause = defineElement<{
    gameState: Partial<FullGameState>;
}>()({
    tagName: 'game-pause',
    state() {
        return {
            showPauseMenu: false,
            cleanup: undefined as undefined | EmptyFunction,
        };
    },
    hostClasses: {
        'game-pause-visible': ({state}) => state.showPauseMenu,
    },
    styles({hostClasses}) {
        return css`
            :host {
                position: fixed;
                inset: 0;
                display: none;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 24px;
                box-sizing: border-box;
                padding: 16px;
                background: rgba(0, 0, 0, 0.2);
                backdrop-filter: blur(3px);
                z-index: 10;
            }

            ${hostClasses['game-pause-visible'].selector} {
                display: flex;
            }

            h1 {
                margin: 0;
                font-size: 48px;
                font-weight: 700;
            }
        `;
    },
    init({inputs, updateState, host}) {
        updateState({
            cleanup: listenToObject(inputs.gameState, 'pauseMenuState', (value) => {
                updateState({
                    showPauseMenu: !!value,
                });
                host.requestUpdate();
            }),
        });
    },
    cleanup({state}) {
        state.cleanup?.();
    },
    render({inputs, state}) {
        const navController = inputs.gameState.navController;

        if (!state.showPauseMenu || !navController) {
            return nothing;
        }

        const headerTemplate = html`
            <h1>Paused</h1>
        `;

        const pauseMenus = {
            default: html`
                <${GameDefaultPauseMenu.assign({
                    gameState: inputs.gameState,
                    navController,
                })}></${GameDefaultPauseMenu}>
            `,
            multiplayerRooms: html`
                <${ViraButton.assign({
                    text: 'Back',
                    color: ViraColorVariant.Neutral,
                    buttonSize: ViraSize.Large,
                })}
                    ${nav(navController, {
                        listeners: {
                            activate: ({enabled}) => {
                                if (enabled) {
                                    inputs.gameState.pauseMenuState = {};
                                }
                            },
                        },
                    })}
                ></${ViraButton}>
                <${GameMultiplayerRooms.assign({
                    gameState: inputs.gameState,
                    navController,
                })}></${GameMultiplayerRooms}>
            `,
        };

        const pauseMenuContents = inputs.gameState.pauseMenuState?.showMultiplayerRoomLobby
            ? pauseMenus.multiplayerRooms
            : pauseMenus.default;

        return html`
            ${headerTemplate} ${pauseMenuContents}
        `;
    },
});
