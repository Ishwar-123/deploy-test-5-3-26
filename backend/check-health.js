import http from 'http';

const checkHealth = () => {
    http.get('http://localhost:5000/api/health', (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
            console.log('Health check response:', data);
            process.exit(0);
        });
    }).on('error', (err) => {
        console.error('Health check failed:', err.message);
        process.exit(1);
    });
};

checkHealth();
