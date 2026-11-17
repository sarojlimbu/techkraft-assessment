import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [CommonModule, MatFormFieldModule, MatInputModule, MatIconModule],
  styleUrl: './input.scss',
  templateUrl: './input.html',
})
export class AppInput {
  @Input() label = '';
  @Input() placeholder = '';
  @Input() type: 'text' | 'email' | 'password' | 'number' = 'text';
  @Input() appearance: 'outline' | 'fill' = 'outline';
  @Input() icon = '';
  @Input() value = '';
  @Input() disabled = false;

  @Output() valueChange = new EventEmitter<string>();

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.value = target.value;
    this.valueChange.emit(this.value);
  }
}
