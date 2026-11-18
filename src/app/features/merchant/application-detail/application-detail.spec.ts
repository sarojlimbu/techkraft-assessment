import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { ApplicationStoreService } from '../../../service/application-store.service';
import { UserRoleService } from '../../../core/user-role.service';
import { ApplicationDetailComponent } from './application-detail';
import { vi } from 'vitest';

describe('ApplicationDetailComponent', () => {
  let component: ApplicationDetailComponent;
  let fixture: ComponentFixture<ApplicationDetailComponent>;
  let applicationStore: ApplicationStoreService;
  let getApplicationSpy: ReturnType<typeof vi.fn>;
  let updateStatusSpy: ReturnType<typeof vi.fn>;
  let router: Router;
  let navigateSpy: ReturnType<typeof vi.fn>;
  let userRole: UserRoleService;

  beforeEach(async () => {
    getApplicationSpy = vi.fn().mockReturnValue(undefined);
    updateStatusSpy = vi.fn();
    navigateSpy = vi.fn();
    applicationStore = {
      getById: getApplicationSpy,
      updateStatus: updateStatusSpy,
    } as unknown as ApplicationStoreService;
    router = { navigate: navigateSpy } as unknown as Router;

    await TestBed.configureTestingModule({
      imports: [ApplicationDetailComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id: 'M-1001' }) } },
        },
        { provide: Router, useValue: router },
        { provide: ApplicationStoreService, useValue: applicationStore },
      ],
    }).compileComponents();

    userRole = TestBed.inject(UserRoleService);
    fixture = TestBed.createComponent(ApplicationDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates and displays the sample application when no stored record exists', () => {
    expect(component).toBeTruthy();
    expect(component.application.businessName).toBe('Acme Foods');
    expect(fixture.nativeElement.textContent).toContain('Acme Foods');
  });

  it('loads a submitted application from the application store', () => {
    getApplicationSpy.mockReturnValue({
      id: 'M-1001',
      status: 'UNDER_REVIEW',
      createdAt: '2026-11-14T10:00:00.000Z',
      form: {
        step1: {
          legalBusinessName: 'Stored Business',
          businessType: 'LLC',
          taxId: '12-3456789',
          annualRevenue: '500000',
          businessAddress: '12 Main Street',
          city: 'Boston',
          state: 'MA',
          postalCode: '02110',
        },
        step2: {
          primaryContactName: 'Alex Owner',
          contactEmail: 'alex@example.com',
          principalOwnerName: 'Alex Owner',
          ownerStake: '75',
        },
        step3: { bankName: 'Example Bank', accountHolderName: 'Stored Business LLC' },
      },
    });

    fixture = TestBed.createComponent(ApplicationDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.application.businessName).toBe('Stored Business');
    expect(component.application.address).toBe('12 Main Street, Boston, MA, 02110');
    expect(component.application.annualRevenue).toBe(500000);
  });

  it('records an approval and adds it to the risk history', () => {
    component.approveApplication();

    expect(component.application.status).toBe('APPROVED');
    expect(updateStatusSpy).toHaveBeenCalledWith('M-1001', 'APPROVED');
    expect(component.application.riskHistory[0].title).toBe('Application approved');
  });

  it('keeps sales users in read-only mode', () => {
    userRole.setRole('SALES');

    expect(component.canReview).toBe(false);
    component.approveApplication();

    expect(component.application.status).toBe('UNDER_REVIEW');
    expect(updateStatusSpy).not.toHaveBeenCalled();
  });

  it('navigates back to the dashboard', () => {
    component.goBack();

    expect(navigateSpy).toHaveBeenCalledWith(['/dashboard']);
  });
});
