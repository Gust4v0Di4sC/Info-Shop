import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { of, switchMap } from 'rxjs';
import { AuthService } from '@app/core/auth/auth.service';
import { CustomerProfileService } from '@app/services/customer-profile.service';
import { AppUser } from '@app/models/app-user.model';

interface ProfileAddressForm {
  street: string;
  postalCode: string;
  district: string;
  number: string;
  state: string;
}

@Component({
  selector: 'app-customer-profile',
  imports: [ReactiveFormsModule, MatIconModule, RouterLink],
  templateUrl: './customer-profile.component.html',
  styleUrl: './customer-profile.component.scss'
})
export class CustomerProfileComponent implements OnInit {
  profileForm: FormGroup;
  isLoading = true;
  isSaving = false;
  isLoggingOut = false;
  isAdmin = false;
  errorMessage = '';
  feedbackMessage = '';
  avatarPreviewUrl: string | null = null;
  selectedAvatarFile: File | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private customerProfileService: CustomerProfileService,
    private changeDetectorRef: ChangeDetectorRef,
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
      number: [''],
      state: ['', [Validators.maxLength(2)]],
    });
  }

  ngOnInit(): void {
    this.loadProfile();
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

    const avatarUrl$ = this.selectedAvatarFile
      ? this.customerProfileService.uploadAvatar(this.selectedAvatarFile)
      : of(this.profileForm.value.avatar_url || null);

    avatarUrl$.pipe(
      switchMap(avatarUrl => this.customerProfileService.updateCurrentProfile({
        full_name: this.profileForm.value.full_name,
        phone: this.profileForm.value.phone || null,
        document: this.profileForm.value.document || null,
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
      phone: profile.phone || '',
      document: profile.document || '',
      avatar_url: profile.avatar_url || '',
      ...address,
    });
    this.avatarPreviewUrl = profile.avatar_url;
    this.selectedAvatarFile = null;
  }

  private buildAddress(): string {
    const address: ProfileAddressForm = {
      street: this.profileForm.value.street || '',
      postalCode: this.profileForm.value.postalCode || '',
      district: this.profileForm.value.district || '',
      number: this.profileForm.value.number || '',
      state: (this.profileForm.value.state || '').toUpperCase(),
    };

    const addressEntries: Array<[string, string]> = [
      ['Rua', address.street],
      ['CEP', address.postalCode],
      ['Bairro', address.district],
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
      numero: 'number',
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

}
