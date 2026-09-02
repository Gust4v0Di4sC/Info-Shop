import { Component, Inject, OnInit, Optional } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Client } from '@app/models/client.model';
import { Order, OrderUpdate } from '@app/models/order.model';
import { Product } from '@app/models/product.model';
import { OrderFormService } from '@app/services/order-form.service';
import { SharedMaterialModule } from '@app/shared/material/shared-material.module';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-pedido-form',
  imports: [SharedMaterialModule, ReactiveFormsModule],
  templateUrl: './pedido-form.component.html',
  styleUrl: './pedido-form.component.scss',
})
export class PedidoFormComponent implements OnInit {
  orderForm: FormGroup;
  clients: Client[] = [];
  products: Product[] = [];
  isLoading = false;
  orderId: string | number | undefined;
  isEditMode = false;
  currentStatus = 'open';

  constructor(
    private fb: FormBuilder,
    private orderFormService: OrderFormService,
    private snackBar: MatSnackBar,
    @Optional() public dialogRef: MatDialogRef<PedidoFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {
    this.orderForm = this.fb.group({
      clientId: ['', [Validators.required]],
      userId: [{ value: '', disabled: true }, [Validators.required]],
      address: [{ value: '', disabled: true }, [Validators.required]],
      productId: ['', [Validators.required]],
    });

    if (data?.order) {
      this.isEditMode = true;
      this.orderId = data.order.id;
      this.currentStatus = data.order.status || this.currentStatus;
    }
  }

  ngOnInit(): void {
    forkJoin({
      clients: this.orderFormService.getClients(),
      products: this.orderFormService.getProducts(),
    }).subscribe({
      next: response => {
        this.clients = response.clients;
        this.products = response.products;

        if (this.orderId) {
          this.orderFormService.getOrderById(this.orderId).subscribe({
            next: order => this.loadOrderData(order),
            error: error => console.error('Error loading order:', error),
          });
        }
      },
      error: error => {
        console.error('Error loading clients or products:', error);
        this.showSnackbar('Não foi possível carregar clientes ou produtos agora.');
      },
    });
  }

  onClientChange(clientId: string | number): void {
    const selectedClient = this.clients.find(client => String(client.id) === String(clientId));
    if (selectedClient) {
      this.orderForm.patchValue({
        userId: String(selectedClient.id),
        address: selectedClient.address || '',
      });
    }
  }

  onSubmit(): void {
    if (this.orderForm.valid) {
      this.saveOrder();
      return;
    }

    this.markFormGroupTouched(this.orderForm);
    this.showSnackbar('Preencha os campos obrigatórios antes de continuar.');
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  getErrorMessage(controlName: string): string {
    const control = this.orderForm.get(controlName);
    if (control?.hasError('required')) {
      return 'Campo obrigatório';
    }
    return '';
  }

  private loadOrderData(order: Order): void {
    const selectedClient = this.clients.find(client => String(client.id) === String(order.clientId));
    const selectedProduct = this.products.find(product => String(product.id) === String(order.productId));
    this.currentStatus = order.status || this.currentStatus;

    this.orderForm.patchValue({
      clientId: selectedClient?.id || '',
      userId: order.userId || '',
      address: order.address || '',
      productId: selectedProduct?.id || '',
    });
  }

  private saveOrder(): void {
    const selectedClient = this.clients.find(client => String(client.id) === String(this.orderForm.value.clientId));
    const selectedProduct = this.products.find(product => String(product.id) === String(this.orderForm.value.productId));

    if (!selectedClient || !selectedProduct) {
      this.showSnackbar('Escolha um cliente e um produto validos.');
      return;
    }

    if (!this.isEditMode || !this.orderId) {
      this.showSnackbar('Criacao manual de pedidos foi desativada.');
      return;
    }

    const orderData: OrderUpdate = {
      id: this.orderId === undefined ? undefined : Number(this.orderId),
      clientId: selectedClient.id,
      name: selectedClient.name,
      userId: String(selectedClient.id),
      address: selectedClient.address || '',
      productId: selectedProduct.id,
      product: selectedProduct.name,
      imageProd: selectedProduct.imageUrl,
      imageClient: selectedClient.imageUrl,
      quantity: 1,
      total_amount: Number(selectedProduct.price || 0),
      status: this.currentStatus,
    };

    this.orderFormService.updateOrder(this.orderId, orderData).subscribe({
      next: response => {
        this.showSnackbar('Pedido atualizado com sucesso!');
        this.dialogRef.close(response);
      },
      error: error => {
        console.error('Erro ao atualizar Pedido:', error);
        this.showSnackbar('Não foi possível atualizar o pedido agora. Tente novamente.');
      },
    });
  }

  private showSnackbar(message: string): void {
    this.snackBar.open(message, 'Fechar', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
}
