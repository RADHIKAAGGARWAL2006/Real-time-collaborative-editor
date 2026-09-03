// File: client/src/Editor.jsx

import React, { useEffect, useRef } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { schema } from 'prosemirror-schema-basic';
import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { ySyncPlugin, yCursorPlugin, yUndoPlugin } from 'y-prosemirror';
import 'prosemirror-view/style/prosemirror.css';

const cursorColors = ['#ff9900', '#00bbaa', '#cc00ff', '#ff3333', '#0066ff'];

const Editor = () => {
  const editorRef = useRef(null);
  // 1. ADD THIS: A new ref to hold the active editor view
  const viewRef = useRef(null); 

  useEffect(() => {
    const ydoc = new Y.Doc();
    const provider = new WebsocketProvider(
      'ws://localhost:1234', 
      'my-room-name', 
      ydoc
    );

    const myColor = cursorColors[Math.floor(Math.random() * cursorColors.length)];
    const myName = `Guest ${Math.floor(Math.random() * 100)}`;

    provider.awareness.setLocalStateField('user', {
      name: myName,
      color: myColor,
      colorLight: myColor + '33'
    });

    const type = ydoc.getXmlFragment('prosemirror');

    const state = EditorState.create({
      schema,
      plugins: [
        ySyncPlugin(type),
        yCursorPlugin(provider.awareness),
        yUndoPlugin()
      ]
    });

    const view = new EditorView(editorRef.current, {
      state
    });
    
    // 2. ADD THIS: Save the view to our ref so the button can read it
    viewRef.current = view;

    return () => {
      provider.disconnect();
      view.destroy();
      ydoc.destroy();
    };
  }, []);

  // 3. ADD THIS: The Export Function
  const handleExport = () => {
    if (viewRef.current) {
      // ProseMirror has a built-in method to convert the complex state into standard JSON
      const documentJSON = viewRef.current.state.doc.toJSON();
      
      console.log("💾 Exported Document JSON:", documentJSON);
      alert("Check your browser console to see the exported JSON data!");
      
      // In a real MERN app, this is exactly where you would do:
      // axios.post('/api/save-blog-post', { content: documentJSON })
    }
  };

  return (
    <div>
      {/* 4. ADD THIS: The Export Button */}
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

      <div className="editor-container" style={{ 
        border: '2px solid #ccc', 
        borderRadius: '8px', 
        padding: '20px',
        minHeight: '400px',
        backgroundColor: '#fff',
        color: '#000'
      }}>
        <div ref={editorRef} />
      </div>
    </div>
  );
};

export default Editor;