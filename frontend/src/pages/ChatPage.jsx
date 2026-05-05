import React from 'react';
import ContactsList from '../components/ContactsList';
import ChatPanel    from '../components/ChatPanel';
import { ContactsProvider } from '../context/ContactsContext';
import styles from './ChatPage.module.css';

export default function ChatPage() {
  return (
    <ContactsProvider>
      <div className={styles.layout}>
        <ContactsList />
        <ChatPanel />
      </div>
    </ContactsProvider>
  );
}
