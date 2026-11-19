import { Injectable, signal } from '@angular/core';

export type UserRole = 'SALES' | 'REVIEWER' | 'ADMIN';

@Injectable({ providedIn: 'root' })
export class UserRoleService {
  private readonly currentRole = signal<UserRole>('ADMIN');
  readonly role = this.currentRole.asReadonly();

  setRole(role: UserRole): void {
    this.currentRole.set(role);
  }
}
