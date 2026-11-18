import { Injectable } from '@angular/core';

export type ApplicationStatus =
  'DRAFT' | 'UNDER_REVIEW' | 'APPROVED' | 'INFO_REQUESTED' | 'REJECTED';

export interface MerchantApplication {
  id: string;
  status: ApplicationStatus;
  createdAt: string;
  form: Record<string, any>;
}

@Injectable({ providedIn: 'root' })
export class ApplicationStoreService {
  private readonly storageKey = 'merchant-applications';

  getAll(): MerchantApplication[] {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? (JSON.parse(stored) as MerchantApplication[]) : [];
    } catch {
      return [];
    }
  }

  getById(id: string): MerchantApplication | undefined {
    return this.getAll().find((application) => application.id === id);
  }

  save(form: Record<string, any>, id?: string): MerchantApplication {
    return this.upsert(form, id, 'UNDER_REVIEW');
  }

  saveDraft(form: Record<string, any>, id?: string): MerchantApplication {
    return this.upsert(form, id, 'DRAFT');
  }

  private upsert(
    form: Record<string, any>,
    id: string | undefined,
    status: ApplicationStatus,
  ): MerchantApplication {
    const applications = this.getAll();
    const existing = id ? applications.find((application) => application.id === id) : undefined;
    const application: MerchantApplication = {
      id: id ?? this.createId(applications),
      status,
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

  private createId(applications: MerchantApplication[]): string {
    const nextNumber =
      applications.reduce((max, application) => {
        const number = Number(application.id.match(/^M-(\d+)$/)?.[1] ?? 1000);
        return Math.max(max, number);
      }, 1000) + 1;
    return `M-${nextNumber}`;
  }
}
