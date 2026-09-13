import {type AudioPlayer, type AudioSetupParams} from '@antha/audio';
import {getObjectTypedValues, log} from '@augment-vir/common';
import {buildUrl} from 'url-vir';

export enum GameAudioChannel {
    Music = 'music',
    Effects = 'effects',
}

export const defaultGameMasterVolume = 0.8;

export const defaultGameAudioVolumeByChannel: Readonly<Record<GameAudioChannel, number>> = {
    [GameAudioChannel.Music]: 0.8,
    [GameAudioChannel.Effects]: 0.8,
};

/** Names every sound the game can load and play without duplicating file details. */
export enum GameAudioKey {
    GameMusic = 'game-music',
    PlayerCollisionOne = 'player-collision-one',
    PlayerCollisionThree = 'player-collision-three',
    PlayerCollisionTwo = 'player-collision-two',
}

function createGameAudio({
    audioChannel,
    fileName,
    volume,
}: Readonly<{
    audioChannel: GameAudioChannel;
    fileName: string;
    volume: number;
}>) {
    return {
        audioChannel,
        sources: buildUrl(document.baseURI, `./audio/${fileName}`).href,
        volume,
    } satisfies AudioSetupParams & {
        audioChannel: GameAudioChannel;
    };
}

/** Defines the playable game sounds so callers share their files and volume settings. */
export const gameAudio = {
    [GameAudioKey.GameMusic]: createGameAudio({
        audioChannel: GameAudioChannel.Music,
        fileName: 'game-music.ogg',
        volume: 0.9,
    }),
    [GameAudioKey.PlayerCollisionOne]: createGameAudio({
        audioChannel: GameAudioChannel.Effects,
        fileName: 'player-collision-1.ogg',
        volume: 0.9,
    }),
    [GameAudioKey.PlayerCollisionThree]: createGameAudio({
        audioChannel: GameAudioChannel.Effects,
        fileName: 'player-collision-3.ogg',
        volume: 0.9,
    }),
    [GameAudioKey.PlayerCollisionTwo]: createGameAudio({
        audioChannel: GameAudioChannel.Effects,
        fileName: 'player-collision-2.ogg',
        volume: 0.9,
    }),
} satisfies Record<
    GameAudioKey,
    AudioSetupParams & {
        audioChannel: GameAudioChannel;
    }
>;

/** Lists every audio asset for startup loading so playback has no missing-file surprises. */
export const gameAudioFilesToLoad = getObjectTypedValues(gameAudio).map((audio) => {
    return audio;
});

/** Plays a named sound when audio is available, keeping entity code independent of file setup. */
export async function playGameAudio(
    gameState: Readonly<{audioPlayer: AudioPlayer | undefined}>,
    audio: GameAudioKey,
) {
    if (!gameState.audioPlayer) {
        return false;
    }

    return await gameState.audioPlayer.play(gameAudio[audio]).catch((error: unknown) => {
        log.error(`Failed to play audio '${audio}'.`, error);

        return false;
    });
}

/** Resumes browser audio after an interaction when the browser requires a user gesture. */
export function resumeGameAudioContext({
    audioPlayer,
}: Readonly<{
    audioPlayer: AudioPlayer | undefined;
}>) {
    void audioPlayer?.audioContext.resume().catch(() => {});
}
