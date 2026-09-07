import {type ActiveBindings} from '@antha/input';
import {getObjectTypedValues, type Coords} from '@augment-vir/common';
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
    if (state.menuState?.activeMenu) {
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

        const movement = calculatePlayerMovement({
            activeBindings: state.activeBindings?.[player.playerPosition],
            msSinceLastExecute,
        });

        if (movement) {
            state.multiplayerP2pLockStep?.multiplayerController.act({
                playerPosition: player.playerPosition,
                type: MultiplayerPacketType.PlayerMovement,
                x: movement.x,
                y: movement.y,
            });
        }
    });
}

function calculatePlayerMovement({
    activeBindings,
    msSinceLastExecute,
}: Readonly<{
    activeBindings: ActiveBindings<PlayerBinding> | undefined;
    msSinceLastExecute: number;
}>): Coords | undefined {
    const upMovement = {
        durationMs: activeBindings?.[PlayerBinding.PlayerUp]?.holdDuration.milliseconds || Infinity,
        value: activeBindings?.[PlayerBinding.PlayerUp]?.value || 0,
    };
    const downMovement = {
        durationMs:
            activeBindings?.[PlayerBinding.PlayerDown]?.holdDuration.milliseconds || Infinity,
        value: activeBindings?.[PlayerBinding.PlayerDown]?.value || 0,
    };
    const leftMovement = {
        durationMs:
            activeBindings?.[PlayerBinding.PlayerLeft]?.holdDuration.milliseconds || Infinity,
        value: activeBindings?.[PlayerBinding.PlayerLeft]?.value || 0,
    };
    const rightMovement = {
        durationMs:
            activeBindings?.[PlayerBinding.PlayerRight]?.holdDuration.milliseconds || Infinity,
        value: activeBindings?.[PlayerBinding.PlayerRight]?.value || 0,
    };

    const movementY =
        upMovement.value && upMovement.durationMs < downMovement.durationMs
            ? -upMovement.value
            : downMovement.value && downMovement.durationMs < upMovement.durationMs
              ? downMovement.value
              : 0;

    const movementX =
        leftMovement.value && leftMovement.durationMs < rightMovement.durationMs
            ? -leftMovement.value
            : rightMovement.value && rightMovement.durationMs < leftMovement.durationMs
              ? rightMovement.value
              : 0;

    const magnitude = Math.hypot(movementX, movementY);

    if (!magnitude) {
        return undefined;
    }

    return {
        x:
            (movementX / magnitude) *
            Math.min(magnitude, 1) *
            msSinceLastExecute *
            playerSpeedPxPerMs,
        y:
            (movementY / magnitude) *
            Math.min(magnitude, 1) *
            msSinceLastExecute *
            playerSpeedPxPerMs,
    };
}
