import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { debounceTime, distinctUntilChanged, finalize, of, Subject, switchMap, takeUntil } from 'rxjs';
import { AdminSectionTab, AdminSectionTabsComponent } from '@app/features/admin/shared/admin-section-tabs/admin-section-tabs.component';
import { ADMIN_ROLE_LABELS, AdminRole, normalizeAdminRole } from '@app/models/admin.model';
import { AdminProfileService } from '@app/services/admin-profile.service';
import { ViaCepService } from '@app/services/via-cep.service';
import { SharedMaterialModule } from '@app/shared/material/shared-material.module';
import { formatCep, formatCpfCnpj, formatPhone, onlyDigits } from '@app/shared/utils/input-masks';

interface AdminAddressForm {
  street: string;
  district: string;
  postalCode: string;
}

@Component({
  selector: 'app-admin-profile',
  imports: [ReactiveFormsModule, SharedMaterialModule, AdminSectionTabsComponent],
  templateUrl: './admin-profile.component.html',
  styleUrl: './admin-profile.component.scss',
})
export class AdminProfileComponent implements OnInit, OnDestroy {
  readonly profileTabs: AdminSectionTab[] = [
    { label: 'Perfil', icon: 'account_circle', route: '/admin-profile' },
    { label: 'Personalização', icon: 'palette', route: '/customization' },
  ];

