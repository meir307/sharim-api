const app = require('./app');
const appCache = require('./services/common/appCache');
require('./services/common/sharingTable');

const DEFAULT_PORT = Number(process.env.PORT) || 3001;

function startServer(port) {
    const server = app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });

    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            const nextPort = port + 1;
            console.warn(`Port ${port} is in use, trying ${nextPort}...`);
            setTimeout(() => startServer(nextPort), 200);
            return;
        }

        console.error('HTTP server error:', err);
        process.exit(1);
    });
}

// Load cache and then start server
appCache.load()
    .then(() => {
        console.log('Cache loaded successfully');
        startServer(DEFAULT_PORT);
    })
    .catch(err => {
        console.error('Failed to load cache:', err);
        process.exit(1);
    });
    