import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getRooms, createClassSchedule } from '../services/api';

function CreateClassSchedule({ adminId, scenarioId }) {
  const [rooms, setRooms] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [lecturerSearch, setLecturerSearch] = useState('');
  const [filteredLecturers, setFilteredLecturers] = useState([]);
  const [selectedLecturers, setSelectedLecturers] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    room_id: '',
    jam_ke: '',
    day_of_week: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const roomsResponse = await getRooms();
      setRooms(roomsResponse.data);

      const lecturersResponse = await axios.get(
        `${process.env.REACT_APP_SUPABASE_URL}/rest/v1/users?role=eq.lecturer`,
        {
          headers: {
            'apikey': process.env.REACT_APP_SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
          },
        }
      );
      setLecturers(lecturersResponse.data);
    } catch (err) {
      setError('Failed to load data');
    }
  };

  const handleLecturerSearch = (value) => {
    setLecturerSearch(value);
    if (value.trim().length === 0) {
      setFilteredLecturers([]);
      return;
    }

    const filtered = lecturers.filter(
      (lecturer) =>
        !selectedLecturers.find((s) => s.id === lecturer.id) &&
        (lecturer.name.toLowerCase().includes(value.toLowerCase()) ||
          lecturer.id.toLowerCase().includes(value.toLowerCase()))
    );
    setFilteredLecturers(filtered);
  };

  const handleSelectLecturer = (lecturer) => {
    setSelectedLecturers([...selectedLecturers, lecturer]);
    setLecturerSearch('');
    setFilteredLecturers([]);
  };

  const handleRemoveLecturer = (lecturerId) => {
    setSelectedLecturers(selectedLecturers.filter((l) => l.id !== lecturerId));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      if (selectedLecturers.length === 0) {
        setError('Please select at least one lecturer');
        setLoading(false);
        return;
      }

      const lecturerIds = selectedLecturers.map((l) => l.id);

      await createClassSchedule(
        formData.name,
        formData.room_id,
        parseInt(formData.jam_ke),
        parseInt(formData.day_of_week),
        lecturerIds,
        scenarioId,
        adminId
      );

      setMessage('Class schedule created successfully');
      setFormData({
        name: '',
        room_id: '',
        jam_ke: '',
        day_of_week: '',
      });
      setSelectedLecturers([]);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create class schedule');
    } finally {
      setLoading(false);
    }
  };

  const days = [
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
  ];

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '30px',
      marginBottom: '30px',
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
        Create Class Schedule
      </h2>

      <form onSubmit={handleSubmit}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '20px',
          marginBottom: '25px',
        }}>
          {/* Class Name */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '600',
              color: '#1a2a4e',
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}>
              Class Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Algoritma"
              required
              style={{
                width: '100%',
                padding: '11px 14px',
                fontSize: '14px',
                border: '1px solid #E8D4C8',
                borderRadius: '6px',
                boxSizing: 'border-box',
                transition: 'border-color 0.3s',
                outline: 'none',
              }}
              onFocus={(e) => e.target.style.borderColor = '#6B4E8A'}
              onBlur={(e) => e.target.style.borderColor = '#E8D4C8'}
            />
          </div>

          {/* Room */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '600',
              color: '#1a2a4e',
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}>
              Room
            </label>
            <select
              name="room_id"
              value={formData.room_id}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '11px 14px',
                fontSize: '14px',
                border: '1px solid #E8D4C8',
                borderRadius: '6px',
                boxSizing: 'border-box',
                outline: 'none',
                backgroundColor: 'white',
                cursor: 'pointer',
              }}
              onFocus={(e) => e.target.style.borderColor = '#6B4E8A'}
              onBlur={(e) => e.target.style.borderColor = '#E8D4C8'}
            >
              <option value="">Select a room</option>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name}
                </option>
              ))}
            </select>
          </div>

          {/* Time Slot */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '600',
              color: '#1a2a4e',
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}>
              Time Slot
            </label>
            <select
              name="jam_ke"
              value={formData.jam_ke}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '11px 14px',
                fontSize: '14px',
                border: '1px solid #E8D4C8',
                borderRadius: '6px',
                boxSizing: 'border-box',
                outline: 'none',
                backgroundColor: 'white',
                cursor: 'pointer',
              }}
              onFocus={(e) => e.target.style.borderColor = '#6B4E8A'}
              onBlur={(e) => e.target.style.borderColor = '#E8D4C8'}
            >
              <option value="">Select time slot</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((slot) => (
                <option key={slot} value={slot}>
                  Jam ke-{slot}
                </option>
              ))}
            </select>
          </div>

          {/* Day */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '600',
              color: '#1a2a4e',
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}>
              Day of Week
            </label>
            <select
              name="day_of_week"
              value={formData.day_of_week}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '11px 14px',
                fontSize: '14px',
                border: '1px solid #E8D4C8',
                borderRadius: '6px',
                boxSizing: 'border-box',
                outline: 'none',
                backgroundColor: 'white',
                cursor: 'pointer',
              }}
              onFocus={(e) => e.target.style.borderColor = '#6B4E8A'}
              onBlur={(e) => e.target.style.borderColor = '#E8D4C8'}
            >
              <option value="">Select day</option>
              {days.map((day) => (
                <option key={day.value} value={day.value}>
                  {day.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Lecturer Search & Selection */}
        <div style={{ marginBottom: '25px' }}>
          <label style={{
            display: 'block',
            fontSize: '13px',
            fontWeight: '600',
            color: '#1a2a4e',
            marginBottom: '8px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}>
            Select Lecturers
          </label>

          <div style={{ position: 'relative', marginBottom: '15px' }}>
            <input
              type="text"
              placeholder="Search by name or ID..."
              value={lecturerSearch}
              onChange={(e) => handleLecturerSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '11px 14px',
                fontSize: '14px',
                border: '1px solid #E8D4C8',
                borderRadius: '6px',
                boxSizing: 'border-box',
                outline: 'none',
              }}
              onFocus={(e) => e.target.style.borderColor = '#6B4E8A'}
              onBlur={(e) => e.target.style.borderColor = '#E8D4C8'}
            />

            {/* Dropdown List */}
            {filteredLecturers.length > 0 && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                backgroundColor: 'white',
                border: '1px solid #E8D4C8',
                borderTop: 'none',
                borderRadius: '0 0 6px 6px',
                maxHeight: '200px',
                overflowY: 'auto',
                zIndex: 10,
              }}>
                {filteredLecturers.map((lecturer) => (
                  <button
                    key={lecturer.id}
                    type="button"
                    onClick={() => handleSelectLecturer(lecturer)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: 'none',
                      backgroundColor: 'white',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '13px',
                      borderBottom: '1px solid #F0F0F0',
                      transition: 'background-color 0.2s',
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#F9F9F9'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                  >
                    <div style={{ fontWeight: '600', color: '#1a2a4e' }}>
                      {lecturer.name}
                    </div>
                    <div style={{ fontSize: '11px', color: '#999', marginTop: '2px' }}>
                      {lecturer.id.substring(0, 12)}...
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Selected Lecturers */}
          {selectedLecturers.length > 0 && (
            <div style={{
              padding: '15px',
              backgroundColor: '#F9F9F9',
              border: '1px solid #E8D4C8',
              borderRadius: '6px',
            }}>
              <p style={{
                margin: '0 0 12px 0',
                fontSize: '13px',
                fontWeight: '600',
                color: '#1a2a4e',
              }}>
                Selected Lecturers ({selectedLecturers.length})
              </p>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
              }}>
                {selectedLecturers.map((lecturer) => (
                  <div
                    key={lecturer.id}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 12px',
                      backgroundColor: '#6B4E8A',
                      color: 'white',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: '600',
                    }}
                  >
                    <span>{lecturer.name}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveLecturer(lecturer.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '16px',
                        padding: '0',
                        lineHeight: '1',
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: loading ? '#CCC' : '#6B4E8A',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            transition: 'background-color 0.3s',
            opacity: loading ? 0.8 : 1,
          }}
          onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#5A3E76')}
          onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = '#6B4E8A')}
        >
          {loading ? 'Creating...' : 'Create Schedule'}
        </button>
      </form>

      {message && (
        <div style={{
          marginTop: '20px',
          padding: '12px 16px',
          backgroundColor: '#E8F5E9',
          border: '1px solid #4CAF50',
          borderRadius: '6px',
          color: '#2E7D32',
          fontSize: '14px',
        }}>
          {message}
        </div>
      )}

      {error && (
        <div style={{
          marginTop: '20px',
          padding: '12px 16px',
          backgroundColor: '#FFEBEE',
          border: '1px solid #F44336',
          borderRadius: '6px',
          color: '#C62828',
          fontSize: '14px',
        }}>
          {error}
        </div>
      )}
    </div>
  );
}

export default CreateClassSchedule;