import { Component, computed, input, output } from '@angular/core';
import { CalendarEvent, colorMeta } from '../../models/calendar-event';
import {
  eventsOnDay,
  formatHour,
  formatTime,
  hoursRange,
  isMultiDay,
} from '../../utils/date-utils';

@Component({
  selector: 'app-day-view',
  templateUrl: './day-view.html',
  styleUrl: './day-view.css',
})
export class DayView {
  readonly anchor = input.required<Date>();
  readonly events = input.required<CalendarEvent[]>();
  readonly createAt = output<{ date: Date; hour: number }>();
  readonly openEvent = output<CalendarEvent>();

  readonly hours = hoursRange();
  readonly dayEvents = computed(() => eventsOnDay(this.events(), this.anchor()));
  readonly allDayEvents = computed(() => this.dayEvents().filter((event) => isMultiDay(event)));
  readonly timedEvents = computed(() => this.dayEvents().filter((event) => !isMultiDay(event)));

  color(event: CalendarEvent) {
    return colorMeta(event.color);
  }

  hourLabel(hour: number): string {
    return hour === 0 ? '' : formatHour(hour);
  }

  timeLabel(event: CalendarEvent): string {
    return formatTime(new Date(event.startDate));
  }

  styleFor(event: CalendarEvent): Record<string, string> {
    const start = new Date(event.startDate);
    const end = new Date(event.endDate);
    const top = ((start.getHours() * 60 + start.getMinutes()) / (24 * 60)) * 100;
    const duration = Math.max((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000), 0.04);
    return {
      top: `${top}%`,
      height: `${duration * 100}%`,
      background: this.color(event).bar,
      color: this.color(event).text,
    };
  }
}
