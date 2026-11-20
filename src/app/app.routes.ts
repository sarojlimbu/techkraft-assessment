import { Routes } from '@angular/router';
import { reviewerGuard } from './core/guards/reviewer.guard';
import { salesOrAdminGuard } from './core/guards/reviewer.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.Dashboard),
  },
  {
    path: 'applications/new',
    canActivate: [salesOrAdminGuard],
    loadComponent: () =>
      import('./features/merchant/new-application/new-application').then(
        (m) => m.MerchantApplicationComponent,
      ),
  },
  {
    path: 'applications/:id/edit',
    canActivate: [salesOrAdminGuard],
    loadComponent: () =>
      import('./features/merchant/new-application/new-application').then(
        (m) => m.MerchantApplicationComponent,
      ),
  },
  {
    path: 'applications/:id',
    loadComponent: () =>
      import('./features/merchant/application-detail/application-detail').then(
        (m) => m.ApplicationDetailComponent,
      ),
  },
  {
    path: 'security-csp',
    loadComponent: () =>
      import('./features/security-csp/security-csp').then((m) => m.SecurityCspComponent),
  },
  {
    path: 'interceptor-demo',
    canActivate: [reviewerGuard],
    loadComponent: () =>
      import('./features/interceptor-demo/interceptor-demo').then((m) => m.InterceptorDemo),
  },
  { path: 'applications', redirectTo: 'dashboard', pathMatch: 'full' },
];
