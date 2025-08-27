import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { supabase } from '../../../supabase.client';

@Component({
  selector: 'app-auth-callback',
  template: '<p>🔐 Processando login...</p>'
})
export class AuthCallbackComponent implements OnInit {
  constructor(private router: Router) {}

  async ngOnInit() {
    // Pega a sessão atual (o Supabase processa automaticamente o hash da URL)
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      console.error('❌ Erro ao obter sessão:', error);
      return;
    }

    console.log('✅ Sessão recebida:', data.session);

    // Redireciona para sua home ou dashboard
    this.router.navigate(['/dash']);
  }
}
