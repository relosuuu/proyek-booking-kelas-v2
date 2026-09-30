import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { getRooms, getRoomAvailability, createBooking, getMyBookings } from '../services/api';

// Custom Confirmation Modal
function ConfirmationModal({ isOpen, title, message, onConfirm, onCancel, loading }) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '30px',
        maxWidth: '400px',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
        animation: 'slideUp 0.3s ease-out',
      }}>
        <h3 style={{
          fontSize: '20px',
          color: '#1a2a4e',
          marginTop: 0,
          marginBottom: '12px',
          fontWeight: '700',
        }}>
          {title}
        </h3>

        <p style={{
          fontSize: '14px',
          color: '#666',
          lineHeight: '1.6',
          marginBottom: '25px',
        }}>
          {message}
        </p>

        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end',
        }}>
          <button
            onClick={onCancel}
            disabled={loading}
            style={{
              padding: '10px 20px',
              backgroundColor: '#F5F5F5',
              color: '#1a2a4e',
              border: '1px solid #E8D4C8',
              borderRadius: '6px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.3s',
              opacity: loading ? 0.6 : 1,
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.target.style.backgroundColor = '#E8D4C8';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.target.style.backgroundColor = '#F5F5F5';
              }
            }}
          >
            No, Keep It
          </button>

          <button
            onClick={onConfirm}
            disabled={loading}
            style={{
              padding: '10px 20px',
              backgroundColor: loading ? '#CCC' : '#F44336',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.3s',
              opacity: loading ? 0.8 : 1,
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.target.style.backgroundColor = '#D32F2F';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.target.style.backgroundColor = '#F44336';
              }
            }}
          >
            {loading ? 'Canceling...' : 'Yes, Cancel Booking'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

function LecturerBooking({ lecturer_id }) {
  const [rooms, setRooms] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedJamKe, setSelectedJamKe] = useState('');
  const [availableRooms, setAvailableRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState('');
  const [selectedCampus, setSelectedCampus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // My Bookings state
  const [myBookings, setMyBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [bookingsError, setBookingsError] = useState('');
  const [bookingFilter, setBookingFilter] = useState('all');

  // Modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedBookingToCancel, setSelectedBookingToCancel] = useState(null);
  const [cancelingBooking, setCancelingBooking] = useState(false);

  // Auto-clear message after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Auto-clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);
  const fetchMyBookings = useCallback(async () => {
    if (!lecturer_id) return;
    setLoadingBookings(true);
    setBookingsError('');
    try {
      const response = await getMyBookings(lecturer_id);
      const bookings = response.data.bookings || [];

      // Auto-transition expired bookings to canceled
      const today = new Date().toISOString().split('T')[0];
      const currentTime = new Date();

      const updatedBookings = await Promise.all(
        bookings.map(async (booking) => {
          if (booking.status === 'active') {
            const bookingDateTime = new Date(`${booking.date}T${getJamKeEndTime(booking.jam_ke)}`);

            // If booking time has passed, automatically cancel it
            if (bookingDateTime < currentTime) {
              try {
                await axios.patch(
                  `${process.env.REACT_APP_SUPABASE_URL}/rest/v1/bookings?id=eq.${booking.id}`,
                  { status: 'canceled' },
                  {
                    headers: {
                      'apikey': process.env.REACT_APP_SUPABASE_ANON_KEY,
                      'Content-Type': 'application/json',
                    },
                  }
                );
                return { ...booking, status: 'canceled' };
              } catch (err) {
                console.error('Failed to auto-cancel booking', err);
                return booking;
              }
            }
          }
          return booking;
        })
      );

      setMyBookings(updatedBookings);
    } catch (err) {
      setBookingsError('Failed to load your bookings');
      console.error(err);
    } finally {
      setLoadingBookings(false);
    }
  }, [lecturer_id]);

  useEffect(() => {
    fetchRooms();
    fetchMyBookings();
  }, [fetchMyBookings]);

  const fetchRooms = async () => {
    try {
      const response = await getRooms();
      setRooms(response.data);
    } catch (err) {
      setError('Failed to load rooms');
    }
  };

  // Get end time for a jam_ke
  const getJamKeEndTime = (jamKe) => {
    const times = {
      1: '08:30',
      2: '09:30',
      3: '10:30',
      4: '11:30',
      5: '12:30',
      6: '13:30',
      7: '14:30',
      8: '15:30',
      9: '16:30',
      10: '17:30',
    };
    return times[jamKe] || '17:30';
  };

  // Helper: resolve room_id to room name
  const getRoomName = (roomId) => {
    const room = rooms.find((r) => r.id === roomId);
    return room ? room.name : roomId?.substring(0, 8) + '...';
  };

  const campuses = [...new Set(rooms.map((r) => {
    const name = r.name.toUpperCase();
    return name[0];
  }))];

  const filteredRoomsByCampus = selectedCampus
    ? rooms.filter((r) => {
      const name = r.name.toUpperCase();
      return name[0] === selectedCampus;
    })
    : [];

  const handleCheckAvailability = async () => {
    if (!selectedDate || !selectedJamKe) {
      setError('Please select both date and time slot');
      return;
    }

    setCheckingAvailability(true);
    setError('');
    setAvailableRooms([]);
    setSelectedRoom('');

    try {
      const roomsToCheck = selectedCampus ? filteredRoomsByCampus : rooms;
      const available = [];

      for (const room of roomsToCheck) {
        try {
          const response = await getRoomAvailability(room.id, parseInt(selectedJamKe), selectedDate);
          if (response.data.is_available) {
            available.push(room);
          }
        } catch (err) {
          // Room not available
        }
      }

      if (available.length === 0) {
        setError('No rooms available at this time');
      }
      setAvailableRooms(available);
    } catch (err) {
      setError('Failed to check availability');
    } finally {
      setCheckingAvailability(false);
    }
  };

  const handleBook = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      await createBooking(lecturer_id, selectedRoom, parseInt(selectedJamKe), selectedDate, 'extra');
      setMessage('Booking created successfully');
      setSelectedDate('');
      setSelectedJamKe('');
      setAvailableRooms([]);
      setSelectedRoom('');
      fetchMyBookings();
    } catch (err) {
      setError(err.response?.data?.error || 'Booking failed');
    } finally {
      setLoading(false);
    }
  };

  // Open confirmation modal
  const handleDeleteBookingClick = (booking) => {
    setSelectedBookingToCancel(booking);
    setShowConfirmModal(true);
  };

  // Confirm booking cancellation
  const handleConfirmCancel = async () => {
    if (!selectedBookingToCancel) return;

    setCancelingBooking(true);
    try {
      const response = await axios.patch(
        `${process.env.REACT_APP_SUPABASE_URL}/rest/v1/bookings?id=eq.${selectedBookingToCancel.id}`,
        { status: 'canceled' },
        {
          headers: {
            'apikey': process.env.REACT_APP_SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.status >= 200 && response.status < 300) {
        setMessage('Booking canceled successfully');
        await fetchMyBookings();
      } else {
        setError('Failed to cancel booking');
      }
    } catch (err) {
      console.error('Cancel booking error:', err);
      setError(err.response?.data?.error || err.message || 'Failed to cancel booking');
    } finally {
      setShowConfirmModal(false);
      setSelectedBookingToCancel(null);
      setCancelingBooking(false);
    }
  };

  // Check if a canceled booking is older than 2 weeks
  const isOlderThan2Weeks = (date) => {
    const bookingDate = new Date(date);
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    return bookingDate < twoWeeksAgo;
  };

  const today = new Date().toISOString().split('T')[0];

  const jamKeNames = {
    1: '07:30 - 08:30',
    2: '08:30 - 09:30',
    3: '09:30 - 10:30',
    4: '10:30 - 11:30',
    5: '11:30 - 12:30',
    6: '12:30 - 13:30',
    7: '13:30 - 14:30',
    8: '14:30 - 15:30',
    9: '15:30 - 16:30',
    10: '16:30 - 17:30',
  };

  // Filter bookings - exclude archived canceled bookings from display
  const filteredBookings = myBookings.filter((b) => {
    // Always show active bookings
    if (b.status === 'active') {
      if (bookingFilter === 'all' || bookingFilter === 'active') return true;
      return false;
    }

    // For canceled: only show if less than 2 weeks old
    if (b.status === 'canceled') {
      const isArchived = isOlderThan2Weeks(b.date);
      if (isArchived) return false; // Hide archived

      if (bookingFilter === 'all' || bookingFilter === 'canceled') return true;
      return false;
    }

    return false;
  });

  // Count stats
  const activeCount = myBookings.filter((b) => b.status === 'active').length;
  const canceledCount = myBookings.filter((b) => {
    if (b.status !== 'canceled') return false;
    return !isOlderThan2Weeks(b.date);
  }).length;
  const archivedCount = myBookings.filter((b) => {
    if (b.status !== 'canceled') return false;
    return isOlderThan2Weeks(b.date);
  }).length;

  return (
    <div style={{
      maxWidth: '900px',
      margin: '0 auto',
      padding: '20px',
    }}>
      {/* Title */}
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{
          fontSize: '32px',
          color: '#1a2a4e',
          marginBottom: '10px',
          fontWeight: '700',
        }}>
          Book a Makeup Class
        </h1>
        <p style={{
          fontSize: '16px',
          color: '#6B4E8A',
          margin: 0,
        }}>
          Select a date and time to find available rooms
        </p>
      </div>

      {/* Campus Filter */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '30px',
        marginBottom: '30px',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.08)',
        border: '2px solid #F4A89B',
      }}>
        <h2 style={{
          fontSize: '20px',
          color: '#1a2a4e',
          marginTop: 0,
          marginBottom: '25px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}>
          Select Campus
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '12px',
        }}>
          {campuses.map((campus) => (
            <button
              key={campus}
              onClick={() => setSelectedCampus(campus)}
              style={{
                padding: '12px 20px',
                backgroundColor: selectedCampus === campus ? '#C5587A' : '#F5F5F5',
                color: selectedCampus === campus ? 'white' : '#1a2a4e',
                border: '2px solid ' + (selectedCampus === campus ? '#C5587A' : '#E8D4C8'),
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '14px',
                transition: 'all 0.3s',
              }}
              onMouseEnter={(e) => {
                if (selectedCampus !== campus) {
                  e.target.style.backgroundColor = '#E8D4C8';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedCampus !== campus) {
                  e.target.style.backgroundColor = '#F5F5F5';
                }
              }}
            >
              Campus {campus}
            </button>
          ))}
        </div>
      </div>

      {/* Step 1: Select Date & Time */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '30px',
        marginBottom: '30px',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.08)',
        border: '2px solid #E8D4C8',
      }}>
        <h2 style={{
          fontSize: '20px',
          color: '#1a2a4e',
          marginTop: 0,
          marginBottom: '25px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}>
          Select Date & Time Slot
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
          marginBottom: '25px',
        }}>
          {/* Date Input */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#1a2a4e',
              marginBottom: '8px',
            }}>
              Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={today}
              style={{
                width: '100%',
                padding: '12px 15px',
                fontSize: '14px',
                border: '2px solid #E8D4C8',
                borderRadius: '8px',
                boxSizing: 'border-box',
                transition: 'border-color 0.3s, box-shadow 0.3s',
                outline: 'none',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#6B4E8A';
                e.target.style.boxShadow = '0 0 0 3px rgba(107, 78, 138, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#E8D4C8';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Time Slot Select */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#1a2a4e',
              marginBottom: '8px',
            }}>
              Time Slot
            </label>
            <select
              value={selectedJamKe}
              onChange={(e) => setSelectedJamKe(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 15px',
                fontSize: '14px',
                border: '2px solid #E8D4C8',
                borderRadius: '8px',
                boxSizing: 'border-box',
                transition: 'border-color 0.3s, box-shadow 0.3s',
                outline: 'none',
                backgroundColor: 'white',
                cursor: 'pointer',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#6B4E8A';
                e.target.style.boxShadow = '0 0 0 3px rgba(107, 78, 138, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#E8D4C8';
                e.target.style.boxShadow = 'none';
              }}
            >
              <option value="">-- Choose time slot --</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((slot) => (
                <option key={slot} value={slot}>
                  Jam ke-{slot} ({jamKeNames[slot]})
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleCheckAvailability}
          disabled={checkingAvailability || !selectedDate || !selectedJamKe}
          style={{
            width: '100%',
            padding: '14px',
            backgroundColor: !selectedDate || !selectedJamKe ? '#DDD' : '#6B4E8A',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: (!selectedDate || !selectedJamKe) ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: '600',
            transition: 'background-color 0.3s, transform 0.2s',
            opacity: checkingAvailability ? 0.8 : 1,
          }}
          onMouseEnter={(e) => {
            if (selectedDate && selectedJamKe) {
              e.target.style.backgroundColor = '#5A3E76';
              e.target.style.transform = 'translateY(-2px)';
            }
          }}
          onMouseLeave={(e) => {
            if (selectedDate && selectedJamKe) {
              e.target.style.backgroundColor = '#6B4E8A';
              e.target.style.transform = 'translateY(0)';
            }
          }}
        >
          {checkingAvailability ? 'Checking...' : 'Check Available Rooms'}
        </button>
      </div>

      {/* Step 2: Select Room */}
      {availableRooms.length > 0 && (
        <form onSubmit={handleBook} style={{
          background: 'white',
          borderRadius: '12px',
          padding: '30px',
          marginBottom: '30px',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.08)',
          border: '2px solid #e9e6e5',
        }}>
          <h2 style={{
            fontSize: '20px',
            color: '#1a2a4e',
            marginTop: 0,
            marginBottom: '25px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              backgroundColor: '#C5587A',
              color: 'white',
              borderRadius: '50%',
              fontSize: '18px',
              fontWeight: '700',
            }}>
              2
            </span>
            Available Rooms
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '15px',
            marginBottom: '25px',
          }}>
            {availableRooms.map((room) => (
              <button
                key={room.id}
                type="button"
                onClick={() => setSelectedRoom(room.id)}
                style={{
                  padding: '18px 15px',
                  backgroundColor: selectedRoom === room.id ? '#C5587A' : '#F4A89B',
                  color: 'white',
                  border: selectedRoom === room.id ? '3px solid #A8456F' : '2px solid #F4A89B',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'all 0.3s',
                  transform: selectedRoom === room.id ? 'scale(1.05)' : 'scale(1)',
                }}
                onMouseEnter={(e) => {
                  if (selectedRoom !== room.id) {
                    e.target.style.backgroundColor = '#E8947F';
                    e.target.style.transform = 'translateY(-4px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedRoom !== room.id) {
                    e.target.style.backgroundColor = '#F4A89B';
                    e.target.style.transform = 'translateY(0)';
                  }
                }}
              >
                <div style={{ fontWeight: '700' }}>{room.name}</div>
                <div style={{ fontSize: '12px', opacity: 0.9 }}>
                  Capacity: {room.capacity}
                </div>
                {selectedRoom === room.id && <div style={{ marginTop: '8px' }}>Selected</div>}
              </button>
            ))}
          </div>

          <button
            type="submit"
            disabled={loading || !selectedRoom}
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: !selectedRoom ? '#DDD' : '#6B4E8A',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: !selectedRoom ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: '600',
              transition: 'background-color 0.3s, transform 0.2s',
              opacity: loading ? 0.8 : 1,
            }}
            onMouseEnter={(e) => {
              if (selectedRoom) {
                e.target.style.backgroundColor = '#5A3E76';
                e.target.style.transform = 'translateY(-2px)';
              }
            }}
            onMouseLeave={(e) => {
              if (selectedRoom) {
                e.target.style.backgroundColor = '#6B4E8A';
                e.target.style.transform = 'translateY(0)';
              }
            }}
          >
            {loading ? 'Please wait...' : 'Confirm Booking'}
          </button>
        </form>
      )}

      {/* Messages */}
      {message && (
        <div style={{
          padding: '16px 20px',
          backgroundColor: '#E8F5E9',
          border: '2px solid #4CAF50',
          borderRadius: '8px',
          color: '#2E7D32',
          fontSize: '14px',
          fontWeight: '600',
          marginBottom: '20px',
          animation: 'slideIn 0.3s ease-out',
        }}>
          {message}
        </div>
      )}

      {error && (
        <div style={{
          padding: '16px 20px',
          backgroundColor: '#FFEBEE',
          border: '2px solid #F44336',
          borderRadius: '8px',
          color: '#C62828',
          fontSize: '14px',
          fontWeight: '600',
          marginBottom: '20px',
          animation: 'slideIn 0.3s ease-out',
        }}>
          {error}
        </div>
      )}

      {/* My Bookings Section */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '30px',
        marginTop: '10px',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.08)',
        border: '2px solid #E8D4C8',
      }}>
        {/* Header row */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '12px',
        }}>
          <h2 style={{
            fontSize: '20px',
            color: '#1a2a4e',
            margin: 0,
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}>
            My Bookings
          </h2>

          <button
            onClick={fetchMyBookings}
            disabled={loadingBookings}
            style={{
              padding: '8px 18px',
              backgroundColor: loadingBookings ? '#CCC' : '#6B4E8A',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: loadingBookings ? 'not-allowed' : 'pointer',
              fontSize: '13px',
              fontWeight: '600',
              transition: 'background-color 0.3s, transform 0.2s',
            }}
            onMouseEnter={(e) => {
              if (!loadingBookings) {
                e.target.style.backgroundColor = '#5A3E76';
                e.target.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loadingBookings) {
                e.target.style.backgroundColor = '#6B4E8A';
                e.target.style.transform = 'translateY(0)';
              }
            }}
          >
            {loadingBookings ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* Stats / filter badges */}
        {myBookings.length > 0 && (
          <div style={{
            display: 'flex',
            gap: '12px',
            marginBottom: '20px',
            flexWrap: 'wrap',
          }}>
            <span
              onClick={() => setBookingFilter('all')}
              style={{
                padding: '6px 16px',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: bookingFilter === 'all' ? '#6B4E8A' : '#F0EBF5',
                color: bookingFilter === 'all' ? 'white' : '#6B4E8A',
                border: bookingFilter === 'all' ? '2px solid #6B4E8A' : '2px solid #E0D6EA',
              }}
            >
              All ({myBookings.length - archivedCount})
            </span>
            <span
              onClick={() => setBookingFilter('active')}
              style={{
                padding: '6px 16px',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: bookingFilter === 'active' ? '#4CAF50' : '#E8F5E9',
                color: bookingFilter === 'active' ? 'white' : '#2E7D32',
                border: bookingFilter === 'active' ? '2px solid #4CAF50' : '2px solid #C8E6C9',
              }}
            >
              Active ({activeCount})
            </span>
            <span
              onClick={() => setBookingFilter('canceled')}
              style={{
                padding: '6px 16px',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: bookingFilter === 'canceled' ? '#F44336' : '#FFEBEE',
                color: bookingFilter === 'canceled' ? 'white' : '#C62828',
                border: bookingFilter === 'canceled' ? '2px solid #F44336' : '2px solid #FFCDD2',
              }}
            >
              Canceled ({canceledCount})
            </span>
            {archivedCount > 0 && (
              <span
                style={{
                  padding: '6px 16px',
                  borderRadius: '20px',
                  fontSize: '13px',
                  fontWeight: '600',
                  backgroundColor: '#F5F5F5',
                  color: '#999',
                  border: '2px solid #E0E0E0',
                }}
              >
                Archived ({archivedCount})
              </span>
            )}
          </div>
        )}

        {/* Bookings error */}
        {bookingsError && (
          <div style={{
            padding: '12px 16px',
            backgroundColor: '#FFEBEE',
            border: '1px solid #F44336',
            borderRadius: '8px',
            color: '#C62828',
            fontSize: '13px',
            fontWeight: '600',
            marginBottom: '16px',
          }}>
            {bookingsError}
          </div>
        )}

        {/* Loading state */}
        {loadingBookings && (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: '#6B4E8A',
          }}>
            <div style={{
              width: '36px',
              height: '36px',
              border: '4px solid #E0D6EA',
              borderTopColor: '#6B4E8A',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 12px',
            }} />
            <p style={{ margin: 0, fontSize: '14px', fontWeight: '500' }}>Loading your bookings...</p>
          </div>
        )}

        {/* Empty state */}
        {!loadingBookings && myBookings.length === 0 && !bookingsError && (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
          }}>
            <p style={{
              margin: 0,
              fontSize: '16px',
              color: '#999',
              fontWeight: '500',
            }}>
              You haven't made any bookings yet
            </p>
            <p style={{
              margin: '6px 0 0',
              fontSize: '13px',
              color: '#BBB',
            }}>
              Use the form above to book a makeup class
            </p>
          </div>
        )}

        {/* Bookings table */}
        {!loadingBookings && filteredBookings.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '14px',
            }}>
              <thead>
                <tr style={{
                  backgroundColor: '#F8F5FB',
                  borderBottom: '2px solid #E8D4C8',
                }}>
                  <th style={{ padding: '14px 12px', textAlign: 'left', fontWeight: '700', color: '#1a2a4e' }}>
                    Room
                  </th>
                  <th style={{ padding: '14px 12px', textAlign: 'left', fontWeight: '700', color: '#1a2a4e' }}>
                    Time Slot
                  </th>
                  <th style={{ padding: '14px 12px', textAlign: 'left', fontWeight: '700', color: '#1a2a4e' }}>
                    Date
                  </th>
                  <th style={{ padding: '14px 12px', textAlign: 'left', fontWeight: '700', color: '#1a2a4e' }}>
                    Type
                  </th>
                  <th style={{ padding: '14px 12px', textAlign: 'left', fontWeight: '700', color: '#1a2a4e' }}>
                    Status
                  </th>
                  <th style={{ padding: '14px 12px', textAlign: 'center', fontWeight: '700', color: '#1a2a4e' }}>
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((booking, index) => {
                  const isUpcoming = booking.date >= today;
                  return (
                    <tr
                      key={booking.id}
                      style={{
                        borderBottom: '1px solid #F0EBF5',
                        backgroundColor: index % 2 === 0 ? 'white' : '#FDFBFE',
                        transition: 'background-color 0.2s',
                        opacity: booking.status === 'canceled' ? 0.6 : 1,
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F5F0FA'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = index % 2 === 0 ? 'white' : '#FDFBFE'; }}
                    >
                      <td style={{ padding: '14px 12px', color: '#333', fontWeight: '600' }}>
                        {getRoomName(booking.room_id)}
                      </td>
                      <td style={{ padding: '14px 12px', color: '#555' }}>
                        <span style={{ fontWeight: '600', color: '#6B4E8A' }}>
                          Jam ke-{booking.jam_ke}
                        </span>
                        <br />
                        <span style={{ fontSize: '12px', color: '#999' }}>
                          {jamKeNames[booking.jam_ke] || ''}
                        </span>
                      </td>
                      <td style={{ padding: '14px 12px', color: '#555' }}>
                        <span>{booking.date}</span>
                        {isUpcoming && booking.status === 'active' && (
                          <span style={{
                            display: 'inline-block',
                            marginLeft: '8px',
                            padding: '2px 8px',
                            borderRadius: '10px',
                            fontSize: '10px',
                            fontWeight: '700',
                            backgroundColor: '#E3F2FD',
                            color: '#1565C0',
                          }}>
                            UPCOMING
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '14px 12px', color: '#555', textTransform: 'capitalize' }}>
                        {booking.booking_type}
                      </td>
                      <td style={{ padding: '14px 12px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 14px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '700',
                          backgroundColor: booking.status === 'active' ? '#E8F5E9' : '#FFEBEE',
                          color: booking.status === 'active' ? '#2E7D32' : '#C62828',
                          border: booking.status === 'active' ? '1px solid #C8E6C9' : '1px solid #FFCDD2',
                        }}>
                          {booking.status === 'active' ? 'Active' : 'Canceled'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 12px', textAlign: 'center' }}>
                        {booking.status === 'active' && (
                          <button
                            onClick={() => handleDeleteBookingClick(booking)}
                            style={{
                              padding: '6px 14px',
                              backgroundColor: '#F44336',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: '600',
                              transition: 'background-color 0.3s',
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#D32F2F'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = '#F44336'}
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Filtered empty state */}
        {!loadingBookings && myBookings.length > 0 && filteredBookings.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '30px 20px',
            color: '#999',
            fontSize: '14px',
          }}>
            No {bookingFilter} bookings found
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        title="Cancel Booking?"
        message={`Are you sure you want to cancel the booking for ${selectedBookingToCancel?.date} (Jam ke-${selectedBookingToCancel?.jam_ke})? This action cannot be undone.`}
        onConfirm={handleConfirmCancel}
        onCancel={() => {
          setShowConfirmModal(false);
          setSelectedBookingToCancel(null);
        }}
        loading={cancelingBooking}
      />

      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default LecturerBooking;