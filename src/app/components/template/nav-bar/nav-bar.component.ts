import { Component } from '@angular/core';
import { ActivatedRoute, RouterOutlet} from '@angular/router';

import {MatSidenavModule} from '@angular/material/sidenav';
import {MatListModule} from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { AuthServiceService } from '../../../services/auth-service.service';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';



@Component({
  selector: 'app-nav',
  imports: [RouterOutlet, MatSidenavModule, MatListModule, MatIconModule, MatButtonModule, RouterModule],
  providers: [AuthServiceService],
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
