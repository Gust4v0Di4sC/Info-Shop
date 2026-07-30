import { Component, ViewEncapsulation } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
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

    if (route === 'products' || route === 'clients') {
      return type === 'enter' ? 'fade-in-enter' : 'fade-in-leave';
    }

    return '';
  }
}
