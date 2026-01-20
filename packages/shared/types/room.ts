// Room-related types for the Dojo multiplayer system

export type RoomStatus = 'waiting' | 'countdown' | 'active' | 'finished';
export type ParticipantStatus = 'waiting' | 'solving' | 'finished' | 'spectating' | 'disconnected';
export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export interface Room {
    id: string;
    code: string;
    name: string;
    hostId: string;
    status: RoomStatus;
    isPrivate: boolean;
    maxPlayers: number;

    // Problem
    problemSlug?: string;
    problemTitle?: string;
    difficulty?: Difficulty;

    // Wager
    isHardcore: boolean;
    entryFee: number;

    // Timing
    duration: number; // minutes
    startedAt?: string;
    endedAt?: string;

    participants: RoomParticipant[];
}

export interface RoomParticipant {
    id: string;
    userId: string;
    username: string;
    avatarUrl?: string;
    status: ParticipantStatus;
    testCasesPassed: number;
    totalTestCases: number;
    finishedAt?: string;
    rank?: number;
    coinsWon: number;
}

export interface ChatMessage {
    id: string;
    roomId: string;
    userId: string;
    username: string;
    message: string;
    timestamp: string;
}

// Socket.io Event Payloads
export interface RoomJoinPayload {
    roomCode: string;
    userId: string;
}

export interface RoomChatPayload {
    roomCode: string;
    userId: string;
    username: string;
    message: string;
}

export interface RoomProgressPayload {
    roomCode: string;
    userId: string;
    testCasesPassed: number;
    totalTestCases: number;
}
