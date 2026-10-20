import React, { useState, Component } from 'react';
import Login from './components/Login';
import LecturerBooking from './components/LecturerBooking';
import StudentAvailabilityChecker from './components/StudentAvailabilityChecker';
import AdminPanel from './components/AdminPanel';
import Header from './components/Header';

// ─── Error Boundary: catches render crashes so the whole app doesn't go white ───
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '60vh', display: 'flex', flexDirection: 'column',
          justifyContent: 'center', alignItems: 'center', padding: '40px',
          textAlign: 'center',
        }}>
          <div style={{
            background: '#fff', borderRadius: '14px', padding: '40px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)', maxWidth: '480px',
            border: '2px solid #FFB3B3',
          }}>
            <h2 style={{ color: '#C5183D', marginTop: 0 }}>Something went wrong</h2>
            <p style={{ color: '#555', marginBottom: '24px' }}>
              {this.state.error?.message || 'An unexpected error occurred.'}
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              style={{
                padding: '10px 24px', backgroundColor: '#6B4E8A', color: 'white',
                border: 'none', borderRadius: '8px', cursor: 'pointer',
                fontSize: '14px', fontWeight: '600',
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
// ────────────────────────────────────────────────────────────────────────────

function App() {
  const [user, setUser] = useState(null);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div>
      <Header
        userName={user.name}
        userRole={user.role}
        onLogout={handleLogout}
      />
      <div style={{ padding: '20px' }}>
        <ErrorBoundary>
          {user.role === 'student' && (
            <div>
              <StudentAvailabilityChecker />
            </div>
          )}

          {user.role === 'lecturer' && (
            <div>
              <LecturerBooking lecturer_id={user.id} />
            </div>
          )}

          {user.role === 'admin' && (
            <div>
              <AdminPanel adminId={user.id} scenarioId="518900cf-cff5-45db-95c6-adfa67cad5eb" />
            </div>
          )}
        </ErrorBoundary>
      </div>
    </div>
  );
}

export default App;