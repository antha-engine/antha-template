import {css, defineElement, html, listen, nothing} from 'element-vir';
import {noUserSelect, viraTheme, ViraThemeClient, ViraThemeSelection} from 'vira';
import {VirGame} from './vir-game.element.js';

/** Wraps the game and its initial loading screen. */
export const VirApp = defineElement()({
    tagName: 'vir-app',
    styles: css`
        :host {
            color: ${viraTheme.colors['theme-default'].foreground.value};
            display: block;
            font-family: sans-serif;
            height: 100%;
            width: 100%;
            ${noUserSelect}
        }
    `,
    state() {
        const themeClient = new ViraThemeClient();
        themeClient.setSelectedTheme(ViraThemeSelection.Dark);

        return {
            hasRenderedGameLoadingScreen: false,
            themeClient,
        };
    },
    cleanup({state}) {
        state.themeClient.destroy();
    },
    render({state, updateState}) {
        return html`
            <${VirGame}
                ${listen(VirGame.events.loadingScreenRendered, () => {
                    updateState({
                        hasRenderedGameLoadingScreen: true,
                    });
                })}
            ></${VirGame}>
            ${state.hasRenderedGameLoadingScreen
                ? nothing
                : html`
                      <slot></slot>
                  `}
        `;
    },
});
