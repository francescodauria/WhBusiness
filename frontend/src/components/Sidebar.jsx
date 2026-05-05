import React from 'react';
import { NavLink } from 'react-router-dom';
import styles from './Sidebar.module.css';

const NAV = [
  { to: '/',        label: 'Dashboard',      icon: '📊' },
  { to: '/chat',    label: 'Conversazioni',  icon: '💬' },
  { to: '/settings',label: 'Impostazioni',   icon: '⚙️' },
];

export default function Sidebar() {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <span className={styles.brandIcon}>📱</span>
        <span className={styles.brandName}>WhBusiness</span>
      </div>
      <nav className={styles.nav}>
        {NAV.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.active : ''}`
            }
          >
            <span className={styles.navIcon}>{icon}</span>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
