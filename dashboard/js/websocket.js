const WebSocket = require('ws');
const https = require('https');
const fs = require('fs');
const path = require('path');

// SSL certificate configuration
const options = {
    cert: fs.readFileSync(path.join(__dirname, '../certs/cert.pem')),
    key: fs.readFileSync(path.join(__dirname, '../certs/key.pem'))
};

const server = https.createServer(options);
const wss = new WebSocket.Server({ server });

const studentsFilePath = path.join(__dirname, 'students.json');
const transfersFilePath = path.join(__dirname, 'transfers.json');

let students = loadData(studentsFilePath, [
    { id: 1, name: 'John Doe', date: '01-10-2021', status: 'completed', img: 'img/people.png' },
    { id: 2, name: 'Jane Smith', date: '01-10-2021', status: 'pending', img: 'img/people.png' },
]);

let transfers = loadData(transfersFilePath, [
    { id: 1, name: 'Mary Achieng', grade: 'Grade 3', completed: true },
    { id: 2, name: 'John Alan', grade: 'Grade 6', completed: true },
    { id: 3, name: 'Peter Oloo', grade: 'Grade 4', completed: false },
]);

const wsUrl = 'ws://kanyadet-school.web.app:8080';  // Change to ws:// instead of wss://

wss.on('connection', (ws, req) => {
    console.log(`New client connected from ${req.socket.remoteAddress}`);

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            if (data.type === 'update_students') {
                students = data.students;
                saveData(studentsFilePath, students);
                broadcast({ type: 'update_students', students });
            }
            if (data.type === 'update_transfers') {
                transfers = data.transfers;
                saveData(transfersFilePath, transfers);
                broadcast({ type: 'update_transfers', transfers });
            }
        } catch (error) {
            console.error('Error processing message:', error);
        }
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });

    // Send initial data
    ws.send(JSON.stringify({ type: 'update_students', students }));
    ws.send(JSON.stringify({ type: 'update_transfers', transfers }));
});

// Error handling for the HTTPS server
server.on('error', (error) => {
    console.error('HTTPS Server Error:', error);
});

function broadcast(data) {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}

function loadData(filePath, defaultData) {
    if (fs.existsSync(filePath)) {
        const rawData = fs.readFileSync(filePath);
        return JSON.parse(rawData);
    }
    return defaultData;
}

function saveData(filePath, data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log(`Secure WebSocket server running on port ${PORT}`);
    console.log(`WSS URL: wss://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    server.close(() => {
        console.log('Server terminated');
        process.exit(0);
    });
});
