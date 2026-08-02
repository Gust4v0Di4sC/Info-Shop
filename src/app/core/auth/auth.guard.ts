import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { supabase } from '@app/core/supabase/supabase.client';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(): Observable<boolean> {
    return from(supabase.auth.getUser()).pipe(
      map(({ data, error }) => {
        if (!error && data.user) {
          return true;
        }

        this.router.navigate(['/home']);
        return false;
      }),
    );
  }
}

@Injectable({
  providedIn: 'root',
})
export class GuestGuard implements CanActivate {
  constructor(private router: Router) {}

  async canActivate(): Promise<boolean> {
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      return true;
    }

    const adminResult = await supabase
      .from('admins')
      .select('id')
      .eq('user_id', data.user.id)
      .eq('active', true)
      .maybeSingle();

    await this.router.navigate([adminResult.data ? '/dash' : '/perfil']);
    return false;
  }
}

@Injectable({
  providedIn: 'root',
})
export class AdminGuard implements CanActivate {
  constructor(private router: Router) {}

  async canActivate(): Promise<boolean> {
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      await this.router.navigate(['/home']);
      return false;
    }

    const adminResult = await supabase
      .from('admins')
      .select('id')
      .eq('user_id', data.user.id)
      .eq('active', true)
      .maybeSingle();

    if (adminResult.error || !adminResult.data) {
      await this.router.navigate(['/perfil']);
      return false;
    }

    return true;
  }
}
