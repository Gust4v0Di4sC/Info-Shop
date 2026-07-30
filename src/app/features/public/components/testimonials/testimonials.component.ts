import { Component } from '@angular/core';



@Component({
  selector: 'app-testimonials',
  imports: [],
  templateUrl: './testimonials.component.html',
  styleUrl: './testimonials.component.scss'
})
export class TestimonialsComponent {
  testimonials = [
    {
      name: 'Notebook Ultra Slim',
      text: 'Processador i7, 16GB RAM, SSD 512GB',
      role: '4.299,90',
      avatar: 'assets/avatars/notebook.jpg'
    },
    {
      name: 'Smartphone Top de Linha',
      text: 'Tela 6.7", 128GB, Câmera Tripla',
      role: '3.599,90',
      avatar: 'assets/avatars/smartphone.jpg'
    },
    {
      name: 'Monitor Gamer',
      text: '27" 144Hz, 1ms, QHD',
      role: '2.199,90',
      avatar: 'assets/images/monitor.jpg'
    }
  ];
}
