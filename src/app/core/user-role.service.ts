import { Injectable, signal } from '@angular/core';
import { Subject } from 'rxjs';

export type UserRole = 'SALES' | 'REVIEWER' | 'ADMIN';

@Injectable({ providedIn: 'root' })
export class UserRoleService {
  private readonly currentRole = signal<UserRole>('ADMIN');
  private readonly currentReviewerId = signal('reviewer-1');
  readonly role = this.currentRole.asReadonly();
  readonly roleChanges = new Subject<UserRole>();

  get userId(): string {
    switch (this.currentRole()) {
      case 'SALES':
        return 'sales-1';
      case 'REVIEWER':
        return this.currentReviewerId();
      case 'ADMIN':
        return 'admin-1';
    }
  }

  readonly reviewers = [
    { id: 'reviewer-1', name: 'Reviewer One' },
    { id: 'reviewer-2', name: 'Reviewer Two' },
  ];

  setRole(role: UserRole): void {
    if (this.currentRole() === role) return;
    this.currentRole.set(role);
    this.roleChanges.next(role);
  }

  setReviewerId(reviewerId: string): void {
    if (
      !this.reviewers.some((reviewer) => reviewer.id === reviewerId) ||
      this.currentReviewerId() === reviewerId
    )
      return;
    this.currentReviewerId.set(reviewerId);
    if (this.currentRole() === 'REVIEWER') this.roleChanges.next('REVIEWER');
  }
}
