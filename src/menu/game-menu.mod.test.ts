import {AnthaEngine} from '@antha/engine';
import {assert} from '@augment-vir/assert';
import {describe, it} from '@augment-vir/test';
import {GameMenuKey, InputConsumer, type FullGameState} from '../game-state/game-state.js';
import {gameMenuNavMod} from './game-menu.mod.js';

describe(gameMenuNavMod.modName, () => {
    it('transfers raw input ownership between the game and pause menu', async () => {
        const engine = new AnthaEngine<FullGameState>({
            hostElement: document.createElement('div'),
            initState: {
                menuState: {
                    menuHistory: [
                        GameMenuKey.Pause,
                    ],
                    openedBy: undefined,
                },
            },
            mods: [
                gameMenuNavMod,
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

        engine.state.menuState = undefined;

        await engine.runSingleTick();
        await engine.runSingleTick();

        /** The earlier assertion narrows `rawInputConsumer`, so its reset is checked apart. */
        assert.isUndefined(engine.state.rawInputConsumer);
        assert.isFalse(engine.state.isInMenu);
    });
});
