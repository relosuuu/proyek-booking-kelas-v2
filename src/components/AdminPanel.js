import React, { useState } from 'react';
import CreateClassSchedule from './CreateClassSchedule';
import ScenarioManagement from './ScenarioManagement';
import ViewClassSchedules from './ViewClassSchedules';
import { getAllBookings } from '../services/api';

function AdminPanel({ adminId, scenarioId }) {
  const [allBookings, setAllBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [showBookings, setShowBookings] = useState(false);

  const fetchAllBookings = async () => {
    setLoadingBookings(true);
    try {
      const response = await getAllBookings();
      setAllBookings(response.data.bookings || []);
      setShowBookings(true);
    } catch (err) {
      console.error('Failed to load bookings', err);
    } finally {
      setLoadingBookings(false);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      {/* Title */}
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{
          fontSize: '32px',
          color: '#1a2a4e',
          marginBottom: '10px',
          fontWeight: '700',
        }}>
          Admin Dashboard
        </h1>
        <p style={{
          fontSize: '16px',
          color: '#6B4E8A',
          margin: 0,
        }}>
          Manage schedules, scenarios, and view all bookings
        </p>
      </div>

      {/* View & Edit Class Schedules */}
      <ViewClassSchedules scenarioId={scenarioId} />

      {/* Scenario Management */}
      <ScenarioManagement />

      {/* Create Class Schedule */}
      <CreateClassSchedule adminId={adminId} scenarioId={scenarioId} />

      {/* All Bookings */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '30px',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.08)',
        border: '1px solid #E8D4C8',
      }}>
        <h2 style={{
          fontSize: '22px',
          color: '#1a2a4e',
          marginTop: 0,
          marginBottom: '25px',
          fontWeight: '700',
        }}>
          All Bookings
        </h2>

        <button
          onClick={fetchAllBookings}
          disabled={loadingBookings}
          style={{
            padding: '12px 24px',
            backgroundColor: loadingBookings ? '#CCC' : '#6B4E8A',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: loadingBookings ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            transition: 'background-color 0.3s',
            marginBottom: '25px',
          }}
          onMouseEnter={(e) => !loadingBookings && (e.target.style.backgroundColor = '#5A3E76')}
          onMouseLeave={(e) => !loadingBookings && (e.target.style.backgroundColor = '#6B4E8A')}
        >
          {loadingBookings ? 'Loading...' : 'View All Bookings'}
        </button>

        {showBookings && (
          <div style={{ overflowX: 'auto' }}>
            {allBookings.length === 0 ? (
              <p style={{ color: '#999', fontSize: '14px' }}>No bookings found</p>
            ) : (
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '13px',
              }}>
                <thead>
                  <tr style={{ backgroundColor: '#F5F5F5', borderBottom: '2px solid #E8D4C8' }}>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '700', color: '#1a2a4e' }}>
                      Lecturer
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '700', color: '#1a2a4e' }}>
                      Room
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '700', color: '#1a2a4e' }}>
                      Jam Ke
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '700', color: '#1a2a4e' }}>
                      Date
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '700', color: '#1a2a4e' }}>
                      Type
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '700', color: '#1a2a4e' }}>
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {allBookings
                    .filter((booking) => {
                      const today = new Date().toISOString().split('T')[0];
                      return booking.date >= today;
                    })
                    .map((booking) => (
                      <tr key={booking.id} style={{ borderBottom: '1px solid #E8D4C8' }}>
                        <td style={{ padding: '12px', color: '#666' }}>
                          {booking.lecturer_name}
                        </td>
                        <td style={{ padding: '12px', color: '#666' }}>
                          {booking.room_name}
                        </td>
                        <td style={{ padding: '12px', color: '#666' }}>
                          {booking.jam_ke}
                        </td>
                        <td style={{ padding: '12px', color: '#666' }}>
                          {booking.date}
                        </td>
                        <td style={{ padding: '12px', color: '#666' }}>
                          {booking.booking_type}
                        </td>
                        <td style={{
                          padding: '12px',
                          color: booking.status === 'active' ? '#4CAF50' : '#F44336',
                          fontWeight: '600',
                        }}>
                          {booking.status}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminPanel;