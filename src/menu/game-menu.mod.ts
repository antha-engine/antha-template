import {defineAnthaMod} from '@antha/engine';
import {MenuNavBinding} from '@antha/input';
import {check} from '@augment-vir/assert';
import {getObjectTypedValues} from '@augment-vir/common';
import {html} from 'element-vir';
import {
    GameMenuKey,
    getGameMenuReturnState,
    InputConsumer,
    type FullGameState,
    type GameMenuState,
} from '../game-state/game-state.js';
import {GameMenu as GameMenuElement} from './game-menu.element.js';

/** Derives the next menu state from the menu and back control actions. */
export function getGameMenuStateForNavigation({
    menuExitWasTriggered,
    menuState,
    openPauseMenuWasTriggered,
}: Readonly<{
    menuExitWasTriggered: boolean;
    menuState: Readonly<GameMenuState> | undefined;
    openPauseMenuWasTriggered: boolean;
}>) {
    const activeMenu = menuState?.activeMenu;

    if (
        (!activeMenu && !openPauseMenuWasTriggered) ||
        (activeMenu && !openPauseMenuWasTriggered && !menuExitWasTriggered)
    ) {
        return undefined;
    }

    return activeMenu
        ? getGameMenuReturnState(menuState)
        : {
              activeMenu: GameMenuKey.Pause,
              returnTo: undefined,
          };
}

export const gameMenuMod = defineAnthaMod<FullGameState>({
    modName: 'game-menu',
    execute({state}) {
        const wasInMenu = !!state.isInMenu;

        const nextMenuState = getObjectTypedValues(state.players || {})
            .map((player) => {
                const openPauseMenuBinding =
                    state.activeBindings?.[player.playerPosition]?.[MenuNavBinding.OpenPauseMenu];
                const menuExitBinding =
                    state.activeBindings?.[player.playerPosition]?.[MenuNavBinding.MenuExit];
                const nextMenuState = getGameMenuStateForNavigation({
                    menuExitWasTriggered: !!menuExitBinding && !menuExitBinding.actCount,
                    menuState: state.menuState,
                    openPauseMenuWasTriggered:
                        !!openPauseMenuBinding && !openPauseMenuBinding.actCount,
                });

                if (!nextMenuState) {
                    return undefined;
                }

                [
                    openPauseMenuBinding,
                    menuExitBinding,
                ].forEach((menuBinding) => {
                    if (menuBinding && !menuBinding.actCount) {
                        menuBinding.actCount = 1;
                    }
                });

                return nextMenuState;
            })
            .find(check.isDefined);

        if (nextMenuState) {
            state.menuState = nextMenuState;
        }

        state.isInMenu = !!state.menuState?.activeMenu;
        state.disableEntityUpdates = wasInMenu || state.isInMenu;
        state.rawInputConsumer = state.isInMenu ? InputConsumer.Menu : InputConsumer.Game;

        return html`
            <${GameMenuElement.assign({
                gameState: state,
            })}></${GameMenuElement}>
        `;
    },
});
