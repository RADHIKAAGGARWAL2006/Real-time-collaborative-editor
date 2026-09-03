// File: client/src/App.jsx

import React from 'react';
import Editor from './Editor';

function App() {
  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', fontFamily: 'system-ui' }}>
      <h1>Multiplayer Text Editor</h1>
      <p style={{ color: '#666', marginBottom: '20px' }}>
        Open this exact same URL in a <b>second browser tab</b> to watch the real-time CRDT sync in action!
      </p>
      
      {/* Load our custom CRDT Editor */}
      <Editor />
    </div>
  );
}

export default App;