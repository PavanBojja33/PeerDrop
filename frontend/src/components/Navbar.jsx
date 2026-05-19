import { Link } from 'react-router-dom';

export default function Navbar({ theme, setTheme }) {
  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 40,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 20px', height: 56,
      background: 'rgba(15,23,42,0.9)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      backdropFilter: 'blur(8px)',
    }}>
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
        }}>
          ⚡
        </div>
        <span style={{ fontWeight: 800, fontSize: 18, color: '#f1f5f9' }}>
          Peer<span style={{ color: '#818cf8' }}>Drop</span>
        </span>
      </Link>

      <button
        id="theme-toggle"
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        style={{
          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
          color: '#94a3b8', borderRadius: 7, padding: '5px 12px',
          cursor: 'pointer', fontSize: 13,
        }}
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? '☀ Light' : '🌙 Dark'}
      </button>
    </nav>
  );
}
