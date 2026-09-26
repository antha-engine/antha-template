import {createAnthaAssetMod, createAnthaBootstrapMod} from '@antha/asset';
import {AnthaEngine, AnthaUi} from '@antha/engine';
import {type EmptyFunction} from '@augment-vir/common';
import {css, defineElement, defineElementEvent, html} from 'element-vir';
import {type FullGameState} from '../game-state/game-state.js';
import {gameWorldSize} from '../game-state/game-world.js';

/** An element that wraps the game engine and its render target. */
export const VirGame = defineElement()({
    tagName: 'vir-game',
    events: {
        loadingScreenRendered: defineElementEvent<void>(),
    },
    styles: css`
        :host {
            background: black;
            display: block;
            height: 100%;
            overflow: hidden;
            position: relative;
            width: 100%;
        }

        ${AnthaUi} {
            display: block;
            height: 100%;
            padding: 0;
            position: relative;
            width: 100%;
        }
    `,
    state() {
        return {
            engine: new AnthaEngine<FullGameState>({
                mods: [
                    createAnthaAssetMod({
                        loadingScreenFadeMs: 500,
                        virtualHeight: gameWorldSize.height,
                        virtualWidth: gameWorldSize.width,
                    }),
                    createAnthaBootstrapMod<FullGameState>()({
                        assetName: 'Game code',
                        async loadModule() {
                            return await import('../game-state/load-game.js');
                        },
                        bootstrap({assetLoader, engine, loadSession, module, state}) {
                            return module.bootstrapGame({
                                assetLoader,
                                engine,
                                loadSession,
                                state,
                            });
                        },
                    }),
                ],
            }),
            cleanup: undefined as undefined | EmptyFunction,
        };
    },
    init({dispatch, events, state, updateState}) {
        const removeEngineObservableListener = state.engine.observable.listen(false, () => {
            removeEngineObservableListener();
            dispatch(
                new events.loadingScreenRendered({
                    detail: undefined,
                }),
            );
        });

        updateState({
            cleanup: removeEngineObservableListener,
        });
    },
    cleanup({state}) {
        state.cleanup?.();
    },
    render({state}) {
        return html`
            <${AnthaUi.assign({
                engine: state.engine,
            })}></${AnthaUi}>
        `;
    },
});
