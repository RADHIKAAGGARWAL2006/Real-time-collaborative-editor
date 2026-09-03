// File: server/server.js

const http = require('http');
const WebSocket = require('ws');
const { setupWSConnection, setPersistence } = require('y-websocket/bin/utils');

// 1. IMPORT OUR DATABASE TOOLS
const Y = require('yjs');
const { LeveldbPersistence } = require('y-leveldb');

// 2. INITIALIZE THE NOSQL DATABASE
// This will automatically create a folder named 'database-storage' 
// in your server folder to hold the binary files.
const ldb = new LeveldbPersistence('./database-storage');

// 3. TELL YJS TO USE THIS DATABASE
setPersistence({
  bindState: async (docName, ydoc) => {
    // A. When a user joins a room, load the document's history from the database
    const persistedYdoc = await ldb.getYDoc(docName);
    
    // B. Apply that history to the active document in the server's memory
    const newUpdates = Y.encodeStateAsUpdate(ydoc);
    ldb.storeUpdate(docName, newUpdates);
    Y.applyUpdate(ydoc, Y.encodeStateAsUpdate(persistedYdoc));
    
    // C. Whenever ANY user types a letter, instantly append that binary update to the database
    ydoc.on('update', async (update) => {
      ldb.storeUpdate(docName, update);
    });
  },
  writeState: async (docName, ydoc) => {
    // Required function for when the document is closed
    return Promise.resolve();
  }
});

// 4. CREATE THE BASIC WEB SERVER
const server = http.createServer((request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/plain' });
  response.end('Yjs WebSocket Server with Persistence is running!');
});

// 5. ATTACH WEBSOCKETS TO THE SERVER
const wss = new WebSocket.Server({ server });

// 6. LISTEN FOR CONNECTIONS
wss.on('connection', (ws, req) => {
  console.log('🟢 Client connected!');
  setupWSConnection(ws, req);
});

// 7. START THE SERVER
const PORT = 1234;
server.listen(PORT, () => {
  console.log(`🚀 Server listening on ws://localhost:${PORT}`);
});