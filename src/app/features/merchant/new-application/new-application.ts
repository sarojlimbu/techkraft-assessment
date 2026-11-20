import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { EMPTY, Subject, of } from 'rxjs';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  map,
  switchMap,
  takeUntil,
  tap,
} from 'rxjs/operators';
import { AppInput, Button } from '../../../shared/components';
import { ApplicationApiService } from '../../../service/application-api.service';

interface FormState {
  legalBusinessName: string;
  businessType: string;
  taxId: string;
  annualRevenue: string;
  businessAddress: string;
  city: string;
  state: string;
  postalCode: string;
  primaryContactName: string;
  contactEmail: string;
  contactPhone: string;
  principalOwnerName: string;
  ownerStake: string;
  ownerSSN: string;
  bankName: string;
  accountHolderName: string;
  routingNumber: string;
  accountNumber: string;
  estimatedMonthlyVolume: string;
  pciClass: string;
  businessLicenseNumber: string;
  confirmCompliance: boolean;
}

@Component({
  selector: 'app-merchant-application',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AppInput, Button],
  templateUrl: './new-application.html',
  styleUrl: './new-application.scss',
})
export class MerchantApplicationComponent implements OnInit, OnDestroy {
  readonly steps = [
    { index: 1, label: 'Business Info', key: 'business-info' },
    { index: 2, label: 'Owner & Contact', key: 'owner-contact' },
    { index: 3, label: 'Banking', key: 'banking' },
    { index: 4, label: 'Compliance', key: 'compliance' },
    { index: 5, label: 'Review & Submit', key: 'review' },
  ];

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly applicationApi = inject(ApplicationApiService);
  private readonly fb = inject(FormBuilder);
  private readonly destroy$ = new Subject<void>();
  private readonly draftStorageKey = 'merchant-application-draft';

  readonly merchantForm: FormGroup = this.fb.group({
    step1: this.fb.group({
      legalBusinessName: ['', Validators.required],
      businessType: ['', Validators.required],
      taxId: ['', [Validators.required, Validators.pattern(/^\d{2}-?\d{7}$/)]],
      annualRevenue: ['', [Validators.required, Validators.min(1)]],
      businessAddress: ['', Validators.required],
      city: ['', Validators.required],
      state: ['', Validators.required],
      postalCode: ['', [Validators.required, Validators.pattern(/^\d{5}$/)]],
    }),
    step2: this.fb.group({
      primaryContactName: ['', Validators.required],
      contactEmail: ['', [Validators.required, Validators.email]],
      contactPhone: ['', [Validators.required, Validators.pattern(/^[0-9+()\s-]{10,}$/)]],
      principalOwnerName: ['', Validators.required],
      ownerSSN: ['', [Validators.required, Validators.pattern(/^\d{3}-?\d{2}-?\d{4}$/)]],
      ownerStake: ['', [Validators.required, Validators.min(1), Validators.max(100)]],
    }),
    step3: this.fb.group({
      bankName: ['', Validators.required],
      accountHolderName: ['', Validators.required],
      routingNumber: ['', [Validators.required, Validators.pattern(/^\d{9}$/)]],
      accountNumber: ['', [Validators.required, Validators.minLength(8)]],
    }),
    step4: this.fb.group({
      estimatedMonthlyVolume: ['', [Validators.required, Validators.min(1)]],
      pciClass: ['', Validators.required],
      businessLicenseNumber: ['', Validators.required],
      confirmCompliance: [false, Validators.requiredTrue],
    }),
  });

  mode: 'create' | 'edit' = 'create';
  applicationId: string | null = null;
  currentStep = 0;
  draftStatus: 'idle' | 'saving' | 'saved' | 'error' = 'idle';
  loadError = '';
  private hasSubmitted = false;

  readonly requiredFieldsByStep: Record<number, string[]> = {
    0: [
      'legalBusinessName',
      'businessType',
      'taxId',
      'annualRevenue',
      'businessAddress',
      'city',
      'state',
      'postalCode',
    ],
    1: [
      'primaryContactName',
      'contactEmail',
      'contactPhone',
      'principalOwnerName',
      'ownerSSN',
      'ownerStake',
    ],
    2: ['bankName', 'accountHolderName', 'routingNumber', 'accountNumber'],
    3: ['estimatedMonthlyVolume', 'pciClass', 'businessLicenseNumber', 'confirmCompliance'],
    4: [],
  };

  get isEditMode(): boolean {
    return this.mode === 'edit';
  }

  get isFirstStep(): boolean {
    return this.currentStep === 0;
  }

  get isLastStep(): boolean {
    return this.currentStep === this.steps.length - 1;
  }

  get currentStepGroup(): FormGroup {
    return this.getStepGroup(this.currentStep + 1);
  }

