import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { AuthServiceService } from '../services/auth-service.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthServiceService,
    private router: Router
  ) {}

  canActivate(): Observable<boolean> {
    console.log('🛡️ AuthGuard.canActivate chamado para:', window.location.href);
    
    return this.authService.currentUser$.pipe(
      take(1),
      map(user => {
        if (user) {
          console.log('✅ AuthGuard: Usuário autenticado:', user.email);
          return true;
        } else {
          console.log('❌ AuthGuard: Usuário não autenticado, redirecionando para /home');
          this.router.navigate(['/home']);
          return false;
        }
      })
    );
  }
}

@Injectable({
  providedIn: 'root'
})
export class GuestGuard implements CanActivate {
  constructor(
    private authService: AuthServiceService,
    private router: Router
  ) {}

  canActivate(): Observable<boolean> {
    return this.authService.currentUser$.pipe(
      take(1),
      map(user => {
        if (!user) {
          return true;
        } else {
          console.log('Usuário já autenticado, redirecionando para dashboard');
          this.router.navigate(['/dash']);
          return false;
        }
      })
    );
  }
}