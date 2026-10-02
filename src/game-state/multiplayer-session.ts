import {
    defaultMultiplayerApiOrigin,
    type MultiplayerConnectionTimeoutOptions,
} from '@antha/multiplayer-core';
import {LocalPlayerPosition} from '@antha/util';
import {ensureErrorAndPrependMessage, getObjectTypedValues} from '@augment-vir/common';
import {buildUrl} from 'url-vir';
import {DeployEnv, deployEnv} from './deploy-env.js';
import {type FullGameState} from './game-state.js';
import {MultiplayerPacketType, type MultiplayerPacket} from './multiplayer-packet.js';

const multiplayerBackendOriginByDeployEnv: Readonly<Record<DeployEnv, string>> = {
    [DeployEnv.Dev]: buildUrl(defaultMultiplayerApiOrigin, {
        hostname: globalThis.location.hostname,
    }).origin,
    [DeployEnv.Prod]: 'https://backend.mp.electrovir.com',
};

/** Keeps a failing multiplayer connection from spinning forever. */
export const multiplayerConnectionTimeoutOptions: MultiplayerConnectionTimeoutOptions = {
    timeout: {
        seconds: 30,
    },
};

/** Starts a fresh local session so players can restart without a room connection. */
export function startLocalGame(state: Partial<FullGameState>) {
    const multiplayerController = getMultiplayerController(state);

    if (multiplayerController.isConnected()) {
        multiplayerController.leaveRoom();
    }

    state.entityStore?.destroyAllEntities();
    state.players = {};
    multiplayerController.startSingleplayer();

    state.menuState = undefined;
    getMultiplayerController(state).act({
        playerPosition: LocalPlayerPosition.One,
        type: MultiplayerPacketType.SpawnPlayer,
    });
}

/** Queues existing local players for the multiplayer session. */
export function startMultiplayerGame(state: Partial<FullGameState>) {
    const localClientId = state.multiplayerP2pLockStep?.multiplayerController.getClientId();
    const spawnLocalPlayerPackets = localClientId
        ? getObjectTypedValues(state.players || {})
              .filter((player) => {
                  return player.clientId === localClientId;
              })
              .map((player) => {
                  return {
                      playerPosition: player.playerPosition,
                      type: MultiplayerPacketType.SpawnPlayer,
                  } satisfies MultiplayerPacket;
              })
        : [];

    if (state.multiplayerP2pLockStep?.multiplayerController && spawnLocalPlayerPackets.length) {
        state.multiplayerP2pLockStep.multiplayerController.act(spawnLocalPlayerPackets);
    }
}

/** Converts an unknown multiplayer failure into an Error with a concise UI-facing prefix. */
export function createMultiplayerError(error: unknown) {
    return ensureErrorAndPrependMessage(error, 'Multiplayer failed.');
}

function getMultiplayerController(state: Partial<FullGameState>) {
    if (!state.multiplayerP2pLockStep) {
        throw new Error('Cannot manage multiplayer: multiplayer mod is missing.');
    }

    return state.multiplayerP2pLockStep.multiplayerController;
}

/** Initializes multiplayer API access and returns the active game controller. */
export async function initializeMultiplayer(state: Partial<FullGameState>) {
    const multiplayerController = getMultiplayerController(state);

    if (!multiplayerController.multiplayerApiClient) {
        await multiplayerController.initMultiplayer({
            backendOrigin: multiplayerBackendOriginByDeployEnv[deployEnv],
            portScanOptions: false,
            stunServerUrls: [
                'stun.cloudflare.com:3478',
            ],
            roomUpdateInterval: {
                seconds: 1,
            },
            ...multiplayerConnectionTimeoutOptions,
        });
    }

    return multiplayerController;
}
