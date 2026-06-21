// cspell:word despawn
import {type ClientId} from '@antha/multiplayer-core';
import {type FrameEventDetail} from '@antha/multiplayer-p2p-lock-step';
import {
    clamp,
    SeededRandom,
    type Coords,
    type MaybePromise,
    type SeededRandomState,
} from '@augment-vir/common';
import {playerBlobRadius, PlayerEntity} from '../entities/player.entity.js';
import {type FullGameState} from './game-state.js';

export enum MultiplayerPacketType {
    PlayerMovement = 'player-movement',
    SpawnPlayer = 'spawn-player',
    DespawnPlayer = 'despawn-player',
}

export type StateSync = {
    players: Record<
        ClientId,
        {
            position: Coords;
        }
    >;
    randomState: SeededRandomState;
};

export type MultiplayerPacket =
    | {
          type: MultiplayerPacketType.PlayerMovement;
          x: number;
          y: number;
      }
    | {
          type: MultiplayerPacketType.SpawnPlayer;
          clientId: ClientId;
          /** Used to get the new player up to speed with everyone else. */
          stateSync: StateSync;
      }
    | {
          type: MultiplayerPacketType.DespawnPlayer;
          clientId: ClientId;
      };

export const multiplayerPacketHandlers = {
    [MultiplayerPacketType.PlayerMovement]({detail, state}) {
        const player = state.players?.[detail.sourceClientId];

        if (!player) {
            throw new Error(
                `Cannot move player '${detail.sourceClientId}'. Player does not exist.`,
            );
        }

        const newPosition = clampPlayerPosition({
            position: {
                x: player.entity.params.x + detail.packet.x,
                y: player.entity.params.y + detail.packet.y,
            },
            state,
        });

        player.entity.params.x = newPosition.x;
        player.entity.params.y = newPosition.y;
    },
    async [MultiplayerPacketType.SpawnPlayer]({detail, state}) {
        if (!state.pixi?.pixiApplication?.screen) {
            throw new Error('Cannot spawn player, no pixi screen yet.');
        } else if (!state.entityStore) {
            throw new Error('Cannot spawn player, no entity store yet.');
        }

        if (!state.players) {
            state.players = {};
        }

        state.seededRandom = SeededRandom.fromState(detail.packet.stateSync.randomState);

        state.players[detail.packet.clientId] = {
            entity: await state.entityStore.addEntity(
                PlayerEntity,
                clampPlayerPosition({
                    position: {
                        x: state.seededRandom.next() * state.pixi.pixiApplication.screen.width,
                        y: state.seededRandom.next() * state.pixi.pixiApplication.screen.height,
                    },
                    state,
                }),
            ),
        };
    },
    [MultiplayerPacketType.DespawnPlayer]({detail, state}) {
        if (!state.players) {
            throw new Error(
                `Cannot despawn player '${detail.packet.clientId}': no players exist yet.`,
            );
        }

        const playerEntity = state.players[detail.packet.clientId];

        if (playerEntity) {
            playerEntity.entity.immediatelyDestroy();
            delete state.players[detail.packet.clientId];
        }
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

function clampPlayerPosition({
    position,
    state,
}: Readonly<{
    position: Coords;
    state: Partial<FullGameState>;
}>): Coords {
    if (state.pixi?.pixiApplication?.screen) {
        return {
            x: clamp(position.x, {
                min: playerBlobRadius,
                max: state.pixi.pixiApplication.screen.width - playerBlobRadius,
            }),
            y: clamp(position.y, {
                min: playerBlobRadius,
                max: state.pixi.pixiApplication.screen.height - playerBlobRadius,
            }),
        };
    } else {
        return position;
    }
}
