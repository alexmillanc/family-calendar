import { CalendarEvent } from '../models/calendar-event';

export type CalendarView = 'day' | 'week' | 'month';

const WEEKDAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function pad(n: number): string {
  return String(n).padStart(2, '0');
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function endOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

export function addDays(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount, date.getHours(), date.getMinutes());
}

export function addMonths(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function weekdayLabels(): string[] {
  return WEEKDAYS;
}

export function monthName(date: Date): string {
  return MONTHS[date.getMonth()];
}

export function monthShort(date: Date): string {
  return MONTHS_SHORT[date.getMonth()];
}

export function startOfWeek(date: Date): Date {
  const start = startOfDay(date);
  const daysFromMonday = (start.getDay() + 6) % 7;
  return addDays(start, -daysFromMonday);
}

export function endOfWeek(date: Date): Date {
  return endOfDay(addDays(startOfWeek(date), 6));
}

export function daysBetween(a: Date, b: Date): number {
  const ms = startOfDay(b).getTime() - startOfDay(a).getTime();
  return Math.round(ms / 86_400_000);
}

export function eventStart(event: CalendarEvent): Date {
  return new Date(event.startDate);
}

export function eventEnd(event: CalendarEvent): Date {
  return new Date(event.endDate);
}

/** Formats a Date as LocalDateTime JSON for the Spring backend (no timezone suffix). */
export function toApiDateTime(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export function isMultiDay(event: CalendarEvent): boolean {
  return !isSameDay(eventStart(event), eventEnd(event)) || event.allDay;
}

export function eventOverlapsRange(event: CalendarEvent, from: Date, to: Date): boolean {
  return eventStart(event) <= to && eventEnd(event) >= from;
}

export function eventsOnDay(events: CalendarEvent[], day: Date): CalendarEvent[] {
  const from = startOfDay(day);
  const to = endOfDay(day);
  return events
    .filter((event) => eventOverlapsRange(event, from, to))
    .sort((a, b) => eventStart(a).getTime() - eventStart(b).getTime());
}

export interface MonthCell {
  date: Date;
  key: string;
  inCurrentMonth: boolean;
  isToday: boolean;
  monthLabel: string | null;
}

export function buildMonthWeeks(anchor: Date, today = new Date()): MonthCell[][] {
  const year = anchor.getFullYear();
  const month = anchor.getMonth();
  const first = new Date(year, month, 1);
  let cursor = startOfWeek(first);
  const weeks: MonthCell[][] = [];

  for (let w = 0; w < 6; w++) {
    const week: MonthCell[] = [];
    for (let d = 0; d < 7; d++) {
      const showMonth = cursor.getDate() === 1;
      week.push({
        date: cursor,
        key: toDateKey(cursor),
        inCurrentMonth: cursor.getMonth() === month,
        isToday: isSameDay(cursor, today),
        monthLabel: showMonth ? `${monthShort(cursor)} ${cursor.getDate()}` : null,
      });
      cursor = addDays(cursor, 1);
    }
    weeks.push(week);
  }
  return weeks;
}

export function weekDays(anchor: Date, today = new Date()): MonthCell[] {
  let cursor = startOfWeek(anchor);
  const days: MonthCell[] = [];
  for (let d = 0; d < 7; d++) {
    days.push({
      date: cursor,
      key: toDateKey(cursor),
      inCurrentMonth: true,
      isToday: isSameDay(cursor, today),
      monthLabel: cursor.getDate() === 1 ? `${monthShort(cursor)} ${cursor.getDate()}` : null,
    });
    cursor = addDays(cursor, 1);
  }
  return days;
}

export interface SpanLayout {
  event: CalendarEvent;
  col: number;
  span: number;
  lane: number;
  continuesBefore: boolean;
  continuesAfter: boolean;
}

export function layoutWeekSpans(
  week: MonthCell[],
  events: CalendarEvent[],
): { spans: SpanLayout[]; timedByDay: Record<string, CalendarEvent[]>; laneCount: number } {
  const weekStart = startOfDay(week[0].date);
  const weekEnd = endOfDay(week[6].date);
  const spanning: CalendarEvent[] = [];
  const timedByDay: Record<string, CalendarEvent[]> = {};

  for (const event of events) {
    if (!eventOverlapsRange(event, weekStart, weekEnd)) continue;
    if (isMultiDay(event)) {
      spanning.push(event);
    } else {
      const key = toDateKey(eventStart(event));
      timedByDay[key] = [...(timedByDay[key] ?? []), event];
    }
  }

  spanning.sort((a, b) => {
    const startDiff = eventStart(a).getTime() - eventStart(b).getTime();
    if (startDiff !== 0) return startDiff;
    return eventEnd(b).getTime() - eventEnd(a).getTime();
  });

  const occupied: number[] = [];
  const spans: SpanLayout[] = [];

  for (const event of spanning) {
    const evStart = startOfDay(eventStart(event));
    const evEnd = startOfDay(eventEnd(event));
    const colStart = Math.max(0, daysBetween(weekStart, evStart));
    const colEnd = Math.min(6, daysBetween(weekStart, evEnd));
    const span = colEnd - colStart + 1;
    let lane = 0;
    while (occupied[lane] !== undefined && occupied[lane] >= colStart) {
      lane += 1;
    }
    occupied[lane] = colEnd;
    spans.push({
      event,
      col: colStart + 1,
      span,
      lane,
      continuesBefore: evStart < weekStart,
      continuesAfter: evEnd > startOfDay(week[6].date),
    });
  }

  return { spans, timedByDay, laneCount: occupied.length };
}

export function formatHour(hour: number): string {
  if (hour === 0) return '12 AM';
  if (hour === 12) return '12 PM';
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
}

export function formatTime(date: Date): string {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const h = hours % 12 || 12;
  if (minutes === 0) return `${h} ${suffix}`;
  return `${h}:${pad(minutes)} ${suffix}`;
}

export function toDateInput(date: Date): string {
  return toDateKey(date);
}

export function toTimeInput(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function combineDateTime(dateStr: string, timeStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  const [hh, mm] = (timeStr || '09:00').split(':').map(Number);
  return new Date(y, m - 1, d, hh, mm, 0, 0);
}

export function shiftAnchor(anchor: Date, view: CalendarView, direction: number): Date {
  if (view === 'day') return addDays(anchor, direction);
  if (view === 'week') return addDays(anchor, direction * 7);
  return addMonths(anchor, direction);
}

export function toolbarTitle(anchor: Date, view: CalendarView): string {
  if (view === 'day') {
    return anchor.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }
  if (view === 'week') {
    const start = startOfWeek(anchor);
    const end = addDays(start, 6);
    const sameMonth = start.getMonth() === end.getMonth();
    const sameYear = start.getFullYear() === end.getFullYear();
    if (sameMonth) {
      return `${monthShort(start)} ${start.getDate()} – ${end.getDate()}, ${end.getFullYear()}`;
    }
    if (sameYear) {
      return `${monthShort(start)} ${start.getDate()} – ${monthShort(end)} ${end.getDate()}, ${end.getFullYear()}`;
    }
    return `${monthShort(start)} ${start.getDate()}, ${start.getFullYear()} – ${monthShort(end)} ${end.getDate()}, ${end.getFullYear()}`;
  }
  return `${monthName(anchor)} ${anchor.getFullYear()}`;
}

export function hoursRange(): number[] {
  return Array.from({ length: 24 }, (_, i) => i);
}
