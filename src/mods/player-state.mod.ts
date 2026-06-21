// cspell:word despawn
import {defineAnthaMod, SkipExecution} from '@antha/engine';
import {
    ControllerClientEvent,
    createNewRoom,
    defaultMultiplayerApiPort,
} from '@antha/multiplayer-core';
import {
    ControllerFrameEvent,
    type P2pLockStepMultiplayerController,
} from '@antha/multiplayer-p2p-lock-step';
import {
    awaitedBlockingMap,
    ensureErrorAndPrependMessage,
    log,
    mapObjectValues,
    randomString,
    type EmptyFunction,
} from '@augment-vir/common';
import {buildUrl} from 'url-vir';
import {type FullGameState} from '../data/game-state.js';
import {
    multiplayerPacketHandlers,
    MultiplayerPacketType,
    type StateSync,
} from '../data/multiplayer-packet.js';
import {queueLocalMovement} from '../data/player-movement.js';

const localPlayerPosition = '1';

type GameMultiplayerModState = FullGameState & {
    multiplayerListenerCleanup: Map<P2pLockStepMultiplayerController, EmptyFunction>;
};

export const playerStateMod = defineAnthaMod<GameMultiplayerModState>({
    modName: 'player-state',
    initState: {
        players: {},
    },
    async execute({state, msSinceLastExecute}) {
        if (!state.multiplayerListenerCleanup) {
            state.multiplayerListenerCleanup = new Map();
        }

        if (!state.multiplayerP2pLockStep || !state.pixi?.pixiApplication?.screen) {
            return SkipExecution;
        }

        state.players = state.players || {};

        if (
            !state.multiplayerListenerCleanup.get(
                state.multiplayerP2pLockStep.multiplayerController,
            )
        ) {
            state.multiplayerListenerCleanup.forEach((cleanup, controller) => {
                cleanup();
                state.multiplayerListenerCleanup?.delete(controller);
            });

            const currentController = state.multiplayerP2pLockStep.multiplayerController;

            const cleanupCallbacks = [
                currentController.listen(ControllerFrameEvent, async (event) => {
                    await awaitedBlockingMap(event.detail, async (detail) => {
                        await multiplayerPacketHandlers[detail.packet.type]({
                            detail,
                            state,
                        });
                    });
                }),
                currentController.listen(ControllerClientEvent, (event) => {
                    if (!currentController.isHost()) {
                        return;
                    } else if (!state.seededRandom) {
                        throw new Error(
                            'Missing seeded random: cannot sync state with new client.',
                        );
                    }

                    if (event.detail.newMember) {
                        currentController.act({
                            type: MultiplayerPacketType.SpawnPlayer,
                            clientId: event.detail.newMember,
                            stateSync: createStateSync(state),
                        });
                    } else if (event.detail.lostMember) {
                        currentController.act({
                            type: MultiplayerPacketType.DespawnPlayer,
                            clientId: event.detail.lostMember,
                        });
                    }
                }),
            ];

            state.multiplayerListenerCleanup.set(currentController, () => {
                cleanupCallbacks.forEach((cleanupCallback) => cleanupCallback());
            });
        }

        if (!state.multiplayerP2pLockStep.multiplayerController.isConnected()) {
            state.players = {};
            try {
                const backendOrigin = buildUrl(globalThis.location.href, {
                    port: defaultMultiplayerApiPort,
                }).origin;

                await state.multiplayerP2pLockStep.multiplayerController.initMultiplayer({
                    backendOrigin,
                    portScanOptions: true,
                    roomUpdateInterval: {
                        seconds: 1,
                    },
                });

                await state.multiplayerP2pLockStep.multiplayerController.joinOrCreateRoom(
                    createNewRoom({
                        roomName: `Room ${randomString(4)}`,
                    }),
                );

                const localClientId =
                    state.multiplayerP2pLockStep.multiplayerController.getClientId();

                if (!localClientId) {
                    throw new Error('Local id was not created.');
                }
                state.multiplayerP2pLockStep.multiplayerController.act({
                    type: MultiplayerPacketType.SpawnPlayer,
                    clientId: localClientId,
                    stateSync: createStateSync(state),
                });
            } catch (error) {
                log.error(ensureErrorAndPrependMessage(error, 'Failed to start multiplayer room.'));
            }
        }

        const localClientId = state.multiplayerP2pLockStep.multiplayerController.getClientId();

        if (!localClientId) {
            return SkipExecution;
        }

        if (state.players[localClientId]) {
            queueLocalMovement({
                activeBindings: state.activeBindings?.[localPlayerPosition],
                msSinceLastExecute,
                state,
            });
        }

        return undefined;
    },
});

function createStateSync(state: Partial<FullGameState>): StateSync {
    if (!state.seededRandom) {
        throw new Error('Missing seeded random: cannot sync multiplayer state.');
    }

    return {
        players: mapObjectValues(state.players || {}, (playerId) => {
            const player = state.players?.[playerId];

            if (!player) {
                throw new Error(`Missing player '${playerId}': cannot sync multiplayer state.`);
            }

            return {
                position: {
                    x: player.entity.params.x,
                    y: player.entity.params.y,
                },
            };
        }),
        randomState: state.seededRandom.exportState(),
    };
}
