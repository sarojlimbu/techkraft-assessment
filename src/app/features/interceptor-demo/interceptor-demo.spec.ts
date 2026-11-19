import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InterceptorDemo } from './interceptor-demo';

describe('InterceptorDemo', () => {
  let component: InterceptorDemo;
  let fixture: ComponentFixture<InterceptorDemo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InterceptorDemo],
    }).compileComponents();

    fixture = TestBed.createComponent(InterceptorDemo);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
