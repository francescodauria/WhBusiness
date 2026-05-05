import React, { useEffect, useState } from 'react';
import { getStats } from '../api';
import styles from './Dashboard.module.css';

function StatCard({ icon, label, value, color }) {
  return (
    <div className={styles.card} style={{ '--card-color': color }}>
      <div className={styles.cardIcon}>{icon}</div>
      <div className={styles.cardBody}>
        <div className={styles.cardValue}>{value ?? '…'}</div>
        <div className={styles.cardLabel}>{label}</div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getStats()
      .then(setStats)
      .catch(err => setError(err.message));
  }, []);

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Dashboard</h1>

      {error && <p className={styles.error}>⚠️ {error}</p>}

      <div className={styles.grid}>
        <StatCard icon="👥" label="Contatti totali"   value={stats?.total_contacts} color="#25d366" />
        <StatCard icon="💬" label="Messaggi totali"   value={stats?.total_messages} color="#128c7e" />
        <StatCard icon="📥" label="Messaggi ricevuti" value={stats?.inbound}        color="#0d6efd" />
        <StatCard icon="📤" label="Messaggi inviati"  value={stats?.outbound}       color="#6f42c1" />
        <StatCard icon="📅" label="Messaggi oggi"     value={stats?.today_msgs}     color="#fd7e14" />
      </div>

      <div className={styles.info}>
        <h2>Come iniziare</h2>
        <ol>
          <li>Vai su <strong>Impostazioni</strong> e configura il tuo <em>Access Token</em>, <em>Phone Number ID</em> e <em>Webhook Verify Token</em>.</li>
          <li>Registra il webhook <code>https://&lt;tuo-dominio&gt;/webhook</code> nel pannello di Meta Developers.</li>
          <li>Vai in <strong>Conversazioni</strong> per inviare il primo messaggio!</li>
        </ol>
      </div>
    </div>
  );
}
