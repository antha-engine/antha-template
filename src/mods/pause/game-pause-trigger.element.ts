import {listenToObject} from '@antha/util';
import {type EmptyFunction} from '@augment-vir/common';
import {css, defineElement, html, listen, nothing} from 'element-vir';
import {lucideIcons, ViraButton, ViraColorVariant, ViraEmphasis} from 'vira';
import {type FullGameState} from '../../data/game-state.js';

export const GamePauseTrigger = defineElement<{
    gameState: Partial<FullGameState>;
}>()({
    tagName: 'game-pause-trigger',
    styles: css`
        :host {
            position: fixed;
            top: 0;
            left: 0;
            padding: 4px;
        }
    `,
    state() {
        return {
            cleanup: undefined as undefined | EmptyFunction,
        };
    },
    init({inputs, updateState, host}) {
        updateState({
            cleanup: listenToObject(inputs.gameState, 'pauseMenuState', () => {
                host.requestUpdate();
            }),
        });
    },
    cleanup({state, updateState}) {
        state.cleanup?.();
        updateState({
            cleanup: undefined,
        });
    },
    render({inputs}) {
        if (inputs.gameState.pauseMenuState) {
            /** Don't show the pause button if we're already paused. */
            return nothing;
        }

        return html`
            <${ViraButton.assign({
                icon: lucideIcons.Pause,
                buttonEmphasis: ViraEmphasis.Subtle,
                color: ViraColorVariant.Neutral,
            })}
                ${listen('click', () => {
                    inputs.gameState.pauseMenuState = {};
                })}
            ></${ViraButton}>
        `;
    },
});
