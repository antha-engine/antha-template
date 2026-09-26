import {createDefaultLocalPlayerBindings} from '@antha/input';
import {PlayerBinding, type GameBinding} from '../player/player-binding.js';

/** Provides movement and menu controls for every local player when a game starts. */
export const defaultBindings = createDefaultLocalPlayerBindings<GameBinding>({
    directionalBindingNames: {
        down: PlayerBinding.PlayerDown,
        left: PlayerBinding.PlayerLeft,
        right: PlayerBinding.PlayerRight,
        up: PlayerBinding.PlayerUp,
    },
});
