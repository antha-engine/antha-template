import {AnthaEngine} from '@antha/engine';
import {assert} from '@augment-vir/assert';
import {describe, it} from '@augment-vir/test';
import {GameMenuKey, InputConsumer, type FullGameState} from '../game-state/game-state.js';
import {gameMenuMod, getGameMenuStateForNavigation} from './game-menu.mod.js';

describe(gameMenuMod.modName, () => {
    it('opens, returns from, and exits menus with menu navigation controls', () => {
        assert.deepEquals(
            [
                getGameMenuStateForNavigation({
                    menuExitWasTriggered: false,
                    menuState: undefined,
                    openPauseMenuWasTriggered: true,
                }),
                getGameMenuStateForNavigation({
                    menuExitWasTriggered: true,
                    menuState: {
                        activeMenu: GameMenuKey.Options,
                        returnTo: GameMenuKey.Pause,
                    },
                    openPauseMenuWasTriggered: false,
                }),
                getGameMenuStateForNavigation({
                    menuExitWasTriggered: false,
                    menuState: {
                        activeMenu: GameMenuKey.Pause,
                        returnTo: undefined,
                    },
                    openPauseMenuWasTriggered: true,
                }),
                getGameMenuStateForNavigation({
                    menuExitWasTriggered: true,
                    menuState: {
                        activeMenu: GameMenuKey.Pause,
                        returnTo: undefined,
                    },
                    openPauseMenuWasTriggered: false,
                }),
            ],
            [
                {
                    activeMenu: GameMenuKey.Pause,
                    returnTo: undefined,
                },
                {
                    activeMenu: GameMenuKey.Pause,
                    returnTo: undefined,
                },
                {
                    activeMenu: undefined,
                    returnTo: undefined,
                },
                {
                    activeMenu: undefined,
                    returnTo: undefined,
                },
            ],
        );
    });

    it('transfers raw input ownership between the game and pause menu', async () => {
        const engine = new AnthaEngine<FullGameState>({
            hostElement: document.createElement('div'),
            initState: {
                isInMenu: true,
                menuState: {
                    activeMenu: GameMenuKey.Pause,
                    returnTo: undefined,
                },
            },
            mods: [
                gameMenuMod,
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

        engine.state.menuState = {
            activeMenu: undefined,
            returnTo: undefined,
        };

        await engine.runSingleTick();

        assert.deepEquals(
            {
                disableEntityUpdates: engine.state.disableEntityUpdates,
                isInMenu: engine.state.isInMenu,
                rawInputConsumer: engine.state.rawInputConsumer,
            },
            {
                disableEntityUpdates: true,
                isInMenu: false,
                rawInputConsumer: InputConsumer.Game,
            },
        );
    });
});
