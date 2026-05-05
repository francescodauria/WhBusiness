import React, { useState } from 'react';
import styles from './Settings.module.css';

const FIELDS = [
  { key: 'WHATSAPP_ACCESS_TOKEN',    label: 'Access Token',      placeholder: 'EAAxxxxxxxx…', type: 'password' },
  { key: 'WHATSAPP_PHONE_NUMBER_ID', label: 'Phone Number ID',   placeholder: '1234567890', type: 'text' },
  { key: 'WHATSAPP_API_VERSION',     label: 'API Version',       placeholder: 'v19.0', type: 'text' },
  { key: 'WEBHOOK_VERIFY_TOKEN',     label: 'Webhook Verify Token', placeholder: 'my_secret_token', type: 'text' },
];

export default function Settings() {
  const [saved, setSaved] = useState(false);

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Impostazioni</h1>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Configurazione API WhatsApp</h2>
        <p className={styles.sectionDesc}>
          Le credenziali vengono configurate tramite variabili d'ambiente nel file
          <code className={styles.code}> backend/.env</code>.
          Riavvia il server dopo ogni modifica.
        </p>

        <div className={styles.table}>
          <div className={styles.tableHead}>
            <span>Variabile d'ambiente</span>
            <span>Descrizione</span>
          </div>
          {FIELDS.map(f => (
            <div key={f.key} className={styles.tableRow}>
              <code className={styles.varName}>{f.key}</code>
              <span className={styles.varDesc}>{f.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Configurazione Webhook</h2>
        <p className={styles.sectionDesc}>
          Registra il tuo webhook nel portale <strong>Meta for Developers</strong> con i seguenti parametri:
        </p>
        <div className={styles.table}>
          <div className={styles.tableRow}>
            <code className={styles.varName}>URL</code>
            <span className={styles.varDesc}><code className={styles.code}>https://&lt;tuo-dominio&gt;/webhook</code></span>
          </div>
          <div className={styles.tableRow}>
            <code className={styles.varName}>Verify Token</code>
            <span className={styles.varDesc}>Stesso valore di <code className={styles.code}>WEBHOOK_VERIFY_TOKEN</code></span>
          </div>
          <div className={styles.tableRow}>
            <code className={styles.varName}>Subscriptions</code>
            <span className={styles.varDesc}>messages, message_deliveries, message_reads</span>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Avvio rapido</h2>
        <pre className={styles.pre}>{`# 1. Copia e compila il file di configurazione
cp backend/.env.example backend/.env
# edita backend/.env con le tue credenziali

# 2. Avvia il backend
cd backend && npm install && npm start

# 3. Avvia il frontend (in un altro terminale)
cd frontend && npm install && npm run dev

# 4. Esponi il backend con ngrok per il webhook
npx ngrok http 4000`}</pre>
      </section>
    </div>
  );
}
