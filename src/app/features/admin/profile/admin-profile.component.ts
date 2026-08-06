import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ADMIN_ROLE_LABELS, AdminRole, normalizeAdminRole } from '@app/models/admin.model';
import { AdminProfileService } from '@app/services/admin-profile.service';
import { SharedMaterialModule } from '@app/shared/material/shared-material.module';

@Component({
  selector: 'app-admin-profile',
  imports: [ReactiveFormsModule, SharedMaterialModule],
  templateUrl: './admin-profile.component.html',
  styleUrl: './admin-profile.component.scss',
})
export class AdminProfileComponent implements OnInit {
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
        });
        this.isLoading = false;
      },
      error: error => {
        this.errorMessage = error?.message || 'Nao foi possivel carregar o perfil administrativo.';
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
        });
        this.isSaving = false;
        this.showFeedback('Perfil administrativo atualizado.');
      },
      error: error => {
        this.errorMessage = error?.message || 'Nao foi possivel salvar o perfil administrativo.';
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
