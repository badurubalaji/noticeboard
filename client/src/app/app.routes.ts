import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'auth',
    canActivate: [guestGuard],
    children: [
      {
        path: 'login',
        loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent),
      },
      {
        path: 'register',
        loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent),
      },
      { path: '', redirectTo: 'login', pathMatch: 'full' },
    ],
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/layout').then(m => m.LayoutComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard').then(m => m.DashboardComponent),
      },
      {
        path: 'notices',
        children: [
          {
            path: '',
            loadComponent: () => import('./features/notices/notice-list').then(m => m.NoticeListComponent),
          },
          {
            path: 'new',
            loadComponent: () => import('./features/notices/notice-form').then(m => m.NoticeFormComponent),
          },
          {
            path: ':id/edit',
            loadComponent: () => import('./features/notices/notice-form').then(m => m.NoticeFormComponent),
          },
        ],
      },
      {
        path: 'templates',
        loadComponent: () => import('./features/templates/templates').then(m => m.TemplatesComponent),
      },
      {
        path: 'boards',
        children: [
          {
            path: '',
            loadComponent: () => import('./features/boards/board-list').then(m => m.BoardListComponent),
          },
          {
            path: 'new',
            loadComponent: () => import('./features/boards/board-form').then(m => m.BoardFormComponent),
          },
          {
            path: ':id/edit',
            loadComponent: () => import('./features/boards/board-form').then(m => m.BoardFormComponent),
          },
          {
            path: ':id/design',
            loadComponent: () => import('./features/boards/board-designer/board-designer').then(m => m.BoardDesignerComponent),
          },
        ],
      },
      {
        path: 'media',
        loadComponent: () => import('./features/media/media').then(m => m.MediaComponent),
      },
      {
        path: 'settings',
        loadComponent: () => import('./features/settings/settings').then(m => m.SettingsComponent),
      },
      {
        path: 'help',
        loadComponent: () => import('./features/help/help').then(m => m.HelpComponent),
      },
    ],
  },
  {
    path: 'display/:boardId',
    loadComponent: () => import('./features/display/display').then(m => m.DisplayComponent),
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
