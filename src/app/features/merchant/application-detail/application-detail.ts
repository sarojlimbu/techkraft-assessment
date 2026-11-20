import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Button } from '../../../shared/components';
import { UserRoleService } from '../../../core/user-role.service';
import { ApplicationApiService } from '../../../service/application-api.service';
import { ApplicationStatus, MerchantApplication } from '../../../service/application-store.service';
import { ReviewDecisionStatus } from '../../../service/application-api.service';

interface ReviewEvent {
  title: string;
  detail: string;
  date: string;
  actor: string;
}

interface ApplicationDetails {
  id: string;
  status: ApplicationStatus;
  businessName: string;
  entityType: string;
  taxId: string;
  annualRevenue: number;
  address: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  ownerName: string;
  ownerStake: number;
  ownerSsn?: string;
  bankName: string;
  accountHolder: string;
  routingNumber?: string;
  accountNumber?: string;
  estimatedMonthlyVolume?: number;
  pciClass?: string;
  businessLicenseNumber?: string;
  createdAt: string;
  riskLevel: string;
  riskScore: number;
  riskHistory: ReviewEvent[];
}

@Component({
  selector: 'app-application-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, Button],
  templateUrl: './application-detail.html',
  styleUrl: './application-detail.scss',
})
export class ApplicationDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly userRoleService = inject(UserRoleService);
  private readonly api = inject(ApplicationApiService);

  readonly role = this.userRoleService.role;
  readonly application = signal<ApplicationDetails | null>(null);
  readonly loading = signal(true);
  readonly savingDecision = signal(false);
  readonly errorMessage = signal('');
  reviewNote = '';
  readonly sensitiveVisibility: Record<string, boolean> = {};
  decisionStatus: ReviewDecisionStatus = 'UNDER_REVIEW';
  decisionRisk: NonNullable<MerchantApplication['riskLevel']> = 'MEDIUM';
  decisionScore = 50;

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.loading.set(false);
      return;
    }
    this.api.get(id).subscribe({
      next: (record) => {
        this.application.set(this.mapApplication(record));
        this.decisionStatus = record.status === 'DRAFT' ? 'UNDER_REVIEW' : record.status;
        this.decisionRisk =
          record.riskLevel && record.riskLevel !== 'PENDING' ? record.riskLevel : 'MEDIUM';
        this.decisionScore = record.riskScore ?? 50;
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set(
          'This application is unavailable or you do not have permission to view it.',
        );
        this.loading.set(false);
      },
    });
  }

  get canReview(): boolean {
    return this.role() !== 'SALES';
  }

  goBack(): void {
    void this.router.navigate(['/dashboard']);
  }

  approveApplication(): void {
    this.decisionStatus = 'APPROVED';
    this.updateDecision();
  }

  rejectApplication(): void {
    this.decisionStatus = 'REJECTED';
    this.updateDecision();
  }

  saveDecision(): void {
    this.updateDecision();
  }

  maskSensitive(value: string | undefined, field: string): string {
    if (!value) return 'Not provided';
    if (this.canReview && this.sensitiveVisibility[field]) return value;
    const digits = value.replace(/\D/g, '');
    return digits ? `•••• ${digits.slice(-4)}` : '••••';
  }

  isSensitiveRevealed(field: string): boolean {
    return this.canReview && Boolean(this.sensitiveVisibility[field]);
  }

  toggleSensitive(field: string): void {
    if (!this.canReview) return;
    this.sensitiveVisibility[field] = !this.sensitiveVisibility[field];
  }

  private updateDecision(): void {
    const application = this.application();
    if (!application || !this.canReview || this.savingDecision()) return;
    this.savingDecision.set(true);
    this.errorMessage.set('');
    this.api
      .review(application.id, {
        status: this.decisionStatus,
        riskLevel: this.decisionRisk,
        riskScore: this.decisionScore,
        notes: this.reviewNote,
      })
      .subscribe({
        next: (record) => {
          this.application.set(this.mapApplication(record));
          this.reviewNote = '';
          this.savingDecision.set(false);
        },
        error: () => {
          this.errorMessage.set('Could not save the review decision. Please retry.');
          this.savingDecision.set(false);
        },
      });
  }

  private mapApplication(record: MerchantApplication): ApplicationDetails {
    const business = record.form['step1'] ?? {};
    const contact = record.form['step2'] ?? {};
    const banking = record.form['step3'] ?? {};
    const riskHistory = record.riskHistory ?? [
      {
        title: 'Application submitted',
        detail: 'Application received and queued for underwriting review.',
        date: new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(
          new Date(record.createdAt),
        ),
        actor: contact['primaryContactName'] ?? 'Merchant',
      },
    ];
    return {
      id: record.id,
      status: record.status,
      businessName: business['legalBusinessName'] ?? '',
      entityType: business['businessType'] ?? '',
      taxId: business['taxId'] ?? '',
      annualRevenue: Number(business['annualRevenue'] ?? 0),
      address: [
        business['businessAddress'],
        business['city'],
        business['state'],
        business['postalCode'],
      ]
        .filter(Boolean)
        .join(', '),
      contactName: contact['primaryContactName'] ?? '',
      contactEmail: contact['contactEmail'] ?? '',
      contactPhone: contact['contactPhone'] ?? '',
      ownerName: contact['principalOwnerName'] ?? '',
      ownerStake: Number(contact['ownerStake'] ?? 0),
      ownerSsn: contact['ownerSSN'] ?? '',
      bankName: banking['bankName'] ?? '',
      accountHolder: banking['accountHolderName'] ?? '',
      routingNumber: banking['routingNumber'] ?? '',
      accountNumber: banking['accountNumber'] ?? '',
      estimatedMonthlyVolume: Number(record.form['step4']?.['estimatedMonthlyVolume'] ?? 0),
      pciClass: record.form['step4']?.['pciClass'] ?? '',
      businessLicenseNumber: record.form['step4']?.['businessLicenseNumber'] ?? '',
      createdAt: record.createdAt,
      riskLevel: record.riskLevel ?? 'PENDING',
      riskScore: record.riskScore ?? 0,
      riskHistory,
    };
  }
}
