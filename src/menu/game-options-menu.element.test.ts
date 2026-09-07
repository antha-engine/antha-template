import {InputDeviceHandler, NavController} from '@antha/input';
import {assert, assertWrap} from '@augment-vir/assert';
import {describe, it, testWeb} from '@augment-vir/test';
import {html, testIdSelector} from 'element-vir';
import {defaultGameAudioVolumeByChannel, GameAudioChannel} from '../audio/game-audio.js';
import {type FullGameState} from '../game-state/game-state.js';
import {createDefaultGameSaveState, defaultJoystickDeadZone} from '../game-state/save-data.js';
import {GameOptionsMenu} from './game-options-menu.element.js';
import {VirGameButton} from './vir-game-button.element.js';

type TestGameState = {
    deviceHandler: NonNullable<FullGameState['deviceHandler']>;
    navController: NonNullable<FullGameState['navController']>;
    saveState: NonNullable<FullGameState['saveState']>;
};

function activateGameOptionsButton({
    gameOptionsMenu,
    testId,
}: Readonly<{
    gameOptionsMenu: InstanceType<typeof GameOptionsMenu>;
    testId: string;
}>) {
    const gameButton = assertWrap.instanceOf(
        assertWrap.isDefined(gameOptionsMenu.shadowRoot).querySelector(testIdSelector(testId)),
        VirGameButton,
    );

    [
        'mousedown',
        'mouseup',
    ].forEach((eventType) => {
        gameButton.dispatchEvent(
            new MouseEvent(eventType, {
                bubbles: true,
            }),
        );
    });
}

async function renderGameOptionsMenu(gameState: Readonly<TestGameState>) {
    const renderedElement = await testWeb.render(html`
        <${GameOptionsMenu.assign({
            gameState,
        })}></${GameOptionsMenu}>
    `);

    return assertWrap.instanceOf(renderedElement, GameOptionsMenu);
}

describe(GameOptionsMenu.tagName, () => {
    it('adjusts music, sound, and controller settings through game buttons', async () => {
        const gameState: TestGameState = {
            deviceHandler: new InputDeviceHandler({
                globalDeadZone: defaultJoystickDeadZone,
                startLoopImmediately: false,
            }),
            navController: new NavController(document.body, {
                alwaysRequireFocused: true,
            }),
            saveState: createDefaultGameSaveState(),
        };

        try {
            const gameOptionsMenu = await renderGameOptionsMenu(gameState);

            activateGameOptionsButton({
                gameOptionsMenu,
                testId: GameOptionsMenu.testIds.increaseMusicVolumeButton,
            });
            activateGameOptionsButton({
                gameOptionsMenu,
                testId: GameOptionsMenu.testIds.increaseSoundVolumeButton,
            });
            activateGameOptionsButton({
                gameOptionsMenu,
                testId: GameOptionsMenu.testIds.increaseJoystickDeadZoneButton,
            });

            assert.deepEquals(
                {
                    deviceHandlerDeadZone: gameState.deviceHandler.globalDeadZone,
                    volume: gameState.saveState.volume,
                    savedJoystickDeadZone: gameState.saveState.joystickDeadZone,
                },
                {
                    deviceHandlerDeadZone: defaultJoystickDeadZone,
                    savedJoystickDeadZone: defaultJoystickDeadZone + 0.01,
                    volume: {
                        [GameAudioChannel.Music]:
                            defaultGameAudioVolumeByChannel[GameAudioChannel.Music] + 0.05,
                        [GameAudioChannel.Effects]:
                            defaultGameAudioVolumeByChannel[GameAudioChannel.Effects] + 0.05,
                    },
                },
            );
        } finally {
            testWeb.cleanupRender();
        }
    });
});
