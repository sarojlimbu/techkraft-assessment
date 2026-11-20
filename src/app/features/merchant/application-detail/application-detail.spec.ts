import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { UserRoleService } from '../../../core/user-role.service';
import { ApplicationApiService } from '../../../service/application-api.service';
import { MerchantApplication } from '../../../service/application-store.service';
import { ApplicationDetailComponent } from './application-detail';
import { vi } from 'vitest';

const record: MerchantApplication = {
  id: 'M-1001',
  status: 'UNDER_REVIEW',
  createdAt: '2026-11-14T10:00:00.000Z',
  createdByUserId: 'sales-1',
  assignedReviewerId: 'reviewer-1',
  riskLevel: 'HIGH',
  riskScore: 72,
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
      contactEmail: 'alex@example.test',
      principalOwnerName: 'Alex Owner',
      ownerStake: '75',
    },
    step3: { bankName: 'Example Bank', accountHolderName: 'Stored Business LLC' },
  },
};

describe('ApplicationDetailComponent', () => {
  let fixture: ComponentFixture<ApplicationDetailComponent>;
  let reviewSpy: ReturnType<typeof vi.fn>;
  let userRole: UserRoleService;

  beforeEach(async () => {
    reviewSpy = vi.fn().mockImplementation((_id, decision) =>
      of({
        ...record,
        ...decision,
        riskHistory: [
          {
            title: 'Application approved',
            detail: decision.notes,
            actor: 'ADMIN',
            date: 'Nov 19, 2026',
          },
        ],
      }),
    );
    await TestBed.configureTestingModule({
      imports: [ApplicationDetailComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id: 'M-1001' }) } },
        },
        { provide: Router, useValue: { navigate: vi.fn() } },
        {
          provide: ApplicationApiService,
          useValue: { get: vi.fn().mockReturnValue(of(record)), review: reviewSpy },
        },
      ],
    }).compileComponents();
    userRole = TestBed.inject(UserRoleService);
    fixture = TestBed.createComponent(ApplicationDetailComponent);
    fixture.detectChanges();
  });

  it('loads and maps the server application response', () => {
    expect(fixture.componentInstance.application()?.businessName).toBe('Stored Business');
    expect(fixture.componentInstance.application()?.address).toBe(
      '12 Main Street, Boston, MA, 02110',
    );
  });

  it('submits a risk decision through the API', () => {
    const component = fixture.componentInstance;
    component.decisionStatus = 'APPROVED';
    component.saveDecision();
    expect(reviewSpy).toHaveBeenCalledWith(
      'M-1001',
      expect.objectContaining({ status: 'APPROVED' }),
    );
  });

  it('keeps sales users in read-only mode', () => {
    userRole.setRole('SALES');
    expect(fixture.componentInstance.canReview).toBe(false);
    fixture.componentInstance.saveDecision();
    expect(reviewSpy).not.toHaveBeenCalled();
  });
});
