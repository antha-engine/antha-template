import {
    createMockRoomHandlerServerApiClient,
    createNewRoom,
    MultiplayerControllerMessageEvent,
} from '@antha/multiplayer-core';
import {
    MultiplayerControllerFrameEvent,
    P2pLockStepMessageType,
    P2pLockStepMultiplayerController,
    type MultiplayerFramePacket,
    type P2pLockStepMessage,
} from '@antha/multiplayer-p2p-lock-step';
import {LocalPlayerPosition} from '@antha/util';
import {assert, assertWrap} from '@augment-vir/assert';
import {getEnumValues, wait, type MaybePromise} from '@augment-vir/common';
import {describe, it} from '@augment-vir/test';
import {MultiplayerPacketType, type MultiplayerPacket} from './multiplayer-packet.js';

class TestDataChannel extends EventTarget {
    public close() {}

    public send() {}
}

class TestPeerConnection extends EventTarget {
    public static readonly dataChannels: TestDataChannel[] = [];

    public localDescription: RTCSessionDescriptionInit | undefined;
    public remoteDescription: RTCSessionDescriptionInit | undefined;

    public override addEventListener(
        type: string,
        listener: EventListenerOrEventListenerObject | null,
        options?: AddEventListenerOptions | boolean | undefined,
    ) {
        super.addEventListener(type, listener, options);

        if (type === 'icecandidate' && listener) {
            queueMicrotask(() => {
                this.dispatchEvent(
                    Object.assign(new Event('icecandidate'), {
                        candidate: undefined,
                    }),
                );
            });
        }
    }

    public createDataChannel() {
        const dataChannel = new TestDataChannel();

        TestPeerConnection.dataChannels.push(dataChannel);

        return dataChannel;
    }

    public createOffer(): Promise<RTCSessionDescriptionInit> {
        return Promise.resolve({
            sdp: 'test offer',
            type: 'offer',
        });
    }

    public createAnswer(): Promise<RTCSessionDescriptionInit> {
        return Promise.resolve({
            sdp: 'test answer',
            type: 'answer',
        });
    }

    public setLocalDescription(description: RTCSessionDescriptionInit) {
        this.localDescription = description;

        return Promise.resolve();
    }

    public setRemoteDescription(description: RTCSessionDescriptionInit) {
        this.remoteDescription = description;

        if (description.type === 'offer') {
            const dataChannel = this.createDataChannel();

            this.dispatchEvent(
                Object.assign(new Event('datachannel'), {
                    channel: dataChannel,
                }),
            );
        } else if (description.type === 'answer') {
            TestPeerConnection.dataChannels.forEach((dataChannel) => {
                queueMicrotask(() => {
                    dataChannel.dispatchEvent(new Event('open'));
                });
            });
        }

        return Promise.resolve();
    }

    public close() {}
}

async function withMockPeerConnection(callback: () => MaybePromise<void>) {
    const originalPropertyDescriptor = Object.getOwnPropertyDescriptor(
        globalThis,
        'RTCPeerConnection',
    );

    Object.defineProperty(globalThis, 'RTCPeerConnection', {
        configurable: true,
        value: TestPeerConnection,
        writable: true,
    });
    TestPeerConnection.dataChannels.length = 0;

    try {
        await callback();
    } finally {
        if (originalPropertyDescriptor) {
            Object.defineProperty(globalThis, 'RTCPeerConnection', originalPropertyDescriptor);
        } else {
            Reflect.deleteProperty(globalThis, 'RTCPeerConnection');
        }
    }
}

function createSpawnPackets() {
    return getEnumValues(LocalPlayerPosition).map((playerPosition) => {
        return {
            playerPosition,
            type: MultiplayerPacketType.SpawnPlayer,
        } satisfies MultiplayerPacket;
    });
}

describe(MultiplayerPacketType.SpawnPlayer, () => {
    it('runs one-to-four local players through a singleplayer frame', async () => {
        const controller = new P2pLockStepMultiplayerController<MultiplayerPacket>({
            frameDuration: {
                milliseconds: 1,
            },
            gameId: 'antha-template-local-player-test',
        });
        const receivedFrames: Array<ReadonlyArray<MultiplayerFramePacket<MultiplayerPacket>>> = [];

        controller.listen(MultiplayerControllerFrameEvent, ({detail}) => {
            if (detail.packets.length) {
                receivedFrames.push(detail.packets);
            }
        });
        controller.startSingleplayer();
        const localClientId = assertWrap.isDefined(controller.getClientId());
        const packets = createSpawnPackets();

        try {
            controller.act(packets);
            await wait({
                milliseconds: 5,
            });

            assert.deepEquals(receivedFrames, [
                packets.map((packet) => {
                    return {
                        packet,
                        sourceClientId: localClientId,
                    };
                }),
            ]);
        } finally {
            controller.destroy();
        }
    });

    it('delivers one-to-four player actions in a mocked host/client session', async () => {
        await withMockPeerConnection(async () => {
            const room = createNewRoom({
                roomName: 'Antha Template Test Room',
            });
            const multiplayerApiClient = createMockRoomHandlerServerApiClient();
            const host = new P2pLockStepMultiplayerController<MultiplayerPacket>({
                gameId: 'antha-template-p2p-player-test',
            });
            const member = new P2pLockStepMultiplayerController<MultiplayerPacket>({
                gameId: 'antha-template-p2p-player-test',
            });
            const receivedFrames: Array<ReadonlyArray<MultiplayerFramePacket<MultiplayerPacket>>> =
                [];

            member.listen(MultiplayerControllerFrameEvent, ({detail}) => {
                receivedFrames.push(detail.packets);
            });

            try {
                await host.initMultiplayer({
                    backendOrigin: multiplayerApiClient.baseUrl,
                    multiplayerApiClient,
                });
                await member.initMultiplayer({
                    backendOrigin: multiplayerApiClient.baseUrl,
                    multiplayerApiClient,
                });
                await host.joinOrCreateRoom(room);
                await member.joinOrCreateRoom(room);

                const hostClientId = assertWrap.isDefined(host.getClientId());
                const memberClientId = assertWrap.isDefined(member.getClientId());
                const packets = createSpawnPackets();

                member.roomController.dispatch(
                    new MultiplayerControllerMessageEvent<P2pLockStepMessage<MultiplayerPacket>>(
                        hostClientId,
                        {
                            packets: packets.map((packet) => {
                                return {
                                    packet,
                                    sourceClientId: memberClientId,
                                };
                            }),
                            type: P2pLockStepMessageType.Frame,
                        },
                    ),
                );

                assert.deepEquals(
                    {
                        hostClientIds: host.getAllClientIds().toSorted(),
                        hostIsHost: host.isHost(),
                        memberClientIds: member.getAllClientIds().toSorted(),
                        memberFrames: receivedFrames,
                        memberIsHost: member.isHost(),
                    },
                    {
                        hostClientIds: [
                            hostClientId,
                            memberClientId,
                        ].toSorted(),
                        hostIsHost: true,
                        memberClientIds: [
                            hostClientId,
                            memberClientId,
                        ].toSorted(),
                        memberFrames: [
                            packets.map((packet) => {
                                return {
                                    packet,
                                    sourceClientId: memberClientId,
                                };
                            }),
                        ],
                        memberIsHost: false,
                    },
                );
            } finally {
                host.destroy();
                member.destroy();
            }
        });
    });
});
