import "dotenv/config";
import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import { sequelize } from './models/index.ts';
import http from 'http';
import { Server } from 'socket.io';

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: true,
        credentials: true
    }
});

const PORT = process.env.PORT || 5001;

// Middleware
const corsOptions = {
    origin: "*", // Explicitly allow all for development testing
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "8mb" }));

import authRoutes from './routes/authRoutes.ts';
import petRoutes from './routes/petRoutes.ts';
import communityRoutes from './routes/communityRoutes.ts';
import adminRoutes from './routes/adminRoutes.ts';
import healthRoutes from './routes/healthRoutes.ts';
import appointmentRoutes from './routes/appointmentRoutes.ts';
import reminderRoutes from './routes/reminderRoutes.ts';

// Routes
app.get('/', (req: Request, res: Response) => {
    res.send('Hello, pawshub backend is running!');
});

app.use('/api/auth', authRoutes);
app.use('/api/pets', petRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/vets', appointmentRoutes); // getVets lives here
app.use('/api/community', communityRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/admin', adminRoutes);

// Test DB Connection and Start Server
const startServer = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected successfully.');
        
        // Auto-create/sync tables based on models - Safe mode (Persistence enabled)
        await sequelize.sync({ alter: true }); 
        console.log('Database schema synchronized (Persistent Mode).');

        httpServer.listen(Number(PORT), "0.0.0.0", () => {
            console.log(`🚀 PawsHub API Live on Network -> http://0.0.0.0:${PORT}`);
        });
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
};

startServer();
