import { Component, computed, input, output } from '@angular/core';
import { CalendarEvent, colorMeta } from '../../models/calendar-event';
import {
  MonthCell,
  buildMonthWeeks,
  formatTime,
  layoutWeekSpans,
  weekdayLabels,
} from '../../utils/date-utils';

@Component({
  selector: 'app-month-view',
  templateUrl: './month-view.html',
  styleUrl: './month-view.css',
})
export class MonthView {
  readonly anchor = input.required<Date>();
  readonly events = input.required<CalendarEvent[]>();
  readonly createAt = output<Date>();
  readonly openEvent = output<CalendarEvent>();

  readonly weekdays = weekdayLabels();
  readonly weeks = computed(() => buildMonthWeeks(this.anchor()));

  weekModel(week: MonthCell[]) {
    return layoutWeekSpans(week, this.events());
  }

  color(event: CalendarEvent) {
    return colorMeta(event.color);
  }

  timeLabel(event: CalendarEvent): string {
    return formatTime(new Date(event.startDate));
  }
}