  getStepGroup(step: number): FormGroup {
    return this.merchantForm.get(`step${step}`) as FormGroup;
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.applicationId = id;
    this.mode = id ? 'edit' : 'create';

    if (id) {
      this.applicationApi.get(id).subscribe({
        next: (application) => this.merchantForm.patchValue(application.form, { emitEvent: false }),
        error: () => {
          this.loadError =
            'This application is unavailable or you do not have permission to edit it.';
        },
      });
    } else {
      this.restoreDraft();
    }

    this.merchantForm.valueChanges
      .pipe(
        map(() => this.merchantForm.getRawValue()),
        debounceTime(500),
        distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)),
        tap(() => {
          this.draftStatus = 'saving';
        }),
        switchMap((value) =>
          this.persistDraft(value).pipe(
            catchError(() => {
              this.draftStatus = 'error';
              return EMPTY;
            }),
          ),
        ),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: () => {
          this.draftStatus = 'saved';
        },
        error: () => {
          this.draftStatus = 'error';
        },
      });
  }

  ngOnDestroy(): void {
    this.saveCurrentDraft();
    this.destroy$.next();
    this.destroy$.complete();
  }

  getStepClass(stepIndex: number): string {
    if (stepIndex < this.currentStep) {
      return 'completed';
    }

    if (stepIndex === this.currentStep) {
      return 'active';
    }

    return 'pending';
  }

  fieldRequired(field: string): boolean {
    return (this.requiredFieldsByStep[this.currentStep] ?? []).includes(field);
  }

  fieldHasError(field: string): boolean {
    const control = this.currentStepGroup.get(field);
    return !!control && control.invalid && (control.touched || this.currentStepGroup.dirty);
  }

  fieldErrorText(field: string): string {
    const control = this.currentStepGroup.get(field);
    const errors = control?.errors;

    if (!errors) {
      return '';
    }

    const labels: Record<string, string> = {
      taxId: 'Tax ID / EIN',
      postalCode: 'ZIP / Postal Code',
      contactPhone: 'Phone number',
      ownerSSN: 'SSN / National ID',
      routingNumber: 'Routing number',
      accountNumber: 'Bank account number',
    };
    const label = labels[field] ?? field;

    if (errors['required']) {
      return `${label} is required.`;
    }

    if (errors['minlength']) {
      return `${label} must be at least ${errors['minlength'].requiredLength} characters.`;
    }

    if (errors['maxlength']) {
      return `${label} must be no more than ${errors['maxlength'].requiredLength} characters.`;
    }

    if (errors['pattern']) {
      const patternMessages: Record<string, string> = {
        taxId: 'Enter a valid Tax ID in 12-3456789 format.',
        postalCode: 'Enter a 5-digit ZIP / Postal Code.',
        contactPhone: 'Enter a phone number with at least 10 characters.',
        ownerSSN: 'Enter a valid 9-digit SSN / National ID.',
        routingNumber: 'Routing number must contain exactly 9 digits.',
      };

      return patternMessages[field] ?? `Enter a valid ${label.toLowerCase()}.`;
    }

    return '';
  }

  getStepControl(stepIndex: number, field: string): AbstractControl | null {
    return this.merchantForm.get(`step${stepIndex + 1}`)?.get(field) ?? null;
  }

  nextStep(): void {
    const current = this.currentStepGroup;

    if (current.invalid) {
      current.markAllAsTouched();
      return;
    }

    if (this.currentStep < this.steps.length - 1) {
      this.currentStep += 1;
    }
  }

  previousStep(): void {
    if (this.currentStep > 0) {
      this.currentStep -= 1;
    }
  }

  saveDraft(): void {
    this.draftStatus = 'saving';
    this.persistDraft(this.merchantForm.getRawValue()).subscribe({
      next: () => {
        this.draftStatus = 'saved';
      },
      error: () => {
        this.draftStatus = 'error';
      },
    });
  }

  submitApplication(): void {
    if (this.merchantForm.invalid) {
      this.merchantForm.markAllAsTouched();
      return;
    }

    this.draftStatus = 'saving';
    this.applicationApi
      .save(this.merchantForm.getRawValue(), { draft: false, id: this.applicationId ?? undefined })
      .subscribe({
        next: () => {
          this.hasSubmitted = true;
          this.applicationId = null;
          localStorage.removeItem(this.draftStorageKey);
          void this.router.navigate(['/dashboard']);
        },
        error: (error: unknown) => {
          this.draftStatus = 'error';
          if (error instanceof HttpErrorResponse) {
            const message =
              typeof error.error?.message === 'string'
                ? error.error.message
                : error.statusText || 'Request failed';
            this.loadError = `Could not submit the application (HTTP ${error.status}): ${message}`;
          } else {
            this.loadError = 'Could not submit the application due to an unexpected error.';
          }
        },
      });
  }

  private restoreDraft(): void {
    try {
      const raw = localStorage.getItem(this.draftStorageKey);
      if (!raw) {
        return;
      }

      const parsed = JSON.parse(raw) as { value?: Record<string, unknown> };
      if (parsed?.value) {
        this.merchantForm.patchValue(parsed.value as any);
      }
    } catch {
      localStorage.removeItem(this.draftStorageKey);
    }
  }

  private persistDraft(value: Record<string, unknown>): any {
    if (!this.hasFormContent(value)) return of(void 0);
    return this.applicationApi
      .save(value, { draft: true, id: this.applicationId ?? undefined })
      .pipe(
        tap((draft) => {
          this.applicationId = draft.id;
          localStorage.removeItem(this.draftStorageKey);
        }),
        map(() => void 0),
      );
  }

  private saveCurrentDraft(): void {
    if (this.hasSubmitted || !this.hasFormContent(this.merchantForm.getRawValue())) {
      return;
    }

    try {
      this.applicationApi
        .save(this.merchantForm.getRawValue(), { draft: true, id: this.applicationId ?? undefined })
        .subscribe({
          next: (draft) => {
            this.applicationId = draft.id;
            localStorage.removeItem(this.draftStorageKey);
          },
          error: () => {
            this.draftStatus = 'error';
          },
        });
    } catch {
      this.draftStatus = 'error';
    }
  }

  private hasFormContent(value: unknown): boolean {
    if (typeof value === 'string') {
      return value.trim().length > 0;
    }
    if (typeof value === 'boolean') {
      return value;
    }
    if (value && typeof value === 'object') {
      return Object.values(value).some((entry) => this.hasFormContent(entry));
    }
    return value !== null && value !== undefined;
  }
}
