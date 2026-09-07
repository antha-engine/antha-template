import {AnthaEngine} from '@antha/engine';
import {InputDeviceHandler} from '@antha/input';
import {assert} from '@augment-vir/assert';
import {describe, it} from '@augment-vir/test';
import {type FullGameState} from './game-state.js';
import {gameStateMod} from './game-state.mod.js';
import {createDefaultGameSaveState} from './save-data.js';

describe(gameStateMod.modName, () => {
    it('syncs the saved joystick dead zone to the input device handler', async () => {
        const deviceHandler = new InputDeviceHandler({
            globalDeadZone: 0.2,
            startLoopImmediately: false,
        });
        const engine = new AnthaEngine<FullGameState>({
            hostElement: document.createElement('div'),
            initState: {
                deviceHandler,
                saveState: {
                    ...createDefaultGameSaveState(),
                    joystickDeadZone: 0.6,
                },
            },
            mods: [
                gameStateMod,
            ],
        });

        try {
            await engine.runSingleTick();

            assert.strictEquals(deviceHandler.globalDeadZone, 0.6);
        } finally {
            await engine.reset();
        }
    });
});
