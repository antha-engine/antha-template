import {defaultMultiplayerApiOrigin} from '@antha/multiplayer-core';
import {ensureErrorAndPrependMessage} from '@augment-vir/common';
import {buildUrl} from 'url-vir';
import {DeployEnv, deployEnv} from './deploy-env.js';
import {LocalPlayerPosition, type FullGameState} from './game-state.js';
import {MultiplayerPacketType} from './multiplayer-packet.js';

const multiplayerBackendOriginByDeployEnv: Readonly<Record<DeployEnv, string>> = {
    [DeployEnv.Dev]: createDevelopmentMultiplayerBackendOrigin(globalThis.location.hostname),
    [DeployEnv.Prod]: 'https://backend.mp.electrovir.com',
};

/** Replaces the local backend host with the domain serving this development frontend. */
export function createDevelopmentMultiplayerBackendOrigin(frontendHostname: string) {
    return buildUrl(defaultMultiplayerApiOrigin, {
        hostname: frontendHostname,
    }).origin;
}

/** Starts a fresh local session so players can restart without a room connection. */
export function startLocalGame(state: Partial<FullGameState>) {
    const multiplayerController = getMultiplayerController(state);

    if (multiplayerController.isConnected()) {
        multiplayerController.leaveRoom();
    }

    state.entityStore?.destroyAllEntities();
    state.players = {};
    multiplayerController.startSingleplayer();

    state.menuState = {
        activeMenu: undefined,
        returnTo: undefined,
    };
    spawnInitialLocalPlayer({
        state,
    });
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
            roomUpdateInterval: {
                seconds: 1,
            },
        });
    }

    return multiplayerController;
}

/** Spawns the controller-one player for the current multiplayer client. */
export function spawnInitialLocalPlayer({
    state,
}: Readonly<{
    state: Partial<FullGameState>;
}>) {
    getMultiplayerController(state).act({
        playerPosition: LocalPlayerPosition.One,
        type: MultiplayerPacketType.SpawnPlayer,
    });
}
