import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '@app/core/auth/auth.service';
import { HeaderComponent } from '@app/features/public/components/header/header.component';
import { FooterComponent } from '@app/features/public/components/footer/footer.component';
import { CustomerProfileService } from '@app/services/customer-profile.service';

@Component({
  selector: 'app-customer-profile',
  imports: [HeaderComponent, FooterComponent, ReactiveFormsModule, RouterLink],
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

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private customerProfileService: CustomerProfileService,
  ) {
    this.profileForm = this.fb.group({
      email: [{ value: '', disabled: true }],
      full_name: ['', [Validators.required]],
      phone: [''],
      document: [''],
      address: [''],
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
        this.profileForm.patchValue(profile);
        this.isLoading = false;
        this.loadAdminStatus();
      },
      error: error => {
        this.errorMessage = error?.message || 'Nao foi possivel carregar seu perfil.';
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
    this.feedbackMessage = '';
    this.errorMessage = '';

    this.customerProfileService.updateCurrentProfile({
      full_name: this.profileForm.value.full_name,
      phone: this.profileForm.value.phone || null,
      document: this.profileForm.value.document || null,
      address: this.profileForm.value.address || null,
    }).subscribe({
      next: profile => {
        this.profileForm.patchValue(profile);
        this.feedbackMessage = 'Perfil atualizado.';
        this.isSaving = false;
      },
      error: error => {
        this.errorMessage = error?.message || 'Nao foi possivel salvar seu perfil.';
        this.isSaving = false;
      },
    });
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
      },
      error: () => {
        this.isAdmin = false;
      },
    });
  }

}
