import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { ApplicationApiService } from '../../../service/application-api.service';
import { MerchantApplicationComponent } from './new-application';
import { vi } from 'vitest';

describe('MerchantApplicationComponent', () => {
  let component: MerchantApplicationComponent;
  let fixture: ComponentFixture<MerchantApplicationComponent>;
  let saveSpy: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    saveSpy = vi.fn().mockReturnValue(of({ id: 'M-1001' }));
    await TestBed.configureTestingModule({
      imports: [MerchantApplicationComponent],
      providers: [
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => null } } } },
        { provide: Router, useValue: { navigate: vi.fn() } },
        { provide: ApplicationApiService, useValue: { get: vi.fn(), save: saveSpy } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(MerchantApplicationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('validates the active step before moving forward', () => {
    component.nextStep();
    expect(component.currentStep).toBe(0);
    expect(component.currentStepGroup.touched).toBe(true);
  });

  it('debounces draft persistence and sends the form to the API', () => {
    component.merchantForm.get('step1.legalBusinessName')?.setValue('Example Merchant');
    component.saveDraft();
    expect(saveSpy).toHaveBeenCalledWith(component.merchantForm.getRawValue(), {
      draft: true,
      id: undefined,
    });
  });
});
