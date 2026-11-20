import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { UserRole, UserRoleService } from '../../../core/user-role.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class NavbarComponent {
  private readonly router = inject(Router);
  private readonly userRoleService = inject(UserRoleService);
  readonly userName = 'test user';
  readonly userEmail = 'testuser@gmail.com';
  readonly role = this.userRoleService.role;

  setRole(role: string): void {
    if (role === 'SALES' || role === 'REVIEWER' || role === 'ADMIN') {
      this.userRoleService.setRole(role as UserRole);
      const currentPath = this.router.url.split(/[?#]/, 1)[0];
      const isApplicationDetail = /^\/applications\/[^/]+$/.test(currentPath);
      const isNewApplicationPage = currentPath === '/applications/new';
      if (
        (role === 'SALES' && !isApplicationDetail) ||
        (role === 'REVIEWER' && isNewApplicationPage)
      ) {
        void this.router.navigate(['/dashboard']);
      }
    }
  }

}
