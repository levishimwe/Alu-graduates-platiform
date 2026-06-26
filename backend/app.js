const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const path = require('path');

require('dotenv').config();

const { connectMongo } = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const profileRoutes = require('./routes/profiles');
const messageRoutes = require('./routes/messages');
const userRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');
const emailRoutes = require('./routes/email');

const app = express();
const PORT = process.env.PORT || 5000;

// IMPORTANT: Trust proxy for Render deployment
app.set('trust proxy', true);

const initDb = async () => {
  try {
    const ok = await connectMongo();
    if (!ok) {
      throw new Error('MongoDB connection failed');
    }

    console.log('✅ Using MongoDB as primary datastore');
    return true;
  } catch (err) {
    console.error('❌ DB Error: ', err.message);
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
    return false;
  }
};

initDb();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://172.26.10.146:3000',
    'http://0.0.0.0:3000',
    process.env.CLIENT_URL || 'http://localhost:3000',

  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting (now with trust proxy set)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },

});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware - FIXED: Only log in development
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Static file serving

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/email', emailRoutes);

// API info endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'ALU Platform API - Google Drive Integration',
    version: '2.0.0',
    features: ['Google Drive image links', 'YouTube video links', 'Google email validation', 'Profile management'],
    endpoints: {
      health: '/api/health',
      auth: {
        register: 'POST /api/auth/register (Google emails only)',
        login: 'POST /api/auth/login',
        logout: 'POST /api/auth/logout',
        profile: 'GET /api/auth/profile'
      },
      projects: {
        create: 'POST /api/projects',
        list: 'GET /api/projects',
        get: 'GET /api/projects/:id',
        update: 'PUT /api/projects/:id',
        delete: 'DELETE /api/projects/:id'
      },
      profiles: {
        graduate: {
          get: 'GET /api/profiles/graduate/:id',
          update: 'PUT /api/profiles/graduate'
        },
        investor: {
          get: 'GET /api/profiles/investor/:id',
          update: 'PUT /api/profiles/investor'
        }
      },
      messages: {
        send: 'POST /api/messages',
        list: 'GET /api/messages',
        get: 'GET /api/messages/:id'
      }
    },
    status: 'operational'
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: 'connected',
    features: {
      googleDriveIntegration: true,
      youTubeIntegration: true,
      googleEmailValidation: true,
      profileManagement: true,
      projectManagement: true,
      messaging: true
    }
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'ALU Platform API - Google Drive Integration',
    version: '2.0.0',
    health: '/api/health',
    endpoints: {
      auth: '/api/auth',
      projects: '/api/projects',
      profiles: '/api/profiles',
      messages: '/api/messages',
      users: '/api/users',
      admin: '/api/admin',
      health: '/api/health'
    },

    requirements: {
      email: 'Google emails only (@gmail.com, @googlemail.com)',
      images: 'Google Drive links only',
      videos: 'YouTube links only',
      documents: 'Google Drive links only',
      university: 'African Leadership University only',
      majors: 'BSE, BEL, IBT only'
    },
    databaseSchema: {
      projects: {
        supportedFields: [
          'id', 'title', 'description', 'category', 'impactArea',
          'technologies', 'images', 'videos', 'documents', 
          'status', 'fundingGoal', 'currentFunding', 
          'demoUrl', 'repoUrl', 'featured', 'graduateId'
        ]
      }
    }
  });
});

// 404 handler for API routes

app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Global error handler
app.use((error, req, res, next) => {

  console.error('Server Error:', error);

  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
  });
});

// Export the app for use by server.js
module.exports = app;
