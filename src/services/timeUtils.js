// Get current Jam ke based on time
export const getCurrentJamKe = () => {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const currentTime = hours * 60 + minutes; // Convert to minutes

  // Jam ke time ranges (in minutes from midnight)
  const jamKeRanges = [
    { jamKe: 1, start: 7 * 60 + 30, end: 8 * 60 + 30 },     // 07:30-08:30
    { jamKe: 2, start: 8 * 60 + 30, end: 9 * 60 + 30 },     // 08:30-09:30
    { jamKe: 3, start: 9 * 60 + 30, end: 10 * 60 + 30 },    // 09:30-10:30
    { jamKe: 4, start: 10 * 60 + 30, end: 11 * 60 + 30 },   // 10:30-11:30
    { jamKe: 5, start: 11 * 60 + 30, end: 12 * 60 + 30 },   // 11:30-12:30
    { jamKe: 6, start: 12 * 60 + 30, end: 13 * 60 + 30 },   // 12:30-13:30
    { jamKe: 7, start: 13 * 60 + 30, end: 14 * 60 + 30 },   // 13:30-14:30
    { jamKe: 8, start: 14 * 60 + 30, end: 15 * 60 + 30 },   // 14:30-15:30
    { jamKe: 9, start: 15 * 60 + 30, end: 16 * 60 + 30 },   // 15:30-16:30
    { jamKe: 10, start: 16 * 60 + 30, end: 17 * 60 + 30 },  // 16:30-17:30
  ];

  // Find which Jam ke the current time falls into
  const current = jamKeRanges.find(
    (range) => currentTime >= range.start && currentTime < range.end
  );

  return current ? current.jamKe : null; // null if outside school hours
};

// Get today's date in YYYY-MM-DD format
export const getTodayDate = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};