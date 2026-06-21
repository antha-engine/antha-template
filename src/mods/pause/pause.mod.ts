import {defineAnthaMod} from '@antha/engine';
import {MenuNavBinding} from '@antha/input';
import {html} from 'element-vir';
import {type FullGameState} from '../../data/game-state.js';
import {GamePauseTrigger} from './game-pause-trigger.element.js';
import {GamePause} from './game-pause.element.js';

export const pauseMod = defineAnthaMod<FullGameState>({
    modName: 'pause-menu',
    execute({state}) {
        Object.values(state.activeBindings || {}).forEach((bindings) => {
            const exitBinding = bindings[MenuNavBinding.OpenPauseMenu];

            if (!exitBinding || exitBinding.actCount) {
                return;
            }

            exitBinding.actCount = 1;

            if (state.pauseMenuState) {
                state.pauseMenuState = undefined;
            } else {
                state.pauseMenuState = {};
            }
        });

        state.isInMenu = !!state.pauseMenuState;

        return html`
            <${GamePauseTrigger.assign({
                gameState: state,
            })}></${GamePauseTrigger}>
            <${GamePause.assign({
                gameState: state,
            })}></${GamePause}>
        `;
    },
});
