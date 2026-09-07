import {NavController, nav, navAttribute} from '@antha/input';
import {assert, assertWrap} from '@augment-vir/assert';
import {describe, it, testWeb} from '@augment-vir/test';
import {NavValue} from 'device-navigation';
import {html} from 'element-vir';
import {VirGameButton} from './vir-game-button.element.js';

describe(VirGameButton.tagName, () => {
    it('keeps its size while receiving navigation state on its host', async () => {
        const navController = new NavController(document.body);

        try {
            const renderedElement = await testWeb.render(html`
                <${VirGameButton}
                    ${nav(navController, {
                        autoFocus: true,
                    })}
                >
                    Play
                </${VirGameButton}>
            `);
            const gameButton = assertWrap.instanceOf(renderedElement, VirGameButton);
            const sizeBeforeActivation = {
                height: gameButton.getBoundingClientRect().height,
                width: gameButton.getBoundingClientRect().width,
            };

            gameButton.dispatchEvent(
                new MouseEvent('mousedown', {
                    bubbles: true,
                }),
            );

            assert.deepEquals(
                {
                    borderWidth: getComputedStyle(gameButton).borderTopWidth,
                    navigation: gameButton.getAttribute(navAttribute.name),
                    size: {
                        height: gameButton.getBoundingClientRect().height,
                        width: gameButton.getBoundingClientRect().width,
                    },
                    text: gameButton.textContent.trim(),
                },
                {
                    borderWidth: '1px',
                    navigation: NavValue.Active,
                    size: sizeBeforeActivation,
                    text: 'Play',
                },
            );
        } finally {
            testWeb.cleanupRender();
        }
    });
});
