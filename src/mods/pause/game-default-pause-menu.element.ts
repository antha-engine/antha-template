import {nav, type NavController} from '@antha/input';
import {css, defineElement, html} from 'element-vir';
import {noNativeSpacing, ViraButton, ViraColorVariant, ViraSize} from 'vira';
import {type GameState} from '../../data/game-state.js';

export const GameDefaultPauseMenu = defineElement<{
    gameState: Partial<GameState>;
    navController: NavController;
}>()({
    tagName: 'game-default-pause-menu',
    styles: css`
        ul {
            ${noNativeSpacing}
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
    `,
    render({inputs}) {
        return html`
            <ul class="button-list">
                <${ViraButton.assign({
                    text: 'Resume',
                    color: ViraColorVariant.Neutral,
                    buttonSize: ViraSize.Large,
                })}
                    ${nav(inputs.navController, {
                        listeners: {
                            activate: ({enabled}) => {
                                if (enabled) {
                                    inputs.gameState.pauseMenuState = undefined;
                                }
                            },
                        },
                    })}
                ></${ViraButton}>
                <${ViraButton.assign({
                    text: 'Join',
                    color: ViraColorVariant.Neutral,
                    buttonSize: ViraSize.Large,
                })}
                    ${nav(inputs.navController, {
                        listeners: {
                            activate: ({enabled}) => {
                                if (enabled) {
                                    inputs.gameState.pauseMenuState = {
                                        showMultiplayerRoomLobby: true,
                                    };
                                }
                            },
                        },
                    })}
                ></${ViraButton}>
            </ul>
        `;
    },
});
