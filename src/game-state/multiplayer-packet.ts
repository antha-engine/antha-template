import {type SerializedEntity2d} from '@antha/entity-2d';
import {
    createMultiplayerPlayerId,
    extractMultiplayerPlayerIdParts,
    type ClientId,
} from '@antha/multiplayer-core';
import {type MultiplayerFramePacket} from '@antha/multiplayer-p2p-lock-step';
import {type LocalPlayerPosition} from '@antha/util';
import {
    filterObject,
    getObjectTypedValues,
    removeUndefinedValues,
    SeededRandom,
    typedObjectFromEntries,
    type MaybePromise,
    type SeededRandomState,
} from '@augment-vir/common';
import {clampPlayer, PlayerEntity} from '../player/player.entity.js';
import {type FullGameState} from './game-state.js';
import {gameWorldSize} from './game-world.js';

export enum MultiplayerPacketType {
    /** Removes every player owned by a peer has left the session. */
    DespawnPlayers = 'despawn-players',
    /** Moves a single player. */
    PlayerMovement = 'player-movement',
    /** Creates a player, triggered by a new local controller joining. */
    SpawnPlayer = 'spawn-player',
}

/** Carries a complete entity and random-state snapshot to a newly connected peer. */
export type MultiplayerStateForSync = {
    entities: SerializedEntity2d[];
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
          type: MultiplayerPacketType.DespawnPlayers;
          clientId: ClientId;
      };

/** Creates a serializable snapshot so a joining player can match the current game. */
export function createStateSync(state: Partial<FullGameState>): MultiplayerStateForSync {
    if (!state.seededRandom) {
        throw new Error('Missing seeded random: cannot sync multiplayer state.');
    } else if (state.entityStore) {
        return {
            entities: state.entityStore.createSnapshot(),
            randomState: state.seededRandom.exportState(),
        };
    } else {
        throw new Error('Missing entity store: cannot sync multiplayer state.');
    }
}

/** Replaces a joining (or resyncing) peer's entities and random state with the host's. */
export async function loadStateSync({
    state,
    stateSync,
}: Readonly<{
    state: Partial<FullGameState>;
    stateSync: Readonly<MultiplayerStateForSync>;
}>) {
    if (!state.entityStore) {
        throw new Error('Cannot load multiplayer state: no entity store exists.');
    }

    state.seededRandom = SeededRandom.fromState(stateSync.randomState);
    state.entityStore.registerEntities({
        entities: [
            PlayerEntity,
        ],
    });

    state.players = typedObjectFromEntries(
        (await state.entityStore.loadSnapshot(stateSync.entities))
            .filter((entity) => entity instanceof PlayerEntity)
            .map((playerEntity) => {
                const playerIdParts = extractMultiplayerPlayerIdParts({
                    playerId: playerEntity.params.playerId,
                });

                return [
                    playerEntity.params.playerId,
                    {
                        clientId: playerIdParts.clientId,
                        playerEntity,
                        playerPosition: playerIdParts.playerPosition,
                    },
                ] as const;
            }),
    );
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
        const playerId = createMultiplayerPlayerId({
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
        const playerId = createMultiplayerPlayerId({
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
} satisfies Readonly<{
    [PacketType in MultiplayerPacketType]: (
        params: Readonly<{
            detail: Readonly<
                MultiplayerFramePacket<
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
                detail: Readonly<MultiplayerFramePacket<MultiplayerPacket>>;
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
