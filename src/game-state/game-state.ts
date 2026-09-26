import {type createAnthaAudioMod, type createAnthaBackgroundAudioMod} from '@antha/audio';
import {type AnthaModsState} from '@antha/engine';
import {
    type AnthaMenuState,
    type createAnthaInputBindingsMod,
    type createAnthaMenuNavMod,
    type createAnthaMenuStateMod,
    type createAnthaReadRawInputMod,
} from '@antha/input';
import {type ClientId} from '@antha/multiplayer-core';
import {type createAnthaMultiplayerP2pLockStepMod} from '@antha/multiplayer-p2p-lock-step';
import {type LocalPlayerPosition} from '@antha/util';
import {type SeededRandom} from '@augment-vir/common';
import {type GameBinding} from '../player/player-binding.js';
import {type PlayerEntity} from '../player/player.entity.js';
import {type updateEntitiesMod} from './game-entity.mod.js';
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

/** Connects a player ID to its owner, controller slot, and live entity instance. */
export type PlayerState = {
    /**
     * The host that this player is on. A single client will contain multiple player positions and
     * entities when local joining is used.
     */
    clientId: ClientId;
    playerEntity: PlayerEntity;
    playerPosition: LocalPlayerPosition;
};

/** Holds the game-specific data shared by all engine mods. */
export type GameState = {
    menuState: AnthaMenuState<GameMenuKey>;
    players: Record<string, PlayerState>;
    saveState: GameSaveState | undefined;
    seededRandom: SeededRandom;
};

/** Derives complete game state from the mods that create and consume its shared properties. */
export type FullGameState = AnthaModsState<
    [
        typeof anthaAutosaveMod,
        ReturnType<typeof createAnthaAudioMod>,
        ReturnType<typeof createAnthaBackgroundAudioMod>,
        ReturnType<typeof createAnthaReadRawInputMod>,
        ReturnType<typeof createAnthaInputBindingsMod<GameBinding>>,
        typeof updateEntitiesMod,
        ReturnType<typeof createAnthaMultiplayerP2pLockStepMod<MultiplayerPacket>>,
        ReturnType<typeof createAnthaMenuStateMod<GameMenuKey, InputConsumer>>,
        ReturnType<typeof createAnthaMenuNavMod>,
    ]
>;
