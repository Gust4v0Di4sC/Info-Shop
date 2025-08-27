import { CommonModule} from '@angular/common';
import { Component, Inject, OnInit, Optional } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { ProductFormService } from '../../../services/product-form.service';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import { Product } from '../../../models/product.model';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-produto-form',
  standalone: true,
  imports: [MatCardModule,MatFormFieldModule,MatIcon,MatInputModule,MatButtonModule,CommonModule, MatDialogModule, ReactiveFormsModule],
  providers: [ProductFormService],
  templateUrl: './produto-form.component.html',
  styleUrl: './produto-form.component.scss'
})
export class ProdutoFormComponent implements OnInit {
  productForm: FormGroup;
  productId: string | null = null;
  isEditMode: boolean = false;
  imagePreview: string | null = null;
  selectedFile: File | null = null;
 

  constructor(
    private fb: FormBuilder,
    private produtoService: ProductFormService,
    private snackBar: MatSnackBar,
    @Optional() public dialogRef: MatDialogRef<ProdutoFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data:any 
  )  {
    this.productForm = this.fb.group({
      name: ['', [Validators.required]],
      model: ['', [Validators.required]], // adicionado o campo model
      price: ['', [Validators.required, Validators.min(0)]],
      cost: ['', [Validators.required, Validators.min(0)]],
      description: ['', [Validators.required]],
      imageUrl: [null]
    });

    if (data?.product) {
      this.isEditMode = true;
      this.productId = data.product.id;
      this.loadProductData(data.product);
    }
  }

  ngOnInit(): void {
    console.log('ngOnInit - isEditMode:', this.isEditMode); // Debug log
    console.log('ngOnInit - productId:', this.productId); // Debug log
    
    if (this.productId) {
      this.produtoService.getProductById(this.productId).subscribe({
        next: (product) => {
          console.log('Product loaded:', product); // Debug log
          this.loadProductData(product);
        },
        error: (error) => {
          console.error('Error loading product:', error);
        }
      });
    }
  }
  private showSnackbar(message: string): void {
    this.snackBar.open(message, 'Fechar', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
  }

  private loadProductData(product: any): void {
    this.productForm.patchValue({
      name: product.name,
      model: product.model,
      price: product.price,
      cost: product.cost,
      description: product.description,
      imageUrl:  product.imageUrl // Compatibilidade com db.json
    });
  
    if (product.imageUrl) {
      this.imagePreview =  product.imageUrl;
    }
  }



  onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    const file = target?.files?.[0];
    
    if (file) {
      this.selectedFile = file;
      // Preview da imagem
      const reader = new FileReader();
      reader.onload = (e) => {
        this.imagePreview = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  private saveProduct(imageUrl?: string | null): void {
    // Prepara os dados do produto
    const productData: Product = {
      name: this.productForm.value.name,
      model: this.productForm.value.model,
      price: Number(this.productForm.value.price),
      cost: Number(this.productForm.value.cost),
      description: this.productForm.value.description,
      imageUrl: imageUrl || this.productForm.value.imageUrl 
    };
  
    if (this.isEditMode && this.productId) {
      // Atualiza o produto existente
      this.produtoService.updateProduct(this.productId, productData).subscribe({
        next: (response) => {
          console.log('Produto atualizado com sucesso:', response);
          this.showSnackbar('Produto atualizado com sucesso!');
          this.dialogRef.close(response);
        },
        error: (error) => {
          console.error('Erro ao atualizar produto:', error);
          this.showSnackbar('Erro ao atualizar o produto. Tente novamente.');
        },
      });
    } else {
      // Cria um novo produto
      this.produtoService.createProduct(productData).subscribe({
        next: (response) => {
          console.log('Produto criado com sucesso:', response);
          this.showSnackbar('Produto criado com sucesso!');
          this.dialogRef.close(response);
        },
        error: (error) => {
          console.error('Erro ao criar produto:', error);
          this.showSnackbar('Erro ao criar o produto. Tente novamente.');
        },
      });
    }
  }
  

  onSubmit(): void {
    
    if (this.productForm.valid) {
      console.log('Formulário válido:', this.productForm.value);
  
      if (this.selectedFile) {
        // Caso um arquivo tenha sido selecionado
        console.log('Arquivo selecionado para upload:', this.selectedFile);
  
        this.produtoService.uploadImage(this.selectedFile).subscribe({
          next: (response) => {
            console.log('Imagem enviada com sucesso:', response);

            this.productForm.patchValue({
              imageUrl: response.imageUrl
            });
  
            // Salva o produto usando a URL da imagem enviada
            
            this.saveProduct(response.imageUrl);
          },
          error: (error) => {
            console.error('Erro no upload da imagem:', error);
            this.showSnackbar('Erro no upload da imagem. Tente novamente.');
          },
        });
      } else {
        // Caso nenhum arquivo tenha sido selecionado
        console.log('Nenhum arquivo selecionado. Salvando produto diretamente.');
        this.saveProduct(this.productForm.get('imageUrl')?.value || null);
      }
    } else {
      console.error('Formulário inválido:', this.productForm.value);
  
      // Marca os campos como "tocados" para exibir mensagens de erro no template
      this.markFormGroupTouched(this.productForm);
      this.showSnackbar('Formulário inválido. Preencha todos os campos obrigatórios.');
    }
  }

  onCancel(): void {
    // Navegar de volta para a lista de produtos
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
    const control = this.productForm.get(controlName);
    if (control?.hasError('required')) {
      return 'Campo obrigatório';
    }
    if (control?.hasError('min')) {
      return 'Valor deve ser maior que 0';
    }
    return '';
  }
}
