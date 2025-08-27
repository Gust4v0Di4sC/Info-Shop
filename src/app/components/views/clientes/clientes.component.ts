import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import {  MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatInputModule } from '@angular/material/input';
import { NavBarComponent } from '../../template/nav-bar/nav-bar.component';
import { Client } from '../../../models/client.model';
import { FormControl } from '@angular/forms';
import { ClientService } from '../../../services/client.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ClienteFormComponent } from '../cliente-form/cliente-form.component';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-clientes',
  imports: [MatButtonModule,MatFormFieldModule,MatIcon,MatCardModule,MatToolbarModule,CommonModule,MatInputModule,NavBarComponent, ReactiveFormsModule],
  providers: [ClientService],
  templateUrl: './clientes.component.html',
  styleUrl: './clientes.component.scss'
})
export class ClientesComponent implements OnInit {
  searchControl = new FormControl('');
  clients: Client[] = [];
  filteredClients: Client[] = [];
  isLoading = false;

  

  constructor(
    private dialog: MatDialog,
    private clientService: ClientService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void { 
    this.loadClients();
    
     this.searchControl.valueChanges.pipe(
          debounceTime(300),
          distinctUntilChanged()
        ).subscribe(searchTerm => {
          console.log('Buscando por:', searchTerm);
          if (!searchTerm) {
            this.filteredClients = this.clients; // Restaura lista completa
            return;
          }
        
          this.filteredClients = this.clients.filter(client =>
            client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            client.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
            client.cpf.toLowerCase().includes(searchTerm.toLowerCase())
          );
          console.log('Produtos filtrados:', this.filteredClients);
        });
  }

  openClientForm(client?: Client): void {
      const dialogRef = this.dialog.open(ClienteFormComponent, {
        width: '500px',
        data: {},
        panelClass: 'custom-modal'
      });
  
      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.loadClients();
        }
      });
    }
  
    openEditForm(client: Client): void {
      const dialogRef = this.dialog.open(ClienteFormComponent, {
        width: '500px',
        
        enterAnimationDuration : '400ms',
        exitAnimationDuration : '300ms',
        data: {
          client: client
        },
        panelClass: 'custom-modal'
      });
  
      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          // Atualizar a lista de produtos ou fazer outras ações necessárias
          this.loadClients(); // Método para recarregar a lista de produtos
        }
      });
    }

  private showSnackbar(message: string): void {
    this.snackBar.open(message, 'Fechar', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
  }

  loadClients(): void {
      this.isLoading = true;
      this.clientService.getClients().subscribe({
        next: (rawClients: Client[]) => {
          this.clients = rawClients.filter(client => client.id !== undefined); 
          this.filteredClients = this.clients;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading products:', error);
          this.showSnackbar('Erro ao carregar produtos');
          this.isLoading = false;
        }
      });
    }

    deleteClient(id: string): void {
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        width: '350px',
        panelClass: 'custom-modal',
        enterAnimationDuration: '400ms',
        exitAnimationDuration: '300ms',
        data: { message: 'Tem certeza que deseja excluir este item?' }
      });
    
      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.clientService.deleteClient(id).subscribe({
          next: () => {
            this.loadClients();
            this.showSnackbar('Cliente excluído com sucesso');
          },
          error: (error) => {
            console.error('Error deleting client:', error);
            this.showSnackbar('Erro ao excluir cliente');
          }
        });
        }
      });
    }
}
