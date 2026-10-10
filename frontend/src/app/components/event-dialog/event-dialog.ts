import { Component, OnInit, computed, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CalendarEvent, EVENT_COLORS, EventColor, EventDraft } from '../../models/calendar-event';
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
  readonly remove = output<number>();
  readonly closed = output<void>();

  readonly colors = EVENT_COLORS;
  readonly confirmDelete = signal(false);

  readonly isEdit = computed(() => !!this.data().event);

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

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
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
    this.save.emit({ id: this.data().event?.id, draft });
  }

  requestDelete(): void {
    this.confirmDelete.set(true);
  }

  confirmRemoval(): void {
    const id = this.data().event?.id;
    if (id !== undefined) this.remove.emit(id);
  }
}
