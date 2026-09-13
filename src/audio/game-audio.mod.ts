import {createAudioSourceKey} from '@antha/audio';
import {defineAnthaMod} from '@antha/engine';
import {check} from '@augment-vir/assert';
import {getObjectTypedValues, type EmptyFunction} from '@augment-vir/common';
import {listenToGlobal} from 'typed-event-target';
import {type FullGameState} from '../game-state/game-state.js';
import {
    defaultGameAudioVolumeByChannel,
    defaultGameMasterVolume,
    gameAudio,
    GameAudioKey,
    playGameAudio,
    resumeGameAudioContext,
    type GameAudioChannel,
} from './game-audio.js';

type GameAudioModState = {
    activeBackgroundAudio: GameAudioKey | undefined;
    audioResumeListenersCleanup: EmptyFunction | undefined;
    backgroundAudioPlaybackId: number;
    isBackgroundAudioPlaying: boolean;
    isWaitingForAudioPermission: boolean;
};

function createGameAudioResumeListeners({
    audioPlayer,
}: Readonly<{
    audioPlayer: NonNullable<FullGameState['audioPlayer']>;
}>) {
    function resumeGameAudio(this: void) {
        resumeGameAudioContext({
            audioPlayer,
        });
        cleanup();
    }

    const cleanupCallbacks = [
        listenToGlobal('click', resumeGameAudio, {
            capture: true,
        }),
        listenToGlobal('keydown', resumeGameAudio, {
            capture: true,
        }),
    ];

    function cleanup(this: void) {
        cleanupCallbacks.forEach((cleanupCallback) => cleanupCallback());
    }

    return cleanup;
}

function updateGameAudioVolumes({
    audioPlayer,
    masterVolume,
    volumeByAudioChannel,
}: Readonly<{
    audioPlayer: NonNullable<FullGameState['audioPlayer']>;
    masterVolume: number;
    volumeByAudioChannel: Readonly<Record<GameAudioChannel, number>>;
}>) {
    if (!check.isApproximately(audioPlayer.gainNode.gain.value, masterVolume, 0.00001)) {
        audioPlayer.gainNode.gain.value = masterVolume;
    }

    getObjectTypedValues(gameAudio).forEach((audio) => {
        const audioFile = audioPlayer.audioFiles[createAudioSourceKey(audio)];

        if (!audioFile) {
            return;
        }

        const volume = audio.volume * volumeByAudioChannel[audio.audioChannel];

        if (!check.isApproximately(audioFile.gainNode.gain.value, volume, 0.00001)) {
            audioFile.gainNode.gain.value = volume;
        }
    });
}

async function playBackgroundGameAudio({
    audio,
    audioPlayer,
    gameState,
    playbackId,
}: Readonly<{
    audio: GameAudioKey;
    audioPlayer: NonNullable<FullGameState['audioPlayer']>;
    gameState: Partial<FullGameState & GameAudioModState>;
    playbackId: number;
}>) {
    const didPlay = await playGameAudio(
        {
            audioPlayer,
        },
        audio,
    );

    if (
        gameState.activeBackgroundAudio === audio &&
        gameState.backgroundAudioPlaybackId === playbackId
    ) {
        gameState.isBackgroundAudioPlaying = false;
        gameState.isWaitingForAudioPermission = !didPlay;
    }
}

/** Keeps the active background track and volume synchronized with the game state. */
export const gameAudioMod = defineAnthaMod<FullGameState & GameAudioModState>({
    modName: 'game-audio',
    cleanup({state}) {
        state.audioResumeListenersCleanup?.();
    },
    execute({state}) {
        const audioPlayer = state.audioPlayer;

        if (!audioPlayer) {
            return;
        }

        if (!state.audioResumeListenersCleanup) {
            state.audioResumeListenersCleanup = createGameAudioResumeListeners({
                audioPlayer,
            });
        }

        updateGameAudioVolumes({
            audioPlayer,
            masterVolume: state.saveState?.masterVolume ?? defaultGameMasterVolume,
            volumeByAudioChannel: state.saveState?.volume || defaultGameAudioVolumeByChannel,
        });

        /** Setup the background audio if it hasn't been setup yet. */
        if (state.activeBackgroundAudio !== GameAudioKey.GameMusic) {
            const previousBackgroundAudio = state.activeBackgroundAudio;

            state.activeBackgroundAudio = GameAudioKey.GameMusic;
            state.backgroundAudioPlaybackId = (state.backgroundAudioPlaybackId || 0) + 1;
            state.isBackgroundAudioPlaying = false;
            state.isWaitingForAudioPermission = false;

            if (previousBackgroundAudio) {
                audioPlayer.stopFile(gameAudio[previousBackgroundAudio]);
            }
        }

        /** Only start the background audio if it's not already playing. */
        if (
            !state.isBackgroundAudioPlaying &&
            (!state.isWaitingForAudioPermission || audioPlayer.audioContext.state === 'running')
        ) {
            state.isBackgroundAudioPlaying = true;
            void playBackgroundGameAudio({
                audio: GameAudioKey.GameMusic,
                audioPlayer,
                gameState: state,
                playbackId: state.backgroundAudioPlaybackId || 0,
            }).catch(() => {
                state.isBackgroundAudioPlaying = false;
            });
        }
    },
});
