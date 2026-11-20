import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { ApplicationApiService } from '../../service/application-api.service';
import { Dashboard } from './dashboard';
import { vi } from 'vitest';

describe('Dashboard', () => {
  let fixture: ComponentFixture<Dashboard>;
  let api: { list: ReturnType<typeof vi.fn>; assign: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    api = {
      list: vi.fn().mockReturnValue(of({ items: [], total: 0, page: 0, pageSize: 5 })),
      assign: vi.fn().mockReturnValue(of(undefined)),
    };
    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [
        { provide: ApplicationApiService, useValue: api },
        { provide: Router, useValue: { navigate: vi.fn() } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(Dashboard);
    fixture.detectChanges();
  });

  it('loads the first server page with active filters', () => {
    expect(api.list).toHaveBeenCalledWith({
      page: 0,
      pageSize: 5,
      search: '',
      status: 'all',
      risk: 'all',
    });
  });

  it('resets to page zero when search changes', () => {
    const component = fixture.componentInstance;
    component.pageIndex = 2;
    component.onSearchChange('sample');
    expect(api.list).toHaveBeenLastCalledWith({
      page: 0,
      pageSize: 5,
      search: 'sample',
      status: 'all',
      risk: 'all',
    });
  });
});
