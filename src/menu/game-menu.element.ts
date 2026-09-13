import {listenToObject} from '@antha/util';
import {type EmptyFunction} from '@augment-vir/common';
import {css, defineElement, html, nothing} from 'element-vir';
import {GameMenuKey, type FullGameState} from '../game-state/game-state.js';
import {GameMultiplayerRooms} from './game-multiplayer-rooms.element.js';
import {GameOptionsMenu} from './game-options-menu.element.js';
import {GamePauseMenu} from './game-pause-menu.element.js';

/** Renders the active game overlay so menu state appears consistently above the game. */
export const GameMenu = defineElement<{
    gameState: Partial<FullGameState>;
}>()({
    tagName: 'game-menu',
    state({inputs}) {
        return {
            cleanup: undefined as undefined | EmptyFunction,
            activeMenu: inputs.gameState.menuState?.activeMenu,
        };
    },
    hostClasses: {
        'game-menu-visible'({state}) {
            return !!state.activeMenu;
        },
    },
    styles({hostClasses}) {
        return css`
            :host {
                align-items: center;
                backdrop-filter: blur(3px);
                background: rgba(0, 0, 0, 0.4);
                box-sizing: border-box;
                color: white;
                display: none;
                flex-direction: column;
                inset: 0;
                justify-content: center;
                padding: 16px;
                position: fixed;
                z-index: 2;
            }

            ${hostClasses['game-menu-visible'].selector} {
                display: flex;
            }
        `;
    },
    init({host, inputs, updateState}) {
        updateState({
            cleanup: listenToObject(inputs.gameState, 'menuState', (menuState) => {
                if (!menuState) {
                    return;
                }

                updateState({
                    activeMenu: menuState.activeMenu,
                });
                host.requestUpdate();
            }),
        });
    },
    cleanup({state}) {
        state.cleanup?.();
    },
    render({inputs, state}) {
        if (!state.activeMenu) {
            return nothing;
        }

        const menus = {
            [GameMenuKey.MultiplayerRooms]: html`
                <${GameMultiplayerRooms.assign({
                    gameState: inputs.gameState,
                })}></${GameMultiplayerRooms}>
            `,
            [GameMenuKey.Options]: html`
                <${GameOptionsMenu.assign({
                    gameState: inputs.gameState,
                })}></${GameOptionsMenu}>
            `,
            [GameMenuKey.Pause]: html`
                <${GamePauseMenu.assign({
                    gameState: inputs.gameState,
                })}></${GamePauseMenu}>
            `,
        } satisfies Record<GameMenuKey, ReturnType<typeof html>>;

        return menus[state.activeMenu];
    },
});
