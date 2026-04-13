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
const NODE_ENV = process.env.NODE_ENV || "development";

// Fail fast if JWT secret is missing in production
if (NODE_ENV === "production" && !process.env.JWT_SECRET) {
    console.error("FATAL: JWT_SECRET environment variable is required in production.");
    process.exit(1);
}

// Fail fast if S3 credentials are missing in production
if (NODE_ENV === "production") {
    const required = ["AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_S3_BUCKET"];
    const missing = required.filter(k => !process.env[k]);
    if (missing.length > 0) {
        console.error(`FATAL: Missing required S3 environment variables: ${missing.join(", ")}`);
        process.exit(1);
    }
}

// Middleware
const allowedOrigins = NODE_ENV === "production"
    ? (process.env.CORS_ORIGINS || "").split(",").map(o => o.trim()).filter(Boolean)
    : ["*"];

const corsOptions = {
    origin: NODE_ENV === "production"
        ? (origin: string | undefined, cb: (err: Error | null, allow?: boolean) => void) => {
            if (!origin || allowedOrigins.includes(origin)) {
                cb(null, true);
            } else {
                cb(new Error(`CORS: Origin '${origin}' not allowed`));
            }
          }
        : "*",
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
import savedVetsRoutes from './routes/savedVetsRoutes.ts';
import notificationRoutes from './routes/notificationRoutes.ts';
import uploadRoutes from './routes/uploadRoutes.ts';
import adoptionRoutes from './routes/adoptionRoutes.ts';
import vetReviewRoutes from './routes/vetReviewRoutes.ts';

// Routes
app.get('/', (req: Request, res: Response) => {
    res.send('Hello, furrcircle backend is running!');
});

app.use('/api/auth', authRoutes);
app.use('/api/pets', petRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/vets', appointmentRoutes); // getVets lives here
app.use('/api/community', communityRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/saved-vets', savedVetsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/adoptions', adoptionRoutes);
app.use('/api/vets/:vetId/reviews', vetReviewRoutes);

// Test DB Connection and Start Server
const startServer = async (attempt = 1) => {
    try {
        await sequelize.authenticate();
        console.log('Database connected successfully.');
        
        // Auto-create/sync tables based on models - Safe mode (Persistence enabled)
        await sequelize.sync({ alter: true }); 
        console.log('Database schema synchronized (Persistent Mode).');

        httpServer.listen(Number(PORT), "0.0.0.0", () => {
            console.log(`🚀 FurrCircle API Live on Network -> http://0.0.0.0:${PORT}`);
        });
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        const retryDelayMs = Math.min(30000, 5000 * attempt);
        console.log(`Retrying database connection in ${Math.round(retryDelayMs / 1000)}s...`);
        setTimeout(() => startServer(attempt + 1), retryDelayMs);
    }
};

startServer();
