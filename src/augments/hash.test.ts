import {assert} from '@augment-vir/assert';
import {describe, it} from '@augment-vir/test';
import {selectItemByHash} from './hash.js';

describe(selectItemByHash.name, () => {
    it('selects a deterministic item from a key', () => {
        assert.strictEquals(
            selectItemByHash({
                items: [
                    'first',
                    'second',
                    'third',
                ],
                key: 'alpha',
            }),
            'third',
        );
    });

    it('rejects an empty item list', () => {
        assert.throws(() => {
            selectItemByHash({
                // @ts-expect-error: Tests runtime validation for an empty array.
                items: [],
                key: 'alpha',
            });
        });
    });
});
