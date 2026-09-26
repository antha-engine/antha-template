import {createDefaultLocalPlayerBindings, GamepadInputDeviceKey} from '@antha/input';
import {getObjectTypedEntries, type Values} from '@augment-vir/common';
import {PlayerBinding, type GameBinding} from '../player/player-binding.js';
import {LocalPlayerPosition} from './game-state.js';

/** Assigns each local player slot to a controller so simultaneous players stay independent. */
export const playerGamepadDeviceKeys = {
    [LocalPlayerPosition.One]: GamepadInputDeviceKey.Gamepad1,
    [LocalPlayerPosition.Two]: GamepadInputDeviceKey.Gamepad2,
    [LocalPlayerPosition.Three]: GamepadInputDeviceKey.Gamepad3,
    [LocalPlayerPosition.Four]: GamepadInputDeviceKey.Gamepad4,
} satisfies Readonly<Record<LocalPlayerPosition, Values<typeof GamepadInputDeviceKey>>>;

/** Provides movement and menu controls for every local player when a game starts. */
export const defaultBindings = createDefaultLocalPlayerBindings<GameBinding>({
    directionalBindingNames: {
        down: PlayerBinding.PlayerDown,
        left: PlayerBinding.PlayerLeft,
        right: PlayerBinding.PlayerRight,
        up: PlayerBinding.PlayerUp,
    },
    keyboardPlayerPosition: LocalPlayerPosition.One,
    playerGamepads: getObjectTypedEntries(playerGamepadDeviceKeys).map(
        ([
            playerPosition,
            gamepadDeviceKey,
        ]) => {
            return {
                gamepadDeviceKey,
                playerPosition,
            };
        },
    ),
});
