import { NgOptimizedImage } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ResponsiveDialogService } from '@app/core/layout/responsive-dialog.service';
import { ClienteFormComponent } from '@app/features/admin/clients/client-form/cliente-form.component';
import { Client } from '@app/models/client.model';
import { ClientService } from '@app/services/client.service';
import { ConfirmDialogComponent } from '@app/shared/dialogs/confirm-dialog/confirm-dialog.component';
import { SharedMaterialModule } from '@app/shared/material/shared-material.module';
import { CpfCnpjPipe } from '@app/shared/pipes/cpf-cnpj.pipe';
import { DisplayTextPipe } from '@app/shared/pipes/display-text.pipe';
import { PhoneBrPipe } from '@app/shared/pipes/phone-br.pipe';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-clientes',
  imports: [SharedMaterialModule, ReactiveFormsModule, NgOptimizedImage, CpfCnpjPipe, DisplayTextPipe, PhoneBrPipe],
  templateUrl: './clientes.component.html',
  styleUrl: './clientes.component.scss',
})
export default class ClientesComponent implements OnInit, OnDestroy {
  searchControl = new FormControl('');
  clients: Client[] = [];
  filteredClients: Client[] = [];
  pagedClients: Client[] = [];
  isLoading = false;
  pageIndex = 0;
  pageSize = 3;
  readonly pageSizeOptions = [3, 6, 9];
  private readonly destroy$ = new Subject<void>();

  constructor(
    private dialog: MatDialog,
    private responsiveDialog: ResponsiveDialogService,
    private clientService: ClientService,
    private snackBar: MatSnackBar,
  ) { }

  ngOnInit(): void {
    this.loadClients();

    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$),
    ).subscribe(searchTerm => {
      this.applySearch(searchTerm || '');
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  openClientForm(client?: Client): void {
    const dialogRef = this.dialog.open(ClienteFormComponent, this.responsiveDialog.buildConfig({
      desktopWidth: '720px',
      autoFocus: 'first-tabbable',
      restoreFocus: true,
      enterAnimationDuration: '400ms',
      exitAnimationDuration: '300ms',
      data: client ? { client } : {},
      panelClass: 'admin-form-dialog',
    }));

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadClients();
      }
    });
  }

  openEditForm(client: Client): void {
    const dialogRef = this.dialog.open(ClienteFormComponent, this.responsiveDialog.buildConfig({
      desktopWidth: '720px',
      autoFocus: 'first-tabbable',
      restoreFocus: true,
      enterAnimationDuration: '400ms',
      exitAnimationDuration: '300ms',
      data: {
        client: client,
      },
      panelClass: 'admin-form-dialog',
    }));

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
        this.applySearch(this.searchControl.value || '');
        this.isLoading = false;
      },
      error: error => {
        console.error('Error loading clients:', error);
        this.showSnackbar('Não foi possível carregar os clientes agora.');
        this.isLoading = false;
      },
    });
  }

  deleteClient(id: string | number): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, this.responsiveDialog.buildConfig({
      desktopWidth: '350px',
      panelClass: 'custom-modal',
      restoreFocus: true,
      enterAnimationDuration: '400ms',
      exitAnimationDuration: '300ms',
      data: { message: 'Tem certeza que deseja excluir este item?' },
    }));

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.clientService.deleteClient(id).subscribe({
          next: () => {
            this.clients = this.clients.filter(client => client.id !== Number(id));
            this.applySearch(this.searchControl.value || '', false);
            this.showSnackbar('Cliente excluído com sucesso');
          },
          error: error => {
            console.error('Error deleting client:', error);
            this.showSnackbar('Não foi possível excluir o cliente agora. Tente novamente.');
          },
        });
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updatePagedClients();
  }

  handleImageError(event: Event): void {
    const image = event.target as HTMLImageElement;
    image.closest('.client-media')?.classList.add('has-image-error');
    image.style.display = 'none';
  }

  private showSnackbar(message: string): void {
    this.snackBar.open(message, 'Fechar', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
  }

  private applySearch(searchTerm: string, resetPage = true): void {
    const normalized = searchTerm.trim().toLowerCase();

    this.filteredClients = normalized
      ? this.clients.filter(client =>
        client.name.toLowerCase().includes(normalized) ||
        (client.address || '').toLowerCase().includes(normalized) ||
        (client.email || '').toLowerCase().includes(normalized) ||
        (client.cpf || '').toLowerCase().includes(normalized),
      )
      : this.clients;

    if (resetPage) {
      this.pageIndex = 0;
    }

    this.updatePagedClients();
  }

  private updatePagedClients(): void {
    const start = this.pageIndex * this.pageSize;
    this.pagedClients = this.filteredClients.slice(start, start + this.pageSize);
  }
}
