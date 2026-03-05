import { Server } from 'socket.io';

let io;

/**
 * Initialize Socket.io
 * @param {Object} server - HTTP Server instance
 */
export const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: [process.env.FRONTEND_URL, 'http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'],
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
            credentials: true
        }
    });

    io.on('connection', (socket) => {
        // console.log('🔌 New socket connection:', socket.id);

        // User joins a room unique to their ID
        socket.on('join', (userId) => {
            if (userId) {
                const roomName = `user_${userId}`;
                socket.join(roomName);
                // console.log(`👤 User ${userId} joined room: ${roomName}`);
            }
        });

        socket.on('disconnect', () => {
            // console.log('🔌 Socket disconnected:', socket.id);
        });
    });

    return io;
};

/**
 * Get Socket.io instance
 */
export const getIO = () => {
    if (!io) {
        // Fallback for cases where it's called before server starts, 
        // though it shouldn't happen in this architecture
        return null;
    }
    return io;
};

/**
 * Emit logout event to all devices of a user
 * @param {String|Number} userId - User ID
 */
export const emitLogout = (userId) => {
    if (io) {
        io.to(`user_${userId}`).emit('force-logout', {
            success: false,
            message: 'Your session has expired because you logged in on another device.',
            code: 'SESSION_FORCE_LOGOUT'
        });
    }
};
