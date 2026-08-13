import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AdminSectionTab, AdminSectionTabsComponent } from '@app/features/admin/shared/admin-section-tabs/admin-section-tabs.component';
import { ADMIN_ROLE_LABELS, AdminRole, normalizeAdminRole } from '@app/models/admin.model';
import { AdminProfileService } from '@app/services/admin-profile.service';
import { SharedMaterialModule } from '@app/shared/material/shared-material.module';

@Component({
  selector: 'app-admin-profile',
  imports: [ReactiveFormsModule, SharedMaterialModule, AdminSectionTabsComponent],
  templateUrl: './admin-profile.component.html',
  styleUrl: './admin-profile.component.scss',
})
export class AdminProfileComponent implements OnInit {
  readonly profileTabs: AdminSectionTab[] = [
    { label: 'Perfil', icon: 'account_circle', route: '/admin-profile' },
    { label: 'Personalizacao', icon: 'palette', route: '/customization' },
  ];

  profileForm: FormGroup;
  isLoading = true;
  isSaving = false;
  errorMessage = '';
  adminRole: AdminRole | null = null;
  createdAt = '';

  constructor(
    private fb: FormBuilder,
    private adminProfileService: AdminProfileService,
    private snackBar: MatSnackBar,
  ) {
    this.profileForm = this.fb.group({
      email: [{ value: '', disabled: true }],
      full_name: ['', [Validators.required, Validators.minLength(3)]],
      phone: [''],
      document: [''],
      address: [''],
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
    this.loadProfile();
  }

  loadProfile(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.adminProfileService.getCurrentAdminProfile().subscribe({
      next: profile => {
        this.adminRole = normalizeAdminRole(profile.admin.role);
        this.createdAt = profile.admin.created_at;
        this.profileForm.patchValue({
          email: profile.user.email,
          full_name: profile.user.full_name || '',
          phone: profile.user.phone || '',
          document: profile.user.document || '',
          address: profile.user.address || '',
          region: profile.admin.region,
          store_name: profile.admin.store_name,
          sender_document: profile.store?.sender_document || '',
          sender_email: profile.store?.sender_email || '',
          sender_phone: profile.store?.sender_phone || '',
          sender_postal_code: profile.store?.sender_postal_code || '',
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
        });
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Nao foi possivel carregar o perfil agora. Tente novamente em alguns instantes.';
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
        address: this.profileForm.value.address || null,
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
        this.profileForm.patchValue({
          full_name: profile.user.full_name || '',
          phone: profile.user.phone || '',
          document: profile.user.document || '',
          address: profile.user.address || '',
          region: profile.admin.region,
          store_name: profile.admin.store_name,
          sender_document: profile.store?.sender_document || '',
          sender_email: profile.store?.sender_email || '',
          sender_phone: profile.store?.sender_phone || '',
          sender_postal_code: profile.store?.sender_postal_code || '',
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
        });
        this.isSaving = false;
        this.showFeedback('Perfil administrativo atualizado.');
      },
      error: () => {
        this.errorMessage = 'Nao foi possivel salvar o perfil agora. Confira os dados e tente novamente.';
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
}
