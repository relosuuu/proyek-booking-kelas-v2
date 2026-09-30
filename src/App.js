import React, { useState } from 'react';
import Login from './components/Login';
import RoomsList from './components/RoomList';
import LecturerBooking from './components/LecturerBooking';
import StudentAvailabilityChecker from './components/StudentAvailabilityChecker';
import AdminPanel from './components/AdminPanel'; // We'll create this next
import Header from './components/Header';

function App() {
  const [user, setUser] = useState(null);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
  };

  // If not logged in, show login page
  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

    // If logged in, show dashboard based on role
  return (
    <div>
      <Header 
        userName={user.name} 
        userRole={user.role} 
        onLogout={handleLogout} 
      />
      <div style={{ padding: '20px' }}>

      {/* Show components based on role */}
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
    </div>
    </div>
  );
}

export default App;