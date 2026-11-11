import { Component, OnInit, computed, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CalendarEvent, EVENT_COLORS, EventColor, EventDraft, Frequency } from '../../models/calendar-event';
import { combineDateTime, toApiDateTime, toDateInput, toTimeInput } from '../../utils/date-utils';

export interface EventDialogData {
  event?: CalendarEvent;
  date: Date;
  hour?: number;
}

@Component({
  selector: 'app-event-dialog',
  imports: [ReactiveFormsModule],
  templateUrl: './event-dialog.html',
  styleUrl: './event-dialog.css',
})
export class EventDialog implements OnInit {
  private readonly fb = new FormBuilder();

  readonly data = input.required<EventDialogData>();
  readonly save = output<{ id?: number; draft: EventDraft }>();
  readonly remove = output<{ id: number; deleteAllEventsFromSerie: boolean }>();
  readonly closed = output<void>();

  readonly colors = EVENT_COLORS;
  readonly confirmDelete = signal(false);

  readonly isEdit = computed(() => !!this.data().event);
  readonly isSeries = computed(() => this.data().event?.eventSerie?.id != null);

  readonly form = this.fb.nonNullable.group({
    title: ['', Validators.required],
    description: [''],
    address: [''],
    date: ['', Validators.required],
    time: ['09:00', Validators.required],
    endDate: ['', Validators.required],
    endTime: ['10:00', Validators.required],
    allDay: [false],
    color: this.fb.nonNullable.control<EventColor>('green'),
    repeat: [false],
    interval: [1],
    frequency: this.fb.nonNullable.control<Frequency>('WEEKLY'),
    repeatUntil: [''],
  });

  ngOnInit(): void {
    this.hydrate();
  }

  private hydrate(): void {
    const { event, date, hour } = this.data();
    if (event) {
      const start = new Date(event.startDate);
      const end = new Date(event.endDate);
      this.form.patchValue({
        title: event.title,
        description: event.description,
        address: event.address,
        date: toDateInput(start),
        time: toTimeInput(start),
        endDate: toDateInput(end),
        endTime: toTimeInput(end),
        allDay: event.allDay,
        color: event.color,
      });
      return;
    }
    const start = new Date(date);
    if (hour !== undefined) start.setHours(hour, 0, 0, 0);
    else if (start.getHours() === 0) start.setHours(9, 0, 0, 0);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    this.form.patchValue({
      date: toDateInput(start),
      time: toTimeInput(start),
      endDate: toDateInput(end),
      endTime: toTimeInput(end),
    });
  }

  onRepeatToggle(event: Event): void {
    const checked = event.target instanceof HTMLInputElement && event.target.checked;
    if (!checked || this.form.controls.repeatUntil.value) return;
    const start = combineDateTime(this.form.controls.date.value || toDateInput(new Date()), '12:00');
    const until = new Date(start.getFullYear(), start.getMonth() + 3, start.getDate());
    this.form.controls.repeatUntil.setValue(toDateInput(until));
  }

  unitLabel(unit: 'week' | 'month' | 'year'): string {
    return Number(this.form.controls.interval.value) === 1 ? unit : `${unit}s`;
  }

  repeatHint(): { text: string; error: boolean } | null {
    if (this.isEdit() || !this.form.controls.repeat.value) return null;
    const value = this.form.getRawValue();
    const interval = Number(value.interval);
    if (!value.date) return { text: 'Choose a start date first.', error: true };
    if (!Number.isInteger(interval) || interval < 1) {
      return { text: 'The repeat interval must be at least 1.', error: true };
    }
    if (!value.repeatUntil) return { text: 'Choose the last day of the series.', error: true };

    const start = combineDateTime(value.date, value.allDay ? '00:00' : value.time);
    const until = combineDateTime(value.repeatUntil, value.allDay ? '00:00' : value.time);
    if (until < start) return { text: 'The end date must be on or after the start date.', error: true };

    const count = countOccurrences(start, until, value.frequency, interval);
    if (count > 500) {
      return { text: 'That series would create more than 500 events. Choose a shorter period.', error: true };
    }
    const untilLabel = until.toLocaleDateString('en', { day: 'numeric', month: 'long', year: 'numeric' });
    const events = count === 1 ? '1 event' : `${count} events`;
    return {
      text: `This will create ${events}, ${cadenceLabel(value.frequency, interval, start)}, until ${untilLabel}.`,
      error: false,
    };
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const hint = this.repeatHint();
    if (hint?.error) return;

    const value = this.form.getRawValue();
    let start = combineDateTime(value.date, value.allDay ? '00:00' : value.time);
    let end = combineDateTime(value.endDate, value.allDay ? '23:59' : value.endTime);
    if (end <= start) {
      end = new Date(start.getTime() + 60 * 60 * 1000);
    }
    const draft: EventDraft = {
      title: value.title.trim(),
      description: value.description.trim(),
      address: value.address.trim(),
      startDate: toApiDateTime(start),
      endDate: toApiDateTime(end),
      allDay: value.allDay,
      color: value.color,
    };
    if (!this.isEdit() && value.repeat) {
      const until = combineDateTime(value.repeatUntil, value.allDay ? '00:00' : value.time);
      draft.eventSerie = {
        frequency: value.frequency,
        interval: Number(value.interval),
        startDate: toApiDateTime(start),
        endDate: toApiDateTime(until),
      };
    }
    const existingSerie = this.data().event?.eventSerie;
    if (existingSerie?.id) {
      draft.eventSerie = existingSerie;
    }
    this.save.emit({ id: this.data().event?.id, draft });
  }

  requestDelete(): void {
    this.confirmDelete.set(true);
  }

  cancelDelete(): void {
    this.confirmDelete.set(false);
  }

  confirmRemoval(deleteAllEventsFromSerie: boolean): void {
    const id = this.data().event?.id;
    if (id !== undefined) this.remove.emit({ id, deleteAllEventsFromSerie });
  }
}

function cadenceLabel(frequency: Frequency, interval: number, start: Date): string {
  if (frequency === 'WEEKLY' && interval === 1) {
    const weekday = start.toLocaleDateString('en', { weekday: 'long' });
    return `every ${weekday}`;
  }
  const unit = frequency === 'WEEKLY' ? 'week' : frequency === 'MONTHLY' ? 'month' : 'year';
  return interval === 1 ? `every ${unit}` : `every ${interval} ${unit}s`;
}

function countOccurrences(start: Date, until: Date, frequency: Frequency, interval: number): number {
  let count = 0;
  let cursor = new Date(start);
  while (cursor.getTime() <= until.getTime()) {
    count += 1;
    if (count > 500) return count;
    cursor = addFrequency(cursor, frequency, interval);
  }
  return count;
}

function addFrequency(date: Date, frequency: Frequency, interval: number): Date {
  const next = new Date(date);
  if (frequency === 'WEEKLY') {
    next.setDate(next.getDate() + 7 * interval);
    return next;
  }
  if (frequency === 'MONTHLY') return addMonthsClamped(next, interval);
  return addMonthsClamped(next, interval * 12);
}

function addMonthsClamped(date: Date, months: number): Date {
  const day = date.getDate();
  const next = new Date(date);
  next.setDate(1);
  next.setMonth(next.getMonth() + months);
  const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
  next.setDate(Math.min(day, lastDay));
  return next;
}
