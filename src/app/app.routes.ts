import { Routes } from '@angular/router';
import { adminGuard } from './Guards/admin-guard';
import { workerGuard } from './Guards/worker-guard';
import { redirectGuard } from './Guards/redirect-guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./blank/blank').then((x) => x.Blank),
    canActivate: [redirectGuard],
  },
  {
    path: 'signin',
    loadComponent: () => import('./signin/signin').then((x) => x.Signin),
  },
  {
    path: 'signup',
    loadComponent: () => import('./signup/signup').then((x) => x.Signup),
  },
  {
    path: 'admin',
    loadComponent: () => import('./Admin/nav/nav').then((x) => x.Nav),
    canActivate: [adminGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./Admin/dash-board/dash-board').then((x) => x.DashBoard),
      },
      {
        path: 'medicines',
        loadComponent: () => import('./Admin/medicines/medicines').then((x) => x.Medicines),
      },

      {
        path: 'workers',
        loadComponent: () => import('./Admin/workers/workers').then((x) => x.Workers),
      },
      {
        path: 'transactions',
        loadComponent: () =>
          import('./Admin/transactions/transactions').then((x) => x.Transactions),
      },
    ],
  },
  {
    path: 'worker',
    loadComponent: () => import('./Worker/nav/nav').then((x) => x.Nav),
    canActivate: [workerGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./Worker/dashboard/dashboard').then((x) => x.Dashboard),
      },
      {
        path: 'inventory',
        loadComponent: () => import('./Worker/inventory/inventory').then((x) => x.Inventory),
      },
      {
        path: 'mywork',
        loadComponent: () =>
          import('./Worker/assigned-work/assigned-work').then((x) => x.AssignedWork),
      },

      {
        path: 'sales',
        loadComponent: () => import('./Worker/sales/sales').then((x) => x.Sales),
      },
    ],
  },
];
