import {createAnthaEntityMod2d} from '@antha/entity-2d';
import {type GameState} from '../data/game-state.js';

export const {defineEntity, entityKeys, mod: entityStoreMod} = createAnthaEntityMod2d<GameState>();
