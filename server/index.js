const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const CLIENT_DIST = path.join(__dirname, '..', 'client', 'dist');
const indexHtmlPath = path.join(CLIENT_DIST, 'index.html');
const serveFrontend =
    process.env.NODE_ENV === 'production' && fs.existsSync(indexHtmlPath);

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use('/uploads', express.static('uploads'));

const authRoute = require('./routes/auth');
const propertyRoute = require('./routes/properties');
const adminRoute = require('./routes/admin');
const logsRoute = require('./routes/logs');
const usersRoute = require('./routes/users');
const aiRoute = require('./routes/ai');
const geoRoute = require('./routes/geo');

app.use('/api/auth', authRoute);
app.use('/api/properties', propertyRoute);
app.use('/api/admin', adminRoute);
app.use('/api/logs', logsRoute);
app.use('/api/users', usersRoute);
app.use('/api/ai', aiRoute);
app.use('/api/geo', geoRoute);

/** Dev / API-only: acknowledge root. Production with built SPA skips this (React owns `/`). */
if (!serveFrontend) {
    app.get('/', (req, res) => {
        res.send('Real Estate Marketplace API — from the server folder run `npm run dev` for API + Vite, or NODE_ENV=production after building the client (`npm run build` in ../client).');
    });
}

if (serveFrontend) {
    app.use(express.static(CLIENT_DIST));
    /** Deep links (/properties/...) — SPA without catching /api/* or /uploads/* */
    app.use((req, res, next) => {
        if (req.method !== 'GET' || req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
            return next();
        }
        res.sendFile(indexHtmlPath, (err) => next(err));
    });
}

// Database Connection — Supabase client is initialized per route modules

const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    if (serveFrontend) {
        console.log(`[server] Serving SPA from ${CLIENT_DIST}`);
    }
    if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET?.trim()) {
        console.warn(
            '[server] JWT_SECRET is unset in NODE_ENV=production — set a strong secret before exposing this API publicly.'
        );
    }
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`[server] Port ${PORT} already in use. Set PORT in server/.env to another port.`);
        process.exit(1);
    }
    throw err;
});
