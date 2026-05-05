import React, { useEffect, useState } from 'react';
import { createContact } from '../api';
import { useContacts } from '../context/ContactsContext';
import styles from './ContactsList.module.css';

function timeAgo(unix) {
  if (!unix) return '';
  const diff = Date.now() / 1000 - unix;
  if (diff < 60)   return 'ora';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400)return `${Math.floor(diff / 3600)}h`;
  return new Date(unix * 1000).toLocaleDateString('it-IT');
}

export default function ContactsList() {
  const { contacts, loading, refresh, activeContact, setActiveContact } = useContacts();
  const [search,     setSearch]     = useState('');
  const [showModal,  setShowModal]  = useState(false);
  const [newPhone,   setNewPhone]   = useState('');
  const [newName,    setNewName]    = useState('');
  const [creating,   setCreating]   = useState(false);
  const [createErr,  setCreateErr]  = useState(null);

  useEffect(() => { refresh(); }, [refresh]);

  // Refresh every 10 s to pick up new inbound messages
  useEffect(() => {
    const id = setInterval(refresh, 10000);
    return () => clearInterval(id);
  }, [refresh]);

  const filtered = contacts.filter(c =>
    (c.name  || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.phone || '').includes(search)
  );

  async function handleCreate(e) {
    e.preventDefault();
    if (!newPhone.trim()) return;
    setCreating(true);
    setCreateErr(null);
    try {
      await createContact({ phone: newPhone.trim(), name: newName.trim() || undefined });
      setShowModal(false);
      setNewPhone(''); setNewName('');
      await refresh();
    } catch (err) {
      setCreateErr(err.response?.data?.errors?.[0]?.msg || err.message);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className={styles.container}>
      {/* Search + New */}
      <div className={styles.toolbar}>
        <input
          className={styles.search}
          placeholder="Cerca contatti…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button className={styles.newBtn} onClick={() => setShowModal(true)} title="Nuovo contatto">＋</button>
      </div>

      {/* List */}
      <div className={styles.list}>
        {loading && contacts.length === 0 && <p className={styles.hint}>Caricamento…</p>}
        {!loading && filtered.length === 0 && (
          <p className={styles.hint}>
            {search ? 'Nessun risultato' : 'Nessun contatto. Aggiungi uno o attendi messaggi.'}
          </p>
        )}

        {filtered.map(c => (
          <button
            key={c.id}
            className={`${styles.item} ${activeContact?.id === c.id ? styles.active : ''}`}
            onClick={() => setActiveContact(c)}
          >
            <div className={styles.avatar}>{(c.name || c.phone)[0].toUpperCase()}</div>
            <div className={styles.info}>
              <div className={styles.row1}>
                <span className={styles.name}>{c.name || c.phone}</span>
                <span className={styles.time}>{timeAgo(c.last_message_at)}</span>
              </div>
              <div className={styles.row2}>
                <span className={styles.preview}>
                  {c.last_direction === 'outbound' && <span className={styles.out}>Tu: </span>}
                  {c.last_message || <em>Nessun messaggio</em>}
                </span>
                {c.unread > 0 && <span className={styles.badge}>{c.unread}</span>}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className={styles.overlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Nuovo contatto</h3>
            <form onSubmit={handleCreate}>
              <label className={styles.label}>Numero di telefono *</label>
              <input
                className={styles.field}
                placeholder="391234567890"
                value={newPhone}
                onChange={e => setNewPhone(e.target.value)}
                required
              />
              <label className={styles.label}>Nome (opzionale)</label>
              <input
                className={styles.field}
                placeholder="Mario Rossi"
                value={newName}
                onChange={e => setNewName(e.target.value)}
              />
              {createErr && <p className={styles.createErr}>{createErr}</p>}
              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowModal(false)}>Annulla</button>
                <button type="submit" className={styles.confirmBtn} disabled={creating}>
                  {creating ? '…' : 'Crea'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
