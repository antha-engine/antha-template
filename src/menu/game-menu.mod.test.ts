import {AnthaEngine} from '@antha/engine';
import {emptyApiAndRoomConnectionState} from '@antha/multiplayer-core';
import {P2pLockStepMultiplayerController} from '@antha/multiplayer-p2p-lock-step';
import {assert} from '@augment-vir/assert';
import {describe, it} from '@augment-vir/test';
import {GameMenuKey, InputConsumer, type FullGameState} from '../game-state/game-state.js';
import {type MultiplayerPacket} from '../game-state/multiplayer-packet.js';
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

    it('keeps render-timed entity updates disabled in a multiplayer room', async () => {
        const controller = new P2pLockStepMultiplayerController<MultiplayerPacket>({
            gameId: 'game-menu-multiplayer-test',
        });

        controller.startSingleplayer();
        Object.defineProperty(controller, 'roomId', {
            configurable: true,
            get() {
                return 'test-room';
            },
        });
        const engine = new AnthaEngine<FullGameState>({
            hostElement: document.createElement('div'),
            initState: {
                menuState: {
                    activeMenu: undefined,
                    returnTo: undefined,
                },
                multiplayerP2pLockStep: {
                    connectionState: emptyApiAndRoomConnectionState,
                    multiplayerController: controller,
                },
            },
            mods: [
                gameMenuMod,
            ],
        });

        try {
            await engine.runSingleTick();

            assert.isTrue(engine.state.disableEntityUpdates);
        } finally {
            controller.destroy();
        }
    });
});
