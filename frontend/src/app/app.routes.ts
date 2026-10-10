import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'calendar' },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then((m) => m.Login),
    canActivate: [guestGuard],
  },
  {
    path: 'calendar',
    loadComponent: () => import('./pages/calendar/calendar').then((m) => m.CalendarPage),
    canActivate: [authGuard],
  },
  { path: '**', redirectTo: 'calendar' },
];
