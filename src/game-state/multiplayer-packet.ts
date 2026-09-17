import {type ClientId} from '@antha/multiplayer-core';
import {type FrameEventDetail} from '@antha/multiplayer-p2p-lock-step';
import {
    filterObject,
    getObjectTypedKeys,
    getObjectTypedValues,
    mapObject,
    mapObjectValues,
    removeUndefinedValues,
    SeededRandom,
    type Coords,
    type MaybePromise,
    type SeededRandomState,
} from '@augment-vir/common';
import {createPlayerId} from '../player/player-id.js';
import {clampPlayer, PlayerEntity} from '../player/player.entity.js';
import {LocalPlayerPosition, type FullGameState} from './game-state.js';
import {gameWorldSize} from './game-world.js';

/** Lists controller slots that can create local players during a session. */
export const allLocalPlayerPositions = [
    LocalPlayerPosition.One,
    LocalPlayerPosition.Two,
    LocalPlayerPosition.Three,
    LocalPlayerPosition.Four,
] as const;

export enum MultiplayerPacketType {
    /** Removes every player owned by a peer has left the session. */
    DespawnPlayers = 'despawn-players',
    /** Moves a single player. */
    PlayerMovement = 'player-movement',
    /** Creates a player, triggered by a new local controller joining. */
    SpawnPlayer = 'spawn-player',
    /** Reconciles multiplayer game state when a new peer joins. */
    SyncState = 'sync-state',
}

/** Describes the serializable part of one player needed to restore it on another peer. */
export type SyncedPlayerState = {
    clientId: ClientId;
    playerPosition: LocalPlayerPosition;
    position: Coords;
};

/** Carries a complete player and random-state snapshot to a newly connected peer. */
export type MultiplayerStateForSync = {
    players: Record<string, SyncedPlayerState>;
    randomState: SeededRandomState;
};

/** Defines every action payload peers may send through the lock-step controller. */
export type MultiplayerPacket =
    | {
          type: MultiplayerPacketType.PlayerMovement;
          playerPosition: LocalPlayerPosition;
          x: number;
          y: number;
      }
    | {
          type: MultiplayerPacketType.SpawnPlayer;
          playerPosition: LocalPlayerPosition;
      }
    | {
          type: MultiplayerPacketType.SyncState;
          clientId: ClientId;
          stateSync: MultiplayerStateForSync;
      }
    | {
          type: MultiplayerPacketType.DespawnPlayers;
          clientId: ClientId;
      };

/** Creates a serializable snapshot so a joining player can match the current game. */
export function createStateSync(state: Partial<FullGameState>): MultiplayerStateForSync {
    if (!state.seededRandom) {
        throw new Error('Missing seeded random: cannot sync multiplayer state.');
    }

    return {
        players: mapObjectValues(state.players || {}, (_playerId, player) => {
            return {
                clientId: player.clientId,
                playerPosition: player.playerPosition,
                position: {
                    x: player.playerEntity.params.x,
                    y: player.playerEntity.params.y,
                },
            };
        }),
        randomState: state.seededRandom.exportState(),
    };
}

