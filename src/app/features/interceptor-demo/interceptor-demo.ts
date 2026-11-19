import { CommonModule } from '@angular/common';
import { Component, ElementRef, effect, inject, signal, ViewChild } from '@angular/core';
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

  readonly tokenExpired = signal(false);
  readonly refreshCount = signal(0);
  readonly isExecuting = signal(false);
  readonly logs = signal<string[]>([]);

  constructor() {
    effect(() => {
      if (!this.logs().length) return;
      requestAnimationFrame(() => {
        const terminal = this.terminal?.nativeElement;
        if (terminal) terminal.scrollTop = terminal.scrollHeight;
      });
    });
  }

  expireToken(): void {
    this.tokenExpired.set(true);
    this.addLog('[Demo] Access token expired. The next API calls will receive 401 responses.');
  }

  async triggerConcurrent401Requests(): Promise<void> {
    if (this.isExecuting()) return;
    if (!this.tokenExpired()) this.expireToken();

    this.isExecuting.set(true);
    this.addLog('[Demo] Dispatching 4 concurrent API requests.');
    await new Promise<void>((resolve) => setTimeout(resolve, 350));

    for (let request = 1; request <= 4; request += 1) {
      this.addLog(`[Request ${request}] Received 401 Unauthorized.`);
    }
    this.addLog('[Interceptor] Concurrent requests are waiting for one token refresh.');
    this.addLog('[Interceptor] POST /api/auth/refresh');

    await new Promise<void>((resolve) => setTimeout(resolve, 700));
    this.refreshCount.update((count) => count + 1);
    this.tokenExpired.set(false);
    this.addLog('[Interceptor] Access token refreshed. Retrying all 4 requests.');

    await new Promise<void>((resolve) => setTimeout(resolve, 350));
    for (let request = 1; request <= 4; request += 1) {
      this.addLog(`[Request ${request}] SUCCESS after retry.`);
    }
    this.addLog('[Demo] All 4 requests completed after a single refresh.');
    this.isExecuting.set(false);
  }

  resetDemo(): void {
    this.tokenExpired.set(false);
    this.refreshCount.set(0);
    this.isExecuting.set(false);
    this.logs.set([]);
  }

  clearLogs(): void {
    this.logs.set([]);
  }

  private addLog(message: string): void {
    this.logs.update((logs) => [...logs, `${new Date().toLocaleTimeString()}  ${message}`]);
  }
}
