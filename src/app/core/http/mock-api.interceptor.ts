import { HttpErrorResponse, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, delay, of, throwError } from 'rxjs';
import { AuthService } from '../auth.service';
import { UserRoleService } from '../user-role.service';
import {
  ApplicationStoreService,
  MerchantApplication,
} from '../../service/application-store.service';

const reviewers = [
  { id: 'reviewer-1', name: 'Reviewer One' },
  { id: 'reviewer-2', name: 'Reviewer Two' },
];

export const mockApiInterceptor: HttpInterceptorFn = (request, next) => {
  if (!request.url.startsWith('/api/') && request.url !== '/auth/refresh') return next(request);

  const store = inject(ApplicationStoreService);
  const auth = inject(AuthService);
  const roles = inject(UserRoleService);
  seedRecords(store);

  if (
    (request.url === '/auth/refresh' || request.url === '/api/auth/refresh') &&
    request.method === 'POST'
  ) {
    auth.logInterceptorEvent('[Mock API] Refresh endpoint issued a new access token.');
    return respond({ accessToken: auth.nextToken() }, 120);
  }

  const token = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!token || token !== auth.accessToken() || auth.isTokenExpired()) {
    auth.logInterceptorEvent(`[Mock API] 401 Unauthorized: ${request.url}`);
    return fail(401, 'Unauthorized');
  }

  const requestUrl = request.urlWithParams;
  const path = requestUrl.split('?')[0];
  const parts = path.split('/').filter(Boolean);
  const role = roles.role();
  const userId = roles.userId;

  if (request.method === 'GET' && path === '/api/applications') {
    const query = new URL(requestUrl, 'http://localhost').searchParams;
    const page = Math.max(Number(query.get('page') ?? 0), 0);
    const pageSize = Math.min(Math.max(Number(query.get('pageSize') ?? 5), 1), 100);
    const search = (query.get('search') ?? '').toLocaleLowerCase();
    const status = query.get('status') ?? 'all';
    const risk = query.get('risk') ?? 'all';
    const matching = store.getAll().filter((app) => {
      const business = app.form['step1'] ?? {};
      const contact = app.form['step2'] ?? {};
      return (
        (!search ||
          [
            business['legalBusinessName'],
            app.id,
            contact['contactEmail'],
            contact['primaryContactName'],
          ].some((value) =>
            String(value ?? '')
              .toLocaleLowerCase()
              .includes(search),
          )) &&
        (status === 'all' || app.status === status) &&
        (risk === 'all' || (app.riskLevel ?? 'PENDING') === risk)
      );
    });
    return respond({
      items: matching.slice(page * pageSize, (page + 1) * pageSize),
      total: matching.length,
      page,
      pageSize,
    });
  }

  if (request.method === 'GET' && path === '/api/reviewers') return respond(reviewers);

  if (request.method === 'POST' && path === '/api/applications') {
    if (role === 'REVIEWER') return fail(403, 'Reviewers cannot create applications');
    const body = request.body as { form: Record<string, any>; draft?: boolean; id?: string };
    if (body.id) {
      const existing = store.getById(body.id);
      if (!existing || !canEdit(existing, role, userId)) return fail(404, 'Application not found');
    }
    return respond(
      body.draft
        ? store.saveDraft(body.form, body.id, userId)
        : store.save(body.form, body.id, userId),
      80,
      201,
    );
  }

  if (parts[0] === 'api' && parts[1] === 'applications' && parts[2]) {
    const app = store.getById(parts[2]);
    if (!app || !canView(app, role, userId)) return fail(404, 'Application not found');
    if (request.method === 'GET' && parts.length === 3) return respond(app);

    if (request.method === 'PATCH' && parts[3] === 'assignment') {
      if (role !== 'ADMIN') return fail(403, 'Only administrators can assign applications');
      const reviewerId = (request.body as { reviewerId: string }).reviewerId;
      if (!reviewers.some((reviewer) => reviewer.id === reviewerId))
        return fail(400, 'Invalid reviewer');
      return respond(store.assignReviewer(app.id, reviewerId));
    }

    if (request.method === 'POST' && parts[3] === 'review') {
      if (role === 'SALES') return fail(403, 'Sales users cannot make risk decisions');
      const decision = request.body as Pick<
        MerchantApplication,
        'status' | 'riskLevel' | 'riskScore'
      > & { notes?: string };
      if (decision.status === 'DRAFT')
        return fail(400, 'A review decision cannot return an application to draft');
      const event = {
        title: `Application ${decision.status.toLocaleLowerCase().replace('_', ' ')}`,
        detail: decision.notes?.trim() || 'Risk assessment updated by reviewer.',
        date: new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date()),
        actor: role,
      };
      store.updateReview(app.id, {
        status: decision.status,
        riskLevel: decision.riskLevel,
        riskScore: decision.riskScore,
        riskHistory: [event, ...(app.riskHistory ?? [])],
      });
      return respond(store.getById(app.id));
    }
  }

  return fail(404, 'Mock endpoint not found');
};

