import { Component, Input, ViewChild } from '@angular/core';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';

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

  @ViewChild(MatPaginator) paginator!: MatPaginator;
}
