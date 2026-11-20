import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, TemplateRef, ViewChild, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { Subject, catchError, finalize, of, switchMap, takeUntil } from 'rxjs';
import { AppInput, AppSelect, Button, Card, Table, TableColumn } from '../../shared/components';
import { ApplicationApiService } from '../../service/application-api.service';
import { MerchantApplication } from '../../service/application-store.service';
import { UserRoleService } from '../../core/user-role.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    Button,
    Table,
    AppInput,
    AppSelect,
    Card,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  styleUrl: './dashboard.scss',
  templateUrl: './dashboard.html',
})
export class Dashboard implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly api = inject(ApplicationApiService);
  private readonly userRoleService = inject(UserRoleService);
  private readonly query$ = new Subject<void>();
  private readonly destroy$ = new Subject<void>();

  @ViewChild('viewAction') viewActionTemplate?: TemplateRef<any>;
  @ViewChild('businessCell') businessCellTemplate?: TemplateRef<any>;
  @ViewChild('taxIdCell') taxIdCellTemplate?: TemplateRef<any>;
  @ViewChild('contactCell') contactCellTemplate?: TemplateRef<any>;
  @ViewChild('riskCell') riskCellTemplate?: TemplateRef<any>;
  @ViewChild('statusCell') statusCellTemplate?: TemplateRef<any>;
  @ViewChild('dateCell') dateCellTemplate?: TemplateRef<any>;
  private columnsCache?: TableColumn[];
  private columnsRole?: string;
  private columnsViewTemplate?: TemplateRef<any>;
  private columnsCellTemplates?: Array<TemplateRef<any> | undefined>;
  private tableDataCacheSource?: MerchantApplication[];
  private tableDataCache: Record<string, any>[] = [];
  readonly role = this.userRoleService.role;
  readonly applications = signal<MerchantApplication[]>([]);
  searchText = '';
  selectedStatus = 'all';
  selectedRisk = 'all';
  readonly loading = signal(false);
  readonly errorMessage = signal('');
  pageIndex = 0;
  pageSize = 5;
  readonly totalRecords = signal(0);

  readonly statusOptions = [
    { label: 'All Statuses', value: 'all' },
    { label: 'Draft', value: 'DRAFT' },
    { label: 'Under Review', value: 'UNDER_REVIEW' },
    { label: 'Approved', value: 'APPROVED' },
    { label: 'Info Requested', value: 'INFO_REQUESTED' },
    { label: 'Rejected', value: 'REJECTED' },
  ];
  readonly riskOptions = [
    { label: 'All Risk Levels', value: 'all' },
    { label: 'Low', value: 'LOW' },
    { label: 'Medium', value: 'MEDIUM' },
    { label: 'High', value: 'HIGH' },
    { label: 'Critical', value: 'CRITICAL' },
    { label: 'Pending', value: 'PENDING' },
  ];

  get roleUserId(): string {
    return this.userRoleService.userId;
  }

  get tableColumns(): TableColumn[] {
    const role = this.role();
    const cellTemplates = [
      this.businessCellTemplate,
      this.taxIdCellTemplate,
      this.contactCellTemplate,
      this.riskCellTemplate,
      this.statusCellTemplate,
      this.dateCellTemplate,
    ];
    if (
      this.columnsCache &&
      this.columnsRole === role &&
      this.columnsViewTemplate === this.viewActionTemplate &&
      this.columnsCellTemplates?.every((template, index) => template === cellTemplates[index])
    ) {
      return this.columnsCache;
    }
    this.columnsRole = role;
    this.columnsViewTemplate = this.viewActionTemplate;
    this.columnsCellTemplates = cellTemplates;
    this.columnsCache = [
      { key: 'businessName', label: 'Business Profile', width: 195, cellTemplate: this.businessCellTemplate },
      { key: 'merchantId', label: 'Merchant ID', width: 110 },
      { key: 'taxId', label: 'Tax ID / EIN', width: 125, cellTemplate: this.taxIdCellTemplate },
      { key: 'primaryContactName', label: 'Primary Contact', width: 150, cellTemplate: this.contactCellTemplate },
      { key: 'riskLevel', label: 'Risk Assessment', width: 125, cellTemplate: this.riskCellTemplate },
      { key: 'status', label: 'Status', width: 135, cellTemplate: this.statusCellTemplate },
      { key: 'createdAt', label: 'Submitted Date ↑', width: 130, cellTemplate: this.dateCellTemplate },
      {
        key: 'actions',
        label: 'Actions',
        type: 'actions',
        width: 190,
        actions: [{ key: 'view', action: 'view', template: this.viewActionTemplate }],
      },
    ];
    return this.columnsCache;
  }

  get tableData(): Record<string, any>[] {
    const applications = this.applications();
    if (this.tableDataCacheSource === applications) return this.tableDataCache;
    this.tableDataCacheSource = applications;
    this.tableDataCache = applications.map((application) => {
      const business = application.form['step1'] ?? {};
      const contact = application.form['step2'] ?? {};
      return {
        businessName: business['legalBusinessName'] ?? 'Unnamed business',
        businessInitials: this.initials(business['legalBusinessName']),
        businessType: business['businessType'] ?? business['legalEntityType'] ?? 'Merchant',
        merchantId: application.id,
        createdByUserId: application.createdByUserId,
        taxId: this.maskTaxId(business['taxId']),
        rawTaxId: business['taxId'] ?? '',
        taxIdVisible: false,
        primaryContactName: contact['primaryContactName'] ?? '—',
        contactEmail: contact['contactEmail'] ?? '',
        createdAt: application.createdAt,
        submittedDate: this.formatDate(application.createdAt),
        submittedTime: this.formatTime(application.createdAt),
        riskLevel: application.riskLevel ?? 'PENDING',
        riskScore: application.riskScore ?? null,
        status: application.status,
        statusLabel: application.status.replaceAll('_', ' '),
        statusClass: `status-${application.status.toLocaleLowerCase().replaceAll('_', '-')}`,
      };
    });
    return this.tableDataCache;
  }

  get stats(): Array<{
    iconClass: string;
    icon: string;
    value: number;
    label: string;
    description: string;
    warning?: boolean;
  }> {
    const rows = this.tableData;
    return [
      {
        iconClass: 'blue',
        icon: '▰',
        value: this.totalRecords(),
        label: 'TOTAL',
        description: 'All merchant records',
      },
      {
        iconClass: 'purple',
        icon: '▱',
        value: this.countStatus(rows, 'DRAFT'),
        label: 'DRAFTS',
        description: 'Incomplete applications',
      },
      {
        iconClass: 'amber',
        icon: '⌛',
        value: this.countStatus(rows, 'UNDER_REVIEW'),
        label: 'UNDER REVIEW',
        description: 'Pending risk evaluation',
      },
      {
        iconClass: 'green',
        icon: '●',
        value: this.countStatus(rows, 'APPROVED'),
        label: 'APPROVED',
        description: 'Active merchant accounts',
      },
    ];
  }

  ngOnInit(): void {
    this.query$
      .pipe(
        switchMap(() => {
          this.loading.set(true);
          this.errorMessage.set('');
          return this.api
            .list({
              page: this.pageIndex,
              pageSize: this.pageSize,
              search: this.searchText.trim(),
              status: this.selectedStatus,
              risk: this.selectedRisk,
            })
            .pipe(
              catchError(() => {
                this.errorMessage.set(
                  'Could not load applications. Check the connection and try again.',
                );
                this.applications.set([]);
                this.totalRecords.set(0);
                return of(null);
              }),
              finalize(() => {
                this.loading.set(false);
              }),
            );
        }),
        takeUntil(this.destroy$),
      )
      .subscribe((result) => {
        if (!result) return;
        this.applications.set(result.items);
        this.totalRecords.set(result.total);
        this.loading.set(false);
      });
    this.userRoleService.roleChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.pageIndex = 0;
      this.loadApplications();
    });
    this.loadApplications();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadApplications(): void {
    this.query$.next();
  }

  onSearchChange(value: string): void {
    this.searchText = value;
    this.pageIndex = 0;
    this.loadApplications();
  }

  onFilterChange(): void {
    this.pageIndex = 0;
    this.loadApplications();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadApplications();
  }

  resetFilters(): void {
    this.searchText = '';
    this.selectedStatus = 'all';
    this.selectedRisk = 'all';
    this.pageIndex = 0;
    this.loadApplications();
  }

  createApplication(): void {
    void this.router.navigate(['/applications/new']);
  }
  handleView(row: Record<string, any>): void {
    const id = row['merchantId'];
    void this.router.navigate(['/applications', id]);
  }

  handleEdit(row: Record<string, any>): void {
    void this.router.navigate(['/applications', row['merchantId'], 'edit']);
  }

  toggleTaxId(row: Record<string, any>): void {
    row['taxIdVisible'] = !row['taxIdVisible'];
  }

  private countStatus(rows: Record<string, any>[], status: string): number {
    return rows.filter((row) => row['status'] === status).length;
  }
  private maskTaxId(value?: string): string {
    return value ? `••-•••${value.slice(-4)}` : '—';
  }

  private initials(value?: string): string {
    return (value ?? 'Merchant')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase();
  }

  private formatDate(value: string): string {
    return new Intl.DateTimeFormat('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: '2-digit',
    }).format(new Date(value));
  }

  private formatTime(value: string): string {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(value));
  }
}
