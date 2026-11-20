import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { firstValueFrom, forkJoin } from 'rxjs';
import { ApplicationApiService } from '../../service/application-api.service';
import { AuthService } from '../auth.service';
import { UserRoleService } from '../user-role.service';
import { authInterceptor } from './auth.interceptor';
import { mockApiInterceptor } from './mock-api.interceptor';

describe('authInterceptor and mock API', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([authInterceptor, mockApiInterceptor]))],
    }).compileComponents();
  });

  it('shares a single refresh across concurrent 401 responses and retries all requests', async () => {
    const auth = TestBed.inject(AuthService);
    const api = TestBed.inject(ApplicationApiService);
    auth.simulateTokenExpiration();

    const results = await firstValueFrom(
      forkJoin([
        api.list({ page: 0, pageSize: 1, search: '', status: 'all', risk: 'all' }),
        api.list({ page: 1, pageSize: 1, search: '', status: 'all', risk: 'all' }),
        api.get('M-1001'),
        api.get('M-1003'),
      ]),
    );

    expect(results).toHaveLength(4);
    expect(auth.refreshCallCount()).toBe(1);
    expect(auth.isTokenExpired()).toBe(false);
  });

  it('filters records by role and limits assignment changes to admins', async () => {
    const api = TestBed.inject(ApplicationApiService);
    const roles = TestBed.inject(UserRoleService);

    expect(
      (
        await firstValueFrom(
          api.list({ page: 0, pageSize: 10, search: '', status: 'all', risk: 'all' }),
        )
      ).total,
    ).toBe(3);
    roles.setRole('REVIEWER');
    expect(
      (
        await firstValueFrom(
          api.list({ page: 0, pageSize: 10, search: '', status: 'all', risk: 'all' }),
        )
      ).total,
    ).toBe(2);
    roles.setReviewerId('reviewer-2');
    expect(
      (
        await firstValueFrom(
          api.list({ page: 0, pageSize: 10, search: '', status: 'all', risk: 'all' }),
        )
      ).total,
    ).toBe(1);
    roles.setReviewerId('reviewer-1');
    await expect(firstValueFrom(api.assign('M-1001', 'reviewer-2'))).rejects.toMatchObject({
      status: 403,
    });
    roles.setRole('SALES');
    expect(
      (
        await firstValueFrom(
          api.list({ page: 0, pageSize: 10, search: '', status: 'all', risk: 'all' }),
        )
      ).total,
    ).toBe(2);
    roles.setRole('ADMIN');
    expect((await firstValueFrom(api.assign('M-1001', 'reviewer-2')))?.assignedReviewerId).toBe(
      'reviewer-2',
    );
  });

  it('filters and paginates records in the mock API response', async () => {
    const api = TestBed.inject(ApplicationApiService);
    const pageZero = await firstValueFrom(
      api.list({ page: 0, pageSize: 1, search: '', status: 'all', risk: 'all' }),
    );
    const pageOne = await firstValueFrom(
      api.list({ page: 1, pageSize: 1, search: '', status: 'all', risk: 'all' }),
    );

    expect(pageZero.total).toBe(3);
    expect(pageZero.items).toHaveLength(1);
    expect(pageOne.items).toHaveLength(1);
    expect(pageOne.items[0].id).not.toBe(pageZero.items[0].id);
  });

  it('saves a new draft and accepts its final submission', async () => {
    const api = TestBed.inject(ApplicationApiService);
    const form = {
      step1: { legalBusinessName: 'Submission Test LLC' },
      step2: {},
      step3: {},
      step4: {},
    };
    const draft = await firstValueFrom(api.save(form, { draft: true }));
    const submitted = await firstValueFrom(api.save(form, { draft: false, id: draft.id }));

    expect(draft.status).toBe('DRAFT');
    expect(submitted.id).toBe(draft.id);
    expect(submitted.status).toBe('UNDER_REVIEW');
    const page = await firstValueFrom(
      api.list({ page: 0, pageSize: 5, search: 'Submission Test LLC', status: 'all', risk: 'all' }),
    );
    expect(page.items.map((application) => application.id)).toContain(submitted.id);
  });

  it('allows sales to submit a draft they created', async () => {
    const api = TestBed.inject(ApplicationApiService);
    TestBed.inject(UserRoleService).setRole('SALES');
    const draft = await firstValueFrom(
      api.save({ step1: { legalBusinessName: 'Sales Owned LLC' } }, { draft: true }),
    );

    const submitted = await firstValueFrom(
      api.save({ step1: { legalBusinessName: 'Sales Owned LLC' } }, { draft: false, id: draft.id }),
    );
    expect(submitted.status).toBe('UNDER_REVIEW');
    const visiblePage = await firstValueFrom(
      api.list({
        page: 0,
        pageSize: 5,
        search: 'Sales Owned LLC',
        status: 'all',
        risk: 'all',
      }),
    );
    expect(visiblePage.items.map((application) => application.id)).toContain(submitted.id);
  });
});
