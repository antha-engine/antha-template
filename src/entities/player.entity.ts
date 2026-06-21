import {position2dParamsMap, position2dParamsShape, type ViewCreation2d} from '@antha/entity-2d';
import {Graphics} from '@antha/graphics-2d';
import {defineEntity} from '../mods/game-entity.mod.js';

export const playerBlobRadius = 18;

export class PlayerEntity extends defineEntity({
    key: 'PlayerEntity',
    paramsShape: position2dParamsShape,
    paramsMap: position2dParamsMap,
    assets: {
        blob: {
            maxProgress: 1,
            load({incrementProgressCallback}) {
                const blob = new Graphics();

                blob.circle(0, 0, playerBlobRadius)
                    .fill({
                        color: 'grey',
                    })
                    .stroke({
                        color: '#14d7fe',
                        width: 4,
                    });

                incrementProgressCallback();

                return {
                    value: blob,
                };
            },
        },
    },
}) {
    public override async createView(): Promise<ViewCreation2d> {
        return {
            view: (await this.getAsset.blob()).clone(true),
        };
    }

    public override update(): void {}
}
