import {defineAnthaMod} from '@antha/engine';
import {MenuNavBinding} from '@antha/input';
import {MultiplayerControllerClientEvent, type ClientId} from '@antha/multiplayer-core';
import {type P2pLockStepMultiplayerController} from '@antha/multiplayer-p2p-lock-step';
import {getObjectTypedValues, type EmptyFunction} from '@augment-vir/common';
import {createPlayerId} from '../player/player-id.js';
import {moveLocalPlayers} from '../player/player-movement.js';
import {LocalPlayerPosition, type FullGameState} from './game-state.js';
import {
    allLocalPlayerPositions,
    createStateSync,
    MultiplayerPacketType,
    type MultiplayerPacket,
} from './multiplayer-packet.js';
import {startLocalGame} from './multiplayer-session.js';

const playerLifecycleHandlers = {
    lostMember({
        clientId,
        currentController,
    }: Readonly<{
        clientId: ClientId;
        currentController: P2pLockStepMultiplayerController<MultiplayerPacket>;
    }>) {
        currentController.act({
            clientId,
            type: MultiplayerPacketType.DespawnPlayers,
        });
    },
    newMember({
        clientId,
        currentController,
        state,
    }: Readonly<{
        clientId: ClientId;
        currentController: P2pLockStepMultiplayerController<MultiplayerPacket>;
        state: Partial<FullGameState>;
    }>) {
        currentController.act({
            clientId,
            stateSync: createStateSync(state),
            type: MultiplayerPacketType.SyncState,
        });
    },
};

function addNewLocalPlayers({
    localClientId,
    multiplayerController,
    state,
}: Readonly<{
    localClientId: ClientId;
    multiplayerController: P2pLockStepMultiplayerController<MultiplayerPacket>;
    state: Partial<FullGameState>;
}>) {
    const newLocalPlayerPositions = allLocalPlayerPositions.filter((playerPosition) => {
        const menuEnterBinding = state.activeBindings?.[playerPosition]?.[MenuNavBinding.MenuEnter];

        if (
            playerPosition === LocalPlayerPosition.One ||
            state.players?.[
                createPlayerId({
                    clientId: localClientId,
                    playerPosition,
                })
            ] ||
            !menuEnterBinding ||
            menuEnterBinding.actCount
        ) {
            return false;
        } else {
            menuEnterBinding.actCount = 1;
            menuEnterBinding.lastActDuration = menuEnterBinding.holdDuration;

            return true;
        }
    });

    if (newLocalPlayerPositions.length) {
        multiplayerController.act(
            newLocalPlayerPositions.map((playerPosition) => {
                return {
                    playerPosition,
                    type: MultiplayerPacketType.SpawnPlayer,
                };
            }),
        );
    }
}

function initMultiplayer({
    currentController,
    multiplayerListenerCleanup,
    state,
}: Readonly<{
    currentController: P2pLockStepMultiplayerController<MultiplayerPacket>;
    multiplayerListenerCleanup: Map<
        P2pLockStepMultiplayerController<MultiplayerPacket>,
        EmptyFunction
    >;
    state: Partial<FullGameState>;
}>) {
    if (multiplayerListenerCleanup.get(currentController)) {
        /** Listeners already attached. Do nothing. */
        return;
    }

    multiplayerListenerCleanup.forEach((cleanup, controller) => {
        cleanup();
        multiplayerListenerCleanup.delete(controller);
    });

    const cleanupCallbacks = [
        currentController.listen(MultiplayerControllerClientEvent, (event) => {
            if (!currentController.isHost() || !state.seededRandom) {
                return;
            }

            if (event.detail.newMember) {
                playerLifecycleHandlers.newMember({
                    clientId: event.detail.newMember,
                    currentController,
                    state,
                });
            } else if (event.detail.lostMember) {
                playerLifecycleHandlers.lostMember({
                    clientId: event.detail.lostMember,
                    currentController,
                });
            }
        }),
    ];

    multiplayerListenerCleanup.set(currentController, () => {
        cleanupCallbacks.forEach((cleanupCallback) => cleanupCallback());
    });
}

/** Coordinates game state, local players, and multiplayer events. */
export const gameUpdateMod = defineAnthaMod<
    FullGameState & {
        multiplayerListenerCleanup: Map<
            P2pLockStepMultiplayerController<MultiplayerPacket>,
            EmptyFunction
        >;
        hasStartedInitialGame: boolean;
    }
>({
    modName: 'game-update',
    execute({state, msSinceLastExecute}) {
        if (!state.multiplayerListenerCleanup) {
            state.multiplayerListenerCleanup = new Map();
        }

        if (state.deviceHandler && state.saveState) {
            state.deviceHandler.globalDeadZone = state.saveState.joystickDeadZone;
        }

        getObjectTypedValues(state.players || {}).forEach((player) => {
            player.playerEntity.render({
                msSinceLastExecute,
            });
        });

        if (!state.multiplayerP2pLockStep || !state.pixi?.pixiApplication?.screen) {
            return;
        }

        initMultiplayer({
            currentController: state.multiplayerP2pLockStep.multiplayerController,
            multiplayerListenerCleanup: state.multiplayerListenerCleanup,
            state,
        });

        const localClientId = state.multiplayerP2pLockStep.multiplayerController.getClientId();

        if (localClientId) {
            addNewLocalPlayers({
                localClientId,
                multiplayerController: state.multiplayerP2pLockStep.multiplayerController,
                state,
            });

            moveLocalPlayers({
                localClientId,
                msSinceLastExecute,
                state,
            });
        }

        if (!state.hasStartedInitialGame && state.entityStore) {
            startLocalGame(state);
            state.hasStartedInitialGame = true;
        }
    },
});
