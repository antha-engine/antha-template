import {assert, assertWrap} from '@augment-vir/assert';
import {type AtLeastTuple} from '@augment-vir/common';

/** Selects a stable item for a key so deterministic assignments stay evenly distributed. */
export function selectItemByHash<T>({
    items,
    key,
}: Readonly<{
    items: Readonly<AtLeastTuple<T, 1>>;
    key: string;
}>) {
    assert.isLengthAtLeast(items, 1, 'Cannot select item by hash from empty array.');

    const keyHash = Array.from(key).reduce((hash, character) => {
        const nextHash = hash ^ assertWrap.isDefined(character.codePointAt(0));

        return Math.imul(nextHash, 16_777_619) >>> 0;
    }, 2_166_136_261);
    const mixedKeyHash = Math.imul(keyHash ^ (keyHash >>> 16), 2_246_822_507) >>> 0;

    return assertWrap.isDefined(items[mixedKeyHash % items.length]);
}
