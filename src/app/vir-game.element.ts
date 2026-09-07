import {AnthaAssetLoadingScreen, createAnthaAssetMod, createAnthaBootstrapMod} from '@antha/asset';
import {AnthaEngine, AnthaUi} from '@antha/engine';
import {assertWrap} from '@augment-vir/assert';
import {type EmptyFunction} from '@augment-vir/common';
import {queryThroughShadow} from '@augment-vir/web';
import {css, defineElement, defineElementEvent, html} from 'element-vir';
import {listenToGlobal} from 'typed-event-target';
import {type FullGameState} from '../game-state/game-state.js';

function createAnthaLoadingScreenZoom({
    gameElement,
}: Readonly<{
    gameElement: HTMLElement;
}>) {
    function updateLoadingScreenZoom(this: void) {
        const anthaUi = queryThroughShadow(gameElement, AnthaUi);

        if (!(anthaUi instanceof HTMLElement) || !anthaUi.shadowRoot) {
            return;
        }

        loadingScreenObserver.observe(anthaUi, {
            attributeFilter: [
                'style',
            ],
            attributes: true,
        });
        loadingScreenObserver.observe(anthaUi.shadowRoot, {
            childList: true,
            subtree: true,
        });
        const loadingScreen = queryThroughShadow(anthaUi, AnthaAssetLoadingScreen);

        if (!(loadingScreen instanceof HTMLElement)) {
            return;
        } else if (anthaUi.style.transform) {
            loadingScreen.style.removeProperty('height');
            loadingScreen.style.removeProperty('inset');
            loadingScreen.style.removeProperty('transform');
            loadingScreen.style.removeProperty('transform-origin');
            loadingScreen.style.removeProperty('width');
            cleanup();

            return;
        }

        const scale = anthaUi.getBoundingClientRect().width / 1920;

        if (!scale) {
            return;
        }

        loadingScreen.style.height = `${100 / scale}%`;
        loadingScreen.style.inset = '0 auto auto 0';
        loadingScreen.style.transform = `scale(${scale})`;
        loadingScreen.style.transformOrigin = 'top left';
        loadingScreen.style.width = `${100 / scale}%`;
    }

    const loadingScreenObserver = new MutationObserver(updateLoadingScreenZoom);
    loadingScreenObserver.observe(assertWrap.isDefined(gameElement.shadowRoot), {
        childList: true,
    });
    const cleanupCallbacks = [
        () => {
            loadingScreenObserver.disconnect();
        },
        listenToGlobal('resize', updateLoadingScreenZoom),
    ];
    updateLoadingScreenZoom();

    function cleanup(this: void) {
        cleanupCallbacks.forEach((cleanupCallback) => cleanupCallback());
    }

    return cleanup;
}

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
    init({dispatch, events, host, state, updateState}) {
        const removeEngineObservableListener = state.engine.observable.listen(false, () => {
            removeEngineObservableListener();
            dispatch(new events.loadingScreenRendered());
        });
        const cleanupCallbacks = [
            removeEngineObservableListener,
            createAnthaLoadingScreenZoom({
                gameElement: host,
            }),
        ];

        function cleanup(this: void) {
            cleanupCallbacks.forEach((cleanupCallback) => cleanupCallback());
        }

        updateState({
            cleanup,
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
