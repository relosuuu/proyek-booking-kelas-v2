import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getRooms } from '../services/api';

// ─── Reusable Confirm Modal ───────────────────────────────────────────────
function ConfirmModal({ isOpen, title, message, confirmLabel = 'Confirm', confirmColor = '#F44336', onConfirm, onCancel, loading }) {
  if (!isOpen) return null;
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.45)',
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        background: 'white', borderRadius: '14px', padding: '32px',
        maxWidth: '420px', width: '90%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        animation: 'modalSlideUp 0.25s ease-out',
      }}>
        <h3 style={{ fontSize: '20px', color: '#1a2a4e', marginTop: 0, marginBottom: '12px', fontWeight: '700' }}>
          {title}
        </h3>
        <p style={{ fontSize: '14px', color: '#555', lineHeight: '1.6', marginBottom: '28px' }}>
          {message}
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            disabled={loading}
            style={{
              padding: '10px 22px', backgroundColor: '#F0F0F0', color: '#1a2a4e',
              border: '1px solid #DDD', borderRadius: '7px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '14px', fontWeight: '600', transition: 'all 0.2s',
              opacity: loading ? 0.6 : 1,
            }}
            onMouseEnter={(e) => { if (!loading) e.target.style.backgroundColor = '#E0E0E0'; }}
            onMouseLeave={(e) => { if (!loading) e.target.style.backgroundColor = '#F0F0F0'; }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{
              padding: '10px 22px',
              backgroundColor: loading ? '#CCC' : confirmColor,
              color: 'white', border: 'none', borderRadius: '7px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '14px', fontWeight: '600', transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => { if (!loading) e.target.style.opacity = '0.85'; }}
            onMouseLeave={(e) => { if (!loading) e.target.style.opacity = '1'; }}
          >
            {loading ? 'Please wait...' : confirmLabel}
          </button>
        </div>
      </div>
      <style>{`
        @keyframes modalSlideUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────

function ViewClassSchedules({ scenarioId }) {
  const [schedules, setSchedules] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [selectedLecturerId, setSelectedLecturerId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [scheduleToDelete, setScheduleToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [scenarioId]);

  const fetchData = async () => {
    try {
      const schedulesResponse = await axios.get(
        `${process.env.REACT_APP_SUPABASE_URL}/rest/v1/class_schedules?scenario_id=eq.${scenarioId}`,
        {
          headers: {
            'apikey': process.env.REACT_APP_SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
          },
        }
      );
      setSchedules(schedulesResponse.data);

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

      const roomsResponse = await getRooms();
      setRooms(roomsResponse.data);
    } catch (err) {
      setError('Failed to load data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (schedule) => {
    setEditingId(schedule.id);
    setEditForm(schedule);
  };

  const handleUpdateSchedule = async () => {
    try {
      await axios.patch(
        `${process.env.REACT_APP_SUPABASE_URL}/rest/v1/class_schedules?id=eq.${editForm.id}`,
        {
          name: editForm.name,
          room_id: editForm.room_id,
          jam_ke: editForm.jam_ke,
          day_of_week: editForm.day_of_week,
          lecturer_ids: editForm.lecturer_ids,
        },
        {
          headers: {
            'apikey': process.env.REACT_APP_SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
          },
        }
      );
      setMessage('Schedule updated successfully');
      setEditingId(null);
      await fetchData();
    } catch (err) {
      setError('Failed to update schedule');
      console.error(err);
    }
  };

  const handleDeleteClick = (schedule) => {
    setScheduleToDelete(schedule);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!scheduleToDelete) return;
    setDeleting(true);
    try {
      await axios.delete(
        `${process.env.REACT_APP_SUPABASE_URL}/rest/v1/class_schedules?id=eq.${scheduleToDelete.id}`,
        {
          headers: {
            'apikey': process.env.REACT_APP_SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
          },
        }
      );
      setMessage('Schedule deleted successfully');
      await fetchData();
    } catch (err) {
      setError('Failed to delete schedule');
      console.error(err);
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
      setScheduleToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setScheduleToDelete(null);
  };

  const days = [
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
  ];

  const getDayName = (dayNum) => {
    return days.find((d) => d.value === dayNum)?.label || dayNum;
  };

  const filteredLecturers = lecturers.filter(
    (lecturer) =>
      lecturer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lecturer.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lecturerSchedules = selectedLecturerId
    ? schedules.filter((schedule) =>
        schedule.lecturer_ids.includes(selectedLecturerId)
      )
    : [];

  const selectedLecturerName = lecturers.find(
    (l) => l.id === selectedLecturerId
  )?.name;

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px', color: '#6B4E8A' }}>
        Loading class schedules...
      </div>
    );
  }

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
        Class Schedules by Lecturer
      </h2>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 2fr',
        gap: '25px',
        minHeight: '500px',
      }}>
        {/* Lecturer List */}
        <div style={{
          border: '1px solid #E8D4C8',
          padding: '20px',
          borderRadius: '8px',
          backgroundColor: '#FAFAFA',
          maxHeight: '600px',
          overflowY: 'auto',
        }}>
          <input
            type="text"
            placeholder="Search lecturers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              marginBottom: '15px',
              border: '1px solid #E8D4C8',
              borderRadius: '6px',
              boxSizing: 'border-box',
              fontSize: '13px',
              outline: 'none',
            }}
            onFocus={(e) => e.target.style.borderColor = '#6B4E8A'}
            onBlur={(e) => e.target.style.borderColor = '#E8D4C8'}
          />

          {filteredLecturers.length === 0 ? (
            <p style={{ color: '#999', fontSize: '13px' }}>No lecturers found</p>
          ) : (
            <div>
              {filteredLecturers.map((lecturer) => {
                const lecturerHasSchedules = schedules.some((s) =>
                  s.lecturer_ids.includes(lecturer.id)
                );
                return (
                  <button
                    key={lecturer.id}
                    onClick={() => setSelectedLecturerId(lecturer.id)}
                    disabled={!lecturerHasSchedules}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      marginBottom: '8px',
                      backgroundColor:
                        selectedLecturerId === lecturer.id ? '#6B4E8A' : 'white',
                      color: selectedLecturerId === lecturer.id ? 'white' : '#1a2a4e',
                      border: '1px solid ' + (selectedLecturerId === lecturer.id ? '#6B4E8A' : '#E8D4C8'),
                      borderRadius: '6px',
                      cursor: lecturerHasSchedules ? 'pointer' : 'not-allowed',
                      opacity: lecturerHasSchedules ? 1 : 0.5,
                      textAlign: 'left',
                      fontSize: '13px',
                      fontWeight: '600',
                      transition: 'all 0.3s',
                    }}
                    onMouseEnter={(e) => {
                      if (lecturerHasSchedules && selectedLecturerId !== lecturer.id) {
                        e.target.style.backgroundColor = '#F0F0F0';
                        e.target.style.borderColor = '#C5587A';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (lecturerHasSchedules && selectedLecturerId !== lecturer.id) {
                        e.target.style.backgroundColor = 'white';
                        e.target.style.borderColor = '#E8D4C8';
                      }
                    }}
                  >
                    <div style={{ fontWeight: '700' }}>{lecturer.name}</div>
                    <div style={{ fontSize: '11px', opacity: 0.7, marginTop: '3px' }}>
                      {lecturer.id.substring(0, 8)}...
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Class Schedules */}
        <div style={{
          border: '1px solid #E8D4C8',
          padding: '20px',
          borderRadius: '8px',
          backgroundColor: '#FAFAFA',
          maxHeight: '600px',
          overflowY: 'auto',
        }}>
          {selectedLecturerId ? (
            <div>
              <h3 style={{
                fontSize: '16px',
                color: '#1a2a4e',
                marginTop: 0,
                marginBottom: '15px',
                fontWeight: '700',
              }}>
                {selectedLecturerName}
              </h3>

              {lecturerSchedules.length === 0 ? (
                <p style={{ color: '#999', fontSize: '13px' }}>No schedules</p>
              ) : (
                <div>
                  {lecturerSchedules.map((schedule) => (
                    <div
                      key={schedule.id}
                      style={{
                        border: '1px solid #E8D4C8',
                        padding: '14px',
                        marginBottom: '12px',
                        borderRadius: '6px',
                        backgroundColor: 'white',
                      }}
                    >
                      {editingId === schedule.id ? (
                        <div>
                          <div style={{ marginBottom: '10px' }}>
                            <label style={{ fontSize: '12px', fontWeight: '600', color: '#1a2a4e' }}>
                              Class Name
                            </label>
                            <input
                              type="text"
                              value={editForm.name}
                              onChange={(e) =>
                                setEditForm({ ...editForm, name: e.target.value })
                              }
                              style={{
                                width: '100%',
                                padding: '8px 10px',
                                marginTop: '4px',
                                fontSize: '13px',
                                border: '1px solid #E8D4C8',
                                borderRadius: '4px',
                                outline: 'none',
                              }}
                            />
                          </div>

                          <div style={{ marginBottom: '10px' }}>
                            <label style={{ fontSize: '12px', fontWeight: '600', color: '#1a2a4e' }}>
                              Room
                            </label>
                            <select
                              value={editForm.room_id}
                              onChange={(e) =>
                                setEditForm({ ...editForm, room_id: e.target.value })
                              }
                              style={{
                                width: '100%',
                                padding: '8px 10px',
                                marginTop: '4px',
                                fontSize: '13px',
                                border: '1px solid #E8D4C8',
                                borderRadius: '4px',
                                outline: 'none',
                              }}
                            >
                              {rooms.map((room) => (
                                <option key={room.id} value={room.id}>
                                  {room.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div style={{ marginBottom: '10px' }}>
                            <label style={{ fontSize: '12px', fontWeight: '600', color: '#1a2a4e' }}>
                              Jam Ke
                            </label>
                            <select
                              value={editForm.jam_ke}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  jam_ke: parseInt(e.target.value),
                                })
                              }
                              style={{
                                width: '100%',
                                padding: '8px 10px',
                                marginTop: '4px',
                                fontSize: '13px',
                                border: '1px solid #E8D4C8',
                                borderRadius: '4px',
                                outline: 'none',
                              }}
                            >
                              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((slot) => (
                                <option key={slot} value={slot}>
                                  Jam ke-{slot}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div style={{ marginBottom: '10px' }}>
                            <label style={{ fontSize: '12px', fontWeight: '600', color: '#1a2a4e' }}>
                              Day
                            </label>
                            <select
                              value={editForm.day_of_week}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  day_of_week: parseInt(e.target.value),
                                })
                              }
                              style={{
                                width: '100%',
                                padding: '8px 10px',
                                marginTop: '4px',
                                fontSize: '13px',
                                border: '1px solid #E8D4C8',
                                borderRadius: '4px',
                                outline: 'none',
                              }}
                            >
                              {days.map((day) => (
                                <option key={day.value} value={day.value}>
                                  {day.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                            <button
                              onClick={handleUpdateSchedule}
                              style={{
                                flex: 1,
                                padding: '8px',
                                backgroundColor: '#6B4E8A',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: '600',
                              }}
                              onMouseEnter={(e) => e.target.style.backgroundColor = '#5A3E76'}
                              onMouseLeave={(e) => e.target.style.backgroundColor = '#6B4E8A'}
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              style={{
                                flex: 1,
                                padding: '8px',
                                backgroundColor: '#999',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: '600',
                              }}
                              onMouseEnter={(e) => e.target.style.backgroundColor = '#777'}
                              onMouseLeave={(e) => e.target.style.backgroundColor = '#999'}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'start',
                            marginBottom: '10px',
                          }}>
                            <div>
                              <h4 style={{ margin: '0 0 6px 0', fontSize: '14px', color: '#1a2a4e', fontWeight: '700' }}>
                                {schedule.name}
                              </h4>
                              <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#666' }}>
                                {rooms.find((r) => r.id === schedule.room_id)?.name}
                              </p>
                              <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>
                                Jam ke-{schedule.jam_ke} · {getDayName(schedule.day_of_week)}
                              </p>
                            </div>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button
                                onClick={() => handleEdit(schedule)}
                                style={{
                                  padding: '6px 12px',
                                  backgroundColor: '#6B4E8A',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '11px',
                                  fontWeight: '600',
                                }}
                                onMouseEnter={(e) => e.target.style.backgroundColor = '#5A3E76'}
                                onMouseLeave={(e) => e.target.style.backgroundColor = '#6B4E8A'}
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteClick(schedule)}
                                style={{
                                  padding: '6px 12px',
                                  backgroundColor: '#F44336',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '11px',
                                  fontWeight: '600',
                                }}
                                onMouseEnter={(e) => e.target.style.backgroundColor = '#D32F2F'}
                                onMouseLeave={(e) => e.target.style.backgroundColor = '#F44336'}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p style={{ color: '#999', fontSize: '13px', textAlign: 'center', paddingTop: '50px' }}>
              Select a lecturer to view schedules
            </p>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete Class Schedule"
        message={`Are you sure you want to delete "${scheduleToDelete?.name}"? This action cannot be undone.`}
        confirmLabel="Delete Schedule"
        confirmColor="#F44336"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        loading={deleting}
      />

      {message && (
        <div style={{
          marginTop: '20px',
          padding: '12px 16px',
          backgroundColor: '#E8F5E9',
          border: '1px solid #4CAF50',
          borderRadius: '6px',
          color: '#2E7D32',
          fontSize: '13px',
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
          fontSize: '13px',
        }}>
          {error}
        </div>
      )}
    </div>
  );
}

export default ViewClassSchedules;