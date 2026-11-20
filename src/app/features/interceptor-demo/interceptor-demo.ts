import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, effect, inject, signal, ViewChild } from '@angular/core';
import { forkJoin, tap } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { UserRoleService } from '../../core/user-role.service';

@Component({
  selector: 'app-interceptor-demo',
  standalone: true,
  imports: [CommonModule],
  styleUrl: './interceptor-demo.scss',
  templateUrl: './interceptor-demo.html',
})
export class InterceptorDemo {
  @ViewChild('terminal') private terminal?: ElementRef<HTMLDivElement>;
  readonly userRoleService = inject(UserRoleService);
  readonly authService = inject(AuthService);
  private readonly http = inject(HttpClient);
  readonly isExecuting = signal(false);

  constructor() {
    effect(() => {
      if (!this.authService.interceptorLog().length) return;
      requestAnimationFrame(() => {
        const terminal = this.terminal?.nativeElement;
        if (terminal) terminal.scrollTop = terminal.scrollHeight;
      });
    });
  }

  expireToken(): void {
    this.authService.simulateTokenExpiration();
  }

  triggerConcurrent401Requests(): void {
    if (this.isExecuting()) return;
    if (!this.authService.isTokenExpired()) this.expireToken();

    this.isExecuting.set(true);
    this.authService.logInterceptorEvent('[Demo] Dispatching 4 concurrent API requests.');
    const requests = [
      {
        label: 'GET /api/applications?page=0&pageSize=1',
        request: this.http.get('/api/applications?page=0&pageSize=1'),
      },
      {
        label: 'GET /api/applications?page=1&pageSize=1',
        request: this.http.get('/api/applications?page=1&pageSize=1'),
      },
      {
        label: 'GET /api/applications/M-1001',
        request: this.http.get('/api/applications/M-1001'),
      },
      {
        label: 'GET /api/applications/M-1003',
        request: this.http.get('/api/applications/M-1003'),
      },
    ];
    forkJoin(
      requests.map(({ label, request }) =>
        request.pipe(
          tap(() => this.authService.logInterceptorEvent(`[Demo] SUCCESS ${label}`)),
        ),
      ),
    ).subscribe({
      error: (error: unknown) => {
        const message = error instanceof Error ? error.message : 'Unknown request error';
        this.authService.logInterceptorEvent(`[Demo] Request batch failed: ${message}`);
      },
      complete: () => this.isExecuting.set(false),
    });
  }

  resetDemo(): void {
    this.authService.resetTokenState();
    this.isExecuting.set(false);
    this.authService.clearLogs();
  }

  clearLogs(): void {
    this.authService.clearLogs();
  }
}
