import {multiplayerIdShapes, type ClientId} from '@antha/multiplayer-core';
import {assertWrap} from '@augment-vir/assert';
import {applyBrand, safeSplit, type Branded} from '@augment-vir/common';
import {assertWrapValidShape, typedStringShape} from 'object-shape-tester';
import {LocalPlayerPosition} from '../game-state/game-state.js';

export const PlayerIdSeparator = ':' as const;

export type PlayerIdSeparator = typeof PlayerIdSeparator;

export type PlayerId = Branded<
    `${ClientId}${PlayerIdSeparator}${LocalPlayerPosition}`,
    'player-id'
>;

export const playerIdShape = typedStringShape<PlayerId>();

export type PlayerIdParts = {
    clientId: ClientId;
    playerPosition: LocalPlayerPosition;
};

export function createPlayerId({clientId, playerPosition}: Readonly<PlayerIdParts>) {
    return applyBrand<PlayerId>(`${clientId}${PlayerIdSeparator}${playerPosition}`);
}

export function extractPlayerIdParts({
    playerId,
}: Readonly<{
    playerId: PlayerId;
}>): PlayerIdParts {
    const [
        clientId,
        playerPosition,
    ] = safeSplit({
        splitter: PlayerIdSeparator,
        value: playerId,
    });

    return {
        clientId: assertWrapValidShape(clientId, multiplayerIdShapes.client()),
        playerPosition: assertWrap.isEnumValue(playerPosition, LocalPlayerPosition),
    };
}
