import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  styleUrl: './button.scss',
  templateUrl: './button.html',
})
export class Button {
  @Input() label = 'Navigate';
  @Input() variant: 'text' | 'outlined' | 'filled' | 'elevated' = 'elevated';
  @Input() icon = '';
  @Input() disabled = false;
  @Input() buttonClass = '';
  @Input() buttonStyle: Record<string, string> = {};

  @Output() buttonClick = new EventEmitter<void>();

  onClick(): void {
    if (!this.disabled) {
      this.buttonClick.emit();
    }
  }
}
