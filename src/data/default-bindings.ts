import {
    AnyGamepad,
    defaultMenuNavBindings,
    InputDirection,
    MenuNavBinding,
    type PlayersBindingAssignments,
} from '@antha/input';
import {KnownInput} from 'gamepad-type';
import {type GameBinding, PlayerBinding} from './player-binding.js';

export const defaultBindings: Readonly<PlayersBindingAssignments<GameBinding>> = {
    '1': {
        [PlayerBinding.PlayerLeft]: [
            {
                deviceKey: AnyGamepad,
                direction: InputDirection.Positive,
                inputName: KnownInput.DPadLeft,
            },
            {
                deviceKey: AnyGamepad,
                direction: InputDirection.Negative,
                inputName: KnownInput.LeftStickX,
            },
            {
                deviceKey: AnyGamepad,
                direction: InputDirection.Negative,
                inputName: KnownInput.RightStickX,
            },
            {
                deviceKey: 'keyboard',
                direction: InputDirection.Positive,
                inputName: 'button-KeyA',
            },
            {
                deviceKey: 'keyboard',
                direction: InputDirection.Positive,
                inputName: 'button-KeyJ',
            },
            {
                deviceKey: 'keyboard',
                direction: InputDirection.Positive,
                inputName: 'button-ArrowLeft',
            },
        ],
        [PlayerBinding.PlayerRight]: [
            {
                deviceKey: AnyGamepad,
                direction: InputDirection.Positive,
                inputName: KnownInput.DPadRight,
            },
            {
                deviceKey: AnyGamepad,
                direction: InputDirection.Positive,
                inputName: KnownInput.LeftStickX,
            },
            {
                deviceKey: AnyGamepad,
                direction: InputDirection.Positive,
                inputName: KnownInput.RightStickX,
            },
            {
                deviceKey: 'keyboard',
                direction: InputDirection.Positive,
                inputName: 'button-KeyD',
            },
            {
                deviceKey: 'keyboard',
                direction: InputDirection.Positive,
                inputName: 'button-KeyL',
            },
            {
                deviceKey: 'keyboard',
                direction: InputDirection.Positive,
                inputName: 'button-ArrowRight',
            },
        ],
        [PlayerBinding.PlayerUp]: [
            {
                deviceKey: AnyGamepad,
                direction: InputDirection.Positive,
                inputName: KnownInput.DPadUp,
            },
            {
                deviceKey: AnyGamepad,
                direction: InputDirection.Negative,
                inputName: KnownInput.LeftStickY,
            },
            {
                deviceKey: AnyGamepad,
                direction: InputDirection.Negative,
                inputName: KnownInput.RightStickY,
            },
            {
                deviceKey: 'keyboard',
                direction: InputDirection.Positive,
                inputName: 'button-KeyW',
            },
            {
                deviceKey: 'keyboard',
                direction: InputDirection.Positive,
                inputName: 'button-KeyI',
            },
            {
                deviceKey: 'keyboard',
                direction: InputDirection.Positive,
                inputName: 'button-ArrowUp',
            },
        ],
        [PlayerBinding.PlayerDown]: [
            {
                deviceKey: AnyGamepad,
                direction: InputDirection.Positive,
                inputName: KnownInput.DPadDown,
            },
            {
                deviceKey: AnyGamepad,
                direction: InputDirection.Positive,
                inputName: KnownInput.LeftStickY,
            },
            {
                deviceKey: AnyGamepad,
                direction: InputDirection.Positive,
                inputName: KnownInput.RightStickY,
            },
            {
                deviceKey: 'keyboard',
                direction: InputDirection.Positive,
                inputName: 'button-KeyS',
            },
            {
                deviceKey: 'keyboard',
                direction: InputDirection.Positive,
                inputName: 'button-KeyK',
            },
            {
                deviceKey: 'keyboard',
                direction: InputDirection.Positive,
                inputName: 'button-ArrowDown',
            },
        ],
        ...defaultMenuNavBindings,
        [MenuNavBinding.OpenPauseMenu]: [
            {
                deviceKey: 'keyboard',
                direction: InputDirection.Positive,
                inputName: 'button-Escape',
            },
            {
                deviceKey: AnyGamepad,
                direction: InputDirection.Positive,
                inputName: KnownInput.Start,
            },
        ],
    },
};
