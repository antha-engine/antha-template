import {AssetLoader} from '@antha/asset';
import {AnthaEngine} from '@antha/engine';
import {EntityStore2d} from '@antha/entity-2d';
import {createMockPixi} from '@antha/graphics-2d';
import {InputDeviceHandler} from '@antha/input';
import {createMultiplayerPlayerId, emptyApiAndRoomConnectionState} from '@antha/multiplayer-core';
import {P2pLockStepMultiplayerController} from '@antha/multiplayer-p2p-lock-step';
import {LocalPlayerPosition} from '@antha/util';
import {assert, assertWrap} from '@augment-vir/assert';
import {describe, it} from '@augment-vir/test';
import {PlayerEntity} from '../player/player.entity.js';
import {type FullGameState} from './game-state.js';
import {gameUpdateMod} from './game-update.mod.js';
import {type MultiplayerPacket} from './multiplayer-packet.js';
import {createDefaultGameSaveState} from './save-data.js';

describe(gameUpdateMod.modName, () => {
    it('syncs the saved joystick dead zone to the input device handler', async () => {
        const deviceHandler = new InputDeviceHandler({
            globalDeadZone: 0.2,
            startLoopImmediately: false,
        });
        const engine = new AnthaEngine<FullGameState>({
            hostElement: document.createElement('div'),
            initState: {
                deviceHandler,
                saveState: {
                    ...createDefaultGameSaveState(),
                    joystickDeadZone: 0.6,
                },
            },
            mods: [
                gameUpdateMod,
            ],
        });

        try {
            await engine.runSingleTick();

            assert.strictEquals(deviceHandler.globalDeadZone, 0.6);
        } finally {
            await engine.reset();
        }
    });

    it('only lets player one and joined local players use menus', async () => {
        const controller = new P2pLockStepMultiplayerController<MultiplayerPacket>({
            gameId: 'game-update-test',
        });
        controller.startSingleplayer();
        const localClientId = assertWrap.isDefined(controller.getClientId());
        const engine = new AnthaEngine<FullGameState>({
            hostElement: document.createElement('div'),
            initState: {
                multiplayerP2pLockStep: {
                    connectionState: emptyApiAndRoomConnectionState,
                    multiplayerController: controller,
                },
                players: {},
            },
            mods: [
                gameUpdateMod,
            ],
        });
        const entityStore = new EntityStore2d({
            assetLoader: new AssetLoader(),
            pixi: createMockPixi(),
            state: engine.state,
        });
        const playerTwoId = createMultiplayerPlayerId({
            clientId: localClientId,
            playerPosition: LocalPlayerPosition.Two,
        });

        try {
            engine.state.players = {
                [playerTwoId]: {
                    clientId: localClientId,
                    playerEntity: await entityStore.addEntity(PlayerEntity, {
                        playerId: playerTwoId,
                        x: 100,
                        y: 100,
                    }),
                    playerPosition: LocalPlayerPosition.Two,
                },
            };

            await engine.runSingleTick();

            assert.deepEquals(engine.state.allowedPlayerMenuNavigation, {
                [LocalPlayerPosition.One]: true,
                [LocalPlayerPosition.Two]: true,
                [LocalPlayerPosition.Three]: false,
                [LocalPlayerPosition.Four]: false,
            });
        } finally {
            controller.destroy();
            entityStore.destroy();
            await engine.reset();
        }
    });
});
