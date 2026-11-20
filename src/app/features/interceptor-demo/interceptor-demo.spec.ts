import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { InterceptorDemo } from './interceptor-demo';
import { authInterceptor } from '../../core/http/auth.interceptor';
import { mockApiInterceptor } from '../../core/http/mock-api.interceptor';

describe('InterceptorDemo', () => {
  let fixture: ComponentFixture<InterceptorDemo>;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [InterceptorDemo],
      providers: [provideHttpClient(withInterceptors([authInterceptor, mockApiInterceptor]))],
    }).compileComponents();
    fixture = TestBed.createComponent(InterceptorDemo);
    fixture.detectChanges();
  });

  it('creates the HTTP interceptor demo', () => {
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('Fire 4 concurrent requests');
  });
});
