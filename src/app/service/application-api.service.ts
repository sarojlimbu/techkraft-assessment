import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApplicationStatus, MerchantApplication } from './application-store.service';

export interface ApplicationPage {
  items: MerchantApplication[];
  total: number;
  page: number;
  pageSize: number;
}

export type ReviewDecisionStatus = Exclude<ApplicationStatus, 'DRAFT'>;

@Injectable({ providedIn: 'root' })
export class ApplicationApiService {
  private readonly http = inject(HttpClient);

  list(options: {
    page: number;
    pageSize: number;
    search: string;
    status: string;
    risk: string;
  }): Observable<ApplicationPage> {
    const params = new HttpParams()
      .set('page', options.page)
      .set('pageSize', options.pageSize)
      .set('search', options.search)
      .set('status', options.status)
      .set('risk', options.risk);
    return this.http.get<ApplicationPage>('/api/applications', { params });
  }

  get(id: string): Observable<MerchantApplication> {
    return this.http.get<MerchantApplication>(`/api/applications/${encodeURIComponent(id)}`);
  }

  save(
    form: Record<string, unknown>,
    options: { draft: boolean; id?: string },
  ): Observable<MerchantApplication> {
    return this.http.post<MerchantApplication>('/api/applications', {
      form,
      draft: options.draft,
      id: options.id,
    });
  }

  review(
    id: string,
    decision: {
      status: ReviewDecisionStatus;
      riskLevel: NonNullable<MerchantApplication['riskLevel']>;
      riskScore: number;
      notes: string;
    },
  ): Observable<MerchantApplication> {
    return this.http.post<MerchantApplication>(
      `/api/applications/${encodeURIComponent(id)}/review`,
      decision,
    );
  }

  assign(id: string, reviewerId: string): Observable<MerchantApplication> {
    return this.http.patch<MerchantApplication>(
      `/api/applications/${encodeURIComponent(id)}/assignment`,
      { reviewerId },
    );
  }

  reviewers(): Observable<Array<{ id: string; name: string }>> {
    return this.http.get<Array<{ id: string; name: string }>>('/api/reviewers');
  }
}
