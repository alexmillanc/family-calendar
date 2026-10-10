import { Component, computed, input, output } from '@angular/core';
import { CalendarEvent, colorMeta } from '../../models/calendar-event';
import {
  eventEnd,
  eventStart,
  formatHour,
  hoursRange,
  isMultiDay,
  layoutWeekSpans,
  weekDays,
} from '../../utils/date-utils';

@Component({
  selector: 'app-week-view',
  templateUrl: './week-view.html',
  styleUrl: './week-view.css',
})
export class WeekView {
  readonly anchor = input.required<Date>();
  readonly events = input.required<CalendarEvent[]>();
  readonly createAt = output<{ date: Date; hour: number }>();
  readonly openEvent = output<CalendarEvent>();

  readonly days = computed(() => weekDays(this.anchor()));
  readonly hours = hoursRange();
  readonly allDay = computed(() => layoutWeekSpans(this.days(), this.events()));

  color(event: CalendarEvent) {
    return colorMeta(event.color);
  }

  timedEvents(dayKey: string): CalendarEvent[] {
    return (this.allDay().timedByDay[dayKey] ?? []).filter((event) => !isMultiDay(event));
  }

  styleFor(event: CalendarEvent): Record<string, string> {
    const start = eventStart(event);
    const end = eventEnd(event);
    const top = ((start.getHours() * 60 + start.getMinutes()) / (24 * 60)) * 100;
    const duration = Math.max((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000), 0.03);
    return {
      top: `${top}%`,
      height: `${duration * 100}%`,
      background: this.color(event).bar,
      color: this.color(event).text,
    };
  }

  hourLabel(hour: number): string {
    return hour === 0 ? '' : formatHour(hour);
  }
}
