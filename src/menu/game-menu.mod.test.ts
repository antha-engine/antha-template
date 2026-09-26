import {AnthaEngine} from '@antha/engine';
import {closeAnthaMenus} from '@antha/input';
import {assert} from '@augment-vir/assert';
import {describe, it} from '@augment-vir/test';
import {GameMenuKey, InputConsumer, type FullGameState} from '../game-state/game-state.js';
import {gameMenuStateMod} from './game-menu.mod.js';

describe(gameMenuStateMod.modName, () => {
    it('transfers raw input ownership between the game and pause menu', async () => {
        const engine = new AnthaEngine<FullGameState>({
            hostElement: document.createElement('div'),
            initState: {
                isInMenu: true,
                menuState: {
                    activeMenu: GameMenuKey.Pause,
                    returnTo: [],
                },
            },
            mods: [
                gameMenuStateMod,
            ],
        });

        await engine.runSingleTick();

        assert.deepEquals(
            {
                isInMenu: engine.state.isInMenu,
                rawInputConsumer: engine.state.rawInputConsumer,
            },
            {
                isInMenu: true,
                rawInputConsumer: InputConsumer.Menu,
            },
        );

        engine.state.menuState = closeAnthaMenus();

        await engine.runSingleTick();
        await engine.runSingleTick();

        assert.deepEquals(
            {
                isInMenu: engine.state.isInMenu,
                rawInputConsumer: engine.state.rawInputConsumer,
            },
            {
                isInMenu: false,
                rawInputConsumer: InputConsumer.Game,
            },
        );
    });
});
