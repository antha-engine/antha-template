import {navAttribute} from '@antha/input';
import {NavValue} from 'device-navigation';
import {css, defineElement, html} from 'element-vir';
import {themeDefaultKey} from 'theme-vir/dist/color-theme/color-theme.js';
import {viraTheme} from 'vira';

/** Supplies a consistent, navigation-aware button shell for game menu actions. */
export const VirGameButton = defineElement()({
    tagName: 'vir-game-button',
    styles: css`
        :host {
            border: 1px solid currentColor;
            background-color: ${viraTheme.colors[themeDefaultKey].background.value};
            border-radius: 8px;
            box-sizing: border-box;
            cursor: pointer;
            min-height: 36px;
            padding: 12px 16px;
            outline: none;
            text-align: center;

            display: flex;
            justify-content: center;
            align-items: center;
        }

        :host(
                ${navAttribute.css({
                        navValue: NavValue.Focused,
                    })}
            ),
        :host(
                ${navAttribute.css({
                        navValue: NavValue.Active,
                    })}
            ) {
            background-color: ${viraTheme.colors['vira-blue-behind-fg-body'].background.value};
            box-shadow: inset 0 0 0 3px currentColor;
        }
    `,
    render() {
        return html`
            <slot></slot>
        `;
    },
});
