import {getDirectionalInputVector} from '@antha/input';
import {getObjectTypedValues} from '@augment-vir/common';
import {type FullGameState} from '../game-state/game-state.js';
import {MultiplayerPacketType} from '../game-state/multiplayer-packet.js';
import {PlayerBinding} from './player-binding.js';

const playerSpeedPxPerMs = 0.6;

/** Converts each local player's active controls into synchronized movement actions. */
export function moveLocalPlayers({
    localClientId,
    msSinceLastExecute,
    state,
}: Readonly<{
    localClientId: FullGameState['multiplayerP2pLockStep']['multiplayerController']['clientId'];
    msSinceLastExecute: number;
    state: Partial<FullGameState>;
}>) {
    if (state.menuState) {
        return;
    } else if (!state.multiplayerP2pLockStep) {
        throw new Error('Cannot queue local movement: missing multiplayer mod.');
    }

    if (!state.multiplayerP2pLockStep.multiplayerController.isConnected()) {
        throw new Error('Cannot queue local movement: not connected.');
    }

    getObjectTypedValues(state.players || {}).forEach((player) => {
        if (player.clientId !== localClientId) {
            return;
        }

        const direction = getDirectionalInputVector({
            activeBindings: state.activeBindings?.[player.playerPosition],
            bindingNames: {
                down: PlayerBinding.PlayerDown,
                left: PlayerBinding.PlayerLeft,
                right: PlayerBinding.PlayerRight,
                up: PlayerBinding.PlayerUp,
            },
        });

        if (direction) {
            state.multiplayerP2pLockStep?.multiplayerController.act({
                playerPosition: player.playerPosition,
                type: MultiplayerPacketType.PlayerMovement,
                x: direction.x * msSinceLastExecute * playerSpeedPxPerMs,
                y: direction.y * msSinceLastExecute * playerSpeedPxPerMs,
            });
        }
    });
}
