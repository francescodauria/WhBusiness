import React, { useEffect, useRef, useState, useCallback } from 'react';
import { getMessages, sendMessage } from '../api';
import { useContacts } from '../context/ContactsContext';
import styles from './Chat.module.css';

function formatTs(unix) {
  const d = new Date(unix * 1000);
  return d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(unix) {
  const d = new Date(unix * 1000);
  const today     = new Date();
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString())     return 'Oggi';
  if (d.toDateString() === yesterday.toDateString()) return 'Ieri';
  return d.toLocaleDateString('it-IT');
}

function groupByDay(messages) {
  const groups = [];
  let lastDay  = null;
  for (const m of messages) {
    const day = formatDate(m.timestamp);
    if (day !== lastDay) { groups.push({ type: 'divider', label: day }); lastDay = day; }
    groups.push(m);
  }
  return groups;
}

const STATUS_ICON = { sent: '✓', delivered: '✓✓', read: '✓✓', failed: '✗' };

export default function ChatPanel() {
  const { activeContact, refresh: refreshContacts } = useContacts();
  const [messages,  setMessages]  = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [sending,   setSending]   = useState(false);
  const [text,      setText]      = useState('');
  const [error,     setError]     = useState(null);
  const bottomRef = useRef(null);

  const loadMessages = useCallback(async () => {
    if (!activeContact) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getMessages(activeContact.id, 50);
      setMessages(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [activeContact]);

  useEffect(() => {
    setMessages([]);
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Poll every 5 seconds for new messages
  useEffect(() => {
    if (!activeContact) return;
    const id = setInterval(loadMessages, 5000);
    return () => clearInterval(id);
  }, [activeContact, loadMessages]);

  async function handleSend(e) {
    e.preventDefault();
    if (!text.trim() || !activeContact) return;
    setSending(true);
    setError(null);
    try {
      await sendMessage({ phone: activeContact.phone, message: text.trim() });
      setText('');
      await loadMessages();
      await refreshContacts();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setSending(false);
    }
  }

  if (!activeContact) {
    return (
      <div className={styles.empty}>
        <span>💬</span>
        <p>Seleziona una conversazione<br />o cerca un contatto</p>
      </div>
    );
  }

  const items = groupByDay(messages);

  return (
    <div className={styles.panel}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.avatar}>{(activeContact.name || activeContact.phone)[0].toUpperCase()}</div>
        <div>
          <div className={styles.contactName}>{activeContact.name || activeContact.phone}</div>
          <div className={styles.contactPhone}>{activeContact.phone}</div>
        </div>
      </div>

      {/* Messages */}
      <div className={styles.messages}>
        {loading && messages.length === 0 && <p className={styles.loadingMsg}>Caricamento…</p>}
        {error && <p className={styles.errorMsg}>⚠️ {error}</p>}

        {items.map((item, i) =>
          item.type === 'divider' ? (
            <div key={`d-${i}`} className={styles.dateDivider}>{item.label}</div>
          ) : (
            <div key={item.id} className={`${styles.bubble} ${styles[item.direction]}`}>
              <span className={styles.bubbleText}>{item.body}</span>
              <span className={styles.bubbleMeta}>
                {formatTs(item.timestamp)}
                {item.direction === 'outbound' && (
                  <span className={`${styles.status} ${styles[item.status]}`}>
                    {STATUS_ICON[item.status] || '✓'}
                  </span>
                )}
              </span>
            </div>
          )
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form className={styles.inputRow} onSubmit={handleSend}>
        <input
          className={styles.input}
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Scrivi un messaggio…"
          disabled={sending}
          maxLength={4096}
        />
        <button className={styles.sendBtn} type="submit" disabled={sending || !text.trim()}>
          {sending ? '…' : '➤'}
        </button>
      </form>
    </div>
  );
}
