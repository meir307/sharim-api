const express = require('express');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes');
const commonRoutes = require('./routes/commonRoutes');
const adminRoutes = require('./routes/adminRoutes');
const songRoutes = require('./routes/songRoutes');
const sharingRoutes = require('./routes/sharingRoutes');
const sessionIdMiddleware = require('./middleware/sessionId');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(sessionIdMiddleware); // Add sessionId middleware here

// Serve uploaded files statically
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/user', userRoutes);
app.use('/api/common', commonRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/song', songRoutes);
app.use('/api/sharing', sharingRoutes);

// Basic route for testing
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to the API' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    
    // Handle multer errors
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File too large. Maximum size is 5MB.' });
    }
    
    if (err.message && err.message.includes('Invalid file type')) {
        return res.status(400).json({ message: err.message });
    }
    
    res.status(500).json({ message: 'Something went wrong!' });
});

module.exports = app;

