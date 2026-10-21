import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getRooms, getRoomAvailability } from '../services/api';
import { getCurrentJamKeInfo, getTodayDate, JAM_KE_RANGES } from '../services/timeUtils';

function StudentAvailabilityChecker() {
  const [rooms, setRooms] = useState([]);
  const [selectedCampus, setSelectedCampus] = useState(null);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [filterJamKe, setFilterJamKe] = useState('all'); // 'all' or 1..10
  const [jamInfo, setJamInfo] = useState(getCurrentJamKeInfo());
  const [today, setToday] = useState(getTodayDate());
  const [availability, setAvailability] = useState({});
  const [roomDetails, setRoomDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const [checkingAvail, setCheckingAvail] = useState(false);
  const [error, setError] = useState('');

  const parseRoomNames = useCallback((roomList) => {
    const details = {};
    (roomList || []).forEach((room) => {
      const name = (room.name || '').trim().toUpperCase();
      if (!name) return;
      const campus = name[0] || 'D';
      const building = name[1] || '1';
      const floor = name[2] || '1';
      const classNum = name.substring(3) || '01';
      details[room.id] = { campus, building, floor, classNum, fullName: name };
    });
    setRoomDetails(details);
  }, []);

  const checkAllAvailability = useCallback(async (roomList, targetJam = 'all') => {
    if (!roomList || roomList.length === 0) return;
    setCheckingAvail(true);
    const todayDate = getTodayDate();
    const availData = {};

    try {
      await Promise.all(
        roomList.map(async (room) => {
          if (targetJam !== 'all') {
            try {
              const response = await getRoomAvailability(room.id, parseInt(targetJam, 10), todayDate);
              availData[room.id] = !!response.data?.is_available;
            } catch {
              availData[room.id] = false;
            }
          } else {
            // Check all slots in parallel to see if room has any free slot today
            try {
              const slotPromises = Array.from({ length: 10 }, (_, i) =>
                getRoomAvailability(room.id, i + 1, todayDate)
              );
              const results = await Promise.all(slotPromises);
              availData[room.id] = results.some((r) => r.data?.is_available);
            } catch {
              availData[room.id] = false;
            }
          }
        })
      );
      setAvailability(availData);
    } finally {
      setCheckingAvail(false);
    }
  }, []);

  const fetchRooms = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getRooms();
      const roomList = Array.isArray(response.data) ? response.data : [];
      setRooms(roomList);
      parseRoomNames(roomList);
      await checkAllAvailability(roomList, filterJamKe);
    } catch (err) {
      console.error('Failed to load rooms', err);
      setError('Gagal memuat daftar ruangan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  }, [parseRoomNames, checkAllAvailability, filterJamKe]);

  useEffect(() => {
    fetchRooms();
    setToday(getTodayDate());
    setJamInfo(getCurrentJamKeInfo());

    const interval = setInterval(() => {
      setJamInfo(getCurrentJamKeInfo());
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchRooms]);

  const campuses = useMemo(
    () => [...new Set(Object.values(roomDetails).map((r) => r.campus).filter(Boolean))],
    [roomDetails]
  );

  // Auto-select campus if only 1 exists and none selected yet
  useEffect(() => {
    if (campuses.length === 1 && !selectedCampus) {
      setSelectedCampus(campuses[0]);
    }
  }, [campuses, selectedCampus]);

  const buildings = selectedCampus
    ? [
        ...new Set(
          Object.values(roomDetails)
            .filter((r) => r.campus === selectedCampus)
            .map((r) => r.building)
            .filter(Boolean)
        ),
      ]
    : [];

  const floors = selectedBuilding
    ? [
        ...new Set(
          Object.values(roomDetails)
            .filter(
              (r) =>
                r.campus === selectedCampus && r.building === selectedBuilding
            )
            .map((r) => r.floor)
            .filter(Boolean)
        ),
      ]
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

  const handleFilterJamChange = (newJam) => {
    setFilterJamKe(newJam);
    checkAllAvailability(rooms, newJam);
  };

  if (loading) {
    return (
      <div style={{
        maxWidth: '960px',
        margin: '0 auto',
        padding: '60px 20px',
        textAlign: 'center',
      }}>
        <div style={{
          width: '36px',
          height: '36px',
          border: '4px solid #E0D6EA',
          borderTopColor: '#6B4E8A',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
          margin: '0 auto 16px',
        }} />
        <p style={{ color: '#6B4E8A', fontSize: '16px', fontWeight: '600' }}>
          Memuat data ruangan & ketersediaan...
        </p>
        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: '960px',
      margin: '0 auto',
      padding: '20px',
    }}>
      {/* Title & Current Jam-Ke Banner */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '24px 28px',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.08)',
        marginBottom: '30px',
        border: '2px solid #E8D4C8',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <h1 style={{
              fontSize: '28px',
              color: '#1a2a4e',
              margin: '0 0 6px 0',
              fontWeight: '700',
            }}>
              Room Availability Checker
            </h1>
            <p style={{
              fontSize: '14px',
              color: '#6B4E8A',
              margin: 0,
            }}>
              Lihat jadwal dan status ketersediaan ruangan kelas secara real-time
            </p>
          </div>

          <button
            onClick={fetchRooms}
            style={{
              padding: '8px 16px',
              backgroundColor: '#F5F5F5',
              color: '#1a2a4e',
              border: '1px solid #E8D4C8',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '600',
            }}
          >
            Refresh
          </button>
        </div>

        {/* Live Jam-Ke and Date Info */}
        <div style={{
          marginTop: '20px',
          padding: '16px 20px',
          background: '#FAFAFA',
          borderRadius: '8px',
          border: '1px solid #E8D4C8',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
        }}>
          <div>
            <div style={{ fontSize: '12px', color: '#6B4E8A', fontWeight: '600' }}>
              Tanggal Hari Ini
            </div>
            <div style={{ fontSize: '16px', color: '#1a2a4e', fontWeight: '700', marginTop: '2px' }}>
              {today}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '12px', color: '#6B4E8A', fontWeight: '600' }}>
              Waktu Saat Ini
            </div>
            <div style={{ fontSize: '16px', color: '#1a2a4e', fontWeight: '700', marginTop: '2px' }}>
              {jamInfo.timeFormatted} WIB
            </div>
          </div>

          <div>
            <div style={{ fontSize: '12px', color: '#6B4E8A', fontWeight: '600' }}>
              Status Jam Perkuliahan
            </div>
            <div style={{ marginTop: '4px' }}>
              {jamInfo.isClassHours ? (
                <span style={{
                  backgroundColor: '#E8F5E9',
                  color: '#2E7D32',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontWeight: '700',
                  fontSize: '13px',
                  display: 'inline-block',
                }}>
                  Jam Ke-{jamInfo.jamKe} ({jamInfo.label})
                </span>
              ) : (
                <span style={{
                  backgroundColor: '#F5F5F5',
                  color: '#666',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontWeight: '600',
                  fontSize: '12px',
                  display: 'inline-block',
                }}>
                  {jamInfo.statusText}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Filter Jam-Ke Slot */}
        <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <span style={{ fontSize: '13px', fontWeight: '600', color: '#1a2a4e' }}>
            Filter Ketersediaan:
          </span>

          <button
            onClick={() => handleFilterJamChange('all')}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: '1px solid ' + (filterJamKe === 'all' ? '#6B4E8A' : '#E8D4C8'),
              backgroundColor: filterJamKe === 'all' ? '#6B4E8A' : 'white',
              color: filterJamKe === 'all' ? 'white' : '#1a2a4e',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            Semua Jam (Ada Slot Kosong)
          </button>

          {jamInfo.isClassHours && (
            <button
              onClick={() => handleFilterJamChange(jamInfo.jamKe)}
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                border: '1px solid ' + (filterJamKe === jamInfo.jamKe ? '#4CAF50' : '#C8E6C9'),
                backgroundColor: filterJamKe === jamInfo.jamKe ? '#4CAF50' : '#E8F5E9',
                color: filterJamKe === jamInfo.jamKe ? 'white' : '#2E7D32',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
              }}
            >
              Saat Ini (Jam Ke-{jamInfo.jamKe})
            </button>
          )}

          <select
            value={filterJamKe}
            onChange={(e) => handleFilterJamChange(e.target.value)}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              border: '1px solid #E8D4C8',
              backgroundColor: 'white',
              fontSize: '12px',
              color: '#1a2a4e',
              cursor: 'pointer',
              fontWeight: '500',
            }}
          >
            <option value="all">Pilih Jam Tertentu...</option>
            {JAM_KE_RANGES.map((r) => (
              <option key={r.jamKe} value={r.jamKe}>
                Jam Ke-{r.jamKe} ({r.label})
              </option>
            ))}
          </select>

          {checkingAvail && (
            <span style={{ fontSize: '12px', color: '#6B4E8A', marginLeft: '6px' }}>
              Memeriksa ketersediaan...
            </span>
          )}
        </div>
      </div>

      {error && (
        <div style={{
          backgroundColor: '#FFEBEE',
          border: '1px solid #F44336',
          color: '#C62828',
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '20px',
          fontSize: '14px',
        }}>
          {error}
        </div>
      )}

      {!selectedRoom ? (
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '30px',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.08)',
          border: '1px solid #E8D4C8',
        }}>
          {/* Campus Selection */}
          <div style={{ marginBottom: '35px' }}>
            <h2 style={{
              fontSize: '18px',
              color: '#1a2a4e',
              marginBottom: '15px',
              fontWeight: '700',
            }}>
              Pilih Lokasi Kampus ({campuses.length} Tersedia)
            </h2>

            {campuses.length === 0 ? (
              <div style={{
                padding: '20px',
                background: '#FAFAFA',
                borderRadius: '8px',
                color: '#999',
                textAlign: 'center',
                fontSize: '14px',
              }}>
                Tidak ada data kampus yang ditemukan di database.
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: '12px',
              }}>
                {campuses.map((campus) => {
                  const campusRoomCount = Object.values(roomDetails).filter((r) => r.campus === campus).length;
                  const isSelected = selectedCampus === campus;

                  return (
                    <button
                      key={campus}
                      onClick={() => {
                        setSelectedCampus(campus);
                        setSelectedBuilding(null);
                        setSelectedFloor(null);
                      }}
                      style={{
                        padding: '14px 18px',
                        backgroundColor: isSelected ? '#6B4E8A' : '#F5F5F5',
                        color: isSelected ? 'white' : '#1a2a4e',
                        border: '2px solid ' + (isSelected ? '#6B4E8A' : '#E8D4C8'),
                        cursor: 'pointer',
                        borderRadius: '8px',
                        fontWeight: '600',
                        fontSize: '14px',
                        transition: 'all 0.3s',
                        textAlign: 'left',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.backgroundColor = '#E8D4C8';
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.backgroundColor = '#F5F5F5';
                      }}
                    >
                      <div>Kampus {campus}</div>
                      <div style={{
                        fontSize: '12px',
                        marginTop: '4px',
                        opacity: isSelected ? 0.9 : 0.6,
                        fontWeight: '500',
                      }}>
                        {campusRoomCount} Ruangan Kelas
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Building Selection */}
          {selectedCampus && (
            <div style={{ marginBottom: '35px', paddingTop: '20px', borderTop: '1px solid #F0F0F0' }}>
              <h2 style={{
                fontSize: '18px',
                color: '#1a2a4e',
                marginBottom: '15px',
                fontWeight: '700',
              }}>
                Pilih Gedung di Kampus {selectedCampus}
              </h2>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: '12px',
              }}>
                {buildings.map((building) => {
                  const buildingRooms = rooms.filter(
                    (r) =>
                      roomDetails[r.id]?.campus === selectedCampus &&
                      roomDetails[r.id]?.building === building
                  );
                  const isFull = !hasAvailableSlot(buildingRooms);
                  const isSelected = selectedBuilding === building;

                  let cardBg = isFull ? '#FFEBEE' : '#E8F5E9';
                  let cardBorder = isFull ? '#FFCDD2' : '#C8E6C9';
                  let textColor = isFull ? '#C62828' : '#2E7D32';

                  if (isSelected) {
                    cardBg = '#C5587A';
                    cardBorder = '#C5587A';
                    textColor = 'white';
                  }

                  return (
                    <button
                      key={building}
                      onClick={() => {
                        setSelectedBuilding(building);
                        setSelectedFloor(null);
                      }}
                      style={{
                        padding: '14px 18px',
                        backgroundColor: cardBg,
                        color: textColor,
                        border: '2px solid ' + cardBorder,
                        cursor: 'pointer',
                        borderRadius: '8px',
                        fontWeight: '700',
                        fontSize: '14px',
                        transition: 'all 0.25s',
                        textAlign: 'left',
                      }}
                    >
                      <div>Gedung {building}</div>
                      <div style={{ fontSize: '12px', marginTop: '6px', opacity: isSelected ? 0.9 : 0.85, fontWeight: '500' }}>
                        {isFull ? 'Penuh' : 'Ada Ruang Kosong'} &middot; {buildingRooms.length} Kelas
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Floor Selection */}
          {selectedBuilding && (
            <div style={{ marginBottom: '35px', paddingTop: '20px', borderTop: '1px solid #F0F0F0' }}>
              <h2 style={{
                fontSize: '18px',
                color: '#1a2a4e',
                marginBottom: '15px',
                fontWeight: '700',
              }}>
                Pilih Lantai di Gedung {selectedBuilding}
              </h2>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
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
                  const isSelected = selectedFloor === floor;

                  let cardBg = isFull ? '#FFEBEE' : '#E8F5E9';
                  let cardBorder = isFull ? '#FFCDD2' : '#C8E6C9';
                  let textColor = isFull ? '#C62828' : '#2E7D32';

                  if (isSelected) {
                    cardBg = '#1E293B';
                    cardBorder = '#1E293B';
                    textColor = 'white';
                  }

                  return (
                    <button
                      key={floor}
                      onClick={() => setSelectedFloor(floor)}
                      style={{
                        padding: '14px 18px',
                        backgroundColor: cardBg,
                        color: textColor,
                        border: '2px solid ' + cardBorder,
                        cursor: 'pointer',
                        borderRadius: '8px',
                        fontWeight: '700',
                        fontSize: '14px',
                        transition: 'all 0.25s',
                        textAlign: 'left',
                      }}
                    >
                      <div>Lantai {floor}</div>
                      <div style={{ fontSize: '12px', marginTop: '6px', opacity: isSelected ? 0.9 : 0.85, fontWeight: '500' }}>
                        {isFull ? 'Penuh' : 'Ada Kosong'} &middot; {floorRooms.length} Kelas
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Classes on Selected Floor */}
          {selectedFloor && (
            <div style={{ paddingTop: '20px', borderTop: '1px solid #F0F0F0' }}>
              <h2 style={{
                fontSize: '18px',
                color: '#1a2a4e',
                marginBottom: '15px',
                fontWeight: '700',
              }}>
                Ruangan Kelas di Lantai {selectedFloor}
              </h2>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '14px',
              }}>
                {roomsOnFloor.map((room) => {
                  const isAvailable = availability[room.id];
                  return (
                    <button
                      key={room.id}
                      onClick={() => setSelectedRoom(room.id)}
                      style={{
                        padding: '18px 16px',
                        backgroundColor: isAvailable ? '#E8F5E9' : '#FFEBEE',
                        color: isAvailable ? '#2E7D32' : '#C62828',
                        border: '2px solid ' + (isAvailable ? '#C8E6C9' : '#FFCDD2'),
                        cursor: 'pointer',
                        borderRadius: '10px',
                        fontSize: '16px',
                        fontWeight: '700',
                        transition: 'all 0.2s',
                        textAlign: 'center',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                    >
                      <div style={{ fontSize: '18px', fontWeight: '800' }}>{room.name}</div>
                      <div style={{
                        fontSize: '11px',
                        marginTop: '8px',
                        padding: '3px 8px',
                        borderRadius: '12px',
                        display: 'inline-block',
                        backgroundColor: isAvailable ? '#C8E6C9' : '#FFCDD2',
                        fontWeight: '700',
                      }}>
                        {isAvailable ? 'Tersedia' : 'Penuh'}
                      </div>
                      <div style={{ fontSize: '11px', marginTop: '6px', opacity: 0.75, color: '#1a2a4e' }}>
                        Kapasitas: {room.capacity} org
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
          roomName={roomDetails[selectedRoom]?.fullName || rooms.find((r) => r.id === selectedRoom)?.name}
          onBack={() => setSelectedRoom(null)}
          today={today}
          currentJamKe={jamInfo.jamKe}
        />
      )}
    </div>
  );
}

function DetailView({ roomId, roomName, onBack, today, currentJamKe }) {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);

  const checkAllSlots = useCallback(async () => {
    setLoading(true);
    try {
      const slotPromises = Array.from({ length: 10 }, async (_, i) => {
        const jamKe = i + 1;
        try {
          const response = await getRoomAvailability(roomId, jamKe, today);
          return {
            jamKe,
            isAvailable: !!response.data?.is_available,
          };
        } catch (err) {
          return {
            jamKe,
            isAvailable: false,
          };
        }
      });
      const slotData = await Promise.all(slotPromises);
      setSlots(slotData);
    } finally {
      setLoading(false);
    }
  }, [roomId, today]);

  useEffect(() => {
    checkAllSlots();
  }, [checkAllSlots]);

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

  if (loading) {
    return (
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '50px 20px',
        textAlign: 'center',
        border: '1px solid #E8D4C8',
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          border: '4px solid #E0D6EA',
          borderTopColor: '#6B4E8A',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
          margin: '0 auto 14px',
        }} />
        <p style={{ color: '#6B4E8A', fontSize: '15px', fontWeight: '600' }}>
          Memeriksa 10 slot jam perkuliahan untuk {roomName}...
        </p>
        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '30px',
      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.08)',
      border: '1px solid #E8D4C8',
    }}>
      <button
        onClick={onBack}
        style={{
          padding: '10px 20px',
          backgroundColor: '#F5F5F5',
          color: '#1a2a4e',
          border: '1px solid #E8D4C8',
          borderRadius: '8px',
          cursor: 'pointer',
          fontWeight: '600',
          fontSize: '14px',
          marginBottom: '24px',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#E8D4C8'; }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#F5F5F5'; }}
      >
        ← Kembali ke Daftar Ruangan
      </button>

      <div style={{ marginBottom: '25px' }}>
        <h2 style={{
          fontSize: '24px',
          color: '#1a2a4e',
          margin: '0 0 6px 0',
          fontWeight: '700',
        }}>
          Ruang {roomName} — Jadwal Hari Ini ({today})
        </h2>
        <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>
          Status ketersediaan di setiap jam perkuliahan (Jam Ke-1 s/d Jam Ke-10):
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '14px',
      }}>
        {slots.map((slot) => {
          const isCurrentSlot = currentJamKe === slot.jamKe;

          return (
            <div
              key={slot.jamKe}
              style={{
                padding: '18px 14px',
                backgroundColor: slot.isAvailable ? '#E8F5E9' : '#FFEBEE',
                color: slot.isAvailable ? '#2E7D32' : '#C62828',
                border: '2px solid ' + (isCurrentSlot ? '#6B4E8A' : (slot.isAvailable ? '#C8E6C9' : '#FFCDD2')),
                borderRadius: '10px',
                textAlign: 'center',
                fontWeight: '600',
              }}
            >
              <div style={{ fontSize: '17px', fontWeight: '800', marginBottom: '4px' }}>
                Jam Ke-{slot.jamKe}
              </div>
              <div style={{ fontSize: '12px', marginBottom: '10px', opacity: 0.85, fontWeight: '500' }}>
                {jamKeNames[slot.jamKe]}
              </div>
              <div style={{
                fontSize: '12px',
                fontWeight: '700',
                padding: '4px 10px',
                borderRadius: '12px',
                display: 'inline-block',
                backgroundColor: slot.isAvailable ? '#C8E6C9' : '#FFCDD2',
              }}>
                {slot.isAvailable ? 'Tersedia' : 'Terpakai'}
              </div>
              {isCurrentSlot && (
                <div style={{ fontSize: '11px', marginTop: '8px', fontWeight: '700', color: '#6B4E8A' }}>
                  Saat ini
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default StudentAvailabilityChecker;