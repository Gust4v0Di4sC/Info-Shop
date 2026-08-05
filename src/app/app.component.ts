import { Component, ViewEncapsulation } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { GsapInteractiveMotionDirective } from './shared/directives/gsap-interactive-motion.directive';
import { GsapPageMotionDirective } from './shared/directives/gsap-page-motion.directive';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, GsapInteractiveMotionDirective, GsapPageMotionDirective],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class AppComponent {
  title = 'infoshop';
}
