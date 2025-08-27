import { Component, ViewEncapsulation } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {MatButtonModule} from '@angular/material/button';
import { AuthServiceService } from './services/auth-service.service';
import { MatDialogModule } from '@angular/material/dialog';
import { trigger, transition, style, query, animate, group } from '@angular/animations';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MatButtonModule,MatDialogModule],
  providers: [AuthServiceService],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  animations: [
    trigger('routeAnimations', [
      transition('login => dashboard', [
        query(':enter, :leave', [
          style({
            position: 'absolute',
            width: '100%'
          })
        ], { optional: true }),
        query(':enter', [
          style({ transform: 'translateX(100%)' })
        ], { optional: true }),
        group([
          query(':leave', [
            animate('0.5s ease-out', style({ transform: 'translateX(-100%)' }))
          ], { optional: true }),
          query(':enter', [
            animate('0.5s ease-out', style({ transform: 'translateX(0)' }))
          ], { optional: true })
        ])
      ]),
      transition('* => login', [
        query(':enter, :leave', [
          style({
            position: 'absolute',
            width: '100%'
          })
        ], { optional: true }),
        query(':enter', [
          style({ transform: 'translateX(-100%)' })
        ], { optional: true }),
        group([
          query(':leave', [
            animate('400ms ease-in-out', style({ transform: 'translateX(100%)' }))
          ], { optional: true }),
          query(':enter', [
            animate('400ms ease-in-out', style({ transform: 'translateX(0)' }))
          ], { optional: true })
        ])
      ]),
      transition('dashboard => products', [
        query(':enter, :leave', [
          style({
            position: 'absolute',
            width: '100%'
          })
        ], { optional: true }),
        query(':enter', [
          style({ 
            transform: 'translateY(30px)', // Reduzido de 100% para 30px
            opacity: 0 // Começa invisível
          })
        ], { optional: true }),
        group([
          query(':leave', [
            animate('400ms ease-in-out', 
              style({ 
                transform: 'translateY(-30px)', // Reduzido de 100% para 30px
                opacity: 0 
              })
            )
          ], { optional: true }),
          query(':enter', [
            animate('400ms ease-in-out', 
              style({ 
                transform: 'translateY(0)',
                opacity: 1 
              })
            )
          ], { optional: true })
        ])
      ]),
      transition('products => dashboard', [
        query(':enter, :leave', [
          style({
            position: 'absolute',
            width: '100%'
          })
        ], { optional: true }),
        query(':enter', [
          style({ 
            transform: 'translateY(-30px)', // Reduzido de 100% para 30px
            opacity: 0 // Começa invisível
          })
        ], { optional: true }),
        group([
          query(':leave', [
            animate('400ms ease-in-out', 
              style({ 
                transform: 'translateY(30px)', // Reduzido de 100% para 30px
                opacity: 0 
              })
            )
          ], { optional: true }),
          query(':enter', [
            animate('400ms ease-in-out', 
              style({ 
                transform: 'translateY(0)',
                opacity: 1 
              })
            )
          ], { optional: true })
        ])
      ]),
      transition('products => clients', [
        query(':enter, :leave', [
          style({
            position: 'absolute',
            width: '100%'
          })
        ], { optional: true }),
        query(':enter', [
          style({ 
            transform: 'translateY(30px)', // Reduzido de 100% para 30px
            opacity: 0 // Começa invisível
          })
        ], { optional: true }),
        group([
          query(':leave', [
            animate('400ms ease-in-out', 
              style({ 
                transform: 'translateY(-30px)', // Reduzido de 100% para 30px
                opacity: 0 
              })
            )
          ], { optional: true }),
          query(':enter', [
            animate('400ms ease-in-out', 
              style({ 
                transform: 'translateY(0)',
                opacity: 1 
              })
            )
          ], { optional: true })
        ])
      ]),
      transition('clients => products', [
        query(':enter, :leave', [
          style({
            position: 'absolute',
            width: '100%'
          })
        ], { optional: true }),
        query(':enter', [
          style({ 
            transform: 'translateY(-30px)', // Reduzido de 100% para 30px
            opacity: 0 // Começa invisível
          })
        ], { optional: true }),
        group([
          query(':leave', [
            animate('400ms ease-in-out', 
              style({ 
                transform: 'translateY(30px)', // Reduzido de 100% para 30px
                opacity: 0 
              })
            )
          ], { optional: true }),
          query(':enter', [
            animate('400ms ease-in-out', 
              style({ 
                transform: 'translateY(0)',
                opacity: 1 
              })
            )
          ], { optional: true })
        ])
      ])
      
    ]),

    

  ],
  encapsulation: ViewEncapsulation.None,
  
})
export class AppComponent {
  title = 'infoshop';
  prepareRoute(outlet: RouterOutlet) {
    return outlet && outlet.activatedRouteData && outlet.activatedRouteData['animation'];
  }
}
