const MONTHS_SHORT = [
  'jan', 'feb', 'mrt', 'apr', 'mei', 'jun',
  'jul', 'aug', 'sep', 'okt', 'nov', 'dec'
];

export const DAYS = ['Ma', 'Di', 'Wo', 'Do', 'Vr'];
export const DAYS_FULL = ['Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag'];

export function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

export function getMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function formatDate(date) {
  return `${date.getDate()} ${MONTHS_SHORT[date.getMonth()]}`;
}

export function getWeekDates(mondayDate) {
  return DAYS.map((_, i) => {
    const d = new Date(mondayDate);
    d.setDate(d.getDate() + i);
    return d;
  });
}

export function isCurrentWeek(mondayDate) {
  const today = new Date();
  const currentMonday = getMonday(today);
  return mondayDate.toISOString().slice(0, 10) === currentMonday.toISOString().slice(0, 10);
}

export function getTodayIndex() {
  const today = new Date();
  const day = today.getDay();
  return day === 0 ? -1 : day - 1;
}

// Aliassen voor componenten
export const DAY_LABELS_SHORT = DAYS;

export function formatWeekLabel(monday) {
  const endOfWeek = new Date(monday);
  endOfWeek.setDate(endOfWeek.getDate() + 4);

  const startDay = monday.getDate();
  const endDay = endOfWeek.getDate();
  const startMonth = MONTHS_SHORT[monday.getMonth()];
  const endMonth = MONTHS_SHORT[endOfWeek.getMonth()];

  if (startMonth === endMonth) {
    return `${startDay} - ${endDay} ${endMonth}`;
  }
  return `${startDay} ${startMonth} - ${endDay} ${endMonth}`;
}
