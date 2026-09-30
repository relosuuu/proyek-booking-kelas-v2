import React, { useState, useEffect, useCallback } from 'react';
import { getRooms, getRoomAvailability } from '../services/api';
import { getCurrentJamKe, getTodayDate } from '../services/timeUtils';

function StudentAvailabilityChecker() {
  const [rooms, setRooms] = useState([]);
  const [selectedCampus, setSelectedCampus] = useState(null);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [currentJamKe, setCurrentJamKe] = useState(null);
  const [today, setToday] = useState('');
  const [availability, setAvailability] = useState({});
  const [roomDetails, setRoomDetails] = useState({});
  const [loading, setLoading] = useState(true);

  const parseRoomNames = useCallback((roomList) => {
    const details = {};
    roomList.forEach((room) => {
      const name = room.name.toUpperCase();
      const campus = name[0];
      const building = name[1];
      const floor = name[2];
      const classNum = name[3];
      details[room.id] = { campus, building, floor, classNum, fullName: name };
    });
    setRoomDetails(details);
  }, []);

  const checkAllAvailability = useCallback(async (roomList) => {
    const availData = {};
    for (const room of roomList) {
      let hasAnyFreeSlot = false;
      for (let jamKe = 1; jamKe <= 10; jamKe++) {
        try {
          const response = await getRoomAvailability(room.id, jamKe, getTodayDate());
          if (response.data.is_available) {
            hasAnyFreeSlot = true;
            break;
          }
        } catch (err) {
          // Continue to next slot
        }
      }
      availData[room.id] = hasAnyFreeSlot;
    }
    setAvailability(availData);
  }, []);

  const fetchRooms = useCallback(async () => {
    try {
      const response = await getRooms();
      setRooms(response.data);
      parseRoomNames(response.data);
      checkAllAvailability(response.data);
    } catch (err) {
      console.error('Failed to load rooms', err);
    } finally {
      setLoading(false);
    }
  }, [parseRoomNames, checkAllAvailability]);

  useEffect(() => {
    fetchRooms();
    setToday(getTodayDate());
    setCurrentJamKe(getCurrentJamKe());

    const interval = setInterval(() => {
      setCurrentJamKe(getCurrentJamKe());
    }, 60000);

    return () => clearInterval(interval);
  }, [fetchRooms]);

  const campuses = [...new Set(Object.values(roomDetails).map((r) => r.campus))];

  const buildings = selectedCampus
    ? [...new Set(
        Object.values(roomDetails)
          .filter((r) => r.campus === selectedCampus)
          .map((r) => r.building)
      )]
    : [];

  const floors = selectedBuilding
    ? [...new Set(
        Object.values(roomDetails)
          .filter(
            (r) =>
              r.campus === selectedCampus && r.building === selectedBuilding
          )
          .map((r) => r.floor)
      )]
    : [];

  const roomsOnFloor = selectedFloor
    ? rooms.filter((room) => {
        const detail = roomDetails[room.id];
        return (
          detail &&
          detail.campus === selectedCampus &&
          detail.building === selectedBuilding &&
          detail.floor === selectedFloor
        );
      })
    : [];

  const hasAvailableSlot = (roomsToCheck) => {
    return roomsToCheck.some((room) => availability[room.id]);
  };

  if (loading) {
    return (
      <div style={{
        maxWidth: '900px',
        margin: '0 auto',
        padding: '20px',
        textAlign: 'center',
      }}>
        <p style={{ color: '#6B4E8A', fontSize: '18px' }}>⏳ Loading rooms...</p>
      </div>
    );
  }

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
          Room Availability
        </h1>
        <p style={{
          fontSize: '16px',
          color: '#6B4E8A',
          margin: 0,
        }}>
          Today: <strong>{today}</strong> | Current Time: <strong>Jam Ke-{currentJamKe || '—'}</strong>
        </p>
      </div>

      {!selectedRoom ? (
        <div>
          {/* Campus Selection */}
          <div style={{ marginBottom: '35px' }}>
            <h2 style={{
              fontSize: '18px',
              color: '#1a2a4e',
              marginBottom: '15px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}>
              <span style={{ fontSize: '24px' }}>🏛️</span>
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
                  onClick={() => {
                    setSelectedCampus(campus);
                    setSelectedBuilding(null);
                    setSelectedFloor(null);
                  }}
                  style={{
                    padding: '14px 20px',
                    backgroundColor: selectedCampus === campus ? '#6B4E8A' : '#F0F0F0',
                    color: selectedCampus === campus ? 'white' : '#1a2a4e',
                    border: '2px solid ' + (selectedCampus === campus ? '#6B4E8A' : '#E0E0E0'),
                    cursor: 'pointer',
                    borderRadius: '8px',
                    fontWeight: '600',
                    fontSize: '14px',
                    transition: 'all 0.3s',
                    transform: selectedCampus === campus ? 'scale(1.05)' : 'scale(1)',
                  }}
                  onMouseEnter={(e) => {
                    if (selectedCampus !== campus) {
                      e.target.style.backgroundColor = '#E8D4C8';
                      e.target.style.borderColor = '#E8D4C8';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedCampus !== campus) {
                      e.target.style.backgroundColor = '#F0F0F0';
                      e.target.style.borderColor = '#E0E0E0';
                    }
                  }}
                >
                  Campus {campus}
                </button>
              ))}
            </div>
          </div>

          {/* Building Selection */}
          {selectedCampus && (
            <div style={{ marginBottom: '35px' }}>
              <h2 style={{
                fontSize: '18px',
                color: '#1a2a4e',
                marginBottom: '15px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}>
                <span style={{ fontSize: '24px' }}>🏢</span>
                Select Building
              </h2>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '12px',
              }}>
                {buildings.map((building) => {
                  const buildingRooms = rooms.filter(
                    (r) =>
                      roomDetails[r.id]?.campus === selectedCampus &&
                      roomDetails[r.id]?.building === building
                  );
                  const isFull = !hasAvailableSlot(buildingRooms);

                  return (
                    <button
                      key={building}
                      onClick={() => {
                        setSelectedBuilding(building);
                        setSelectedFloor(null);
                      }}
                      style={{
                        padding: '14px 20px',
                        backgroundColor: selectedBuilding === building 
                          ? '#6B4E8A' 
                          : isFull ? '#FF6B6B' : '#61DAFB',
                        color: 'white',
                        border: '2px solid ' + (selectedBuilding === building ? '#6B4E8A' : 'transparent'),
                        cursor: 'pointer',
                        borderRadius: '8px',
                        fontWeight: '600',
                        fontSize: '14px',
                        transition: 'all 0.3s',
                        transform: selectedBuilding === building ? 'scale(1.05)' : 'scale(1)',
                      }}
                      onMouseEnter={(e) => {
                        if (selectedBuilding !== building) {
                          e.target.style.transform = 'translateY(-4px)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedBuilding !== building) {
                          e.target.style.transform = 'translateY(0)';
                        }
                      }}
                    >
                      <div style={{ fontWeight: '700' }}>Building {building}</div>
                      <div style={{ fontSize: '12px', marginTop: '4px', opacity: 0.9 }}>
                        {isFull ? 'Full' : 'Free'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Floor Selection */}
          {selectedBuilding && (
            <div style={{ marginBottom: '35px' }}>
              <h2 style={{
                fontSize: '18px',
                color: '#1a2a4e',
                marginBottom: '15px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}>
                <span style={{ fontSize: '24px' }}>📍</span>
                Select Floor
              </h2>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '12px',
              }}>
                {floors.map((floor) => {
                  const floorRooms = rooms.filter(
                    (r) =>
                      roomDetails[r.id]?.campus === selectedCampus &&
                      roomDetails[r.id]?.building === selectedBuilding &&
                      roomDetails[r.id]?.floor === floor
                  );
                  const isFull = !hasAvailableSlot(floorRooms);

                  return (
                    <button
                      key={floor}
                      onClick={() => setSelectedFloor(floor)}
                      style={{
                        padding: '14px 20px',
                        backgroundColor: selectedFloor === floor 
                          ? '#6B4E8A' 
                          : isFull ? '#FF6B6B' : '#61DAFB',
                        color: 'white',
                        border: '2px solid ' + (selectedFloor === floor ? '#6B4E8A' : 'transparent'),
                        cursor: 'pointer',
                        borderRadius: '8px',
                        fontWeight: '600',
                        fontSize: '14px',
                        transition: 'all 0.3s',
                        transform: selectedFloor === floor ? 'scale(1.05)' : 'scale(1)',
                      }}
                      onMouseEnter={(e) => {
                        if (selectedFloor !== floor) {
                          e.target.style.transform = 'translateY(-4px)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedFloor !== floor) {
                          e.target.style.transform = 'translateY(0)';
                        }
                      }}
                    >
                      <div style={{ fontWeight: '700' }}>Floor {floor}</div>
                      <div style={{ fontSize: '12px', marginTop: '4px', opacity: 0.9 }}>
                        {isFull ? 'Full' : 'Free'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Classes on Selected Floor */}
          {selectedFloor && (
            <div>
              <h2 style={{
                fontSize: '18px',
                color: '#1a2a4e',
                marginBottom: '15px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}>
                <span style={{ fontSize: '24px' }}>🚪</span>
                Classes on Floor {selectedFloor}
              </h2>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '12px',
              }}>
                {roomsOnFloor.map((room) => {
                  const isAvailable = availability[room.id];
                  return (
                    <button
                      key={room.id}
                      onClick={() => setSelectedRoom(room.id)}
                      style={{
                        padding: '18px 15px',
                        backgroundColor: isAvailable ? '#61DAFB' : '#FF6B6B',
                        color: 'white',
                        border: '2px solid ' + (isAvailable ? '#61DAFB' : '#FF6B6B'),
                        cursor: 'pointer',
                        borderRadius: '10px',
                        fontSize: '16px',
                        fontWeight: '700',
                        transition: 'all 0.3s',
                        transform: 'scale(1)',
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.transform = 'scale(1.08)';
                        e.target.style.boxShadow = '0 8px 20px rgba(0,0,0,0.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = 'scale(1)';
                        e.target.style.boxShadow = 'none';
                      }}
                    >
                      <div>{room.name}</div>
                      <div style={{ fontSize: '12px', marginTop: '8px', opacity: 0.9 }}>
                        {isAvailable ? 'Free' : 'Full'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        <DetailView
          roomId={selectedRoom}
          roomName={roomDetails[selectedRoom]?.fullName}
          onBack={() => setSelectedRoom(null)}
          today={today}
        />
      )}
    </div>
  );
}

function DetailView({ roomId, roomName, onBack, today }) {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);

  const checkAllSlots = useCallback(async () => {
    const slotData = [];
    for (let jamKe = 1; jamKe <= 10; jamKe++) {
      try {
        const response = await getRoomAvailability(roomId, jamKe, today);
        slotData.push({
          jamKe,
          isAvailable: response.data.is_available,
        });
      } catch (err) {
        slotData.push({
          jamKe,
          isAvailable: false,
        });
      }
    }
    setSlots(slotData);
    setLoading(false);
  }, [roomId, today]);

  useEffect(() => {
    checkAllSlots();
  }, [checkAllSlots]);

  const jamKeNames = {
    1: '07:30-08:30',
    2: '08:30-09:30',
    3: '09:30-10:30',
    4: '10:30-11:30',
    5: '11:30-12:30',
    6: '12:30-13:30',
    7: '13:30-14:30',
    8: '14:30-15:30',
    9: '15:30-16:30',
    10: '16:30-17:30',
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
        <p style={{ color: '#6B4E8A', fontSize: '18px' }}>⏳ Loading time slots...</p>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={onBack}
        style={{
          padding: '10px 20px',
          backgroundColor: '#6B4E8A',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontWeight: '600',
          marginBottom: '30px',
          transition: 'background-color 0.3s',
        }}
        onMouseEnter={(e) => e.target.style.backgroundColor = '#5A3E76'}
        onMouseLeave={(e) => e.target.style.backgroundColor = '#6B4E8A'}
      >
        ← Back
      </button>

      <h2 style={{
        fontSize: '28px',
        color: '#1a2a4e',
        marginBottom: '25px',
        fontWeight: '700',
      }}>
        {roomName} - All Time Slots
      </h2>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '15px',
      }}>
        {slots.map((slot) => (
          <div
            key={slot.jamKe}
            style={{
              padding: '20px',
              backgroundColor: slot.isAvailable ? '#61DAFB' : '#FF6B6B',
              color: 'white',
              borderRadius: '10px',
              textAlign: 'center',
              fontWeight: '600',
              transition: 'all 0.3s',
              transform: 'scale(1)',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'scale(1.05)';
              e.target.style.boxShadow = '0 8px 20px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'scale(1)';
              e.target.style.boxShadow = 'none';
            }}
          >
            <div style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>
              Jam ke-{slot.jamKe}
            </div>
            <div style={{ fontSize: '13px', marginBottom: '10px', opacity: 0.95 }}>
              {jamKeNames[slot.jamKe]}
            </div>
            <div style={{
              fontSize: '12px',
              fontWeight: '700',
              marginTop: '10px',
              paddingTop: '10px',
              borderTop: '1px solid rgba(255,255,255,0.3)',
            }}>
              {slot.isAvailable ? 'Free' : 'Booked'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default StudentAvailabilityChecker;