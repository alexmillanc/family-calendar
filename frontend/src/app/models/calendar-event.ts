export type EventColor = 'green' | 'blue' | 'teal' | 'orange' | 'red' | 'purple';

const EVENT_COLOR_IDS: EventColor[] = ['green', 'blue', 'teal', 'orange', 'red', 'purple'];

export interface CalendarEvent {
  id: number;
  title: string;
  description: string;
  address: string;
  startDate: string;
  endDate: string;
  allDay: boolean;
  color: EventColor;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  user?: { id: number } | null;
}

export interface EventDraft {
  title: string;
  description: string;
  address: string;
  startDate: string;
  endDate: string;
  allDay: boolean;
  color: EventColor;
}

export const EVENT_COLORS: { id: EventColor; label: string; bar: string; text: string; dot: string }[] = [
  { id: 'green', label: 'Green', bar: '#d9f2dc', text: '#1b6b32', dot: '#34a853' },
  { id: 'blue', label: 'Blue', bar: '#d2e3fc', text: '#174ea6', dot: '#1a73e8' },
  { id: 'teal', label: 'Teal', bar: '#cceee8', text: '#0d7377', dot: '#0b9b8a' },
  { id: 'orange', label: 'Orange', bar: '#fde7c7', text: '#a15c00', dot: '#f9ab00' },
  { id: 'red', label: 'Red', bar: '#fad2cf', text: '#a50e0e', dot: '#ea4335' },
  { id: 'purple', label: 'Purple', bar: '#e6d6f5', text: '#5b2c8a', dot: '#a142f4' },
];

export function colorMeta(color: EventColor) {
  return EVENT_COLORS.find((c) => c.id === color) ?? EVENT_COLORS[0];
}

export function asEventColor(value: string | null | undefined): EventColor {
  return EVENT_COLOR_IDS.includes(value as EventColor) ? (value as EventColor) : 'green';
}
