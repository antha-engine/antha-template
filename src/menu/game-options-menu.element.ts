import {nav} from '@antha/input';
import {clamp, getEnumValues} from '@augment-vir/common';
import {css, defineElement, html, testId} from 'element-vir';
import {noNativeSpacing} from 'vira';
import {defaultGameAudioVolumeByChannel, GameAudioChannel} from '../audio/game-audio.js';
import {getGameMenuReturnState, type FullGameState} from '../game-state/game-state.js';
import {defaultJoystickDeadZone} from '../game-state/save-data.js';
import {VirGameButton} from './vir-game-button.element.js';

const joystickDeadZoneStep = 0.01;
const gameAudioVolumeStep = 0.05;

function renderGameNumberControl({
    adjustValue,
    adjustmentStep,
    decreaseButtonTestId,
    host,
    increaseButtonTestId,
    label,
    navController,
    value,
    y,
}: Readonly<{
    adjustValue: (adjustment: number) => void;
    adjustmentStep: number;
    decreaseButtonTestId: string;
    host: {requestUpdate: () => void};
    increaseButtonTestId: string;
    label: string;
    navController: NonNullable<FullGameState['navController']>;
    value: number;
    y: number;
}>) {
    return html`
        <li class="settings-control">
            <p>${label}: ${Math.round(value * 100)}%</p>
            <div class="settings-buttons">
                <${VirGameButton}
                    ${testId(decreaseButtonTestId)}
                    ${nav(navController, {
                        listeners: {
                            activate({enabled}) {
                                if (enabled) {
                                    adjustValue(-adjustmentStep);
                                    host.requestUpdate();
                                }
                            },
                        },
                        x: 0,
                        y,
                    })}
                >
                    -
                </${VirGameButton}>
                <${VirGameButton}
                    ${testId(increaseButtonTestId)}
                    ${nav(navController, {
                        listeners: {
                            activate({enabled}) {
                                if (enabled) {
                                    adjustValue(adjustmentStep);
                                    host.requestUpdate();
                                }
                            },
                        },
                        x: 1,
                        y,
                    })}
                >
                    +
                </${VirGameButton}>
            </div>
        </li>
    `;
}

/** Lets players adjust saved audio and controller sensitivity settings. */
export const GameOptionsMenu = defineElement<{
    gameState: Partial<FullGameState>;
}>()({
    tagName: 'game-options-menu',
    testIds: [
        'decreaseMusicVolumeButton',
        'decreaseJoystickDeadZoneButton',
        'decreaseSoundVolumeButton',
        'increaseMusicVolumeButton',
        'increaseJoystickDeadZoneButton',
        'increaseSoundVolumeButton',
    ],
    styles: css`
        :host,
        .settings-control,
        ul {
            align-items: center;
            display: flex;
            flex-direction: column;
        }

        :host,
        ul {
            gap: 16px;
        }

        ul,
        p {
            ${noNativeSpacing}
        }

        ul {
            list-style: none;
        }

        h1 {
            font-size: 48px;
        }

        .settings-control {
            gap: 4px;
        }

        .settings-buttons {
            display: flex;
            gap: 8px;
        }
    `,
    render({host, inputs, testIds}) {
        const navController = inputs.gameState.navController;

        if (!navController) {
            return;
        }

        const joystickDeadZone =
            inputs.gameState.deviceHandler?.globalDeadZone ??
            inputs.gameState.saveState?.joystickDeadZone ??
            defaultJoystickDeadZone;
        return html`
            <h1>Options</h1>
            <ul>
                ${getEnumValues(GameAudioChannel).map((audioChannel, index) => {
                    return renderGameNumberControl({
                        adjustValue(adjustment) {
                            adjustGameAudioVolume({
                                adjustment,
                                audioChannel,
                                gameState: inputs.gameState,
                            });
                        },
                        adjustmentStep: gameAudioVolumeStep,
                        decreaseButtonTestId:
                            testIds[
                                audioVolumeControlDefinitionsByChannel[audioChannel]
                                    .decreaseButtonTestId
                            ],
                        host,
                        increaseButtonTestId:
                            testIds[
                                audioVolumeControlDefinitionsByChannel[audioChannel]
                                    .increaseButtonTestId
                            ],
                        label: `${audioVolumeControlDefinitionsByChannel[audioChannel].label} volume`,
                        navController,
                        value:
                            inputs.gameState.saveState?.volume[audioChannel] ??
                            defaultGameAudioVolumeByChannel[audioChannel],
                        y: index,
                    });
                })}
                ${renderGameNumberControl({
                    adjustValue(adjustment) {
                        adjustJoystickDeadZone({
                            adjustment,
                            gameState: inputs.gameState,
                        });
                    },
                    adjustmentStep: joystickDeadZoneStep,
                    decreaseButtonTestId: testIds.decreaseJoystickDeadZoneButton,
                    host,
                    increaseButtonTestId: testIds.increaseJoystickDeadZoneButton,
                    label: 'Joystick dead zone',
                    navController,
                    value: joystickDeadZone,
                    y: 2,
                })}
                <li>
                    <${VirGameButton}
                        ${nav(navController, {
                            listeners: {
                                activate({enabled}) {
                                    if (enabled) {
                                        inputs.gameState.menuState = getGameMenuReturnState(
                                            inputs.gameState.menuState,
                                        );
                                    }
                                },
                            },
                            y: 3,
                        })}
                    >
                        Back
                    </${VirGameButton}>
                </li>
            </ul>
        `;
    },
});

const audioVolumeControlDefinitionsByChannel = {
    [GameAudioChannel.Music]: {
        decreaseButtonTestId: 'decreaseMusicVolumeButton',
        increaseButtonTestId: 'increaseMusicVolumeButton',
        label: 'Music',
    },
    [GameAudioChannel.Effects]: {
        decreaseButtonTestId: 'decreaseSoundVolumeButton',
        increaseButtonTestId: 'increaseSoundVolumeButton',
        label: 'Sound',
    },
} satisfies Record<
    GameAudioChannel,
    Readonly<{
        decreaseButtonTestId: 'decreaseMusicVolumeButton' | 'decreaseSoundVolumeButton';
        increaseButtonTestId: 'increaseMusicVolumeButton' | 'increaseSoundVolumeButton';
        label: string;
    }>
>;

function adjustJoystickDeadZone({
    adjustment,
    gameState,
}: Readonly<{
    adjustment: number;
    gameState: Partial<FullGameState>;
}>) {
    if (!gameState.saveState) {
        return;
    }

    gameState.saveState.joystickDeadZone = clamp(
        gameState.saveState.joystickDeadZone + adjustment,
        {
            max: 1,
            min: 0,
        },
    );
}

function adjustGameAudioVolume({
    adjustment,
    audioChannel,
    gameState,
}: Readonly<{
    adjustment: number;
    audioChannel: GameAudioChannel;
    gameState: Partial<FullGameState>;
}>) {
    if (!gameState.saveState) {
        return;
    }

    gameState.saveState.volume[audioChannel] = clamp(
        gameState.saveState.volume[audioChannel] + adjustment,
        {
            max: 1,
            min: 0,
        },
    );
}
