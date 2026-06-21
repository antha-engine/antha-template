import {createAnthaAssetMod} from '@antha/asset';
import {AnthaEngine, AnthaUi} from '@antha/engine';
import {createAnthaGraphics2dMod} from '@antha/graphics-2d';
import {
    createAnthaInputBindingsMod,
    createAnthaMenuNavMod,
    createAnthaReadRawInputMod,
} from '@antha/input';
import {createAnthaMultiplayerP2pLockStepMod} from '@antha/multiplayer-p2p-lock-step';
import {randomString, SeededRandom} from '@augment-vir/common';
import {css, defineElement, html} from 'element-vir';
import {defaultBindings} from '../../data/default-bindings.js';
import {type FullGameState} from '../../data/game-state.js';
import {type MultiplayerPacket} from '../../data/multiplayer-packet.js';
import {entityStoreMod} from '../../mods/game-entity.mod.js';
import {pauseMod} from '../../mods/pause/pause.mod.js';
import {playerStateMod} from '../../mods/player-state.mod.js';

export const VirGame = defineElement()({
    tagName: 'vir-game',
    styles: css`
        :host {
            background: white;
            overflow: hidden;
            width: 100%;
            height: 100%;
        }
    `,
    state() {
        return {
            engine: new AnthaEngine<FullGameState>({
                initState: {
                    bindingAssignments: defaultBindings,
                    seededRandom: SeededRandom.fromSeed(randomString()),
                },
                mods: [
                    createAnthaAssetMod(),
                    createAnthaGraphics2dMod({
                        pixiOptions: {
                            background: 'white',
                        },
                    }),
                    entityStoreMod,
                    createAnthaReadRawInputMod(),
                    createAnthaInputBindingsMod(),
                    pauseMod,
                    createAnthaMenuNavMod({
                        allowWrapping: false,
                        alwaysRequireFocused: true,
                    }),
                    createAnthaMultiplayerP2pLockStepMod<MultiplayerPacket>({
                        gameId: 'antha-template',
                    }),
                    playerStateMod,
                ],
            }),
        };
    },
    render({state}) {
        return html`
            <${AnthaUi.assign({
                engine: state.engine,
            })}></${AnthaUi}>
        `;
    },
});
