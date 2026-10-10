import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, map, of, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { asEventColor, CalendarEvent, EventDraft } from '../models/calendar-event';
import { AuthService } from './auth.service';

interface ApiEvent {
  id: number;
  title: string;
  description: string;
  address?: string | null;
  startDate: string;
  endDate?: string | null;
  allDay?: boolean;
  color?: string | null;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  user?: { id: number } | null;
}

@Injectable({ providedIn: 'root' })
export class EventService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  private readonly eventsState = signal<CalendarEvent[]>([]);
  readonly events = this.eventsState.asReadonly();
  readonly count = computed(() => this.eventsState().length);

  load(): Observable<CalendarEvent[]> {
    const user = this.auth.currentUser();
    if (!user) {
      this.eventsState.set([]);
      return of([]);
    }

    return this.http
      .get<ApiEvent[]>(`${environment.apiUrl}/event`, { params: { userId: user.id } })
      .pipe(
        map((list) =>
          list.filter((event) => !event.deletedAt).map((event) => this.fromApi(event)),
        ),
        tap({
          next: (mapped) => this.eventsState.set(mapped),
          error: () => this.eventsState.set([]),
        }),
      );
  }

  clear(): void {
    this.eventsState.set([]);
  }

  create(draft: EventDraft): Observable<CalendarEvent> {
    return this.http.post<ApiEvent>(`${environment.apiUrl}/event`, this.toApiBody(draft)).pipe(
      map((created) => this.fromApi(created)),
      tap((created) => this.eventsState.update((list) => [...list, created])),
    );
  }

  update(id: number, draft: EventDraft): Observable<CalendarEvent> {
    return this.http.put<ApiEvent>(`${environment.apiUrl}/event/${id}`, this.toApiBody(draft, id)).pipe(
      map((updated) => this.fromApi(updated)),
      tap((updated) =>
        this.eventsState.update((list) => list.map((event) => (event.id === id ? updated : event))),
      ),
    );
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/event/${id}`).pipe(
      tap(() => this.eventsState.update((list) => list.filter((event) => event.id !== id))),
    );
  }

  byId(id: number): CalendarEvent | undefined {
    return this.eventsState().find((event) => event.id === id);
  }

  private toApiBody(draft: EventDraft, id?: number): Record<string, unknown> {
    const user = this.auth.currentUser();
    const body: Record<string, unknown> = {
      title: draft.title,
      description: draft.description,
      address: draft.address,
      startDate: draft.startDate,
      endDate: draft.endDate,
      allDay: draft.allDay,
      color: draft.color,
      user: user ? { id: user.id } : null,
    };
    if (id !== undefined) {
      body['id'] = id;
    }
    return body;
  }

  private fromApi(event: ApiEvent): CalendarEvent {
    return {
      id: event.id,
      title: event.title ?? '',
      description: event.description ?? '',
      address: event.address ?? '',
      startDate: event.startDate,
      endDate: event.endDate ?? event.startDate,
      allDay: !!event.allDay,
      color: asEventColor(event.color ?? undefined),
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
      deletedAt: event.deletedAt,
      user: event.user ? { id: event.user.id } : null,
    };
  }
}
