import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { UserRole, UserRoleService } from '../../../core/user-role.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class NavbarComponent {
  private readonly userRoleService = inject(UserRoleService);
  readonly role = this.userRoleService.role;

  setRole(role: string): void {
    if (role === 'SALES' || role === 'REVIEWER' || role === 'ADMIN') {
      this.userRoleService.setRole(role as UserRole);
    }
  }
}
