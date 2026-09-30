import React from 'react';

function Header({ userName, userRole, onLogout }) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #1a2a4e 0%, #6B4E8A 100%)',
      color: 'white',
      padding: '20px 30px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    }}>
      {/* Left: Logo + Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        {/* LOGO GOES HERE - Add your logo image */}
        <img 
          src="/images/logo.png" 
          alt="Logo" 
          style={{ height: '50px', width: 'auto' }} 
        />
        <div>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700' }}>
            Classroom Scheduling
          </h2>
          <p style={{ margin: 0, fontSize: '12px', opacity: 0.9 }}>
            {userRole.charAt(0).toUpperCase() + userRole.slice(1)} Portal
          </p>
        </div>
      </div>

      {/* Right: User Info + Logout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{ textAlign: 'right' }}>
          <p style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>
            {userName}
          </p>
          <p style={{ margin: 0, fontSize: '12px', opacity: 0.8 }}>
            {userRole.toUpperCase()}
          </p>
        </div>
        <button
          onClick={onLogout}
          style={{
            padding: '10px 20px',
            backgroundColor: '#C5587A',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            transition: 'background-color 0.3s',
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#A8456F'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#C5587A'}
        >
          Logout
        </button>
      </div>
    </div>
  );
}

export default Header;