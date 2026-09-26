import {type AnthaAudioState} from '@antha/audio';
import {createAnthaEntity2dSuite} from '@antha/entity-2d';
import {type AnthaMultiplayerP2pLockStepState} from '@antha/multiplayer-p2p-lock-step';
import {type GameState} from './game-state.js';
import {type MultiplayerPacket} from './multiplayer-packet.js';

type GameEntityState = GameState &
    AnthaAudioState &
    AnthaMultiplayerP2pLockStepState<MultiplayerPacket>;

/** Entity data updates run in `multiplayerLockstepMod` so every peer simulates the same frames. */
export const {defineEntity, entityKeys, updateEntitiesMod, defineLogicEntity} =
    createAnthaEntity2dSuite<GameEntityState>({
        disableEntityUpdate: true,
    });