  profileForm: FormGroup;
  isLoading = true;
  isSaving = false;
  errorMessage = '';
  adminRole: AdminRole | null = null;
  createdAt = '';
  isFetchingSenderCep = false;
  senderCepMessage = '';
  isFetchingUserCep = false;
  userCepMessage = '';
  private readonly destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private adminProfileService: AdminProfileService,
    private snackBar: MatSnackBar,
    private viaCepService: ViaCepService,
  ) {
    this.profileForm = this.fb.group({
      email: [{ value: '', disabled: true }],
      full_name: ['', [Validators.required, Validators.minLength(3)]],
      phone: [''],
      document: [''],
      address_street: [''],
      address_district: [''],
      address_postal_code: [''],
      region: ['', [Validators.required, Validators.minLength(2)]],
      store_name: ['', [Validators.required, Validators.minLength(2)]],
      sender_document: [''],
      sender_email: [''],
      sender_phone: [''],
      sender_postal_code: [''],
      sender_address: [''],
      sender_number: [''],
      sender_complement: [''],
      sender_district: [''],
      sender_city: [''],
      sender_state: ['', [Validators.maxLength(2)]],
      default_package_weight: [0.5, [Validators.required, Validators.min(0.001)]],
      default_package_width: [16, [Validators.required, Validators.min(1)]],
      default_package_height: [4, [Validators.required, Validators.min(1)]],
      default_package_length: [24, [Validators.required, Validators.min(1)]],
    });
  }

  ngOnInit(): void {
    this.bindUserPostalCodeAutocomplete();
    this.bindSenderPostalCodeAutocomplete();
    this.loadProfile();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadProfile(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.adminProfileService.getCurrentAdminProfile().subscribe({
      next: profile => {
        this.adminRole = normalizeAdminRole(profile.admin.role);
        this.createdAt = profile.admin.created_at;
        const userAddress = this.parseAddress(profile.user.address);
        this.profileForm.patchValue({
          email: profile.user.email,
          full_name: profile.user.full_name || '',
          phone: formatPhone(profile.user.phone || ''),
          document: formatCpfCnpj(profile.user.document || ''),
          address_street: userAddress.street,
          address_district: userAddress.district,
          address_postal_code: formatCep(userAddress.postalCode),
          region: profile.admin.region,
          store_name: profile.admin.store_name,
          sender_document: formatCpfCnpj(profile.store?.sender_document || ''),
          sender_email: profile.store?.sender_email || '',
          sender_phone: formatPhone(profile.store?.sender_phone || ''),
          sender_postal_code: formatCep(profile.store?.sender_postal_code || ''),
          sender_address: profile.store?.sender_address || '',
          sender_number: profile.store?.sender_number || '',
          sender_complement: profile.store?.sender_complement || '',
          sender_district: profile.store?.sender_district || '',
          sender_city: profile.store?.sender_city || '',
          sender_state: profile.store?.sender_state || '',
          default_package_weight: profile.store?.default_package_weight || 0.5,
          default_package_width: profile.store?.default_package_width || 16,
          default_package_height: profile.store?.default_package_height || 4,
          default_package_length: profile.store?.default_package_length || 24,
        }, { emitEvent: false });
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Não foi possível carregar o perfil agora. Tente novamente em alguns instantes.';
        this.isLoading = false;
      },
    });
  }

  saveProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';

    this.adminProfileService.updateCurrentAdminProfile({
      user: {
        full_name: this.profileForm.value.full_name,
        phone: this.profileForm.value.phone || null,
        document: this.profileForm.value.document || null,
        address: this.buildAddress(),
      },
      admin: {
        region: this.profileForm.value.region,
        store_name: this.profileForm.value.store_name,
      },
      store: {
        sender_document: this.profileForm.value.sender_document || null,
        sender_email: this.profileForm.value.sender_email || null,
        sender_phone: this.profileForm.value.sender_phone || null,
        sender_postal_code: this.profileForm.value.sender_postal_code || null,
        sender_address: this.profileForm.value.sender_address || null,
        sender_number: this.profileForm.value.sender_number || null,
        sender_complement: this.profileForm.value.sender_complement || null,
        sender_district: this.profileForm.value.sender_district || null,
        sender_city: this.profileForm.value.sender_city || null,
        sender_state: this.profileForm.value.sender_state || null,
        default_package_weight: Number(this.profileForm.value.default_package_weight) || 0.5,
        default_package_width: Number(this.profileForm.value.default_package_width) || 16,
        default_package_height: Number(this.profileForm.value.default_package_height) || 4,
        default_package_length: Number(this.profileForm.value.default_package_length) || 24,
      },
    }).subscribe({
      next: profile => {
        this.adminRole = normalizeAdminRole(profile.admin.role);
        this.createdAt = profile.admin.created_at;
        const userAddress = this.parseAddress(profile.user.address);
        this.profileForm.patchValue({
          full_name: profile.user.full_name || '',
          phone: formatPhone(profile.user.phone || ''),
          document: formatCpfCnpj(profile.user.document || ''),
          address_street: userAddress.street,
          address_district: userAddress.district,
          address_postal_code: formatCep(userAddress.postalCode),
          region: profile.admin.region,
          store_name: profile.admin.store_name,
          sender_document: formatCpfCnpj(profile.store?.sender_document || ''),
          sender_email: profile.store?.sender_email || '',
          sender_phone: formatPhone(profile.store?.sender_phone || ''),
          sender_postal_code: formatCep(profile.store?.sender_postal_code || ''),
          sender_address: profile.store?.sender_address || '',
          sender_number: profile.store?.sender_number || '',
          sender_complement: profile.store?.sender_complement || '',
          sender_district: profile.store?.sender_district || '',
          sender_city: profile.store?.sender_city || '',
          sender_state: profile.store?.sender_state || '',
          default_package_weight: profile.store?.default_package_weight || 0.5,
          default_package_width: profile.store?.default_package_width || 16,
          default_package_height: profile.store?.default_package_height || 4,
          default_package_length: profile.store?.default_package_length || 24,
        }, { emitEvent: false });
        this.isSaving = false;
        this.showFeedback('Perfil administrativo atualizado.');
      },
      error: () => {
        this.errorMessage = 'Não foi possível salvar o perfil agora. Confira os dados e tente novamente.';
        this.isSaving = false;
      },
    });
  }

  roleLabel(): string {
    return this.adminRole ? ADMIN_ROLE_LABELS[this.adminRole] : 'Administrador';
  }

  initials(): string {
    const name = this.profileForm.value.full_name as string;
    return (name || this.profileForm.getRawValue().email || 'AD')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part: string) => part[0]?.toUpperCase())
      .join('') || 'AD';
  }

  private showFeedback(message: string): void {
    this.snackBar.open(message, 'Fechar', {
      duration: 3500,
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
  }

  formatPhoneField(): void {
    this.formatControl('phone', formatPhone);
  }

  formatDocumentField(): void {
    this.formatControl('document', formatCpfCnpj);
  }

  formatUserPostalCodeField(): void {
    this.formatControl('address_postal_code', formatCep);
  }

  formatSenderDocumentField(): void {
    this.formatControl('sender_document', formatCpfCnpj);
  }

  formatSenderPhoneField(): void {
    this.formatControl('sender_phone', formatPhone);
  }

  formatSenderPostalCodeField(): void {
    this.formatControl('sender_postal_code', formatCep);
  }

  private bindSenderPostalCodeAutocomplete(): void {
    this.profileForm.get('sender_postal_code')?.valueChanges.pipe(
      debounceTime(250),
      distinctUntilChanged(),
      switchMap(value => {
        const postalCode = onlyDigits(String(value || ''));

        if (postalCode.length !== 8) {
          this.isFetchingSenderCep = false;
          this.senderCepMessage = '';
          return of(null);
        }

        this.isFetchingSenderCep = true;
        this.senderCepMessage = '';

        return this.viaCepService.lookup(postalCode).pipe(
          finalize(() => {
            this.isFetchingSenderCep = false;
          }),
        );
      }),
      takeUntil(this.destroy$),
    ).subscribe(address => {
      if (!address) {
        const postalCode = onlyDigits(String(this.profileForm.get('sender_postal_code')?.value || ''));
        if (postalCode.length === 8) {
          this.senderCepMessage = 'CEP nao encontrado. Confira os numeros ou preencha manualmente.';
        }
        return;
      }

      this.profileForm.patchValue({
        sender_address: address.street || this.profileForm.value.sender_address || '',
        sender_district: address.district || this.profileForm.value.sender_district || '',
        sender_city: address.city || this.profileForm.value.sender_city || '',
        sender_state: address.state || this.profileForm.value.sender_state || '',
      }, { emitEvent: false });
      this.senderCepMessage = '';
    });
  }

  private bindUserPostalCodeAutocomplete(): void {
    this.profileForm.get('address_postal_code')?.valueChanges.pipe(
      debounceTime(250),
      distinctUntilChanged(),
      switchMap(value => {
        const postalCode = onlyDigits(String(value || ''));

        if (postalCode.length !== 8) {
          this.isFetchingUserCep = false;
          this.userCepMessage = '';
          return of(null);
        }

        this.isFetchingUserCep = true;
        this.userCepMessage = '';

        return this.viaCepService.lookup(postalCode).pipe(
          finalize(() => {
            this.isFetchingUserCep = false;
          }),
        );
      }),
      takeUntil(this.destroy$),
    ).subscribe(address => {
      if (!address) {
        const postalCode = onlyDigits(String(this.profileForm.get('address_postal_code')?.value || ''));
        if (postalCode.length === 8) {
          this.userCepMessage = 'CEP nao encontrado. Confira os numeros ou preencha manualmente.';
        }
        return;
      }

      this.profileForm.patchValue({
        address_street: address.street || this.profileForm.value.address_street || '',
        address_district: address.district || this.profileForm.value.address_district || '',
      }, { emitEvent: false });
      this.userCepMessage = '';
    });
  }

  private buildAddress(): string | null {
    const address: AdminAddressForm = {
      street: this.profileForm.value.address_street || '',
      district: this.profileForm.value.address_district || '',
      postalCode: formatCep(this.profileForm.value.address_postal_code || ''),
    };

    const addressEntries: Array<[string, string]> = [
      ['Rua', address.street],
      ['Bairro', address.district],
      ['CEP', address.postalCode],
    ];

    const formatted = addressEntries
      .filter(([, value]) => Boolean(value))
      .map(([label, value]) => `${label}: ${value}`)
      .join('\n');

    return formatted || null;
  }

  private parseAddress(address: string | null): AdminAddressForm {
    const fields: AdminAddressForm = {
      street: '',
      district: '',
      postalCode: '',
    };

    if (!address) {
      return fields;
    }

    const labelMap: Record<string, keyof AdminAddressForm> = {
      rua: 'street',
      endereco: 'street',
      endereço: 'street',
      bairro: 'district',
      cep: 'postalCode',
    };

    for (const line of address.split(/\r?\n| - /)) {
      const [rawLabel, ...rawValue] = line.split(':');
      const label = rawLabel.trim().toLowerCase();
      const field = labelMap[label];

      if (field && rawValue.length) {
        fields[field] = rawValue.join(':').trim();
      }
    }

    if (!fields.postalCode) {
      fields.postalCode = onlyDigits(address).slice(-8);
    }

    if (!fields.street) {
      fields.street = address.replace(/cep[:\s-]*\d{5}-?\d{3}/i, '').trim();
    }

    return fields;
  }

  private formatControl(controlName: string, formatter: (value: string) => string): void {
    const control = this.profileForm.get(controlName);
    const formatted = formatter(String(control?.value || ''));

    if (control && control.value !== formatted) {
      control.setValue(formatted, { emitEvent: false });
    }
  }
}
