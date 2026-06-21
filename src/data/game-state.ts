import {type AnthaEntity2dModState} from '@antha/entity-2d';
import {type AnthaInputBindingsModState, type MenuNavModState} from '@antha/input';
import {type ClientId} from '@antha/multiplayer-core';
import {type AnthaMultiplayerP2pLockStepState} from '@antha/multiplayer-p2p-lock-step';
import {type SeededRandom} from '@augment-vir/common';
import {type RequireOneOrNone} from 'type-fest';
import {type PlayerEntity} from '../entities/player.entity.js';
import {type MultiplayerPacket} from './multiplayer-packet.js';
import {type GameBinding} from './player-binding.js';

export type PlayerState = {
    entity: PlayerEntity;
};

export type GameState = {
    seededRandom: SeededRandom;
    players: Record<ClientId, PlayerState>;
    pauseMenuState: PauseMenuState | undefined;
};

export type PauseMenuState = RequireOneOrNone<{
    showMultiplayerRoomLobby: true;
}>;

export type FullGameState = AnthaEntity2dModState<
    GameState &
        AnthaInputBindingsModState<GameBinding> &
        MenuNavModState &
        AnthaMultiplayerP2pLockStepState<MultiplayerPacket>
>;
