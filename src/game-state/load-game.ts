import {type AssetLoader, type AssetLoadSession} from '@antha/asset';
import {AudioPlayer, createAnthaAudioMod, createAnthaBackgroundAudioMod} from '@antha/audio';
import {type AnthaEngine} from '@antha/engine';
import {loadAnthaAssets} from '@antha/entity-2d';
import {createAnthaFpsMod} from '@antha/fps';
import {
    createAnthaGraphics2dMod,
    createAnthaVirtualViewportMod,
    createVirtualViewportPixiOptions,
} from '@antha/graphics-2d';
import {
    closeAnthaMenus,
    createAnthaInputBindingsMod,
    createAnthaMenuNavMod,
    createAnthaReadRawInputMod,
} from '@antha/input';
import {ensureErrorAndPrependMessage, randomString, SeededRandom} from '@augment-vir/common';
import {css} from 'element-vir';
import {gameAudio, gameAudioFilesToLoad, GameAudioKey} from '../audio/game-audio.js';
import {gameMenuMod, gameMenuStateMod} from '../menu/game-menu.mod.js';
import {PlayerEntity} from '../player/player.entity.js';
import {defaultBindings} from './default-bindings.js';
import {deployEnv, DeployEnv} from './deploy-env.js';
import {updateEntitiesMod} from './game-entity.mod.js';
import {InputConsumer, type FullGameState} from './game-state.js';
import {gameUpdateMod} from './game-update.mod.js';
import {gameWorldSize} from './game-world.js';
import {multiplayerLockstepMod} from './multiplayer-lockstep.mod.js';
import {anthaAutosaveMod, createDefaultGameSaveState, loadSaveDataAsset} from './save-data.js';

async function loadInitialGameAssets({
    assetLoader,
    audioPlayer,
    engine,
    loadSession,
}: Readonly<{
    assetLoader: AssetLoader;
    audioPlayer: AudioPlayer;
    engine: AnthaEngine;
    loadSession: AssetLoadSession;
}>) {
    try {
        await loadAnthaAssets(
            {
                assetLoader,
                assets: [
                    loadSaveDataAsset,
                ],
                audio: {
                    assetName: 'Game audio',
                    audioPlayer,
                    files: gameAudioFilesToLoad,
                    serial: true,
                },
                entities: [
                    PlayerEntity,
                ],
            },
            {
                doNotUnload: true,
                loadSession,
            },
        );
        const loadedSaveState = await assetLoader.loadIndividualAsset({
            asset: loadSaveDataAsset,
        });

        if (loadedSaveState.loadError) {
            engine.log.error(loadedSaveState.loadError);
        }

        return loadedSaveState;
    } catch (error) {
        engine.log.error(ensureErrorAndPrependMessage(error, 'Failed to load game save state.'));

        return {
            loadError: ensureErrorAndPrependMessage(error, 'Failed to load game save state.'),
            saveState: createDefaultGameSaveState(),
        };
    }
}

/** Loads assets and installs the game mods so a new engine starts a playable session. */
export async function bootstrapGame({
    assetLoader,
    engine,
    loadSession,
    state,
}: Readonly<{
    assetLoader: AssetLoader;
    engine: AnthaEngine;
    loadSession: AssetLoadSession;
    state: Partial<FullGameState>;
}>) {
    engine.currentMods.push(
        createAnthaVirtualViewportMod({
            virtualHeight: gameWorldSize.height,
            virtualWidth: gameWorldSize.width,
        }),
    );
    const audioPlayer = new AudioPlayer();
    state.audioPlayer = audioPlayer;
    const loadedSaveState = await loadInitialGameAssets({
        assetLoader,
        audioPlayer,
        engine,
        loadSession,
    });
    state.saveState = loadedSaveState.saveState;
    state.bindingAssignments = defaultBindings;
    state.currentBackgroundAudio = gameAudio[GameAudioKey.GameMusic];
    state.menuState = closeAnthaMenus();
    state.players = {};
    state.seededRandom = SeededRandom.fromSeed(randomString());

    return {
        mods: [
            anthaAutosaveMod,
            createAnthaGraphics2dMod({
                extraCanvasWrapperStyles: css`
                    z-index: 0;
                `,
                pixiOptions: {
                    background: 'black',
                    ...createVirtualViewportPixiOptions(),
                },
            }),
            ...(deployEnv === DeployEnv.Dev
                ? [
                      createAnthaFpsMod({
                          debugFps: true,
                      }),
                  ]
                : []),
            createAnthaAudioMod(),
            createAnthaReadRawInputMod({
                deviceHandlerOptions: {
                    globalDeadZone: loadedSaveState.saveState.joystickDeadZone,
                },
                startRawInputConsumer: InputConsumer.Game,
            }),
            createAnthaInputBindingsMod(),
            updateEntitiesMod,
            multiplayerLockstepMod,
            gameUpdateMod,
            gameMenuStateMod,
            gameMenuMod,
            createAnthaMenuNavMod({
                allowWrapping: true,
                alwaysRequireFocused: true,
                blockPerpendicularNavigation: true,
            }),
            createAnthaBackgroundAudioMod(),
        ],
    };
}
