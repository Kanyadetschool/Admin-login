// heartbeat-worker.js
// Place this file in the same directory as your HTML

const HEARTBEAT_INTERVAL = 4 * 24 * 60 * 60 * 1000; // 4 days

self.addEventListener('install', (event) => {
    console.log('Heartbeat worker installed');
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('Heartbeat worker activated');
    event.waitUntil(self.clients.claim());
});

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'supabase-heartbeat') {
        event.waitUntil(performBackgroundHeartbeat());
    }
});

async function performBackgroundHeartbeat() {
    try {
        // Notify all clients to perform heartbeat
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
            client.postMessage({ type: 'PERFORM_HEARTBEAT' });
        });
    } catch (error) {
        console.error('Background heartbeat failed:', error);
    }
}