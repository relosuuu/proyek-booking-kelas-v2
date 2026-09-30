import React, { useState, useEffect } from 'react';
import { getRooms } from '../services/api';

function RoomsList() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await getRooms();
      setRooms(response.data);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (loading) return <div>Loading rooms...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Available Rooms</h2>
      <ul>
        {rooms.map((room) => (
          <li key={room.id}>
            {room.name} - Capacity: {room.capacity}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default RoomsList;