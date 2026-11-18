import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [CommonModule, MatFormFieldModule, MatInputModule, MatIconModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AppInput),
      multi: true,
    },
  ],
  styleUrl: './input.scss',
  templateUrl: './input.html',
})
export class AppInput implements ControlValueAccessor {
  @Input() label = '';
  @Input() placeholder = '';
  @Input() type: 'text' | 'email' | 'password' | 'number' = 'text';
  @Input() appearance: 'outline' | 'fill' = 'outline';
  @Input() icon = '';
  @Input() value = '';
  @Input() disabled = false;
  @Input() required = false;
  @Input() errorText = '';
  @Input() showError = false;

  @Output() valueChange = new EventEmitter<string>();

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  isFocused = false;
  isTouched = false;

  get displayLabel(): string {
    const cleaned = this.label.replace(/\*+$/g, '').trim();
    return `${cleaned}${this.required ? ' *' : ''}`;
  }

  get showPlaceholder(): boolean {
    return !!this.placeholder && this.isFocused;
  }

  get resolvedErrorText(): string {
    if (this.errorText) {
      return this.errorText;
    }

    const labelText = (this.label || 'This field').replace(/\*+/g, '').trim();

    return labelText ? `${labelText} is required` : 'This field is required';
  }

  get shouldShowError(): boolean {
    return this.required && (this.showError || (!this.value?.trim() && this.isTouched));
  }

  writeValue(value: string | null): void {
    this.value = value ?? '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.value = target.value;
    this.onChange(this.value);
    this.valueChange.emit(this.value);
    this.onTouched();
  }

  onFocus(): void {
    this.isFocused = true;
  }

  onBlur(): void {
    this.isTouched = true;
    this.isFocused = false;
    this.onTouched();
  }
}
