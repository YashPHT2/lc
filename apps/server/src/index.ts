import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// CORS configuration for production and development
const allowedOrigins = [
    process.env.CLIENT_URL,
    'http://localhost:3000',
    'https://localhost:3000',
].filter(Boolean) as string[];

const io = new Server(httpServer, {
    cors: {
        origin: (origin, callback) => {
            // Allow requests with no origin (like mobile apps or curl)
            if (!origin) return callback(null, true);
            if (allowedOrigins.some(allowed => origin.startsWith(allowed.replace(/\/$/, '')))) {
                return callback(null, true);
            }
            // Also allow any Vercel preview deployments
            if (origin.includes('.vercel.app')) {
                return callback(null, true);
            }
            callback(new Error('Not allowed by CORS'));
        },
        methods: ['GET', 'POST'],
        credentials: true,
    },
});

app.use(cors({
    origin: allowedOrigins,
    credentials: true,
}));
app.use(express.json());

// ============== TYPES ==============

interface Participant {
    odId: string;
    userId: string;
    socketId: string;
    username: string;
    avatarUrl?: string;
    isReady: boolean;
    solved: boolean;
    solveTime?: number;
}

interface Room {
    code: string;
    hostId: string;
    status: 'waiting' | 'starting' | 'in_progress' | 'finished';
    problemSlug: string;
    problemTitle?: string;
    difficulty: string;
    duration: number;
    startTime?: number;
    isHardcore: boolean;
    entryFee: number;
    leetCodeRoomId?: string;
    leetCodeRoomUrl?: string;
    participants: Map<string, Participant>;
    chat: ChatMessage[];
    // Voting system
    problemSuggestions: Map<string, ProblemSuggestion>;
    problemLocked: boolean;
}

interface ChatMessage {
    id: string;
    odId: string;
    userId: string;
    username: string;
    message: string;
    timestamp: string;
    type: 'message' | 'system' | 'invite';
    roomCode?: string;
}

interface ProblemSuggestion {
    id: string;
    url: string;
    problemSlug: string;
    problemTitle: string;
    difficulty: 'Easy' | 'Medium' | 'Hard' | 'Unknown';
    submittedBy: string;
    submittedByUsername: string;
    votes: Set<string>; // userIds who voted
}

// ============== IN-MEMORY STORAGE ==============

const rooms = new Map<string, Room>();
const onlineUsers = new Map<string, { odId: string; socketId: string; username: string }>();

// ============== HELPERS ==============

function generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }
    return rooms.has(code) ? generateRoomCode() : code;
}

function broadcastPresence() {
    const userIds = Array.from(onlineUsers.keys());
    io.emit('presence:update', userIds);
}

function serializeRoom(room: Room) {
    return {
        ...room,
        participants: Array.from(room.participants.values()),
        chat: room.chat,
        problemSuggestions: Array.from(room.problemSuggestions.values()).map(s => ({
            ...s,
            votes: Array.from(s.votes),
            voteCount: s.votes.size,
        })),
    };
}

// ============== REST API ==============

app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        rooms: rooms.size,
        onlineUsers: onlineUsers.size,
    });
});

app.get('/api/room/:code', (req, res) => {
    const room = rooms.get(req.params.code.toUpperCase());
    if (!room) return res.status(404).json({ error: 'Room not found' });

    res.json({
        code: room.code,
        status: room.status,
        problemSlug: room.problemSlug,
        problemTitle: room.problemTitle,
        difficulty: room.difficulty,
        duration: room.duration,
        isHardcore: room.isHardcore,
        leetCodeRoomUrl: room.leetCodeRoomUrl,
        participants: Array.from(room.participants.values()).map(p => ({
            odId: p.odId,
            userId: p.userId,
            username: p.username,
            isReady: p.isReady,
            solved: p.solved,
        })),
    });
});

// ============== SOCKET.IO ==============

