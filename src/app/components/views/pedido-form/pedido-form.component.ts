import { Component, Inject, OnInit, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { Order } from '../../../models/order.model';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { Client } from '../../../models/client.model';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ReactiveFormsModule } from '@angular/forms';
import { OrderFormService } from '../../../services/order-form.service';
import { Product } from '../../../models/product.model';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-pedido-form',
  imports: [MatCardModule, MatIcon, MatFormFieldModule, CommonModule, MatInputModule, MatButtonModule, MatSelectModule, ReactiveFormsModule],
  providers: [OrderFormService],
  templateUrl: './pedido-form.component.html',
  styleUrl: './pedido-form.component.scss'
})
export class PedidoFormComponent implements OnInit {
  orderForm: FormGroup;
  clients: Client[] = []; // Armazena a lista de clientes
  products: Product[] = []; // Armazena a lista de produtos
  isLoading = false;
  orderId: string | undefined;
  isEditMode: boolean = false;

  constructor(
    private fb: FormBuilder,
    private orderFormService: OrderFormService,
    private snackBar: MatSnackBar,
    @Optional() public dialogRef: MatDialogRef<PedidoFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.orderForm = this.fb.group({
      clientId: ['', [Validators.required]],
      userId: [{ value: '', disabled: true }, [Validators.required]],
      address: [{ value: '', disabled: true }, [Validators.required]],
      productId: ['', [Validators.required]]
    });

    if (data?.order) {
      this.isEditMode = true;
      this.orderId = data.order.id;
    }
  }

  ngOnInit(): void {
    forkJoin({
      clients: this.orderFormService.getClients(),
      products: this.orderFormService.getProducts()
    }).subscribe({
      next: (response) => {
        this.clients = response.clients;
        this.products = response.products;

        if (this.orderId) {
          this.orderFormService.getOrderById(this.orderId).subscribe({
            next: (order) => {
              this.loadOrderData(order);
            },
            error: (error) => {
              console.error('Error loading order:', error);
            }
          });
        }
      },
      error: (error) => {
        console.error('Error loading clients or products:', error);
        this.showSnackbar('Erro ao carregar clientes ou produtos.');
      }
    });
  }

  private loadOrderData(order: any): void {
    const selectedClient = this.clients.find(client => client.id === order.clientId);
    const selectedProduct = this.products.find(product => product.id === order.productId);

    this.orderForm.patchValue({
      clientId: selectedClient?.id || '',
      userId: order.userId,
      address: order.address,
      productId: selectedProduct?.id || '',
    });
  }

  private showSnackbar(message: string): void {
    this.snackBar.open(message, 'Fechar', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
  }

  onClientChange(clientId: string): void {
    const selectedClient = this.clients.find((client) => client.id === clientId);
    if (selectedClient) {
      this.orderForm.patchValue({
        userId: selectedClient.id,
        address: selectedClient.address,
      });
    }
  }

  private saveOrder(): void {
    const selectedClient = this.clients.find(client => client.id === this.orderForm.value.clientId);
    const selectedProduct = this.products.find(product => product.id === this.orderForm.value.productId);
  
    if (!selectedClient || !selectedProduct) {
      this.showSnackbar('Erro: Cliente ou Produto inválido.');
      return;
    }
  
    // Prepara os dados do Pedido com clientId e productId
    const orderData: Order = {
      id: this.orderId, // Se for edição, mantém o ID atual
      clientId: selectedClient.id, // Agora salvamos o clientId corretamente
      name: selectedClient.name, // Ainda salvamos o nome para exibição
      userId: selectedClient.id, 
      address: selectedClient.address,
      productId: selectedProduct.id, // Agora salvamos o productId corretamente
      product: selectedProduct.name,
      imageProd: selectedProduct.imageUrl,
      imageClient: selectedClient.imageUrl // Ainda salvamos o nome para exibição
    };
  
    if (this.isEditMode && this.orderId) {
      // Atualiza um pedido existente
      this.orderFormService.updateOrder(this.orderId, orderData).subscribe({
        next: (response) => {
          console.log('Pedido atualizado com sucesso:', response);
          this.showSnackbar('Pedido atualizado com sucesso!');
          this.dialogRef.close(response);
        },
        error: (error) => {
          console.error('Erro ao atualizar Pedido:', error);
          this.showSnackbar('Erro ao atualizar o Pedido. Tente novamente.');
        },
      });
    } else {
      // Cria um novo Pedido
      this.orderFormService.createOrder(orderData).subscribe({
        next: (response) => {
          console.log('Pedido criado com sucesso:', response);
          this.showSnackbar('Pedido criado com sucesso!');
          this.dialogRef.close(response);
        },
        error: (error) => {
          console.error('Erro ao criar Pedido:', error);
          this.showSnackbar('Erro ao criar o Pedido. Tente novamente.');
        },
      });
    }
  }

  onSubmit(): void {
    if (this.orderForm.valid) {
      console.log('Formulário válido:', this.orderForm.value);
      this.saveOrder();
    } else {
      console.error('Formulário inválido:', this.orderForm.value);
      this.markFormGroupTouched(this.orderForm);
      this.showSnackbar('Formulário inválido. Preencha todos os campos obrigatórios.');
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  getErrorMessage(controlName: string): string {
    const control = this.orderForm.get(controlName);
    if (control?.hasError('required')) {
      return 'Campo obrigatório';
    }
    return '';
  }
}