import React, { useEffect, useState } from 'react';
import { createContact } from '../api';
import { useContacts } from '../context/ContactsContext';
import Icon from './Icon';
import styles from './ContactsList.module.css';

/* Deterministic color from phone string */
const AVATAR_COLORS = ['#d32f2f','#7b1fa2','#1565c0','#00695c','#f57f17','#4e342e','#37474f','#00838f'];
function avatarColor(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function timeAgo(unix) {
  if (!unix) return '';
  const diff = Date.now() / 1000 - unix;
  if (diff < 60)    return 'ora';
  if (diff < 3600)  return `${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h`;
  const d = new Date(unix * 1000);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

export default function ContactsList() {
  const { contacts, loading, refresh, activeContact, setActiveContact } = useContacts();
  const [search,    setSearch]    = useState('');
  const [filter,    setFilter]    = useState('all'); // 'all' | 'unread'
  const [showModal, setShowModal] = useState(false);
  const [newPhone,  setNewPhone]  = useState('');
  const [newName,   setNewName]   = useState('');
  const [creating,  setCreating]  = useState(false);
  const [createErr, setCreateErr] = useState(null);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => {
    const id = setInterval(refresh, 10000);
    return () => clearInterval(id);
  }, [refresh]);

  let filtered = contacts.filter(c =>
    (c.name  || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.phone || '').includes(search)
  );
  if (filter === 'unread') filtered = filtered.filter(c => c.unread > 0);

  async function handleCreate(e) {
    e.preventDefault();
    if (!newPhone.trim()) return;
    setCreating(true); setCreateErr(null);
    try {
      await createContact({ phone: newPhone.trim(), name: newName.trim() || undefined });
      setShowModal(false); setNewPhone(''); setNewName('');
      await refresh();
    } catch (err) {
      setCreateErr(err.response?.data?.errors?.[0]?.msg || err.message);
    } finally { setCreating(false); }
  }

  return (
    <div className={styles.panel}>
      {/* ── Header ── */}
      <div className={styles.header}>
        <span className={styles.headerTitle}>Chats</span>
        <div className={styles.headerActions}>
          <button className={styles.iconBtn} title="Nuova chat" onClick={() => setShowModal(true)}>
            <Icon name="edit" size={20} />
          </button>
          <button className={styles.iconBtn} title="Menu">
            <Icon name="more_vert" size={20} />
          </button>
        </div>
      </div>

      {/* ── Search ── */}
      <div className={styles.searchWrap}>
        <div className={styles.searchBox}>
          <Icon name="search" size={17} color="var(--wa-text-secondary)" />
          <input
            className={styles.searchInput}
            placeholder="Cerca o inizia una nuova chat"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* ── Filter pills ── */}
      <div className={styles.pills}>
        <button className={`${styles.pill} ${filter === 'all'    ? styles.pillActive : ''}`} onClick={() => setFilter('all')}>Tutti</button>
        <button className={`${styles.pill} ${filter === 'unread' ? styles.pillActive : ''}`} onClick={() => setFilter('unread')}>Non letti</button>
      </div>

      {/* ── List ── */}
      <div className={styles.list}>
        {loading && contacts.length === 0 && (
          <p className={styles.hint}>Caricamento…</p>
        )}
        {!loading && filtered.length === 0 && (
          <p className={styles.hint}>
            {search ? 'Nessun risultato' : filter === 'unread' ? 'Nessun messaggio non letto' : 'Nessuna chat. Aggiungi un contatto.'}
          </p>
        )}

        {filtered.map(c => {
          const label = c.name || c.phone;
          const bg    = avatarColor(c.phone);
          return (
            <button
              key={c.id}
              className={`${styles.item} ${activeContact?.id === c.id ? styles.active : ''}`}
              onClick={() => setActiveContact(c)}
            >
              <div className={styles.avatar} style={{ background: bg }}>
                {label[0].toUpperCase()}
              </div>
              <div className={styles.itemBody}>
                <div className={styles.itemTop}>
                  <span className={styles.itemName}>{label}</span>
                  <span className={`${styles.itemTime} ${c.unread > 0 ? styles.itemTimeUnread : ''}`}>
                    {timeAgo(c.last_message_at)}
                  </span>
                </div>
                <div className={styles.itemBottom}>
                  <span className={styles.itemPreview}>
                    {c.last_direction === 'outbound' && (
                      <span className={styles.outTick}>
                        <Icon name="done_all" size={14} color="var(--wa-tick-grey)" />
                      </span>
                    )}
                    {c.last_message || <em>Nessun messaggio</em>}
                  </span>
                  {c.unread > 0 && <span className={styles.badge}>{c.unread > 99 ? '99+' : c.unread}</span>}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* ── New contact modal ── */}
      {showModal && (
        <div className={styles.overlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <span>Nuova chat</span>
              <button className={styles.iconBtn} onClick={() => setShowModal(false)}>
                <Icon name="close" size={20} />
              </button>
            </div>
            <form onSubmit={handleCreate}>
              <label className={styles.label}>Numero di telefono *</label>
              <input className={styles.field} placeholder="391234567890" value={newPhone} onChange={e => setNewPhone(e.target.value)} required />
              <label className={styles.label}>Nome (opzionale)</label>
              <input className={styles.field} placeholder="Mario Rossi" value={newName} onChange={e => setNewName(e.target.value)} />
              {createErr && <p className={styles.createErr}>{createErr}</p>}
              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowModal(false)}>Annulla</button>
                <button type="submit" className={styles.confirmBtn} disabled={creating}>{creating ? '…' : 'Inizia chat'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
