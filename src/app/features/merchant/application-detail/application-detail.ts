import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Button } from '../../../shared/components/button/button';
import { UserRoleService } from '../../../core/user-role.service';
import { ApplicationStoreService } from '../../../service/application-store.service';

interface ReviewEvent {
  title: string;
  detail: string;
  date: string;
  actor: string;
}

interface ApplicationDetails {
  id: string;
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
  createdAt?: string;
  riskLevel: string;
  riskScore: number;
  status: string;
  riskHistory: ReviewEvent[];
}

const sampleApplications: Record<string, Omit<ApplicationDetails, 'id'>> = {
  'M-1001': {
    businessName: 'Acme Foods',
    entityType: 'LLC',
    taxId: 'XX-1234567',
    annualRevenue: 1200000,
    address: '100 Market Street, San Francisco, CA 94105',
    contactName: 'Sarah Kim',
    contactEmail: 'sarah@acmefoods.com',
    ownerName: 'Sarah Kim',
    ownerStake: 65,
    bankName: 'First National Bank',
    accountHolder: 'Acme Foods LLC',
    riskLevel: 'HIGH',
    riskScore: 82,
    status: 'UNDER_REVIEW',
    riskHistory: [
      {
        title: 'Risk assessment completed',
        detail: 'Elevated transaction volume flagged for manual review.',
        date: 'Nov 14, 2026',
        actor: 'Risk Engine',
      },
      {
        title: 'Application submitted',
        detail: 'Application moved to underwriting review.',
        date: 'Nov 13, 2026',
        actor: 'Sarah Kim',
      },
      {
        title: 'Business verification passed',
        detail: 'Business registration details verified.',
        date: 'Nov 13, 2026',
        actor: 'Verification Service',
      },
    ],
  },
  'M-1002': {
    businessName: 'Northwind Retail',
    entityType: 'Corporation',
    taxId: 'XX-9876543',
    annualRevenue: 4500000,
    address: '42 Harbor Road, Boston, MA 02110',
    contactName: 'Daniel Ross',
    contactEmail: 'daniel@northwind.com',
    ownerName: 'Daniel Ross',
    ownerStake: 80,
    bankName: 'Citizens Bank',
    accountHolder: 'Northwind Retail Inc.',
    riskLevel: 'LOW',
    riskScore: 28,
    status: 'APPROVED',
    riskHistory: [
      {
        title: 'Application approved',
        detail: 'Low risk profile approved for onboarding.',
        date: 'Nov 12, 2026',
        actor: 'Reviewer',
      },
      {
        title: 'Risk assessment completed',
        detail: 'No elevated risk indicators found.',
        date: 'Nov 11, 2026',
        actor: 'Risk Engine',
      },
      {
        title: 'Application submitted',
        detail: 'Application moved to underwriting review.',
        date: 'Nov 10, 2026',
        actor: 'Daniel Ross',
      },
    ],
  },
  'M-1003': {
    businessName: 'Boreal Logistics',
    entityType: 'Partnership',
    taxId: 'XX-4356278',
    annualRevenue: 2100000,
    address: '880 Lake Avenue, Chicago, IL 60601',
    contactName: 'Priya Shah',
    contactEmail: 'priya@boreallogistics.com',
    ownerName: 'Priya Shah',
    ownerStake: 55,
    bankName: 'Chase',
    accountHolder: 'Boreal Logistics',
    riskLevel: 'MEDIUM',
    riskScore: 51,
    status: 'INFO_REQUESTED',
    riskHistory: [
      {
        title: 'Additional information requested',
        detail: 'Please provide updated ownership documents.',
        date: 'Nov 10, 2026',
        actor: 'Reviewer',
      },
      {
        title: 'Risk assessment completed',
        detail: 'Moderate risk indicators require supporting documents.',
        date: 'Nov 09, 2026',
        actor: 'Risk Engine',
      },
      {
        title: 'Application submitted',
        detail: 'Application moved to underwriting review.',
        date: 'Nov 08, 2026',
        actor: 'Priya Shah',
      },
    ],
  },
};

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
  private readonly applicationStore = inject(ApplicationStoreService);

  readonly role = this.userRoleService.role;
  readonly application: ApplicationDetails;
  reviewNote = '';
  decisionStatus: 'UNDER_REVIEW' | 'APPROVED' | 'INFO_REQUESTED' | 'REJECTED' = 'UNDER_REVIEW';
  decisionRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'MEDIUM';
  decisionScore = 50;

  constructor() {
    const id = this.route.snapshot.paramMap.get('id') ?? 'M-1001';
    const stored = this.applicationStore.getById(id);
    if (stored) {
      const business = stored.form['step1'] ?? {};
      const contact = stored.form['step2'] ?? {};
      const banking = stored.form['step3'] ?? {};
      this.application = {
        id,
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
        estimatedMonthlyVolume: Number(stored.form['step4']?.['estimatedMonthlyVolume'] ?? 0),
        pciClass: stored.form['step4']?.['pciClass'] ?? '',
        createdAt: stored.createdAt,
        riskLevel: stored.riskLevel ?? 'PENDING',
        riskScore: stored.riskScore ?? 0,
        status: stored.status,
        riskHistory: stored.riskHistory ?? [
          {
            title: 'Application submitted',
            detail: 'Application received and queued for underwriting review.',
            date: new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(
              new Date(stored.createdAt),
            ),
            actor: contact['primaryContactName'] ?? 'Merchant',
          },
        ],
      };
    } else {
      const details = sampleApplications[id] ?? sampleApplications['M-1001'];
      this.application = { id, ...structuredClone(details) };
    }
    this.decisionStatus = this.application.status as typeof this.decisionStatus;
    this.decisionRisk = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(this.application.riskLevel)
      ? (this.application.riskLevel as typeof this.decisionRisk)
      : 'MEDIUM';
    this.decisionScore = this.application.riskScore;
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

  maskSensitive(value?: string): string {
    if (!value) return 'Not provided';
    if (this.canReview) return value;
    const digits = value.replace(/\D/g, '');
    const visible = digits.slice(-4);
    return visible ? `•••• ${visible}` : '••••';
  }

  private updateDecision(): void {
    if (!this.canReview) {
      return;
    }

    const statusLabels: Record<string, string> = {
      UNDER_REVIEW: 'Application kept under review',
      APPROVED: 'Application approved',
      REJECTED: 'Application rejected',
      INFO_REQUESTED: 'Additional information requested',
    };
    const event = {
      title: statusLabels[this.decisionStatus],
      detail: this.reviewNote.trim() || 'Risk assessment updated by reviewer.',
      date: new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date()),
      actor: this.role(),
    };
    this.application.status = this.decisionStatus;
    this.application.riskLevel = this.decisionRisk;
    this.application.riskScore = this.decisionScore;
    this.application.riskHistory.unshift(event);
    const reviewChanges = {
      status: this.decisionStatus,
      riskLevel: this.decisionRisk,
      riskScore: this.decisionScore,
      riskHistory: this.application.riskHistory,
    };
    if (this.applicationStore.updateReview) {
      this.applicationStore.updateReview(this.application.id, reviewChanges);
    } else {
      this.applicationStore.updateStatus(this.application.id, this.decisionStatus);
    }
    this.reviewNote = '';
  }
}
