import {createSaveGameSuite} from '@antha/asset';
import {defineShape, enumShape, exactShape, recordShape} from 'object-shape-tester';
import {defaultGameAudioVolumeByChannel, GameAudioChannel} from '../audio/game-audio.js';

export const defaultJoystickDeadZone = 0.25;

const savedGameStateShape = defineShape({
    joystickDeadZone: -1,
    version: exactShape(1),
    volume: recordShape({
        keys: enumShape(GameAudioChannel),
        values: -1,
    }),
});

type SavedGameState = typeof savedGameStateShape.runtimeType;
export type GameSaveState = Omit<SavedGameState, 'version'>;

export function createDefaultGameSaveState(): GameSaveState {
    return {
        joystickDeadZone: defaultJoystickDeadZone,
        volume: {
            ...defaultGameAudioVolumeByChannel,
        },
    };
}

export const {anthaAutosaveMod, loadSaveDataAsset, persistSaveState} = createSaveGameSuite({
    fallbackState: createDefaultGameSaveState,
    deserialize(savedGameState: SavedGameState | undefined): GameSaveState {
        if (savedGameState) {
            return {
                joystickDeadZone: savedGameState.joystickDeadZone,
                volume: savedGameState.volume,
            };
        } else {
            return createDefaultGameSaveState();
        }
    },
    serialize({joystickDeadZone, volume}: GameSaveState): SavedGameState {
        return {
            joystickDeadZone,
            version: 1,
            volume,
        };
    },
    storedSaveStateShape: savedGameStateShape,
});
