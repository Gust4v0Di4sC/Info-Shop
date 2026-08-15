import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router } from '@angular/router';
import { AuthService } from '@app/core/auth/auth.service';
import { ADMIN_DEFAULT_ROUTE, AdminRole } from '@app/models/admin.model';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  async canActivate(): Promise<boolean> {
    const user = await this.authService.getCurrentUserAsync();

    if (user) {
      return true;
    }

    await this.router.navigate(['/home']);
    return false;
  }
}

@Injectable({
  providedIn: 'root',
})
export class GuestGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  async canActivate(): Promise<boolean> {
    const user = await this.authService.getCurrentUserAsync();

    if (!user) {
      return true;
    }

    const adminRole = await this.authService.getAdminRole(user.id);

    await this.router.navigate([adminRole ? ADMIN_DEFAULT_ROUTE[adminRole] : '/perfil']);
    return false;
  }
}

@Injectable({
  providedIn: 'root',
})
export class PublicGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  async canActivate(): Promise<boolean> {
    const user = this.authService.getCurrentUser();

    if (!user) {
      return true;
    }

    const adminRole = await this.authService.getAdminRole(user.id);

    if (adminRole) {
      await this.router.navigate([ADMIN_DEFAULT_ROUTE[adminRole]]);
      return false;
    }

    return true;
  }
}

@Injectable({
  providedIn: 'root',
})
export class AdminGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  async canActivate(route: ActivatedRouteSnapshot): Promise<boolean> {
    const user = await this.authService.getCurrentUserAsync();

    if (!user) {
      await this.router.navigate(['/home']);
      return false;
    }

    const adminRole = await this.authService.getAdminRole(user.id);

    if (!adminRole) {
      await this.router.navigate(['/perfil']);
      return false;
    }

    const allowedRoles = route.data['allowedRoles'] as AdminRole[] | undefined;

    if (allowedRoles?.length && !allowedRoles.includes(adminRole)) {
      await this.router.navigate([ADMIN_DEFAULT_ROUTE[adminRole]]);
      return false;
    }

    return true;
  }
}
