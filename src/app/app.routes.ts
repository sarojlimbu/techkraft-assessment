import { Routes } from '@angular/router';
import { Dashboard } from './features/dashboard/dashboard';
import { MerchantApplicationComponent } from './features/merchant/new-application/new-application';
import { ApplicationDetailComponent } from './features/merchant/application-detail/application-detail';
import { SecurityCspComponent } from './features/security-csp/security-csp';
import { InterceptorDemo } from './features/interceptor-demo/interceptor-demo';
import { reviewerGuard } from './core/guards/reviewer.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: Dashboard },
  { path: 'applications/new', component: MerchantApplicationComponent },
  { path: 'applications/:id/edit', component: MerchantApplicationComponent },
  { path: 'applications/:id', component: ApplicationDetailComponent },
  { path: 'security-csp', component: SecurityCspComponent },
  { path: 'interceptor-demo', component: InterceptorDemo, canActivate: [reviewerGuard] },
  { path: 'applications', redirectTo: 'dashboard', pathMatch: 'full' },
];
