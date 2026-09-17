import {type createAnthaAudioMod} from '@antha/audio';
import {type AnthaModsState} from '@antha/engine';
import {
    type createAnthaInputBindingsMod,
    type createAnthaMenuNavMod,
    type createAnthaReadRawInputMod,
} from '@antha/input';
import {type ClientId} from '@antha/multiplayer-core';
import {type createAnthaMultiplayerP2pLockStepMod} from '@antha/multiplayer-p2p-lock-step';
import {type SeededRandom} from '@augment-vir/common';
import {type GameBinding} from '../player/player-binding.js';
import {type PlayerEntity} from '../player/player.entity.js';
import {type entityStoreMod} from './game-entity.mod.js';
import {type MultiplayerPacket} from './multiplayer-packet.js';
import {type anthaAutosaveMod, type GameSaveState} from './save-data.js';

export enum InputConsumer {
    Game = 'game',
    Menu = 'menu',
}

/** Names the overlays the game can show so menu navigation uses stable state values. */
export enum GameMenuKey {
    MultiplayerRooms = 'multiplayer-rooms',
    Options = 'options',
    Pause = 'pause',
}

/** Gives each local controller a stable player slot for bindings and player IDs. */
export enum LocalPlayerPosition {
    One = '1',
    Two = '2',
    Three = '3',
    Four = '4',
}

/** Stores the visible overlay and its return destination so menus can navigate back correctly. */
export type GameMenuState = {
    activeMenu: GameMenuKey | undefined;
    returnTo: GameMenuKey | undefined;
};

/** Creates the state for returning to a menu's parent or leaving menu mode. */
export function getGameMenuReturnState(menuState: Readonly<GameMenuState> | undefined) {
    return {
        activeMenu: menuState?.returnTo,
        returnTo: undefined,
    };
}

/** Connects a player ID to its owner, controller slot, and live entity instance. */
export type PlayerState = {
    /**
     * Ths host that this player is on. A single client will contain multiple player positions and
     * entities when local joining is used.
     */
    clientId: ClientId;
    playerEntity: PlayerEntity;
    playerPosition: LocalPlayerPosition;
};

/** Holds the game-specific data shared by all engine mods. */
export type GameState = {
    menuState: GameMenuState;
    multiplayerLockstepTick: number;
    players: Record<string, PlayerState>;
    saveState: GameSaveState | undefined;
    seededRandom: SeededRandom;
};

/** Derives complete game state from the mods that create and consume its shared properties. */
export type FullGameState = AnthaModsState<
    [
        typeof anthaAutosaveMod,
        ReturnType<typeof createAnthaAudioMod>,
        ReturnType<typeof createAnthaReadRawInputMod>,
        ReturnType<typeof createAnthaInputBindingsMod<GameBinding>>,
        typeof entityStoreMod,
        ReturnType<typeof createAnthaMultiplayerP2pLockStepMod<MultiplayerPacket>>,
        ReturnType<typeof createAnthaMenuNavMod>,
    ]
>;
