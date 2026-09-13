import {createAudioSourceKey, type AudioFile, type AudioPlayer} from '@antha/audio';
import {AnthaEngine} from '@antha/engine';
import {assert} from '@augment-vir/assert';
import {describe, it} from '@augment-vir/test';
import {type FullGameState} from '../game-state/game-state.js';
import {createDefaultGameSaveState} from '../game-state/save-data.js';
import {gameAudio, GameAudioChannel, GameAudioKey} from './game-audio.js';
import {gameAudioMod} from './game-audio.mod.js';

function createTestGainNode() {
    return {
        gain: {
            value: 0,
        } satisfies Pick<AudioParam, 'value'> as AudioParam,
    } satisfies Pick<GainNode, 'gain'> as GainNode;
}

describe(gameAudioMod.modName, () => {
    it('resumes audio once from the first game interaction', async () => {
        const resumeCalls: undefined[] = [];
        const audioContext = {
            resume() {
                resumeCalls.push(undefined);

                return Promise.resolve();
            },
            state: 'suspended',
        } satisfies Pick<AudioContext, 'resume' | 'state'> as AudioContext;
        const musicGainNode = createTestGainNode();
        const masterGainNode = createTestGainNode();
        const soundGainNode = createTestGainNode();
        const audioPlayer = {
            audioContext,
            audioFiles: {
                [createAudioSourceKey(gameAudio[GameAudioKey.GameMusic])]: {
                    gainNode: musicGainNode,
                } satisfies Pick<AudioFile, 'gainNode'> as AudioFile,
                [createAudioSourceKey(gameAudio[GameAudioKey.PlayerCollisionOne])]: {
                    gainNode: soundGainNode,
                } satisfies Pick<AudioFile, 'gainNode'> as AudioFile,
            },
            gainNode: masterGainNode,
            play() {
                return Promise.resolve(false);
            },
        } satisfies Pick<
            AudioPlayer,
            'audioContext' | 'audioFiles' | 'gainNode' | 'play'
        > as unknown as AudioPlayer;
        const engine = new AnthaEngine<FullGameState>({
            hostElement: document.createElement('div'),
            initState: {
                audioPlayer,
                saveState: {
                    ...createDefaultGameSaveState(),
                    masterVolume: 0.2,
                    volume: {
                        [GameAudioChannel.Music]: 0.6,
                        [GameAudioChannel.Effects]: 0.4,
                    },
                },
            },
            mods: [
                gameAudioMod,
            ],
        });

        try {
            await engine.runSingleTick();
            globalThis.dispatchEvent(new MouseEvent('click'));
            globalThis.dispatchEvent(new KeyboardEvent('keydown'));

            assert.isLengthExactly(resumeCalls, 1);
            assert.isApproximately(masterGainNode.gain.value, 0.2, 0.00001);
            assert.isApproximately(musicGainNode.gain.value, 0.54, 0.00001);
            assert.isApproximately(soundGainNode.gain.value, 0.36, 0.00001);
        } finally {
            await engine.reset();
        }
    });
});
