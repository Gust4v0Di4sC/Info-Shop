import { Component, OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ClienteFormComponent } from '@app/features/admin/clients/client-form/cliente-form.component';
import { Client } from '@app/models/client.model';
import { ClientService } from '@app/services/client.service';
import { ConfirmDialogComponent } from '@app/shared/dialogs/confirm-dialog/confirm-dialog.component';
import { SharedMaterialModule } from '@app/shared/material/shared-material.module';
import { CpfCnpjPipe } from '@app/shared/pipes/cpf-cnpj.pipe';
import { DisplayTextPipe } from '@app/shared/pipes/display-text.pipe';
import { PhoneBrPipe } from '@app/shared/pipes/phone-br.pipe';
import { debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-clientes',
  imports: [SharedMaterialModule, ReactiveFormsModule, CpfCnpjPipe, DisplayTextPipe, PhoneBrPipe],
  templateUrl: './clientes.component.html',
  styleUrl: './clientes.component.scss',
})
export default class ClientesComponent implements OnInit {
  searchControl = new FormControl('');
  clients: Client[] = [];
  filteredClients: Client[] = [];
  isLoading = false;

  constructor(
    private dialog: MatDialog,
    private clientService: ClientService,
    private snackBar: MatSnackBar,
  ) { }

  ngOnInit(): void {
    this.loadClients();

    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
    ).subscribe(searchTerm => {
      if (!searchTerm) {
        this.filteredClients = this.clients;
        return;
      }

      const normalized = searchTerm.toLowerCase();
      this.filteredClients = this.clients.filter(client =>
        client.name.toLowerCase().includes(normalized) ||
        (client.address || '').toLowerCase().includes(normalized) ||
        (client.email || '').toLowerCase().includes(normalized) ||
        (client.cpf || '').toLowerCase().includes(normalized),
      );
    });
  }

  openClientForm(client?: Client): void {
    const dialogRef = this.dialog.open(ClienteFormComponent, {
      width: '720px',
      maxWidth: '96vw',
      maxHeight: '92vh',
      autoFocus: false,
      enterAnimationDuration: '400ms',
      exitAnimationDuration: '300ms',
      data: client ? { client } : {},
      panelClass: 'admin-form-dialog',
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadClients();
      }
    });
  }

  openEditForm(client: Client): void {
    const dialogRef = this.dialog.open(ClienteFormComponent, {
      width: '720px',
      maxWidth: '96vw',
      maxHeight: '92vh',
      autoFocus: false,
      enterAnimationDuration: '400ms',
      exitAnimationDuration: '300ms',
      data: {
        client: client,
      },
      panelClass: 'admin-form-dialog',
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadClients();
      }
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
      error: error => {
        console.error('Error loading clients:', error);
        this.showSnackbar('Nao foi possivel carregar os clientes agora.');
        this.isLoading = false;
      },
    });
  }

  deleteClient(id: string | number): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      panelClass: 'custom-modal',
      enterAnimationDuration: '400ms',
      exitAnimationDuration: '300ms',
      data: { message: 'Tem certeza que deseja excluir este item?' },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.clientService.deleteClient(id).subscribe({
          next: () => {
            this.loadClients();
            this.showSnackbar('Cliente excluído com sucesso');
          },
          error: error => {
            console.error('Error deleting client:', error);
            this.showSnackbar('Nao foi possivel excluir o cliente agora. Tente novamente.');
          },
        });
      }
    });
  }

  private showSnackbar(message: string): void {
    this.snackBar.open(message, 'Fechar', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
  }
}
