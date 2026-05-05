import React, { useEffect, useRef, useState, useCallback } from 'react';
import { getMessages, sendMessage, startCall } from '../api';
import { useContacts } from '../context/ContactsContext';
import Icon from './Icon';
import CallOverlay from './CallOverlay';
import styles from './Chat.module.css';

/* ── helpers ─────────────────────────────────────────────── */
const AVATAR_COLORS = ['#d32f2f','#7b1fa2','#1565c0','#00695c','#f57f17','#4e342e','#37474f','#00838f'];
function avatarColor(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function fmtTime(unix) {
  return new Date(unix * 1000).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
}

function fmtDate(unix) {
  const d = new Date(unix * 1000);
  const today     = new Date();
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString())     return 'Oggi';
  if (d.toDateString() === yesterday.toDateString()) return 'Ieri';
  return d.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });
}

function groupByDay(msgs) {
  const out = [];
  let last  = null;
  for (const m of msgs) {
    const day = fmtDate(m.timestamp);
    if (day !== last) { out.push({ type: 'divider', label: day }); last = day; }
    out.push(m);
  }
  return out;
}

function TickIcon({ status }) {
  if (status === 'sent')      return <Icon name="done"     size={14} color="var(--wa-tick-grey)" />;
  if (status === 'delivered') return <Icon name="done_all" size={14} color="var(--wa-tick-grey)" />;
  if (status === 'read')      return <Icon name="done_all" size={14} color="var(--wa-tick-blue)" />;
  if (status === 'failed')    return <Icon name="close"    size={14} color="var(--wa-danger)" />;
  return null;
}

/* ── component ───────────────────────────────────────────── */
export default function ChatPanel() {
  const { activeContact, refresh: refreshContacts } = useContacts();

  const [messages, setMessages]     = useState([]);
  const [loading,  setLoading]      = useState(false);
  const [sending,  setSending]      = useState(false);
  const [text,     setText]         = useState('');
  const [error,    setError]        = useState(null);

  // call state
  const [call, setCall] = useState(null); // null | { type, contact, error }
  const bottomRef = useRef(null);

  const loadMessages = useCallback(async () => {
    if (!activeContact) return;
    setLoading(true); setError(null);
    try {
      setMessages(await getMessages(activeContact.id, 50));
    } catch (e) {
      setError(e.message);
    } finally { setLoading(false); }
  }, [activeContact]);

  useEffect(() => { setMessages([]); loadMessages(); }, [loadMessages]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => {
    if (!activeContact) return;
    const id = setInterval(loadMessages, 5000);
    return () => clearInterval(id);
  }, [activeContact, loadMessages]);

  async function handleSend(e) {
    e.preventDefault();
    if (!text.trim() || !activeContact) return;
    setSending(true); setError(null);
    try {
      await sendMessage({ phone: activeContact.phone, message: text.trim() });
      setText('');
      await loadMessages();
      await refreshContacts();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally { setSending(false); }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  }

  async function initiateCall(type) {
    if (!activeContact) return;
    // Show overlay immediately, then make API call
    setCall({ type, contact: activeContact, error: null });
    try {
      await startCall({ phone: activeContact.phone, type });
    } catch (err) {
      const msg = err.response?.data?.error || err.message;
      setCall(prev => prev ? { ...prev, error: msg } : null);
    }
  }

  /* ── no active contact ── */
  if (!activeContact) {
    return (
      <div className={styles.welcome}>
        <div className={styles.welcomeInner}>
          <div className={styles.welcomeIcon}>
            <Icon name="lock" size={22} color="var(--wa-text-secondary)" />
          </div>
          <p className={styles.welcomeTitle}>I tuoi messaggi personali sono protetti</p>
          <p className={styles.welcomeText}>
            Seleziona una chat o inizia una nuova conversazione
          </p>
        </div>
      </div>
    );
  }

  const label = activeContact.name || activeContact.phone;
  const bg    = avatarColor(activeContact.phone);
  const items = groupByDay(messages);

  return (
    <div className={styles.panel}>
      {/* ── Header ─────────────────────────────────────── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerAvatar} style={{ background: bg }}>
            {label[0].toUpperCase()}
          </div>
          <div>
            <div className={styles.headerName}>{label}</div>
            <div className={styles.headerSub}>{activeContact.phone}</div>
          </div>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.iconBtn} title="Videochiamata" onClick={() => initiateCall('video')}>
            <Icon name="videocam" size={22} />
          </button>
          <button className={styles.iconBtn} title="Chiamata vocale" onClick={() => initiateCall('audio')}>
            <Icon name="phone" size={22} />
          </button>
          <button className={styles.iconBtn} title="Cerca">
            <Icon name="search" size={22} />
          </button>
          <button className={styles.iconBtn} title="Menu">
            <Icon name="more_vert" size={22} />
          </button>
        </div>
      </div>

      {/* ── Messages ────────────────────────────────────── */}
      <div className={styles.messages}>
        {loading && messages.length === 0 && (
          <p className={styles.loadingMsg}>Caricamento…</p>
        )}
        {error && <p className={styles.errorMsg}>⚠️ {error}</p>}

        {items.map((item, i) =>
          item.type === 'divider' ? (
            <div key={`d-${i}`} className={styles.dateDivider}>{item.label}</div>
          ) : (
            <div key={item.id} className={`${styles.bubble} ${styles[item.direction]}`}>
              <span className={styles.bubbleText}>{item.body}</span>
              <span className={styles.bubbleMeta}>
                <span className={styles.bubbleTime}>{fmtTime(item.timestamp)}</span>
                {item.direction === 'outbound' && <TickIcon status={item.status} />}
              </span>
            </div>
          )
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Input bar ───────────────────────────────────── */}
      <form className={styles.inputBar} onSubmit={handleSend}>
        <button type="button" className={styles.inputIconBtn} title="Emoji">
          <Icon name="emoji" size={24} color="var(--wa-icon)" />
        </button>
        <button type="button" className={styles.inputIconBtn} title="Allega">
          <Icon name="attach" size={24} color="var(--wa-icon)" />
        </button>
        <input
          className={styles.input}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Scrivi un messaggio"
          disabled={sending}
          maxLength={4096}
        />
        <button
          type={text.trim() ? 'submit' : 'button'}
          className={`${styles.sendBtn} ${text.trim() ? styles.sendActive : ''}`}
          disabled={sending && text.trim()}
          title={text.trim() ? 'Invia' : 'Messaggio vocale'}
        >
          {text.trim()
            ? <Icon name="send"   size={22} color="#fff" />
            : <Icon name="mic"    size={24} color="var(--wa-icon)" />
          }
        </button>
      </form>

      {/* ── Call overlay ────────────────────────────────── */}
      {call && (
        <CallOverlay
          contact={call.contact}
          callType={call.type}
          error={call.error}
          onClose={() => setCall(null)}
        />
      )}
    </div>
  );
}
