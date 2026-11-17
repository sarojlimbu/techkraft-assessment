import { AfterViewInit, Component, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { Table, TableColumn } from '../../shared/components/table/table';
import { Button } from '../../shared/components/button/button';
import { AppInput } from '../../shared/components/input/input';
import { AppSelect } from '../../shared/components/select/select';
import { Card } from '../../shared/components/card/card';
import { NavbarComponent } from '../../shared/components/navbar/navbar';

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
    NavbarComponent,
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
  @ViewChild('viewAction') viewActionTemplate?: TemplateRef<any>;
  @ViewChild('editAction') editActionTemplate?: TemplateRef<any>;

  statusOptions = [
    { label: 'All Statuses', value: 'all' },
    { label: 'Draft', value: 'draft' },
    { label: 'Under Review', value: 'under_review' },
    { label: 'Approved', value: 'approved' },
    { label: 'Info Requested', value: 'info_requested' },
  ];

  riskOptions = [
    { label: 'All Risk Levels', value: 'all' },
    { label: 'Low', value: 'low' },
    { label: 'Medium', value: 'medium' },
    { label: 'High', value: 'high' },
  ];

  stats = [
    { iconClass: 'blue', value: 7, label: 'All merchant records' },
    { iconClass: 'purple', value: 3, label: 'In progress applications' },
    { iconClass: 'amber', value: 1, label: 'Pending risk evaluation' },
    { iconClass: 'green', value: 1, label: 'Active merchant accounts' },
    { iconClass: 'red', value: 2, label: 'High risk flag', warning: true },
  ];

  tableColumns: TableColumn[] = [
    { key: 'businessName', label: 'Business Profile', width: 300 },
    { key: 'merchantId', label: 'Merchant ID', width: 200 },
    { key: 'taxId', label: 'Tax ID / EIN', width: 200 },
    { key: 'primaryContactName', label: 'Primary Contact', width: 180 },
    { key: 'riskLevel', label: 'Risk Assessment', width: 170 },
    { key: 'status', label: 'Status', type: 'status', width: 220 },
    { key: 'createdAt', label: 'Submitted Date', width: 220 },
    {
      key: 'actions',
      label: 'Actions',
      type: 'actions',
      width: 220,
      actions: [
        { key: 'view', action: 'view', template: this.viewActionTemplate },
        { key: 'edit', action: 'edit', template: this.editActionTemplate },
      ],
    },
  ];

  tableData = [
    {
      businessName: 'Acme Foods',
      merchantId: 'M-1001',
      taxId: 'XX-1234567',
      primaryContactName: 'Sarah Kim',
      contactEmail: 'sarah@acmefoods.com',
      riskLevel: 'HIGH',
      riskScore: 82,
      status: 'UNDER_REVIEW',
      createdAt: '2026-11-14T10:00:00Z',
      legalEntityType: 'LLC',
      operatingCurrency: 'USD',
      annualRevenue: 1200000,
    },
    {
      businessName: 'Northwind Retail',
      merchantId: 'M-1002',
      taxId: 'XX-9876543',
      primaryContactName: 'Daniel Ross',
      contactEmail: 'daniel@northwind.com',
      riskLevel: 'LOW',
      riskScore: 28,
      status: 'APPROVED',
      createdAt: '2026-11-12T08:30:00Z',
      legalEntityType: 'Corporation',
      operatingCurrency: 'USD',
      annualRevenue: 4500000,
    },
    {
      businessName: 'Boreal Logistics',
      merchantId: 'M-1003',
      taxId: 'XX-4356278',
      primaryContactName: 'Priya Shah',
      contactEmail: 'priya@boreallogistics.com',
      riskLevel: 'MEDIUM',
      riskScore: 51,
      status: 'INFO_REQUESTED',
      createdAt: '2026-11-10T14:15:00Z',
      legalEntityType: 'Partnership',
      operatingCurrency: 'USD',
      annualRevenue: 2100000,
    },
  ];

  ngAfterViewInit(): void {
    const actionsColumn = this.tableColumns[7];

    if (actionsColumn && Array.isArray(actionsColumn.actions)) {
      if (actionsColumn.actions[0]) {
        actionsColumn.actions[0].template = this.viewActionTemplate;
      }

      if (actionsColumn.actions[1]) {
        actionsColumn.actions[1].template = this.editActionTemplate;
      }
    }
  }

  handleClick(): void {
    console.log('Button clicked from dashboard');
  }

  handleView(row: Record<string, any>): void {
    console.log('View row:', row);
  }

  handleReview(row: Record<string, any>): void {
    console.log('Review row:', row);
  }

  handleTableAction(event: { action: string; row: Record<string, any> }): void {
    console.log('Table action:', event.action, event.row);
  }
}
