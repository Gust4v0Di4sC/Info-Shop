import { Component } from '@angular/core';
import { ActivatedRoute, RouterOutlet} from '@angular/router';
import { CommonModule } from '@angular/common';
import {MatSidenavModule} from '@angular/material/sidenav';
import {MatListModule} from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { AuthServiceService } from '../../../services/auth-service.service';
import { MatButtonModule } from '@angular/material/button';
import {  provideAnimations } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { trigger, state, style, transition, animate, query, group } from '@angular/animations';


@Component({
  selector: 'app-nav',
  imports: [RouterOutlet,MatSidenavModule, MatListModule,MatIconModule, MatButtonModule, RouterModule, CommonModule],
  providers: [AuthServiceService, provideAnimations()],
  animations: [
    trigger('routeAnimations', [
      transition('* <=> *', [
        query(':enter, :leave', [
          style({ position: 'absolute', width: '100%' }) // Mantém a posição dos elementos durante a transição
        ], { optional: true }),

        group([
          // Saída da página atual (fade-out e slide para a esquerda)
          query(':leave', [
            animate('300ms ease-in', style({ transform: 'translateX(-30px)' }))
          ], { optional: true }),

          // Entrada da nova página (fade-in e slide da direita para o centro)
          query(':enter', [
            style({ opacity: 0, transform: 'translateX(30px)' }),
            animate('300ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
          ], { optional: true })
        ])
      ])
    ])
  ],
  templateUrl: './nav-bar.component.html',
  styleUrls: ['./nav-bar.component.scss']
})
export class NavBarComponent {
  constructor(private authService: AuthServiceService,
    protected route: ActivatedRoute) {
  }

  isOpen = false;

  prepareRoute(outlet: RouterOutlet) {
  return outlet?.activatedRouteData?.['animation'] ?? 'default';
  }

  openMenu() {
    this.isOpen = true;
  }

  
  closeMenu() {
    this.isOpen = false;
  }

  logout(): void {
    this.authService.logout();
  }
}
