import { Routes } from '@angular/router';
import { Dashboard } from './features/dashboard/dashboard';
import { MerchantApplicationComponent } from './features/merchant/new-application/new-application';
import { ApplicationDetailComponent } from './features/merchant/application-detail/application-detail';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: Dashboard },
  { path: 'applications/new', component: MerchantApplicationComponent },
  { path: 'applications/:id/edit', component: MerchantApplicationComponent },
  { path: 'applications/:id', component: ApplicationDetailComponent },
];
