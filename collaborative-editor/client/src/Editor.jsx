// File: client/src/Editor.jsx

// 1. IMPORT THE TOOLS
import React, { useEffect, useRef } from 'react';
import * as Y from 'yjs'; // The math engine to prevent typing conflicts
import { WebsocketProvider } from 'y-websocket'; // Connects to our Node.js server
import { schema } from 'prosemirror-schema-basic'; // Basic text rules (paragraphs, bold, etc.)
import { EditorState } from 'prosemirror-state'; // Manages the text box's brain
import { EditorView } from 'prosemirror-view'; // Draws the text box on the screen
import { ySyncPlugin, yCursorPlugin, yUndoPlugin } from 'y-prosemirror'; // Bridges the text box to the math engine
import 'prosemirror-view/style/prosemirror.css'; // Basic styles

// A list of colors for the multiplayer cursors
const cursorColors = ['#ff9900', '#00bbaa', '#cc00ff', '#ff3333', '#0066ff'];

const Editor = () => {
  // 2. SETUP MEMORY
  // editorRef: Tells React exactly where to place the text box on the webpage.
  const editorRef = useRef(null);
  
  // viewRef: Remembers the active text box so our Export button can read from it later.
  const viewRef = useRef(null); 

  // 3. START THE ENGINE (Runs once when the page loads)
  useEffect(() => {
    // A. Create an empty math document in the browser
    const ydoc = new Y.Doc();
    
    // B. Call the server to connect to the room
    const provider = new WebsocketProvider(
      'ws://localhost:1234', 
      'my-room-name', 
      ydoc
    );

    // C. Setup Multiplayer Cursors
    // Pick a random color and name, then broadcast it to everyone else
    const myColor = cursorColors[Math.floor(Math.random() * cursorColors.length)];
    const myName = `Guest ${Math.floor(Math.random() * 100)}`;

    provider.awareness.setLocalStateField('user', {
      name: myName,
      color: myColor,
      colorLight: myColor + '33' // Slight transparency for highlighting
    });

    // D. Build the Smart Text Box
    // Tell the math engine we are using ProseMirror's XML format
    const type = ydoc.getXmlFragment('prosemirror');

    const state = EditorState.create({
      schema,
      plugins: [
        ySyncPlugin(type), // Watches your typing and sends it to the math engine
        yCursorPlugin(provider.awareness), // Draws other people's cursors on your screen
        yUndoPlugin() // Custom Ctrl+Z so you only undo your own typing
      ]
    });

    // E. Draw the text box inside our empty HTML <div>
    const view = new EditorView(editorRef.current, {
      state
    });
    
    // Save a copy of this text box into our memory so the Export button can find it
    viewRef.current = view;

    // F. Cleanup
    // Hang up the phone call and clear the memory if the user closes the tab
    return () => {
      provider.disconnect();
      view.destroy();
      ydoc.destroy();
    };
  }, []); // Empty brackets mean this setup only runs once.

  // 4. THE EXPORT FUNCTION
  // When you click the button, this converts the complicated math into standard data.
  const handleExport = () => {
    // Check if the text box actually exists yet
    if (viewRef.current) {
      // Use ProseMirror's built-in tool to convert the text to clean JSON
      const documentJSON = viewRef.current.state.doc.toJSON();
      
      console.log("💾 Exported Document JSON:", documentJSON);
      alert("Check your browser console to see the exported JSON data!");
      
      // In a full MERN app, you would send this to your Express backend here:
      // axios.post('/api/save-blog-post', { content: documentJSON })
    }
  };

  // 5. DRAW THE WEBPAGE
  return (
    <div>
      {/* The Export Button */}
      <button 
        onClick={handleExport}
        style={{
          marginBottom: '15px',
          padding: '10px 20px',
          backgroundColor: '#0066ff',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          fontWeight: 'bold'
        }}
      >
        Export to JSON
      </button>

      {/* The Container for the Text Box */}
      <div className="editor-container" style={{ 
        border: '2px solid #ccc', 
        borderRadius: '8px', 
        padding: '20px',
        minHeight: '400px',
        backgroundColor: '#fff',
        color: '#000'
      }}>
        {/* ProseMirror will inject the actual typing area right here */}
        <div ref={editorRef} />
      </div>
    </div>
  );
};

export default Editor;