function canEdit(app: MerchantApplication, role: string, userId: string): boolean {
  return role === 'ADMIN' || (role === 'SALES' && app.createdByUserId === userId);
}

function canView(app: MerchantApplication, role: string, userId: string): boolean {
  if (role === 'ADMIN') return true;
  if (role === 'REVIEWER') return true;
  return app.createdByUserId === userId;
}

function respond<T>(body: T, delayMs = 70, status = 200): Observable<HttpResponse<T>> {
  return of(new HttpResponse({ body, status })).pipe(delay(delayMs));
}

function fail(status: number, message: string): Observable<never> {
  return throwError(
    () => new HttpErrorResponse({ status, statusText: message, error: { message } }),
  );
}

function seedRecords(store: ApplicationStoreService): void {
  if (store.getAll().length) return;
  const form = (business: string, n: string) => ({
    step1: {
      legalBusinessName: business,
      businessType: 'LLC',
      taxId: `12-345678${n}`,
      annualRevenue: '1250000',
      businessAddress: '100 Example Street',
      city: 'Sample City',
      state: 'CA',
      postalCode: '90001',
    },
    step2: {
      primaryContactName: `Contact ${n}`,
      contactEmail: `contact${n}@example.test`,
      contactPhone: '555-010-0100',
      principalOwnerName: `Owner ${n}`,
      ownerSSN: `000-00-000${n}`,
      ownerStake: '60',
    },
    step3: {
      bankName: 'Example Bank',
      accountHolderName: business,
      routingNumber: '000000000',
      accountNumber: `0000000${n}`,
    },
    step4: {
      estimatedMonthlyVolume: '50000',
      pciClass: 'Level 2',
      businessLicenseNumber: `LIC-${n}`,
    },
  });
  const createdAt = new Date().toISOString();
  const apps: MerchantApplication[] = [
    {
      id: 'M-1001',
      status: 'UNDER_REVIEW',
      createdAt,
      form: form('Sample Foods LLC', '1'),
      createdByUserId: 'sales-1',
      assignedReviewerId: 'reviewer-1',
      riskLevel: 'HIGH',
      riskScore: 72,
    },
    {
      id: 'M-1002',
      status: 'APPROVED',
      createdAt,
      form: form('Example Retail Inc.', '2'),
      createdByUserId: 'sales-2',
      assignedReviewerId: 'reviewer-2',
      riskLevel: 'LOW',
      riskScore: 24,
    },
    {
      id: 'M-1003',
      status: 'INFO_REQUESTED',
      createdAt,
      form: form('Demo Logistics LLC', '3'),
      createdByUserId: 'sales-1',
      assignedReviewerId: 'reviewer-1',
      riskLevel: 'MEDIUM',
      riskScore: 48,
    },
  ];
  localStorage.setItem('merchant-applications', JSON.stringify(apps));
}
