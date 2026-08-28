import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged, finalize, of, Subject, switchMap, takeUntil } from 'rxjs';
import { AuthService } from '@app/core/auth/auth.service';
import { CustomerProfileService } from '@app/services/customer-profile.service';
import { AppUser } from '@app/models/app-user.model';
import { ViaCepService } from '@app/services/via-cep.service';
import { formatCep, formatCpfCnpj, formatPhone, onlyDigits } from '@app/shared/utils/input-masks';

interface ProfileAddressForm {
  street: string;
  postalCode: string;
  district: string;
  city: string;
  number: string;
  state: string;
}

@Component({
  selector: 'app-customer-profile',
  imports: [ReactiveFormsModule, MatIconModule, RouterLink],
  templateUrl: './customer-profile.component.html',
  styleUrl: './customer-profile.component.scss'
})
export class CustomerProfileComponent implements OnInit, OnDestroy {
  profileForm: FormGroup;
  isLoading = true;
  isSaving = false;
  isLoggingOut = false;
  isAdmin = false;
  errorMessage = '';
  feedbackMessage = '';
  avatarPreviewUrl: string | null = null;
  selectedAvatarFile: File | null = null;
  isFetchingCep = false;
  cepErrorMessage = '';
  private readonly destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private customerProfileService: CustomerProfileService,
    private changeDetectorRef: ChangeDetectorRef,
    private viaCepService: ViaCepService,
  ) {
    this.profileForm = this.fb.group({
      email: [{ value: '', disabled: true }],
      full_name: ['', [Validators.required]],
      phone: [''],
      document: [''],
      avatar_url: [''],
      street: [''],
      postalCode: [''],
      district: [''],
      city: [''],
      number: [''],
      state: ['', [Validators.maxLength(2)]],
    });
  }

  ngOnInit(): void {
    this.bindPostalCodeAutocomplete();
    this.loadProfile();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadProfile(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.customerProfileService.getCurrentProfile().subscribe({
      next: profile => {
        this.patchProfile(profile);
        this.isLoading = false;
        this.loadAdminStatus();
        this.changeDetectorRef.markForCheck();
      },
      error: () => {
        this.errorMessage = 'Não foi possível carregar seu perfil agora. Atualize a página ou tente novamente mais tarde.';
        this.isLoading = false;
        this.changeDetectorRef.markForCheck();
      },
    });
  }

  saveProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    this.feedbackMessage = '';
    this.errorMessage = '';

    const formValue = this.profileForm.getRawValue();
    const avatarUrl$ = this.selectedAvatarFile
      ? this.customerProfileService.uploadAvatar(this.selectedAvatarFile)
      : of(formValue.avatar_url || null);

    avatarUrl$.pipe(
      switchMap(avatarUrl => this.customerProfileService.updateCurrentProfile({
        full_name: String(formValue.full_name || '').trim(),
        phone: String(formValue.phone || '').trim() || null,
        document: String(formValue.document || '').trim() || null,
        address: this.buildAddress() || null,
        avatar_url: avatarUrl,
      })),
    ).subscribe({
      next: profile => {
        this.patchProfile(profile);
        this.feedbackMessage = 'Perfil atualizado.';
        this.isSaving = false;
        this.changeDetectorRef.markForCheck();
      },
      error: () => {
        this.errorMessage = 'Não foi possível salvar seu perfil agora. Confira os dados e tente novamente.';
        this.isSaving = false;
        this.changeDetectorRef.markForCheck();
      },
    });
  }

  onAvatarSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';

    if (!file) {
      return;
    }

    if (!this.isAcceptedAvatar(file)) {
      this.errorMessage = 'Use uma imagem PNG, JPG ou WEBP de até 2 MB.';
      return;
    }

    this.selectedAvatarFile = file;
    this.errorMessage = '';

    const reader = new FileReader();
    reader.onload = () => {
      this.avatarPreviewUrl = reader.result as string;
      this.changeDetectorRef.markForCheck();
    };
    reader.readAsDataURL(file);
  }

  async logout(): Promise<void> {
    if (this.isLoggingOut) {
      return;
    }

    this.isLoggingOut = true;
    await this.authService.logout();
    this.isLoggingOut = false;
  }

  formatPhoneField(): void {
    this.formatControl('phone', formatPhone);
  }

  formatDocumentField(): void {
    this.formatControl('document', formatCpfCnpj);
  }

  formatPostalCodeField(): void {
    this.formatControl('postalCode', formatCep);
  }

  private loadAdminStatus(): void {
    this.customerProfileService.isCurrentUserAdmin().subscribe({
      next: isAdmin => {
        this.isAdmin = isAdmin;
        this.changeDetectorRef.markForCheck();
      },
      error: () => {
        this.isAdmin = false;
        this.changeDetectorRef.markForCheck();
      },
    });
  }

  private patchProfile(profile: AppUser): void {
    const address = this.parseAddress(profile.address);
    this.profileForm.patchValue({
      email: profile.email,
      full_name: profile.full_name || '',
      phone: formatPhone(profile.phone || ''),
      document: formatCpfCnpj(profile.document || ''),
      avatar_url: profile.avatar_url || '',
      ...address,
    });
    this.avatarPreviewUrl = profile.avatar_url;
    this.selectedAvatarFile = null;
  }

  private buildAddress(): string {
    const formValue = this.profileForm.getRawValue();
    const address: ProfileAddressForm = {
      street: formValue.street || '',
      postalCode: formValue.postalCode || '',
      district: formValue.district || '',
      city: formValue.city || '',
      number: formValue.number || '',
      state: (formValue.state || '').toUpperCase(),
    };

    const addressEntries: Array<[string, string]> = [
      ['Rua', address.street],
      ['CEP', address.postalCode],
      ['Bairro', address.district],
      ['Cidade', address.city],
      ['Número', address.number],
      ['Estado', address.state],
    ];

    return addressEntries
      .filter(([, value]) => value.trim())
      .map(([label, value]) => `${label}: ${value.trim()}`)
      .join('\n');
  }

  private parseAddress(address: string | null): ProfileAddressForm {
    const fields: ProfileAddressForm = {
      street: '',
      postalCode: '',
      district: '',
      city: '',
      number: '',
      state: '',
    };

    if (!address) {
      return fields;
    }

    const labels: Record<string, keyof ProfileAddressForm> = {
      rua: 'street',
      cep: 'postalCode',
      bairro: 'district',
      cidade: 'city',
      numero: 'number',
      'número': 'number',
      estado: 'state',
    };

    for (const line of address.split(/\r?\n/)) {
      const [rawLabel, ...rawValue] = line.split(':');
      const key = labels[rawLabel?.trim().toLowerCase()];

      if (key) {
        fields[key] = rawValue.join(':').trim();
      }
    }

    if (!Object.values(fields).some(Boolean)) {
      fields.street = address;
    }

    return fields;
  }

  private isAcceptedAvatar(file: File): boolean {
    const acceptedTypes = ['image/png', 'image/jpeg', 'image/webp'];
    return acceptedTypes.includes(file.type) && file.size <= 2 * 1024 * 1024;
  }

  private bindPostalCodeAutocomplete(): void {
    this.profileForm.get('postalCode')?.valueChanges.pipe(
      debounceTime(250),
      distinctUntilChanged(),
      switchMap(value => {
        const postalCode = onlyDigits(String(value || ''));

        if (postalCode.length !== 8) {
          this.isFetchingCep = false;
          this.cepErrorMessage = '';
          this.changeDetectorRef.markForCheck();
          return of(null);
        }

        this.isFetchingCep = true;
        this.cepErrorMessage = '';
        this.changeDetectorRef.markForCheck();

        return this.viaCepService.lookup(postalCode).pipe(
          finalize(() => {
            this.isFetchingCep = false;
            this.changeDetectorRef.markForCheck();
          }),
        );
      }),
      takeUntil(this.destroy$),
    ).subscribe(address => {
      if (!address) {
        const postalCode = onlyDigits(String(this.profileForm.get('postalCode')?.value || ''));
        if (postalCode.length === 8) {
          this.cepErrorMessage = 'CEP nao encontrado. Confira os numeros ou preencha o endereco manualmente.';
        }
        this.changeDetectorRef.markForCheck();
        return;
      }

      this.profileForm.patchValue({
        street: address.street || this.profileForm.value.street || '',
        district: address.district || this.profileForm.value.district || '',
        city: address.city || this.profileForm.value.city || '',
        state: address.state || this.profileForm.value.state || '',
      }, { emitEvent: false });
      this.cepErrorMessage = '';
      this.changeDetectorRef.markForCheck();
    });
  }

  private formatControl(controlName: string, formatter: (value: string) => string): void {
    const control = this.profileForm.get(controlName);
    const formatted = formatter(String(control?.value || ''));

    if (control && control.value !== formatted) {
      control.setValue(formatted, { emitEvent: false });
    }
  }

}
