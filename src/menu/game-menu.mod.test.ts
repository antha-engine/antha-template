import {AnthaEngine} from '@antha/engine';
import {getAnthaMenuStateForNavigation} from '@antha/input';
import {assert} from '@augment-vir/assert';
import {describe, it, itCases} from '@augment-vir/test';
import {GameMenuKey, InputConsumer, type FullGameState} from '../game-state/game-state.js';
import {gameMenuStateMod} from './game-menu.mod.js';

describe(gameMenuStateMod.modName, () => {
    itCases(getAnthaMenuStateForNavigation, [
        {
            it: 'opens the pause menu when no menu is active',
            input: {
                menuExitWasTriggered: false,
                menuState: undefined,
                openPauseMenuWasTriggered: true,
                pauseMenu: GameMenuKey.Pause,
            },
            expect: {
                activeMenu: GameMenuKey.Pause,
                returnTo: [],
            },
        },
        {
            it: 'returns to the parent menu on back',
            input: {
                menuExitWasTriggered: true,
                menuState: {
                    activeMenu: GameMenuKey.Options,
                    returnTo: [GameMenuKey.Pause],
                },
                openPauseMenuWasTriggered: false,
                pauseMenu: GameMenuKey.Pause,
            },
            expect: {
                activeMenu: GameMenuKey.Pause,
                returnTo: [],
            },
        },
        {
            it: 'closes the root menu on pause or back',
            input: {
                menuExitWasTriggered: false,
                menuState: {
                    activeMenu: GameMenuKey.Pause,
                    returnTo: [],
                },
                openPauseMenuWasTriggered: true,
                pauseMenu: GameMenuKey.Pause,
            },
            expect: {
                activeMenu: undefined,
                returnTo: [],
            },
        },
        {
            it: 'ignores inactive navigation inputs',
            input: {
                menuExitWasTriggered: false,
                menuState: {
                    activeMenu: undefined,
                    returnTo: [],
                },
                openPauseMenuWasTriggered: false,
                pauseMenu: GameMenuKey.Pause,
            },
            expect: undefined,
        },
    ]);

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

        engine.state.menuState = {
            activeMenu: undefined,
            returnTo: [],
        };

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
