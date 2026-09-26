import {defineAnthaMod} from '@antha/engine';
import {markBindingActed, MenuNavBinding} from '@antha/input';
import {createMultiplayerPlayerId, type ClientId} from '@antha/multiplayer-core';
import {type P2pLockStepMultiplayerController} from '@antha/multiplayer-p2p-lock-step';
import {LocalPlayerPosition} from '@antha/util';
import {getEnumValues} from '@augment-vir/common';
import {moveLocalPlayers} from '../player/player-movement.js';
import {type FullGameState} from './game-state.js';
import {MultiplayerPacketType, type MultiplayerPacket} from './multiplayer-packet.js';
import {startLocalGame} from './multiplayer-session.js';

function addNewLocalPlayers({
    localClientId,
    multiplayerController,
    state,
}: Readonly<{
    localClientId: ClientId;
    multiplayerController: P2pLockStepMultiplayerController<MultiplayerPacket>;
    state: Partial<FullGameState>;
}>) {
    const newLocalPlayerPositions = getEnumValues(LocalPlayerPosition).filter((playerPosition) => {
        const menuEnterBinding = state.activeBindings?.[playerPosition]?.[MenuNavBinding.MenuEnter];

        if (
            playerPosition === LocalPlayerPosition.One ||
            state.players?.[
                createMultiplayerPlayerId({
                    clientId: localClientId,
                    playerPosition,
                })
            ] ||
            !menuEnterBinding ||
            menuEnterBinding.actCount
        ) {
            return false;
        } else {
            markBindingActed(menuEnterBinding);

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

/** Coordinates game state and local players. */
export const gameUpdateMod = defineAnthaMod<
    FullGameState & {
        hasStartedInitialGame: boolean;
    }
>({
    modName: 'game-update',
    execute({state, msSinceLastExecute}) {
        if (state.saveState) {
            if (state.deviceHandler) {
                state.deviceHandler.globalDeadZone = state.saveState.joystickDeadZone;
            }

            state.audioChannelVolume = {
                channels: state.saveState.volume,
                master: state.saveState.masterVolume,
            };
        }

        if (!state.multiplayerP2pLockStep || !state.pixi?.pixiApplication?.screen) {
            return;
        }

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
