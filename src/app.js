const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { corsConfig, rateLimitConfig } = require('./config/security');

const app = express();

// Middlewares globaux
app.use(helmet());
app.use(cors(corsConfig));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(rateLimit(rateLimitConfig));


// Routes
const authRoutes = require('./routes/auth.route');
const accountRoutes = require('./routes/account.route');
const generationrapportRoutes = require('./routes/professionnel/generationrapport.route');
const gestionclientRoutes = require('./routes/professionnel/gestionclient.route');

// Serveur fichiers statiques pour les uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Définition des routes
app.use('/sign/auth', authRoutes);
app.use('/sign/account', accountRoutes);
app.use('/sign/professionnel/document', generationrapportRoutes);
app.use('/sign/professionnel/client', gestionclientRoutes);

module.exports = app;
