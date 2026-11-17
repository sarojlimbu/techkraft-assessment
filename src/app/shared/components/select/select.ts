import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-select',
  standalone: true,
  imports: [CommonModule, MatFormFieldModule, MatSelectModule],
  styleUrl: './select.scss',
  templateUrl: './select.html',
})
export class AppSelect {
  @Input() label = '';
  @Input() options: Array<{ label: string; value: string }> = [];
  @Input() value = '';

  @Output() valueChange = new EventEmitter<string>();

  onSelectionChange(event: MatSelectChange): void {
    this.value = event.value;
    this.valueChange.emit(this.value);
  }
}
