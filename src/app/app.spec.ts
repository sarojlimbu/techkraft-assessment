import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';

describe('App', () => {
  let fixture: ComponentFixture<App>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(App);
    fixture.detectChanges();
  });

  it('renders the application shell and dashboard navigation', () => {
    expect(fixture.nativeElement.textContent).toContain('MerchantPay');
    expect(fixture.nativeElement.textContent).toContain('Dashboard');
  });
});
