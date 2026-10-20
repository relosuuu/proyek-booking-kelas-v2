import axios from 'axios';

// Supabase REST configuration
const SUPABASE_URL =
  process.env.REACT_APP_SUPABASE_URL || 'https://ttlsypuiqznzncuazvjj.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.REACT_APP_SUPABASE_ANON_KEY || 'sb_publishable_0Qj_5J_QIOWiUNHBAAL_lQ_nmATdBxb';

const supabaseHeaders = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json',
};

const supabaseClient = axios.create({
  baseURL: `${SUPABASE_URL}/rest/v1`,
  headers: supabaseHeaders,
});

// Helper for backend URL if running locally
const BACKEND_URL = (process.env.REACT_APP_API_URL || '').replace(/\/+$/, '');

const api = axios.create({
  baseURL: BACKEND_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper: calculate day_of_week (1=Mon ... 6=Sat, Sunday is null)
const getDayOfWeekFromDate = (dateStr) => {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split('-').map(Number);
  const dateObj = new Date(Date.UTC(year, month - 1, day));
  const jsDay = dateObj.getUTCDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  return jsDay === 0 ? null : jsDay;
};

// ─── Room endpoints ──────────────────────────────────────────────────────────

export const getRooms = async () => {
  // Try backend first if BACKEND_URL is explicitly configured and not default
  if (BACKEND_URL && BACKEND_URL !== '/api') {
    try {
      const endpoint = BACKEND_URL.endsWith('/api')
        ? `${BACKEND_URL}/rooms`
        : `${BACKEND_URL}/api/rooms`;
      const res = await axios.get(endpoint, { timeout: 3000 });
      if (Array.isArray(res.data) && res.data.length > 0) {
        return { data: res.data };
      }
    } catch (e) {
      // Backend unreachable or returned error, fallback to Supabase directly
    }
  }

  // Direct Supabase REST fetch
  const res = await supabaseClient.get('/rooms?select=*&order=name.asc');
  const rooms = Array.isArray(res.data) ? res.data : [];
  return { data: rooms };
};

export const getRoomAvailability = async (roomId, jam_ke, date) => {
  const jamKeInt = parseInt(jam_ke, 10);

  // 1. Check active booking in bookings table
  const bookingsRes = await supabaseClient.get(
    `/bookings?room_id=eq.${roomId}&jam_ke=eq.${jamKeInt}&date=eq.${date}&status=eq.active&select=id`
  );
  const hasActiveBooking = Array.isArray(bookingsRes.data) && bookingsRes.data.length > 0;

  // 2. Check class schedules for matching day_of_week and jam_ke
  const dayOfWeek = getDayOfWeekFromDate(date);
  let hasScheduleConflict = false;

  if (dayOfWeek !== null) {
    const schedulesRes = await supabaseClient.get(
      `/class_schedules?room_id=eq.${roomId}&jam_ke=eq.${jamKeInt}&day_of_week=eq.${dayOfWeek}&select=id,name`
    );
    hasScheduleConflict = Array.isArray(schedulesRes.data) && schedulesRes.data.length > 0;
  }

  const isBooked = hasActiveBooking || hasScheduleConflict;

  return {
    data: {
      room_id: roomId,
      jam_ke: jamKeInt,
      date: date,
      is_available: !isBooked,
      status: isBooked ? 'booked' : 'free',
    },
  };
};

// ─── Booking endpoints ───────────────────────────────────────────────────────

export const createBooking = async (lecturer_id, room_id, jam_ke, date, booking_type) => {
  const jamKeInt = parseInt(jam_ke, 10);

  // Check active booking
  const existingRes = await supabaseClient.get(
    `/bookings?room_id=eq.${room_id}&jam_ke=eq.${jamKeInt}&date=eq.${date}&status=eq.active&select=id`
  );
  if (Array.isArray(existingRes.data) && existingRes.data.length > 0) {
    const err = new Error('Room is already booked for the selected time slot.');
    err.response = { data: { error: err.message }, status: 400 };
    throw err;
  }

  // Check schedule conflict
  const dayOfWeek = getDayOfWeekFromDate(date);
  if (dayOfWeek !== null) {
    const conflictRes = await supabaseClient.get(
      `/class_schedules?room_id=eq.${room_id}&jam_ke=eq.${jamKeInt}&day_of_week=eq.${dayOfWeek}&select=id,name`
    );
    if (Array.isArray(conflictRes.data) && conflictRes.data.length > 0) {
      const err = new Error(
        `Room is not available — there is already a class schedule (${conflictRes.data[0].name}) at this time slot.`
      );
      err.response = { data: { error: err.message }, status: 400 };
      throw err;
    }
  }

  // Get active scenario
  const scenarioRes = await supabaseClient.get('/scenarios?is_active=eq.true&select=id');
  if (!scenarioRes.data || scenarioRes.data.length === 0) {
    const err = new Error('No active scenario. Please activate a scenario first.');
    err.response = { data: { error: err.message }, status: 400 };
    throw err;
  }
  const activeScenario = scenarioRes.data[0];

  // Insert into bookings
  const insertRes = await supabaseClient.post(
    '/bookings',
    {
      lecturer_id,
      room_id,
      date,
      jam_ke: jamKeInt,
      scenario_id: activeScenario.id,
      status: 'active',
      booking_type: booking_type || 'extra',
    },
    {
      headers: {
        Prefer: 'return=representation',
      },
    }
  );

  return {
    data: {
      message: 'Booking created successfully',
      booking: insertRes.data[0],
    },
  };
};

export const getMyBookings = async (lecturerId) => {
  const res = await supabaseClient.get(
    `/bookings?lecturer_id=eq.${lecturerId}&order=date.asc`
  );
  return {
    data: {
      lecturer_id: lecturerId,
      bookings: Array.isArray(res.data) ? res.data : [],
    },
  };
};

export const getAllBookings = async () => {
  const [bRes, rRes, uRes] = await Promise.all([
    supabaseClient.get('/bookings?order=date.asc'),
    supabaseClient.get('/rooms?select=id,name'),
    supabaseClient.get('/users?role=eq.lecturer&select=id,name'),
  ]);

  const roomMap = {};
  (Array.isArray(rRes.data) ? rRes.data : []).forEach((r) => {
    roomMap[r.id] = r.name;
  });

  const userMap = {};
  (Array.isArray(uRes.data) ? uRes.data : []).forEach((u) => {
    userMap[u.id] = u.name;
  });

  const enrichedBookings = (Array.isArray(bRes.data) ? bRes.data : []).map((b) => ({
    ...b,
    room_name: roomMap[b.room_id] || b.room_id,
    lecturer_name: userMap[b.lecturer_id] || b.lecturer_id,
  }));

  return {
    data: {
      total_bookings: enrichedBookings.length,
      bookings: enrichedBookings,
    },
  };
};

export const cancelBooking = async (bookingId) => {
  const res = await supabaseClient.patch(
    `/bookings?id=eq.${bookingId}`,
    { status: 'canceled' },
    {
      headers: {
        Prefer: 'return=representation',
      },
    }
  );
  return {
    data: {
      message: 'Booking canceled successfully',
      booking: (res.data || [])[0],
    },
  };
};

// ─── Class schedule endpoints ───────────────────────────────────────────────

export const createClassSchedule = async (
  name,
  room_id,
  jam_ke,
  day_of_week,
  lecturer_ids,
  scenario_id,
  created_by
) => {
  const jamKeInt = parseInt(jam_ke, 10);
  const dayOfWeekInt = parseInt(day_of_week, 10);

  // Check whether schedule conflict exists
  const conflictRes = await supabaseClient.get(
    `/class_schedules?room_id=eq.${room_id}&jam_ke=eq.${jamKeInt}&day_of_week=eq.${dayOfWeekInt}&select=name`
  );
  if (Array.isArray(conflictRes.data) && conflictRes.data.length > 0) {
    const err = new Error(
      `Room is already scheduled for "${conflictRes.data[0].name}" at this time slot on this day.`
    );
    err.response = { data: { error: err.message }, status: 400 };
    throw err;
  }

  const insertRes = await supabaseClient.post(
    '/class_schedules',
    {
      name,
      room_id,
      jam_ke: jamKeInt,
      day_of_week: dayOfWeekInt,
      lecturer_ids,
      scenario_id,
      created_by,
    },
    {
      headers: {
        Prefer: 'return=representation',
      },
    }
  );

  return {
    data: {
      message: 'Class schedule created successfully',
      schedule: insertRes.data[0],
    },
  };
};

// ─── Scenario endpoints ─────────────────────────────────────────────────────

export const activateScenario = async (scenarioId) => {
  // 1. Get active scenarios
  const activeRes = await supabaseClient.get('/scenarios?is_active=eq.true&select=id');
  if (Array.isArray(activeRes.data) && activeRes.data.length > 0) {
    const oldId = activeRes.data[0].id;
    // Cancel active bookings for old scenario
    await supabaseClient.patch(
      `/bookings?scenario_id=eq.${oldId}&status=eq.active`,
      { status: 'canceled' }
    );
  }

  // 2. Set new scenario active
  const activateRes = await supabaseClient.patch(
    `/scenarios?id=eq.${scenarioId}`,
    { is_active: true },
    {
      headers: {
        Prefer: 'return=representation',
      },
    }
  );

  // 3. Set other scenarios inactive
  await supabaseClient.patch(
    `/scenarios?id=neq.${scenarioId}`,
    { is_active: false }
  );

  const scenario = (activateRes.data || [])[0];
  return {
    data: {
      message: `Scenario '${scenario?.name || ''}' activated successfully. All previous bookings canceled.`,
      scenario,
    },
  };
};

export default api;