io.on('connection', (socket: Socket) => {
    console.log(`[Socket] Connected: ${socket.id}`);

    // === PRESENCE ===

    socket.on('user:online', (data: { odId: string; userId: string; username: string }) => {
        onlineUsers.set(data.userId, { odId: data.userId, socketId: socket.id, username: data.username });
        broadcastPresence();
    });

    socket.on('user:offline', (data: { odId: string; userId: string }) => {
        onlineUsers.delete(data.userId);
        broadcastPresence();
    });

    // === ROOM MANAGEMENT ===

    socket.on('room:create', (data: {
        userId: string;
        username: string;
        avatarUrl?: string;
        problemSlug?: string;
        problemTitle?: string;
        difficulty?: string;
        duration?: number;
        isHardcore?: boolean;
        entryFee?: number;
        leetCodeRoomId?: string;
        leetCodeRoomUrl?: string;
    }, callback) => {
        const code = generateRoomCode();

        const participant: Participant = {
            odId: data.userId,
            userId: data.userId,
            socketId: socket.id,
            username: data.username,
            avatarUrl: data.avatarUrl,
            isReady: true,
            solved: false,
        };

        const room: Room = {
            code,
            hostId: data.userId,
            status: 'waiting',
            problemSlug: data.problemSlug || '',
            problemTitle: data.problemTitle || '',
            difficulty: data.difficulty || 'Medium',
            duration: data.duration || 30,
            isHardcore: data.isHardcore || false,
            entryFee: data.entryFee || 0,
            leetCodeRoomId: data.leetCodeRoomId,
            leetCodeRoomUrl: data.leetCodeRoomUrl,
            participants: new Map([[data.userId, participant]]),
            chat: [],
            problemSuggestions: new Map(),
            problemLocked: false,
        };

        rooms.set(code, room);
        socket.join(code);

        const systemMsg: ChatMessage = {
            id: `sys-${Date.now()}`,
            odId: 'system',
            userId: 'system',
            username: 'System',
            message: `${data.username} created the room`,
            timestamp: new Date().toISOString(),
            type: 'system',
        };
        room.chat.push(systemMsg);

        callback({ success: true, room: serializeRoom(room) });
    });

    socket.on('room:join', (data: {
        roomCode: string;
        userId: string;
        username: string;
        avatarUrl?: string;
    }, callback) => {
        const code = data.roomCode.toUpperCase();
        const room = rooms.get(code);

        if (!room) return callback({ success: false, error: 'Room not found' });
        if (room.status !== 'waiting') return callback({ success: false, error: 'Battle already started' });
        if (room.participants.size >= 4) return callback({ success: false, error: 'Room is full' });

        if (room.participants.has(data.userId)) {
            return callback({
                success: true,
                room: serializeRoom(room)
            });
        }

        const participant: Participant = {
            odId: data.userId,
            userId: data.userId,
            socketId: socket.id,
            username: data.username,
            avatarUrl: data.avatarUrl,
            isReady: false,
            solved: false,
        };

        room.participants.set(data.userId, participant);
        socket.join(code);

        socket.to(code).emit('room:participant-joined', {
            odId: data.userId,
            userId: data.userId,
            username: data.username,
            avatarUrl: data.avatarUrl,
        });

        const systemMsg: ChatMessage = {
            id: `sys-${Date.now()}`,
            odId: 'system',
            userId: 'system',
            username: 'System',
            message: `${data.username} joined the room`,
            timestamp: new Date().toISOString(),
            type: 'system',
        };
        room.chat.push(systemMsg);
        io.to(code).emit('room:chat-message', systemMsg);

        callback({
            success: true,
            room: serializeRoom(room)
        });
    });

    socket.on('room:ready', (data: { roomCode: string; userId: string; isReady: boolean }) => {
        const room = rooms.get(data.roomCode);
        if (!room) return;

        const participant = room.participants.get(data.userId);
        if (participant) {
            participant.isReady = data.isReady;
            io.to(data.roomCode).emit('room:participant-updated', { userId: data.userId, isReady: data.isReady });
        }
    });

    socket.on('room:start', (data: { roomCode: string; hostId: string }, callback) => {
        const room = rooms.get(data.roomCode);
        if (!room) return callback?.({ success: false, error: 'Room not found' });
        if (room.hostId !== data.hostId) return callback?.({ success: false, error: 'Only host can start' });

        const allReady = Array.from(room.participants.values()).every(p => p.isReady);
        if (!allReady) return callback?.({ success: false, error: 'Not everyone is ready' });

        room.status = 'starting';
        io.to(data.roomCode).emit('room:starting', { countdown: 3 });

        setTimeout(() => {
            room.status = 'in_progress';
            room.startTime = Date.now();
            io.to(data.roomCode).emit('room:started', {
                problemSlug: room.problemSlug,
                problemTitle: room.problemTitle,
                leetCodeRoomUrl: room.leetCodeRoomUrl,
                startTime: room.startTime,
                duration: room.duration,
            });
        }, 3000);

        callback?.({ success: true });
    });

    socket.on('room:solved', (data: { roomCode: string; userId: string; solveTime: number }) => {
        const room = rooms.get(data.roomCode);
        if (!room || room.status !== 'in_progress') return;

        const participant = room.participants.get(data.userId);
        if (participant && !participant.solved) {
            participant.solved = true;
            participant.solveTime = data.solveTime;

            io.to(data.roomCode).emit('room:participant-solved', {
                userId: data.userId,
                username: participant.username,
                solveTime: data.solveTime,
            });

            // First to solve wins
            room.status = 'finished';
            const rankings = Array.from(room.participants.values())
                .sort((a, b) => {
                    if (a.solved !== b.solved) return a.solved ? -1 : 1;
                    return (a.solveTime || Infinity) - (b.solveTime || Infinity);
                });

            io.to(data.roomCode).emit('room:finished', { rankings, winnerId: data.userId });
        }
    });

    socket.on('room:chat', (data: { roomCode: string; userId: string; username: string; message: string }) => {
        const room = rooms.get(data.roomCode);
        if (!room) return;

        const chatMessage: ChatMessage = {
            id: `msg-${Date.now()}-${socket.id}`,
            odId: data.userId,
            userId: data.userId,
            username: data.username,
            message: data.message,
            timestamp: new Date().toISOString(),
            type: 'message',
        };

        room.chat.push(chatMessage);
        io.to(data.roomCode).emit('room:chat-message', chatMessage);
    });

    // === PROBLEM VOTING ===

    socket.on('room:suggest-problem', (data: {
        roomCode: string;
        userId: string;
        username: string;
        url: string;
        problemSlug: string;
        problemTitle: string;
        difficulty: 'Easy' | 'Medium' | 'Hard' | 'Unknown';
    }, callback) => {
        const room = rooms.get(data.roomCode);
        if (!room) return callback?.({ success: false, error: 'Room not found' });
        if (room.problemLocked) return callback?.({ success: false, error: 'Problem already locked' });
        if (room.status !== 'waiting') return callback?.({ success: false, error: 'Battle already started' });

        // Check if this problem was already suggested
        const existingSuggestion = Array.from(room.problemSuggestions.values())
            .find(s => s.problemSlug === data.problemSlug);
        if (existingSuggestion) {
            return callback?.({ success: false, error: 'This problem was already suggested' });
        }

        const suggestion: ProblemSuggestion = {
            id: `sug-${Date.now()}-${data.userId}`,
            url: data.url,
            problemSlug: data.problemSlug,
            problemTitle: data.problemTitle,
            difficulty: data.difficulty,
            submittedBy: data.userId,
            submittedByUsername: data.username,
            votes: new Set([data.userId]), // Auto-vote for your own suggestion
        };

        room.problemSuggestions.set(suggestion.id, suggestion);

        // Broadcast to all participants
        io.to(data.roomCode).emit('room:problem-suggested', {
            ...suggestion,
            votes: Array.from(suggestion.votes),
            voteCount: suggestion.votes.size,
        });

        callback?.({ success: true, suggestion: { ...suggestion, votes: Array.from(suggestion.votes) } });
    });

    socket.on('room:vote-problem', (data: {
        roomCode: string;
        userId: string;
        suggestionId: string;
    }, callback) => {
        const room = rooms.get(data.roomCode);
        if (!room) return callback?.({ success: false, error: 'Room not found' });
        if (room.problemLocked) return callback?.({ success: false, error: 'Problem already locked' });

        // Remove vote from any previous suggestion
        room.problemSuggestions.forEach(s => s.votes.delete(data.userId));

        // Add vote to selected suggestion
        const suggestion = room.problemSuggestions.get(data.suggestionId);
        if (!suggestion) return callback?.({ success: false, error: 'Suggestion not found' });

        suggestion.votes.add(data.userId);

        // Broadcast vote update to all
        io.to(data.roomCode).emit('room:vote-updated', {
            suggestionId: data.suggestionId,
            votes: Array.from(suggestion.votes),
            voteCount: suggestion.votes.size,
            voterId: data.userId,
        });

        callback?.({ success: true });
    });

    socket.on('room:lock-problem', (data: {
        roomCode: string;
        hostId: string;
    }, callback) => {
        const room = rooms.get(data.roomCode);
        if (!room) return callback?.({ success: false, error: 'Room not found' });
        if (room.hostId !== data.hostId) return callback?.({ success: false, error: 'Only host can lock problem' });
        if (room.problemLocked) return callback?.({ success: false, error: 'Already locked' });

        // Find suggestion with most votes
        const suggestions = Array.from(room.problemSuggestions.values());
        if (suggestions.length === 0) {
            return callback?.({ success: false, error: 'No problems suggested yet' });
        }

        const winningProblem = suggestions.reduce((best, current) =>
            current.votes.size > best.votes.size ? current : best
        );

        // Lock the problem
        room.problemLocked = true;
        room.problemSlug = winningProblem.problemSlug;
        room.problemTitle = winningProblem.problemTitle;
        room.difficulty = winningProblem.difficulty;
        room.leetCodeRoomUrl = winningProblem.url;
        const maxVotes = winningProblem.votes.size;

        // Broadcast to all
        io.to(data.roomCode).emit('room:problem-locked', {
            problemSlug: room.problemSlug,
            problemTitle: room.problemTitle,
            difficulty: room.difficulty,
            leetCodeRoomUrl: room.leetCodeRoomUrl,
            voteCount: maxVotes,
        });

        const systemMsg: ChatMessage = {
            id: `sys-${Date.now()}`,
            odId: 'system',
            userId: 'system',
            username: 'System',
            message: `Problem locked: ${room.problemTitle || room.problemSlug} 🎯`,
            timestamp: new Date().toISOString(),
            type: 'system',
        };
        room.chat.push(systemMsg);
        io.to(data.roomCode).emit('room:chat-message', systemMsg);

        callback?.({ success: true, problem: { problemSlug: room.problemSlug, problemTitle: room.problemTitle } });
    });

    socket.on('invite:send', (data: { toUserId: string; roomCode: string; fromUsername?: string }) => {
        const target = onlineUsers.get(data.toUserId);
        if (target) {
            io.to(target.socketId).emit('invite:received', {
                roomCode: data.roomCode,
                from: { username: data.fromUsername },
                message: `${data.fromUsername} invited you to battle!`,
            });
        }
    });

    socket.on('room:leave', (data: { roomCode: string; userId: string; username: string }) => {
        const room = rooms.get(data.roomCode);
        if (!room) return;

        room.participants.delete(data.userId);
        socket.leave(data.roomCode);

        const systemMsg: ChatMessage = {
            id: `sys-${Date.now()}`,
            odId: 'system',
            userId: 'system',
            username: 'System',
            message: `${data.username} left the room`,
            timestamp: new Date().toISOString(),
            type: 'system',
        };
        room.chat.push(systemMsg);
        io.to(data.roomCode).emit('room:chat-message', systemMsg);
        io.to(data.roomCode).emit('room:participant-left', { userId: data.userId });

        if (room.participants.size === 0) {
            rooms.delete(data.roomCode);
        } else if (data.userId === room.hostId) {
            const newHost = room.participants.values().next().value;
            if (newHost) {
                room.hostId = newHost.userId;
                io.to(data.roomCode).emit('room:host-changed', { newHostId: newHost.userId });
            }
        }
    });

    socket.on('disconnect', () => {
        console.log(`[Socket] Disconnected: ${socket.id}`);

        onlineUsers.forEach((user, odId) => {
            if (user.socketId === socket.id) {
                onlineUsers.delete(odId);
            }
        });
        broadcastPresence();

        rooms.forEach((room, code) => {
            room.participants.forEach((participant, odId) => {
                if (participant.socketId === socket.id) {
                    room.participants.delete(odId);
                    io.to(code).emit('room:participant-left', { userId: odId });
                    if (room.participants.size === 0) {
                        rooms.delete(code);
                    }
                }
            });
        });
    });
});

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
    console.log(`🚀 Dojo Server running on port ${PORT}`);
});
