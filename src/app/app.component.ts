import { Component, ViewEncapsulation } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {MatButtonModule} from '@angular/material/button';
import { AuthServiceService } from './services/auth-service.service';
import { MatDialogModule } from '@angular/material/dialog';


@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MatButtonModule,MatDialogModule],
  providers: [AuthServiceService],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  encapsulation: ViewEncapsulation.None,
  
})
export class AppComponent {
  title = 'infoshop';
  prepareRoute(outlet: RouterOutlet) {
    return outlet && outlet.activatedRouteData && outlet.activatedRouteData['animation'];
  }

  getAnimationClass(outlet: RouterOutlet, type: 'enter' | 'leave'): string {
    const route = outlet.activatedRouteData['animation'];

    if (route === 'login' || route === 'dashboard') {
      return type === 'enter' ? 'route-animation-enter' : 'route-animation-leave';
    }
    
    // Outras rotas podem usar um tipo de animação diferente
    if (route === 'products' || route === 'clients') {
        return type === 'enter' ? 'fade-in-enter' : 'fade-in-leave';
    }

    return '';
  }
}