export const multiplayerPacketHandlers = {
    [MultiplayerPacketType.DespawnPlayers]({detail, state}) {
        getObjectTypedValues(state.players || {}).forEach((player) => {
            if (player.clientId !== detail.packet.clientId) {
                /** Only despawn players for the disconnected peer. */
                return;
            }
            player.playerEntity.immediatelyDestroy();
        });
        state.players = removeUndefinedValues(
            filterObject(state.players || {}, (_playerId, player) => {
                return player.clientId !== detail.packet.clientId;
            }),
        );
    },
    [MultiplayerPacketType.PlayerMovement]({detail, state}) {
        const playerId = createPlayerId({
            clientId: detail.sourceClientId,
            playerPosition: detail.packet.playerPosition,
        });
        const player = state.players?.[playerId];

        if (!player) {
            throw new Error(`Cannot move player '${playerId}'. Player does not exist.`);
        } else if (player.clientId !== detail.sourceClientId) {
            throw new Error(
                `Cannot move player '${playerId}'. Player owner does not match source.`,
            );
        }

        const position = {
            x: player.playerEntity.params.x + detail.packet.x,
            y: player.playerEntity.params.y + detail.packet.y,
        };
        const newPosition = clampPlayer({
            position,
        });

        player.playerEntity.params.x = newPosition.x;
        player.playerEntity.params.y = newPosition.y;
    },
    async [MultiplayerPacketType.SpawnPlayer]({detail, state}) {
        const playerId = createPlayerId({
            clientId: detail.sourceClientId,
            playerPosition: detail.packet.playerPosition,
        });

        if (state.players?.[playerId]) {
            return;
        } else if (!state.entityStore) {
            throw new Error('Cannot add player: no entity store exists.');
        }

        const playerEntity = await state.entityStore.addEntity(PlayerEntity, {
            ...createRandomPlayerPosition(state),
            playerId,
        });

        state.players = {
            ...state.players,
            [playerId]: {
                clientId: detail.sourceClientId,
                playerEntity,
                playerPosition: detail.packet.playerPosition,
            },
        };
    },
    async [MultiplayerPacketType.SyncState]({detail, state}) {
        const seededRandom = SeededRandom.fromState(detail.packet.stateSync.randomState);
        const newPlayerId = createPlayerId({
            clientId: detail.packet.clientId,
            playerPosition: LocalPlayerPosition.One,
        });
        const syncedPlayers = detail.packet.stateSync.players[newPlayerId]
            ? detail.packet.stateSync.players
            : {
                  ...detail.packet.stateSync.players,
                  [newPlayerId]: {
                      clientId: detail.packet.clientId,
                      playerPosition: LocalPlayerPosition.One,
                      position: createRandomPlayerPosition({
                          ...state,
                          seededRandom,
                      }),
                  },
              };

        state.seededRandom = seededRandom;
        getObjectTypedKeys(state.players || {}).forEach((playerId) => {
            if (!syncedPlayers[playerId]) {
                state.players?.[playerId]?.playerEntity.immediatelyDestroy();
            }
        });

        state.players = await mapObject(syncedPlayers, async (_syncedPlayerId, player) => {
            const playerId = createPlayerId({
                clientId: player.clientId,
                playerPosition: player.playerPosition,
            });
            const existingPlayer = state.players?.[playerId];

            if (existingPlayer) {
                existingPlayer.playerEntity.params.x = player.position.x;
                existingPlayer.playerEntity.params.y = player.position.y;

                return {
                    key: playerId,
                    value: existingPlayer,
                };
            } else if (state.entityStore) {
                return {
                    key: playerId,
                    value: {
                        clientId: player.clientId,
                        playerEntity: await state.entityStore.addEntity(PlayerEntity, {
                            ...player.position,
                            playerId,
                        }),
                        playerPosition: player.playerPosition,
                    },
                };
            } else {
                throw new Error('Cannot synchronize players: no entity store exists.');
            }
        });
    },
} satisfies Readonly<{
    [PacketType in MultiplayerPacketType]: (
        params: Readonly<{
            detail: Readonly<
                FrameEventDetail<
                    Extract<
                        MultiplayerPacket,
                        {
                            type: PacketType;
                        }
                    >
                >
            >;
            state: Partial<FullGameState>;
        }>,
    ) => MaybePromise<void>;
}> as Readonly<
    Record<
        MultiplayerPacketType,
        (
            params: Readonly<{
                detail: Readonly<FrameEventDetail<MultiplayerPacket>>;
                state: Partial<FullGameState>;
            }>,
        ) => MaybePromise<void>
    >
>;

function createRandomPlayerPosition(state: Partial<FullGameState>) {
    if (state.seededRandom) {
        return clampPlayer({
            position: {
                x: state.seededRandom.next() * gameWorldSize.width,
                y: state.seededRandom.next() * gameWorldSize.height,
            },
        });
    } else {
        throw new Error('Cannot create player position: seeded random is missing.');
    }
}
