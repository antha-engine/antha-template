import {type ClientId} from '@antha/multiplayer-core';
import {assert} from '@augment-vir/assert';
import {applyBrand} from '@augment-vir/common';
import {describe, it} from '@augment-vir/test';
import {assertWrapValidShape} from 'object-shape-tester';
import {LocalPlayerPosition} from '../game-state/game-state.js';
import {
    createPlayerId,
    extractPlayerIdParts,
    PlayerIdSeparator,
    playerIdShape,
} from './player-id.js';

const testPlayerIdParts = {
    clientId: applyBrand<ClientId>('c_test-client'),
    playerPosition: LocalPlayerPosition.Two,
};

describe('player IDs', () => {
    it('creates player IDs', () => {
        assert.strictEquals(
            createPlayerId(testPlayerIdParts),
            assertWrapValidShape(
                `c_test-client${PlayerIdSeparator}${LocalPlayerPosition.Two}`,
                playerIdShape,
            ),
        );
    });

    it('extracts client and position from a player ID', () => {
        assert.deepEquals(
            extractPlayerIdParts({
                playerId: createPlayerId(testPlayerIdParts),
            }),
            testPlayerIdParts,
        );
    });

    it('rejects a player ID without a valid client ID', () => {
        assert.throws(() => {
            extractPlayerIdParts({
                playerId: assertWrapValidShape(
                    `invalid-client${PlayerIdSeparator}${LocalPlayerPosition.One}`,
                    playerIdShape,
                ),
            });
        });
    });
});
