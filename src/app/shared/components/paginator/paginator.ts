import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { PageEvent } from '@angular/material/paginator';

@Component({
  selector: 'app-paginator',
  standalone: true,
  imports: [MatPaginatorModule],
  styleUrl: './paginator.scss',
  templateUrl: './paginator.html',
})
export class PaginatorComponent {
  @Input() pageSizeOptions: number[] = [5, 10, 20];
  @Input() pageSize = 5;
  @Input() showFirstLastButtons = true;
  @Input() ariaLabel = 'Select page of records';
  @Input() length = 0;
  @Input() pageIndex = 0;
  @Output() pageChange = new EventEmitter<PageEvent>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
}
