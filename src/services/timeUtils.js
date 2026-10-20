// Jam ke time ranges (in minutes from midnight)
export const JAM_KE_RANGES = [
  { jamKe: 1, start: 7 * 60 + 30, end: 8 * 60 + 30, label: '07:30 - 08:30' },
  { jamKe: 2, start: 8 * 60 + 30, end: 9 * 60 + 30, label: '08:30 - 09:30' },
  { jamKe: 3, start: 9 * 60 + 30, end: 10 * 60 + 30, label: '09:30 - 10:30' },
  { jamKe: 4, start: 10 * 60 + 30, end: 11 * 60 + 30, label: '10:30 - 11:30' },
  { jamKe: 5, start: 11 * 60 + 30, end: 12 * 60 + 30, label: '11:30 - 12:30' },
  { jamKe: 6, start: 12 * 60 + 30, end: 13 * 60 + 30, label: '12:30 - 13:30' },
  { jamKe: 7, start: 13 * 60 + 30, end: 14 * 60 + 30, label: '13:30 - 14:30' },
  { jamKe: 8, start: 14 * 60 + 30, end: 15 * 60 + 30, label: '14:30 - 15:30' },
  { jamKe: 9, start: 15 * 60 + 30, end: 16 * 60 + 30, label: '15:30 - 16:30' },
  { jamKe: 10, start: 16 * 60 + 30, end: 17 * 60 + 30, label: '16:30 - 17:30' },
];

// Get current Jam ke based on time (returns number 1-10 or null)
export const getCurrentJamKe = () => {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const currentTime = hours * 60 + minutes;

  const current = JAM_KE_RANGES.find(
    (range) => currentTime >= range.start && currentTime < range.end
  );

  return current ? current.jamKe : null;
};

// Get rich info about current jam-ke, time, and session status
export const getCurrentJamKeInfo = () => {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const currentTime = hours * 60 + minutes;
  const timeFormatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

  const current = JAM_KE_RANGES.find(
    (range) => currentTime >= range.start && currentTime < range.end
  );

  let statusText = '';
  if (current) {
    statusText = `Jam Ke-${current.jamKe} (${current.label})`;
  } else if (currentTime < 7 * 60 + 30) {
    statusText = `Sebelum Jam Kuliah (Mulai 07:30)`;
  } else {
    statusText = `Selesai Perkuliahan / Di luar jam kuliah (07:30 - 17:30)`;
  }

  return {
    jamKe: current ? current.jamKe : null,
    isClassHours: !!current,
    timeFormatted,
    statusText,
    label: current ? current.label : '',
  };
};

// Get today's date in local YYYY-MM-DD format (avoids UTC timezone day-shift bug)
export const getTodayDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};