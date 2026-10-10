import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { User } from '../models/user';

const STORAGE_KEY = 'family-calendar.user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly user = signal<User | null>(this.read());

  readonly currentUser = this.user.asReadonly();
  readonly isAuthenticated = computed(() => this.user() !== null);

  login(username: string, password: string): Observable<{ ok: true } | { ok: false; message: string }> {
    const trimmed = username.trim();
    if (!trimmed) {
      return of({ ok: false, message: 'Enter a username.' });
    }
    if (password.length < 4) {
      return of({ ok: false, message: 'Password must be at least 4 characters.' });
    }

    return this.http
      .post<User>(`${environment.apiUrl}/user/login`, { username: trimmed, password })
      .pipe(
        tap((user) => this.persist(user)),
        map(() => ({ ok: true as const })),
        catchError((err) => {
          const status = err?.status;
          if (status === 401) {
            return of({ ok: false as const, message: 'Invalid username or password.' });
          }
          return of({
            ok: false as const,
            message: 'Could not reach the server. Is the backend running?',
          });
        }),
      );
  }

  logout(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.user.set(null);
  }

  private persist(user: User): void {
    const session: User = {
      id: user.id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
      active: user.active,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    this.user.set(session);
  }

  private read(): User | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as User;
      if (parsed?.id && parsed?.username) return parsed;
      return null;
    } catch {
      return null;
    }
  }
}
