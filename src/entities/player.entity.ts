import {position2dParamsMap, position2dParamsShape, type ViewCreation2d} from '@antha/entity-2d';
import {Graphics} from '@antha/graphics-2d';
import {multiplayerIdShapes, type ClientId} from '@antha/multiplayer-core';
import {assertWrap} from '@augment-vir/assert';
import {defineShape} from 'object-shape-tester';
import {defineEntity} from '../mods/game-entity.mod.js';

export const playerBlobRadius = 18;

export const playerBorderColors: string[] = [
    '#14d7fe',
    '#30d158',
    '#ff9f0a',
    '#ff2d55',
    '#bf5af2',
    '#ffd60a',
];

export const playerParamsShape = defineShape({
    x: position2dParamsShape.default.x,
    y: position2dParamsShape.default.y,
    clientId: multiplayerIdShapes.client(),
});

export class PlayerEntity extends defineEntity({
    key: 'PlayerEntity',
    paramsShape: playerParamsShape,
    paramsMap: position2dParamsMap,
}) {
    protected renderedBorderColor: string | undefined;

    public override createView(): ViewCreation2d {
        return {
            view: new Graphics(),
        };
    }

    public override update(): void {
        if (this.renderedBorderColor !== choosePlayerBorderColor(this.params.clientId)) {
            this.renderPlayerBlob();
        }
    }

    protected renderPlayerBlob() {
        const borderColor = choosePlayerBorderColor(this.params.clientId);

        (this.view as Graphics)
            .clear()
            .circle(0, 0, playerBlobRadius)
            .fill({
                color: '#eee',
            })
            .stroke({
                color: borderColor,
                width: 4,
            });
        this.renderedBorderColor = borderColor;
    }
}

function choosePlayerBorderColor(clientId: ClientId) {
    const clientIdHash = Array.from(clientId).reduce((hash, character) => {
        const nextHash = hash ^ assertWrap.isDefined(character.codePointAt(0));

        return Math.imul(nextHash, 16_777_619) >>> 0;
    }, 2_166_136_261);
    const mixedClientIdHash = Math.imul(clientIdHash ^ (clientIdHash >>> 16), 2_246_822_507) >>> 0;

    return assertWrap.isDefined(playerBorderColors[mixedClientIdHash % playerBorderColors.length]);
}
