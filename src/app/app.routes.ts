import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    loadComponent: () =>
      import('./components/group-breeds/group-breeds').then((m) => m.GroupBreeds),
    path: 'group/:id',
  },
  {
    loadComponent: () => import('./components/breed/breed').then((m) => m.Breed),
    path: 'breed/:id',
  },
  {
    loadComponent: () => import('./components/home/home').then((m) => m.Home),
    path: '',
  },
  { path: '**', pathMatch: 'full', redirectTo: '' },
];
