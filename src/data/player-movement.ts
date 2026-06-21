import {type ActiveBindings} from '@antha/input';
import {type Coords} from '@augment-vir/common';
import {type FullGameState} from './game-state.js';
import {MultiplayerPacketType} from './multiplayer-packet.js';
import {PlayerBinding} from './player-binding.js';

const playerSpeedPxPerMs = 0.6;

export function queueLocalMovement({
    activeBindings,
    msSinceLastExecute,
    state,
}: Readonly<{
    activeBindings: ActiveBindings<PlayerBinding> | undefined;
    msSinceLastExecute: number;
    state: Partial<FullGameState>;
}>): void {
    if (state.pauseMenuState) {
        /** No movement when paused. */
        return;
    } else if (!state.multiplayerP2pLockStep) {
        throw new Error('Cannot queue local movement: missing multiplayer mod.');
    }

    const localClientId = state.multiplayerP2pLockStep.multiplayerController.getClientId();

    if (!state.multiplayerP2pLockStep.multiplayerController.isConnected()) {
        throw new Error('Cannot queue local movement: not connected.');
    } else if (!localClientId) {
        throw new Error('Cannot queue local movement: missing local client id.');
    } else if (!state.players?.[localClientId]) {
        throw new Error('Cannot queue local movement: missing local player.');
    }

    const movement = calculatePlayerMovement({
        activeBindings,
        msSinceLastExecute,
    });

    if (movement) {
        state.multiplayerP2pLockStep.multiplayerController.act({
            type: MultiplayerPacketType.PlayerMovement,
            x: movement.x,
            y: movement.y,
        });
    }
}

function calculatePlayerMovement({
    activeBindings,
    msSinceLastExecute,
}: Readonly<{
    activeBindings: ActiveBindings<PlayerBinding> | undefined;
    msSinceLastExecute: number;
}>): Coords | undefined {
    const upMovement = {
        value: activeBindings?.[PlayerBinding.PlayerUp]?.value || 0,
        durationMs: activeBindings?.[PlayerBinding.PlayerUp]?.holdDuration.milliseconds || Infinity,
    };
    const downMovement = {
        value: activeBindings?.[PlayerBinding.PlayerDown]?.value || 0,
        durationMs:
            activeBindings?.[PlayerBinding.PlayerDown]?.holdDuration.milliseconds || Infinity,
    };
    const leftMovement = {
        value: activeBindings?.[PlayerBinding.PlayerLeft]?.value || 0,
        durationMs:
            activeBindings?.[PlayerBinding.PlayerLeft]?.holdDuration.milliseconds || Infinity,
    };
    const rightMovement = {
        value: activeBindings?.[PlayerBinding.PlayerRight]?.value || 0,
        durationMs:
            activeBindings?.[PlayerBinding.PlayerRight]?.holdDuration.milliseconds || Infinity,
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

    const inputMagnitude = Math.min(magnitude, 1);

    return {
        x: (movementX / magnitude) * inputMagnitude * msSinceLastExecute * playerSpeedPxPerMs,
        y: (movementY / magnitude) * inputMagnitude * msSinceLastExecute * playerSpeedPxPerMs,
    };
}
