import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PaginatorComponent } from '../paginator/paginator';

export interface TableAction {
  key: string;
  label?: string;
  action?: string;
  template?: TemplateRef<any>;
  variant?: 'flat' | 'stroked';
  color?: 'primary' | 'accent' | 'warn';
  icon?: string;
  disabled?: boolean;
}

export interface TableStatusConfig {
  classMap?: Record<string, string>;
  defaultClass?: string;
}

export interface TableColumn {
  key: string;
  label: string;
  type?: 'text' | 'status' | 'actions';
  width?: number;
  actions?: TableAction[];
  statusConfig?: TableStatusConfig;
}

export interface MerchantRow {
  businessName: string;
  merchantId: string;
  taxId: string;
  primaryContactName: string;
  contactEmail: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  riskScore: number;
  status: 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'INFO_REQUESTED';
  createdAt: string;
  legalEntityType: string;
  operatingCurrency: string;
  annualRevenue: number;
}

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatButtonModule, MatIconModule, PaginatorComponent],
  styleUrl: './table.scss',
  templateUrl: './table.html',
})
export class Table implements AfterViewInit, OnInit, OnChanges {
  @Input() columns: TableColumn[] = [
    { key: 'businessName', label: 'Business Profile' },
    { key: 'merchantId', label: 'Merchant ID' },
    { key: 'status', label: 'Status', type: 'status' },
    {
      key: 'actions',
      label: 'Actions',
      type: 'actions',
      actions: [
        { key: 'view', label: 'View', action: 'view', variant: 'stroked' },
        { key: 'review', label: 'Review', action: 'review', variant: 'flat', color: 'primary' },
      ],
    },
  ];

  @Input() data: Record<string, any>[] = [
    { businessName: 'Acme Foods', merchantId: 'M-1001', status: 'UNDER_REVIEW', actions: '' },
    { businessName: 'Northwind Retail', merchantId: 'M-1002', status: 'APPROVED', actions: '' },
    {
      businessName: 'Boreal Logistics',
      merchantId: 'M-1003',
      status: 'INFO_REQUESTED',
      actions: '',
    },
  ];

  @Output() actionClick = new EventEmitter<{ action: string; row: Record<string, any> }>();

  displayedColumns: string[] = [];
  dataSource = new MatTableDataSource<Record<string, any>>([]);

  @ViewChild(PaginatorComponent) paginatorComponent!: PaginatorComponent;

  ngOnInit(): void {
    this.displayedColumns = this.columns.map((column) => column.key);
    this.dataSource = new MatTableDataSource<Record<string, any>>(this.data);
  }

  ngAfterViewInit(): void {
    if (this.paginatorComponent?.paginator) {
      this.dataSource.paginator = this.paginatorComponent.paginator;
    }
  }

  ngOnChanges(): void {
    this.displayedColumns = this.columns.map((column) => column.key);
    this.dataSource = new MatTableDataSource<Record<string, any>>(this.data);
    if (this.paginatorComponent?.paginator) {
      this.dataSource.paginator = this.paginatorComponent.paginator;
    }
  }

  getCellValue(row: Record<string, any>, key: string): any {
    return row?.[key];
  }

  isActionsColumn(column: TableColumn): boolean {
    return column.type === 'actions' || column.key === 'actions';
  }

  hasActionsColumn(): boolean {
    return this.columns.some((column) => this.isActionsColumn(column));
  }

  isStatusColumn(column: TableColumn): boolean {
    return column.type === 'status' || column.key === 'status';
  }

  getColumnActions(column: TableColumn): TableAction[] {
    return column.actions ?? [];
  }

  getColumnWidth(column: TableColumn): string | null {
    const width = column.width;

    if (width === undefined || width === null || width === 0) {
      return null;
    }

    return `${width}px`;
  }

  getStatusTone(status: string): 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'primary' {
    switch (status) {
      case 'APPROVED':
        return 'success';
      case 'UNDER_REVIEW':
        return 'warning';
      case 'INFO_REQUESTED':
        return 'primary';
      case 'REJECTED':
        return 'danger';
      case 'SUBMITTED':
        return 'info';
      default:
        return 'neutral';
    }
  }

  getStatusBackgroundColor(status: string): string {
    switch (status) {
      case 'APPROVED':
        return 'rgba(16, 185, 129, 0.12)';
      case 'UNDER_REVIEW':
        return 'rgba(245, 158, 11, 0.12)';
      case 'INFO_REQUESTED':
        return 'rgba(139, 92, 246, 0.12)';
      case 'REJECTED':
        return 'rgba(239, 68, 68, 0.12)';
      case 'SUBMITTED':
        return 'rgba(59, 130, 246, 0.1)';
      default:
        return 'rgba(148, 163, 184, 0.12)';
    }
  }

  getStatusTextColor(status: string): string {
    switch (status) {
      case 'APPROVED':
        return '#047857';
      case 'UNDER_REVIEW':
        return '#9a5b00';
      case 'INFO_REQUESTED':
        return '#6d28d9';
      case 'REJECTED':
        return '#b91c1c';
      case 'SUBMITTED':
        return '#1d4ed8';
      default:
        return '#475569';
    }
  }

  getStatusClass(column: TableColumn, status: string): string {
    const classMap = column.statusConfig?.classMap ?? {};
    const normalized = String(status ?? '');
    return (
      classMap[normalized] ??
      column.statusConfig?.defaultClass ??
      `status-${normalized.toLowerCase().replace(/\s+/g, '_')}`
    );
  }

  onAction(action: string, row: Record<string, any>): void {
    this.actionClick.emit({ action, row });
  }
}
