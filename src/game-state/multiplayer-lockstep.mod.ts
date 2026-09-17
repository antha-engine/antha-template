import {defineAnthaMod, ModExecutionTriggerType, type ModExecuteParams} from '@antha/engine';
import {
    isMultiplayerRoomConnected,
    MultiplayerControllerFrameEvent,
} from '@antha/multiplayer-p2p-lock-step';
import {awaitedBlockingMap, ensureErrorAndPrependMessage, log} from '@augment-vir/common';
import {type FullGameState} from './game-state.js';
import {multiplayerPacketHandlers, type MultiplayerPacket} from './multiplayer-packet.js';

const multiplayerFrameDurationMs = 10;

/** Applies each synchronized multiplayer frame before running entity updates. */
export const multiplayerLockstepMod = defineAnthaMod<FullGameState>({
    modName: 'multiplayer-lockstep',
    trigger: {
        event: MultiplayerControllerFrameEvent,
        executeImmediately: false,
    },
    async execute(executeParams) {
        const {executionTrigger, state} = executeParams;

        if (executionTrigger.type !== ModExecutionTriggerType.Event) {
            return;
        }

        await awaitedBlockingMap(executionTrigger.events, async (event) => {
            if (!(event instanceof MultiplayerControllerFrameEvent)) {
                return;
            }

            const multiplayerFrameEvent: MultiplayerControllerFrameEvent<MultiplayerPacket> = event;

            await awaitedBlockingMap(multiplayerFrameEvent.detail, async (detail) => {
                try {
                    await multiplayerPacketHandlers[detail.packet.type]({
                        detail,
                        state,
                    });
                } catch (error) {
                    log.error(
                        ensureErrorAndPrependMessage(
                            error,
                            `Failed to handel '${detail.packet.type}' multiplayer packet.`,
                        ),
                    );
                }
            });

            if (!isMultiplayerRoomConnected(state)) {
                return;
            }

            state.multiplayerLockstepTick = (state.multiplayerLockstepTick || 0) + 1;

            if (state.entityStore) {
                await state.entityStore.updateAllEntities({
                    ...executeParams,
                    currentTick: state.multiplayerLockstepTick,
                    executionTrigger: {
                        events: [
                            multiplayerFrameEvent,
                        ],
                        type: ModExecutionTriggerType.Event,
                    },
                    msSinceLastExecute: multiplayerFrameDurationMs,
                    ticksSinceLastExecute: 1,
                    trigger: undefined,
                } satisfies ModExecuteParams<FullGameState>);
            }
        });
    },
});
