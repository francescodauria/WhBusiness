import React, { useEffect, useRef, useState } from 'react';
import Icon from './Icon';
import styles from './CallOverlay.module.css';

const AVATAR_COLORS = ['#d32f2f','#7b1fa2','#1565c0','#00695c','#f57f17','#4e342e','#37474f','#00838f'];
function avatarColor(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function pad(n) { return String(n).padStart(2, '0'); }

export default function CallOverlay({ contact, callType, onClose, error: initError }) {
  const [status,  setStatus]  = useState(initError ? 'error' : 'calling'); // calling | ringing | connected | ended | error
  const [elapsed, setElapsed] = useState(0);
  const [muted,   setMuted]   = useState(false);
  const [speaker, setSpeaker] = useState(true);
  const [errMsg,  setErrMsg]  = useState(initError || null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (status === 'calling') {
      // Simulate "ringing" after 1.5s (API call already made by parent)
      const t = setTimeout(() => setStatus('ringing'), 1500);
      return () => clearTimeout(t);
    }
    if (status === 'connected') {
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
      return () => clearInterval(timerRef.current);
    }
  }, [status]);

  useEffect(() => {
    if (initError) { setStatus('error'); setErrMsg(initError); }
  }, [initError]);

  function handleHangUp() {
    clearInterval(timerRef.current);
    setStatus('ended');
    setTimeout(onClose, 1200);
  }

  function simulateConnect() {
    if (status === 'ringing') setStatus('connected');
  }

  const label  = contact.name || contact.phone;
  const bg     = avatarColor(contact.phone);
  const mm     = Math.floor(elapsed / 60);
  const ss     = elapsed % 60;
  const timer  = `${pad(mm)}:${pad(ss)}`;

  const statusText = {
    calling:   'Chiamata WhatsApp in corso…',
    ringing:   'Squilla…',
    connected: timer,
    ended:     'Chiamata terminata',
    error:     errMsg || 'Errore durante la chiamata',
  }[status];

  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        {/* Call type badge */}
        <div className={styles.badge}>
          <Icon name={callType === 'video' ? 'videocam' : 'phone'} size={14} />
          <span>{callType === 'video' ? 'Videochiamata WhatsApp' : 'Chiamata vocale WhatsApp'}</span>
        </div>

        {/* Avatar */}
        <div className={styles.avatarWrap}>
          <div className={styles.avatar} style={{ background: bg }}>
            {label[0].toUpperCase()}
          </div>
          {(status === 'calling' || status === 'ringing') && (
            <div className={styles.pulse} />
          )}
        </div>

        {/* Name + status */}
        <div className={styles.name}>{label}</div>
        <div className={`${styles.status} ${status === 'error' ? styles.statusError : ''} ${status === 'connected' ? styles.statusTimer : ''}`}>
          {statusText}
        </div>

        {/* Simulate connect (dev helper for demo) */}
        {status === 'ringing' && (
          <button className={styles.simBtn} onClick={simulateConnect}>
            (Simula risposta)
          </button>
        )}

        {/* Controls */}
        {(status === 'calling' || status === 'ringing' || status === 'connected') && (
          <div className={styles.controls}>
            <button
              className={`${styles.ctrl} ${muted ? styles.ctrlActive : ''}`}
              onClick={() => setMuted(m => !m)}
              title={muted ? 'Riattiva microfono' : 'Silenzia'}
            >
              <Icon name={muted ? 'close' : 'mic'} size={22} />
              <span>{muted ? 'Attiva audio' : 'Silenzia'}</span>
            </button>

            {/* Hang up */}
            <button className={styles.hangUp} onClick={handleHangUp} title="Termina chiamata">
              <Icon name="call_end" size={28} />
            </button>

            <button
              className={`${styles.ctrl} ${!speaker ? styles.ctrlActive : ''}`}
              onClick={() => setSpeaker(s => !s)}
              title="Altoparlante"
            >
              <Icon name={speaker ? 'mic' : 'close'} size={22} />
              <span>Altoparlante</span>
            </button>
          </div>
        )}

        {(status === 'ended' || status === 'error') && (
          <button className={styles.closeBtn} onClick={onClose}>
            Chiudi
          </button>
        )}
      </div>
    </div>
  );
}
