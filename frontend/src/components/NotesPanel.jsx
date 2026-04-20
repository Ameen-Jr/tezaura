import React, { useState, useEffect, useRef } from 'react';
import API_BASE from '../config';

const NotesPanel = () => {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const panelRef = useRef(null);

  const fetchNotes = async () => {
    try {
      const res = await fetch(`${API_BASE}/notes`);
      if (res.ok) setNotes(await res.json());
    } catch { }
  };

  useEffect(() => { fetchNotes(); }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const addNote = async () => {
    const content = input.trim();
    if (!content) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (res.ok) {
        setInput('');
        fetchNotes();
      }
    } catch { }
    setLoading(false);
  };

  const deleteNote = async (id) => {
    try {
      await fetch(`${API_BASE}/notes/${id}`, { method: 'DELETE' });
      setNotes(prev => prev.filter(n => n.id !== id));
    } catch { }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addNote(); }
  };

  return (
    <div ref={panelRef} style={{ position: 'relative' }}>
      {/* Trigger Button */}
      <button
        onClick={() => setOpen(v => !v)}
        title="Quick Notes"
        style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '6px 14px', borderRadius: '20px',
          background: open ? '#1e293b' : 'white',
          color: open ? 'white' : '#374151',
          border: '1px solid #E5E7EB',
          fontSize: '13px', fontWeight: '700', cursor: 'pointer',
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
          transition: 'all 0.2s',
        }}
      >
        <span style={{ fontSize: '15px' }}>📋</span>
        Notes
        {notes.length > 0 && (
          <span style={{
            background: '#6366f1', color: 'white',
            borderRadius: '10px', padding: '1px 7px',
            fontSize: '11px', fontWeight: '800', lineHeight: '1.5',
          }}>{notes.length}</span>
        )}
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 10px)', right: 0,
          width: '340px', background: 'white',
          borderRadius: '16px', zIndex: 2000,
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          border: '1px solid #e5e7eb',
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            padding: '14px 18px', background: '#1e293b',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ color: 'white', fontWeight: '800', fontSize: '14px' }}>📋 Quick Notes</div>
            <div style={{ color: '#94a3b8', fontSize: '12px' }}>{notes.length} note{notes.length !== 1 ? 's' : ''}</div>
          </div>

          {/* Add Input */}
          <div style={{ padding: '12px', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: '8px' }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Add a note… (Enter to save)"
              rows={2}
              style={{
                flex: 1, padding: '8px 12px', borderRadius: '10px',
                border: '1px solid #e2e8f0', fontSize: '13px',
                resize: 'none', outline: 'none', fontFamily: 'inherit',
                color: '#1e293b', background: '#f8fafc',
              }}
            />
            <button
              onClick={addNote}
              disabled={loading || !input.trim()}
              style={{
                padding: '8px 14px', background: '#6366f1', color: 'white',
                border: 'none', borderRadius: '10px', cursor: 'pointer',
                fontWeight: '700', fontSize: '13px', alignSelf: 'stretch',
                opacity: !input.trim() ? 0.5 : 1, transition: 'opacity 0.2s',
              }}
            >+ Add</button>
          </div>

          {/* Notes List */}
          <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
            {notes.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                No notes yet. Add one above.
              </div>
            ) : (
              notes.map(note => (
                <div key={note.id} style={{
                  padding: '12px 18px', borderBottom: '1px solid #f8fafc',
                  display: 'flex', alignItems: 'flex-start', gap: '10px',
                  transition: 'background 0.15s',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.background = 'white'}
                >
                  <div style={{
                    width: '6px', height: '6px', borderRadius: '50%',
                    background: '#6366f1', flexShrink: 0, marginTop: '6px',
                  }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', color: '#1e293b', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                      {note.content}
                    </div>
                    {note.created_at && (
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '3px' }}>
                        {new Date(note.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => deleteNote(note.id)}
                    title="Remove"
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: '#94a3b8', fontSize: '16px', padding: '2px 4px',
                      borderRadius: '6px', flexShrink: 0, lineHeight: 1,
                      transition: 'color 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                    onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
                  >×</button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotesPanel;
