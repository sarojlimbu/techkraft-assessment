import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, TemplateRef, ViewChild, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { Button } from '../../shared/components/button/button';
import { Card } from '../../shared/components/card/card';
import { AppInput } from '../../shared/components/input/input';
import { AppSelect } from '../../shared/components/select/select';
import { Table, TableColumn } from '../../shared/components/table/table';
import { ApplicationStoreService, MerchantApplication } from '../../service/application-store.service';

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
export class Dashboard implements AfterViewInit {
  private readonly router = inject(Router);
  private readonly applicationStore = inject(ApplicationStoreService);

  @ViewChild('viewAction') viewActionTemplate?: TemplateRef<any>;
  applications: MerchantApplication[] = [];
  searchText = '';
  selectedStatus = 'all';
  selectedRisk = 'all';
  loading = false;
  errorMessage = '';

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

  get stats() {
    const rows = this.tableData;
    return [
      { iconClass: 'blue', value: rows.length, label: 'All merchant records' },
      { iconClass: 'purple', value: this.countStatus(rows, 'DRAFT'), label: 'Incomplete applications' },
      { iconClass: 'amber', value: this.countStatus(rows, 'UNDER_REVIEW'), label: 'Pending risk evaluation' },
      { iconClass: 'green', value: this.countStatus(rows, 'APPROVED'), label: 'Active merchant accounts' },
      { iconClass: 'purple', value: this.countStatus(rows, 'INFO_REQUESTED'), label: 'Awaiting docs' },
      {
        iconClass: 'red',
        value: rows.filter((row) => ['HIGH', 'CRITICAL'].includes(row['riskLevel'])).length,
        label: 'High / critical risk',
        warning: true,
      },
    ];
  }

  readonly tableColumns: TableColumn[] = [
    { key: 'businessName', label: 'Business Profile', width: 260 },
    { key: 'merchantId', label: 'Merchant ID', width: 150 },
    { key: 'taxId', label: 'Tax ID / EIN', width: 150 },
    { key: 'primaryContactName', label: 'Primary Contact', width: 170 },
    { key: 'riskLevel', label: 'Risk Assessment', width: 150 },
    { key: 'status', label: 'Status', type: 'status', width: 170 },
    { key: 'createdAt', label: 'Submitted Date', width: 180 },
    {
      key: 'actions',
      label: 'Actions',
      type: 'actions',
      width: 110,
      actions: [{ key: 'view', action: 'view', template: this.viewActionTemplate }],
    },
  ];

  get tableData(): Record<string, any>[] {
    return this.applications.map((application) => {
      const business = application.form['step1'] ?? {};
      const contact = application.form['step2'] ?? {};
      return {
        businessName: business['legalBusinessName'] ?? 'Unnamed business',
        merchantId: application.id,
        taxId: this.maskTaxId(business['taxId']),
        primaryContactName: contact['primaryContactName'] ?? '—',
        contactEmail: contact['contactEmail'] ?? '',
        riskLevel: application.riskLevel ?? 'PENDING',
        status: application.status,
        createdAt: application.createdAt,
      };
    });
  }

  get filteredTableData(): Record<string, any>[] {
    const query = this.searchText.trim().toLocaleLowerCase();
    return this.tableData.filter((row) => {
      const searchMatches =
        !query ||
        [row['businessName'], row['merchantId'], row['contactEmail'], row['primaryContactName']].some(
          (value) => String(value ?? '').toLocaleLowerCase().includes(query),
        );
      return (
        searchMatches &&
        (this.selectedStatus === 'all' || row['status'] === this.selectedStatus) &&
        (this.selectedRisk === 'all' || row['riskLevel'] === this.selectedRisk)
      );
    });
  }

  constructor() {
    this.loadApplications();
  }

  ngAfterViewInit(): void {
    const actions = this.tableColumns.find((column) => column.key === 'actions')?.actions;
    if (actions?.[0]) actions[0].template = this.viewActionTemplate;
  }

  loadApplications(): void {
    this.loading = true;
    this.errorMessage = '';
    try {
      this.applications = this.applicationStore.getAllStrict();
    } catch {
      this.applications = [];
      this.errorMessage = 'Could not load applications from this browser. Check storage and try again.';
    } finally {
      this.loading = false;
    }
  }

  resetFilters(): void {
    this.searchText = '';
    this.selectedStatus = 'all';
    this.selectedRisk = 'all';
  }

  createApplication(): void {
    void this.router.navigate(['/applications/new']);
  }

  handleView(row: Record<string, any>): void {
    this.openApplication(row);
  }

  private countStatus(rows: Record<string, any>[], status: string): number {
    return rows.filter((row) => row['status'] === status).length;
  }

  private maskTaxId(value?: string): string {
    if (!value) return '—';
    return `••-•••${value.slice(-4)}`;
  }

  private openApplication(row: Record<string, any>): void {
    const id = row['merchantId'];
    const isDraft = row['status'] === 'DRAFT';
    void this.router.navigate(isDraft ? ['/applications', id, 'edit'] : ['/applications', id]);
  }
}
