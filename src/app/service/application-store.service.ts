import { Injectable } from '@angular/core';

export type ApplicationStatus =
  'DRAFT' | 'UNDER_REVIEW' | 'APPROVED' | 'INFO_REQUESTED' | 'REJECTED';

export interface MerchantApplication {
  id: string;
  status: ApplicationStatus;
  createdAt: string;
  form: Record<string, any>;
  createdByUserId: string;
  assignedReviewerId?: string;
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'PENDING';
  riskScore?: number;
  riskHistory?: Array<{ title: string; detail: string; date: string; actor: string }>;
}

@Injectable({ providedIn: 'root' })
export class ApplicationStoreService {
  private readonly storageKey = 'merchant-applications';

  getAll(): MerchantApplication[] {
    try {
      return this.getAllStrict();
    } catch {
      return [];
    }
  }

  getAllStrict(): MerchantApplication[] {
    const stored = localStorage.getItem(this.storageKey);
    const applications = stored ? (JSON.parse(stored) as MerchantApplication[]) : [];
    return applications.map((application) => ({
      ...application,
      // Migrate records created before the role-aware mock API was introduced.
      createdByUserId: application.createdByUserId ?? 'sales-1',
      assignedReviewerId: application.assignedReviewerId ?? 'reviewer-1',
    }));
  }

  getById(id: string): MerchantApplication | undefined {
    return this.getAll().find((application) => application.id === id);
  }

  save(form: Record<string, any>, id?: string, userId = 'sales-1'): MerchantApplication {
    return this.upsert(form, id, 'UNDER_REVIEW', userId);
  }

  saveDraft(form: Record<string, any>, id?: string, userId = 'sales-1'): MerchantApplication {
    return this.upsert(form, id, 'DRAFT', userId);
  }

  assignReviewer(id: string, reviewerId: string): MerchantApplication | undefined {
    const applications = this.getAll();
    const target = applications.find((application) => application.id === id);
    if (!target) return undefined;
    const updated = { ...target, assignedReviewerId: reviewerId };
    localStorage.setItem(
      this.storageKey,
      JSON.stringify(
        applications.map((application) => (application.id === id ? updated : application)),
      ),
    );
    return updated;
  }

  private upsert(
    form: Record<string, any>,
    id: string | undefined,
    status: ApplicationStatus,
    userId: string,
  ): MerchantApplication {
    const applications = this.getAll();
    const existing = id ? applications.find((application) => application.id === id) : undefined;
    const application: MerchantApplication = {
      ...existing,
      id: id ?? this.createId(applications),
      status,
      createdByUserId: existing?.createdByUserId ?? userId,
      assignedReviewerId:
        existing?.assignedReviewerId ?? (status === 'DRAFT' ? undefined : 'reviewer-1'),
      createdAt: existing?.createdAt ?? new Date().toISOString(),
      form,
    };

    const updated = existing
      ? applications.map((item) => (item.id === id ? application : item))
      : [application, ...applications];
    localStorage.setItem(this.storageKey, JSON.stringify(updated));
    return application;
  }

  updateStatus(id: string, status: ApplicationStatus): void {
    const updated = this.getAll().map((application) =>
      application.id === id ? { ...application, status } : application,
    );
    localStorage.setItem(this.storageKey, JSON.stringify(updated));
  }

  updateReview(
    id: string,
    changes: Pick<MerchantApplication, 'status' | 'riskLevel' | 'riskScore' | 'riskHistory'>,
  ): void {
    const updated = this.getAll().map((application) =>
      application.id === id ? { ...application, ...changes } : application,
    );
    localStorage.setItem(this.storageKey, JSON.stringify(updated));
  }

  private createId(applications: MerchantApplication[]): string {
    const nextNumber =
      applications.reduce((max, application) => {
        const number = Number(application.id.match(/^M-(\d+)$/)?.[1] ?? 1000);
        return Math.max(max, number);
      }, 1000) + 1;
    return `M-${nextNumber}`;
  }
}
