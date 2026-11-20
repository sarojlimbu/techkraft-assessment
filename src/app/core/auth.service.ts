import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private tokenSequence = 1;
  private readonly tokenState = signal('demo-access-token-1');
  private readonly expiredState = signal(false);
  private readonly refreshCountState = signal(0);
  private readonly logState = signal<string[]>([]);

  readonly accessToken = this.tokenState.asReadonly();
  readonly isTokenExpired = this.expiredState.asReadonly();
  readonly refreshCallCount = this.refreshCountState.asReadonly();
  readonly interceptorLog = this.logState.asReadonly();

  simulateTokenExpiration(): void {
    this.expiredState.set(true);
    this.logInterceptorEvent('[Auth] Access token marked expired.');
  }

  setRefreshedToken(token: string): void {
    this.tokenState.set(token);
    this.expiredState.set(false);
    this.refreshCountState.update((count) => count + 1);
  }

  nextToken(): string {
    this.tokenSequence += 1;
    return `demo-access-token-${this.tokenSequence}`;
  }

  resetTokenState(): void {
    this.tokenSequence = 1;
    this.tokenState.set('demo-access-token-1');
    this.expiredState.set(false);
    this.refreshCountState.set(0);
  }

  logInterceptorEvent(message: string): void {
    this.logState.update((logs) => [...logs, `${new Date().toLocaleTimeString()}  ${message}`]);
  }

  clearLogs(): void {
    this.logState.set([]);
  }
}
