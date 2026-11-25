import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { testConnection } from './config/db.js';

// Route imports
import healthRoutes from './routes/health.js';
import authRoutes from './routes/auth.js';
import donorRoutes from './routes/donors.js';
import requestRoutes from './routes/requests.js';
import inventoryRoutes from './routes/inventory.js';
import bloodBankRoutes from './routes/bloodbanks.js';
import hospitalRoutes from './routes/hospitals.js';
import adminRoutes from './routes/admin.js';
import analyticsRoutes from './routes/analytics.js';
import notificationRoutes from './routes/notifications.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Core API Routes
app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/donors', donorRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/bloodbanks', bloodBankRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);

// Root greeting
app.get('/', (req, res) => {
    res.json({
        name: 'CELLS — Blood Donation & Emergency Management Network API',
        version: '1.0.0',
        endpoints: {
            health: '/api/health',
            auth: '/api/auth',
            donors: '/api/donors',
            requests: '/api/requests',
            inventory: '/api/inventory',
            bloodbanks: '/api/bloodbanks',
            hospitals: '/api/hospitals',
            admin: '/api/admin',
            analytics: '/api/analytics/dashboard',
            notifications: '/api/notifications'
        }
    });
});

// Central 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `API endpoint '${req.originalUrl}' not found.`
    });
});

// Central error handler
app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error'
    });
});

app.listen(PORT, async () => {
    console.log(`=========================================`);
    console.log(` CELLS API Server listening on port ${PORT}`);
    console.log(` Health check: http://localhost:${PORT}/api/health`);
    console.log(`=========================================`);
    await testConnection();
});

export default app;
