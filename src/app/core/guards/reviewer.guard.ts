import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserRoleService } from '../user-role.service';

export const reviewerGuard: CanActivateFn = () => {
  const userRoleService = inject(UserRoleService);
  const router = inject(Router);

  return userRoleService.role() === 'SALES' ? router.createUrlTree(['/dashboard']) : true;
};

export const salesOrAdminGuard: CanActivateFn = () => {
  const userRoleService = inject(UserRoleService);
  const router = inject(Router);

  return userRoleService.role() === 'REVIEWER' ? router.createUrlTree(['/dashboard']) : true;
};
