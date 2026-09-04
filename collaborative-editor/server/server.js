// File: server/server.js

//In standard web apps, the server does a lot of thinking (validating data, running logic). In our app, the server is just a dumb switchboard. Its only job is to catch a keystroke from User A and instantly broadcast it to everyone else in the room. We use a library called y-websocket to handle this routing automatically.

// 1. Import the tools we need
const http = require('http'); // Creates a basic web server
const WebSocket = require('ws'); // Creates the open "phone call" connection
const { setupWSConnection, setPersistence } = require('y-websocket/bin/utils');// The pre-built switchboard

// 1. IMPORT OUR DATABASE TOOLS
const Y = require('yjs'); // The math engine that prevents typing conflicts
const { LeveldbPersistence } = require('y-leveldb'); // The local database tool

// 2. INITIALIZE THE NOSQL DATABASE
// This will automatically create a folder named 'database-storage' 
// in your server folder to hold the binary files(to store continous video-log of typings)
const ldb = new LeveldbPersistence('./database-storage');

// 3. TELL SERVER HOW TO SAVE DATA
setPersistence({
  bindState: async (docName, ydoc) => {
    // A. THE PAST: When a user joins the room, load the document's history from the folder
    const persistedYdoc = await ldb.getYDoc(docName);
    
    // B. THE PRESENT: Apply that history to the active document in the server's memory
    const newUpdates = Y.encodeStateAsUpdate(ydoc);
    ldb.storeUpdate(docName, newUpdates);
    Y.applyUpdate(ydoc, Y.encodeStateAsUpdate(persistedYdoc));
    
    // C. THE FUTURE: Whenever ANY user types a new letter, instantly save it to the folder
    ydoc.on('update', async (update) => {
      ldb.storeUpdate(docName, update);
    });
  },
  writeState: async (docName, ydoc) => {
    // A mandatory cleanup function for when the document is closed
    return Promise.resolve();
  }
});

// 4. CREATE A BASIC WEB SERVER
// If someone visits your server link in a normal browser, they just see this welcome text.
const server = http.createServer((request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/plain' });
  response.end('Yjs WebSocket Server with Persistence is running!');
});

// 5. ADD WEBSOCKETS TO THE SERVER
// This upgrades our basic server so it can handle permanent, live connections.
const wss = new WebSocket.Server({ server });

// 6. LISTEN FOR USERS
// When your React app finally connects to this server, this event happens.
wss.on('connection', (ws, req) => {
  console.log('A React client connected to the room!');
  
  // Hand the user's connection over to the automatic switchboard tool.
  // Now, if they type, this tool automatically passes it to everyone else.
  setupWSConnection(ws, req);
});

// 7. TURN THE SERVER ON
// Until you run this in your terminal, the phone lines are dead.
const PORT = 1234;
server.listen(PORT, () => {
  console.log(`Server listening on ws://localhost:${PORT}`);
});