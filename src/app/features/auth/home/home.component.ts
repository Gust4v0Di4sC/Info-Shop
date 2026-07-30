import { Component, HostListener, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { AuthService } from '@app/core/auth/auth.service';
import { SharedMaterialModule } from '@app/shared/material/shared-material.module';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [SharedMaterialModule, ReactiveFormsModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export default class HomeComponent implements OnInit {
  mouseX = 0;
  mouseY = 0;
  loginForm: FormGroup;
  hidePassword = true;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar,
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });
  }

  ngOnInit(): void {}

  @HostListener('mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    this.mouseX = (event.clientX / window.innerWidth) * 200;
    this.mouseY = (event.clientY / window.innerHeight) * 200;
  }

  getParallaxStyle(): string {
    const moveX = (this.mouseX - 100) * 0.05;
    const moveY = (this.mouseY - 100) * 0.05;
    return `translate(${moveX}px, ${moveY}px)`;
  }

  goToHome() {
    this.router.navigate(['/']);
  }

  async loginWithGoogle() {
    this.isLoading = true;
    try {
      await this.authService.signInWithGoogle();
    } catch (error: any) {
      console.error('Erro no login Google:', error);
      this.snackBar.open(error.message || 'Erro ao fazer login com Google', 'Fechar', {
        duration: 5000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
      });
      this.isLoading = false;
    }
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.isLoading = true;
      const { email, password } = this.loginForm.value;

      this.authService.login(email, password).subscribe({
        next: success => {
          if (success) {
            this.router.navigate(['/dash']);
          } else {
            this.snackBar.open('Email ou senha inválidos', 'Fechar', {
              duration: 3000,
              horizontalPosition: 'center',
              verticalPosition: 'bottom',
            });
          }
        },
        error: () => {
          this.snackBar.open('Erro ao fazer login', 'Fechar', {
            duration: 3000,
          });
        },
        complete: () => {
          this.isLoading = false;
        },
      });
    }
  }
}
