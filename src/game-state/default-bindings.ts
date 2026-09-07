import {KnownInput} from '@antha/gamepad-type';
import {
    AnyGamepad,
    defaultMenuNavBindings,
    GamepadInputDeviceKey,
    InputDirection,
    type BindingAssignments,
    type MenuNavBinding,
    type PlayersBindingAssignments,
} from '@antha/input';
import {mapObjectValues, type Values} from '@augment-vir/common';
import {PlayerBinding, type GameBinding} from '../player/player-binding.js';
import {LocalPlayerPosition} from './game-state.js';

/** Assigns each local player slot to a controller so simultaneous players stay independent. */
export const playerGamepadDeviceKeys = {
    [LocalPlayerPosition.One]: GamepadInputDeviceKey.Gamepad1,
    [LocalPlayerPosition.Two]: GamepadInputDeviceKey.Gamepad2,
    [LocalPlayerPosition.Three]: GamepadInputDeviceKey.Gamepad3,
    [LocalPlayerPosition.Four]: GamepadInputDeviceKey.Gamepad4,
} satisfies Readonly<Record<LocalPlayerPosition, Values<typeof GamepadInputDeviceKey>>>;

function createPlayerMovementBindings({
    gamepadDeviceKey,
    includeKeyboard,
}: Readonly<{
    gamepadDeviceKey: Values<typeof GamepadInputDeviceKey>;
    includeKeyboard: boolean;
}>) {
    const keyboardBindings: BindingAssignments<PlayerBinding> = {
        [PlayerBinding.PlayerDown]: [
            {
                deviceKey: 'keyboard',
                direction: InputDirection.Positive,
                inputName: 'button-KeyS',
            },
            {
                deviceKey: 'keyboard',
                direction: InputDirection.Positive,
                inputName: 'button-ArrowDown',
            },
        ],
        [PlayerBinding.PlayerLeft]: [
            {
                deviceKey: 'keyboard',
                direction: InputDirection.Positive,
                inputName: 'button-KeyA',
            },
            {
                deviceKey: 'keyboard',
                direction: InputDirection.Positive,
                inputName: 'button-ArrowLeft',
            },
        ],
        [PlayerBinding.PlayerRight]: [
            {
                deviceKey: 'keyboard',
                direction: InputDirection.Positive,
                inputName: 'button-KeyD',
            },
            {
                deviceKey: 'keyboard',
                direction: InputDirection.Positive,
                inputName: 'button-ArrowRight',
            },
        ],
        [PlayerBinding.PlayerUp]: [
            {
                deviceKey: 'keyboard',
                direction: InputDirection.Positive,
                inputName: 'button-KeyW',
            },
            {
                deviceKey: 'keyboard',
                direction: InputDirection.Positive,
                inputName: 'button-ArrowUp',
            },
        ],
    };

    return {
        [PlayerBinding.PlayerDown]: [
            {
                deviceKey: gamepadDeviceKey,
                direction: InputDirection.Positive,
                inputName: KnownInput.DPadDown,
            },
            {
                deviceKey: gamepadDeviceKey,
                direction: InputDirection.Positive,
                inputName: KnownInput.LeftStickY,
            },
            {
                deviceKey: gamepadDeviceKey,
                direction: InputDirection.Positive,
                inputName: KnownInput.RightStickY,
            },
            ...(includeKeyboard ? keyboardBindings[PlayerBinding.PlayerDown] || [] : []),
        ],
        [PlayerBinding.PlayerLeft]: [
            {
                deviceKey: gamepadDeviceKey,
                direction: InputDirection.Positive,
                inputName: KnownInput.DPadLeft,
            },
            {
                deviceKey: gamepadDeviceKey,
                direction: InputDirection.Negative,
                inputName: KnownInput.LeftStickX,
            },
            {
                deviceKey: gamepadDeviceKey,
                direction: InputDirection.Negative,
                inputName: KnownInput.RightStickX,
            },
            ...(includeKeyboard ? keyboardBindings[PlayerBinding.PlayerLeft] || [] : []),
        ],
        [PlayerBinding.PlayerRight]: [
            {
                deviceKey: gamepadDeviceKey,
                direction: InputDirection.Positive,
                inputName: KnownInput.DPadRight,
            },
            {
                deviceKey: gamepadDeviceKey,
                direction: InputDirection.Positive,
                inputName: KnownInput.LeftStickX,
            },
            {
                deviceKey: gamepadDeviceKey,
                direction: InputDirection.Positive,
                inputName: KnownInput.RightStickX,
            },
            ...(includeKeyboard ? keyboardBindings[PlayerBinding.PlayerRight] || [] : []),
        ],
        [PlayerBinding.PlayerUp]: [
            {
                deviceKey: gamepadDeviceKey,
                direction: InputDirection.Positive,
                inputName: KnownInput.DPadUp,
            },
            {
                deviceKey: gamepadDeviceKey,
                direction: InputDirection.Negative,
                inputName: KnownInput.LeftStickY,
            },
            {
                deviceKey: gamepadDeviceKey,
                direction: InputDirection.Negative,
                inputName: KnownInput.RightStickY,
            },
            ...(includeKeyboard ? keyboardBindings[PlayerBinding.PlayerUp] || [] : []),
        ],
    } satisfies BindingAssignments<PlayerBinding>;
}

function createPlayerMenuBindings({
    gamepadDeviceKey,
    includeKeyboard,
}: Readonly<{
    gamepadDeviceKey: Values<typeof GamepadInputDeviceKey>;
    includeKeyboard: boolean;
}>) {
    return mapObjectValues(defaultMenuNavBindings, (_bindingName, assignments) => {
        return assignments.flatMap((assignment) => {
            if (assignment.deviceKey === AnyGamepad) {
                return [
                    {
                        ...assignment,
                        deviceKey: gamepadDeviceKey,
                    },
                ];
            }

            return includeKeyboard ? [assignment] : [];
        });
    }) satisfies BindingAssignments<MenuNavBinding>;
}

function createPlayerBindings({
    gamepadDeviceKey,
    playerPosition,
}: Readonly<{
    gamepadDeviceKey: Values<typeof GamepadInputDeviceKey>;
    playerPosition: LocalPlayerPosition;
}>) {
    const includeKeyboard = playerPosition === LocalPlayerPosition.One;

    return {
        ...createPlayerMovementBindings({
            gamepadDeviceKey,
            includeKeyboard,
        }),
        ...createPlayerMenuBindings({
            gamepadDeviceKey,
            includeKeyboard,
        }),
    } satisfies BindingAssignments<GameBinding>;
}

/** Provides movement and menu controls for every local player when a game starts. */
export const defaultBindings: Readonly<PlayersBindingAssignments<GameBinding>> = mapObjectValues(
    playerGamepadDeviceKeys,
    (playerPosition, gamepadDeviceKey) => {
        return createPlayerBindings({
            gamepadDeviceKey,
            playerPosition,
        });
    },
);
