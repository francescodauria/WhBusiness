import React from 'react';
import { NavLink } from 'react-router-dom';
import Icon from './Icon';
import styles from './Sidebar.module.css';

const AVATAR_COLORS = ['#00a884','#128c7e','#25d366','#34b7f1','#6bcbef'];

function UserAvatar({ letter = 'W' }) {
  return (
    <div className={styles.userAvatar} title="Il tuo profilo">
      <span>{letter}</span>
    </div>
  );
}

function NavIcon({ to, icon, label, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      title={label}
      className={({ isActive }) => `${styles.navIcon} ${isActive ? styles.active : ''}`}
    >
      <Icon name={icon} size={24} />
    </NavLink>
  );
}

export default function Sidebar() {
  return (
    <aside className={styles.strip}>
      {/* Top: avatar */}
      <div className={styles.top}>
        <UserAvatar letter="W" />
      </div>

      {/* Middle: main nav icons */}
      <nav className={styles.mid}>
        <NavIcon to="/chat"      icon="chat"      label="Chats"         />
        <NavIcon to="/dashboard" icon="dashboard" label="Dashboard"     />
      </nav>

      {/* Bottom: secondary icons */}
      <div className={styles.bot}>
        <NavIcon to="/settings" icon="settings" label="Impostazioni" />
      </div>
    </aside>
  );
}
