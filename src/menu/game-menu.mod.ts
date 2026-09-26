import {defineAnthaMod} from '@antha/engine';
import {createAnthaMenuStateMod} from '@antha/input';
import {html} from 'element-vir';
import {GameMenuKey, InputConsumer, type FullGameState} from '../game-state/game-state.js';
import {GameMenu as GameMenuElement} from './game-menu.element.js';

export const gameMenuStateMod = createAnthaMenuStateMod<GameMenuKey, InputConsumer>({
    gameInputConsumerName: InputConsumer.Game,
    menuInputConsumerName: InputConsumer.Menu,
    pauseMenuKey: GameMenuKey.Pause,
});

export const gameMenuMod = defineAnthaMod<FullGameState>({
    modName: 'game-menu',
    execute({state}) {
        return html`
            <${GameMenuElement.assign({
                gameState: state,
            })}></${GameMenuElement}>
        `;
    },
});
