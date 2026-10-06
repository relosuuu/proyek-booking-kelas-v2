import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Room endpoints
export const getRooms = () => api.get('/rooms');
export const getRoomAvailability = (roomId, jam_ke, date) =>
  api.get(`/rooms/${roomId}/availability?jam_ke=${jam_ke}&date=${date}`);

// Booking endpoints
export const createBooking = (lecturer_id, room_id, jam_ke, date, booking_type) =>
  api.post('/bookings', { lecturer_id, room_id, jam_ke, date, booking_type });

export const getMyBookings = (lecturerId) =>
  api.get(`/my-bookings/${lecturerId}`);

export const getAllBookings = () =>
  api.get('/all-bookings');

export const cancelBooking = (bookingId) =>
  api.put(`/bookings/${bookingId}/cancel`);

// Class schedule endpoints
export const createClassSchedule = (name, room_id, jam_ke, day_of_week, lecturer_ids, scenario_id, created_by) =>
  api.post('/class-schedules', { name, room_id, jam_ke, day_of_week, lecturer_ids, scenario_id, created_by });

// Scenario endpoints
export const activateScenario = (scenarioId) =>
  api.post(`/scenarios/${scenarioId}/activate`);

export default api;