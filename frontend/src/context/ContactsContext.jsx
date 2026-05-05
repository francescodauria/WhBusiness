import React, { createContext, useContext, useState, useCallback } from 'react';
import { getContacts as fetchContacts } from '../api';

const ContactsContext = createContext(null);

export function ContactsProvider({ children }) {
  const [contacts, setContacts]           = useState([]);
  const [loading,  setLoading]            = useState(false);
  const [activeContact, setActiveContact] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchContacts();
      setContacts(data);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <ContactsContext.Provider value={{ contacts, loading, refresh, activeContact, setActiveContact }}>
      {children}
    </ContactsContext.Provider>
  );
}

export const useContacts = () => useContext(ContactsContext);
