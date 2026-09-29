import {defineAnthaMod} from '@antha/engine';
import {createAnthaMenuMod} from '@antha/input';
import {html} from 'element-vir';
import {GameMenuKey, InputConsumer, type FullGameState} from '../game-state/game-state.js';
import {GameMenu as GameMenuElement} from './game-menu.element.js';

export const gameMenuNavMod = createAnthaMenuMod<GameMenuKey, InputConsumer>({
    allowWrapping: true,
    alwaysRequireFocused: true,
    blockPerpendicularNavigation: true,
    menuState: {
        menuInputConsumerName: InputConsumer.Menu,
        pauseMenuKey: GameMenuKey.Pause,
    },
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
