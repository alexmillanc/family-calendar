import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DayView } from '../../components/day-view/day-view';
import { EventDialog, EventDialogData } from '../../components/event-dialog/event-dialog';
import { MonthView } from '../../components/month-view/month-view';
import { WeekView } from '../../components/week-view/week-view';
import { CalendarEvent, EventDraft } from '../../models/calendar-event';
import { AuthService } from '../../services/auth.service';
import { EventService } from '../../services/event.service';
import { CalendarView, shiftAnchor, toolbarTitle } from '../../utils/date-utils';

@Component({
  selector: 'app-calendar',
  imports: [FormsModule, MonthView, WeekView, DayView, EventDialog],
  templateUrl: './calendar.html',
  styleUrl: './calendar.css',
})
export class CalendarPage implements OnInit {
  private readonly eventsApi = inject(EventService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly views: CalendarView[] = ['day', 'week', 'month'];
  readonly view = signal<CalendarView>('month');
  readonly anchor = signal(new Date());
  readonly query = signal('');
  readonly dialog = signal<EventDialogData | null>(null);
  readonly loadError = signal('');

  readonly user = this.auth.currentUser;
  readonly title = computed(() => toolbarTitle(this.anchor(), this.view()));

  readonly visibleEvents = computed(() => {
    const q = this.query().trim().toLowerCase();
    const events = this.eventsApi.events();
    if (!q) return events;
    return events.filter((event) =>
      [event.title, event.description, event.address].join(' ').toLowerCase().includes(q),
    );
  });

  ngOnInit(): void {
    this.eventsApi.load().subscribe({
      error: () => this.loadError.set('Could not load events from the backend.'),
    });
  }

  setView(view: CalendarView): void {
    this.view.set(view);
  }

  today(): void {
    this.anchor.set(new Date());
  }

  step(direction: number): void {
    this.anchor.set(shiftAnchor(this.anchor(), this.view(), direction));
  }

  openCreate(date: Date, hour?: number): void {
    this.dialog.set({ date, hour });
  }

  openEvent(event: CalendarEvent): void {
    this.dialog.set({ event, date: new Date(event.startDate) });
  }

  closeDialog(): void {
    this.dialog.set(null);
  }

  saveEvent(payload: { id?: number; draft: EventDraft }): void {
    const request = payload.id
      ? this.eventsApi.update(payload.id, payload.draft)
      : this.eventsApi.create(payload.draft);
    request.subscribe({
      next: () => this.closeDialog(),
      error: () => this.loadError.set('Could not save the event.'),
    });
  }

  deleteEvent(id: number): void {
    this.eventsApi.remove(id).subscribe({
      next: () => this.closeDialog(),
      error: () => this.loadError.set('Could not delete the event.'),
    });
  }

  logout(): void {
    this.eventsApi.clear();
    this.auth.logout();
    void this.router.navigateByUrl('/login');
  }
}
