import {clamp, type Coords} from '@augment-vir/common';

export const gameWorldSize = {
    height: 1080,
    width: 1920,
} as const;

export function clampToGameWorld({
    edgeOffset = 0,
    position,
}: Readonly<{
    edgeOffset?: number | undefined;
    position: Coords;
}>) {
    return {
        x: clamp(position.x, {
            min: edgeOffset,
            max: gameWorldSize.width - edgeOffset,
        }),
        y: clamp(position.y, {
            min: edgeOffset,
            max: gameWorldSize.height - edgeOffset,
        }),
    };
}
