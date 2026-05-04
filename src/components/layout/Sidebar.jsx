import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, CalendarDays, QrCode, Wallet,
  ShoppingBag, BrainCircuit, Trophy, ClipboardList,
  BarChart3, LogOut, Zap, User,
} from 'lucide-react';
import './Sidebar.css';

const navItems = [
  { to: '/dashboard',    label: 'Dashboard',   icon: LayoutDashboard },
  { to: '/events',       label: 'Events',       icon: CalendarDays },
  { to: '/scan',         label: 'Scan QR',      icon: QrCode },
  { to: '/wallet',       label: 'Wallet',       icon: Wallet },
  { to: '/store',        label: 'Store',        icon: ShoppingBag },
  { to: '/ai',           label: 'AI Learning',  icon: BrainCircuit },
  { to: '/leaderboard',  label: 'Leaderboard',  icon: Trophy },
  { to: '/tasks',        label: 'Tasks',        icon: ClipboardList },
  { to: '/polls',        label: 'Polls',        icon: BarChart3 },
];

const Sidebar = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Zap size={18} />
        </div>
        <div>
          <div className="sidebar-logo-title">Campus XP</div>
          <div className="sidebar-logo-sub">Attendance System</div>
        </div>
      </div>

      {/* User pill */}
      <div className="sidebar-user">
        <div className="sidebar-user-avatar">
          {user?.name?.charAt(0).toUpperCase()}
        </div>
        <div className="sidebar-user-info">
          <div className="sidebar-user-name">{user?.name}</div>
          <div className="sidebar-user-coins">🪙 {user?.coinBalance ?? 0} coins</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="sidebar-nav-label">Navigation</div>
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `sidebar-nav-item ${isActive ? 'active' : ''}`
            }
          >
            <Icon size={17} />
            <span>{label}</span>
          </NavLink>
        ))}

        {isAdmin && (
          <>
            <div className="sidebar-nav-label" style={{ marginTop: 16 }}>Admin</div>
            <NavLink to="/admin" className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}>
              <User size={17} />
              <span>Admin Panel</span>
            </NavLink>
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <NavLink to="/profile" className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}>
          <User size={17} />
          <span>Profile</span>
        </NavLink>
        <button className="sidebar-nav-item sidebar-logout" onClick={handleLogout}>
          <LogOut size={17} />
          <span>Log out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
