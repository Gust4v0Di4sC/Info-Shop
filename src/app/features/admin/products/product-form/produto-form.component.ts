
import { Component, Inject, OnInit, Optional } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProductFormService } from '@app/services/product-form.service';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import { Product, ProductInsert } from '@app/models/product.model';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SharedMaterialModule } from '@app/shared/material/shared-material.module';

@Component({
  selector: 'app-produto-form',
  standalone: true,
  imports: [SharedMaterialModule, ReactiveFormsModule],
  templateUrl: './produto-form.component.html',
  styleUrl: './produto-form.component.scss'
})
export class ProdutoFormComponent implements OnInit {
  readonly categories = [
    { label: 'Notebooks', value: 'notebooks' },
    { label: 'Smartphones', value: 'smartphones' },
    { label: 'Tablets', value: 'tablets' },
    { label: 'Games', value: 'games' },
    { label: 'Hardware', value: 'hardware' },
    { label: 'Periféricos', value: 'perifericos' },
  ];

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
      category: ['hardware', [Validators.required]],
      price: ['', [Validators.required, Validators.min(0)]],
      cost: ['', [Validators.required, Validators.min(0)]],
      description: ['', [Validators.required]],
      imageUrl: [null],
      stock_quantity: [0, [Validators.required, Validators.min(0)]],
      stock_minimum: [0, [Validators.required, Validators.min(0)]],
      is_featured: [false],
      shipping_weight: [null, [Validators.min(0.001)]],
      shipping_width: [null, [Validators.min(1)]],
      shipping_height: [null, [Validators.min(1)]],
      shipping_length: [null, [Validators.min(1)]],
      shipping_insurance_value: [null, [Validators.min(0)]],
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
      category: product.category || 'hardware',
      price: product.price,
      cost: product.cost,
      description: product.description,
      imageUrl: product.imageUrl,
      stock_quantity: product.stock_quantity || 0,
      stock_minimum: product.stock_minimum || 0,
      is_featured: Boolean(product.is_featured),
      shipping_weight: product.shipping_weight,
      shipping_width: product.shipping_width,
      shipping_height: product.shipping_height,
      shipping_length: product.shipping_length,
      shipping_insurance_value: product.shipping_insurance_value,
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
    const productData: ProductInsert = {
      name: this.productForm.value.name,
      model: this.productForm.value.model,
      category: this.productForm.value.category,
      price: Number(this.productForm.value.price),
      cost: Number(this.productForm.value.cost),
      description: this.productForm.value.description,
      imageUrl: imageUrl || this.productForm.value.imageUrl,
      stock_quantity: Number(this.productForm.value.stock_quantity) || 0,
      stock_minimum: Number(this.productForm.value.stock_minimum) || 0,
      is_featured: Boolean(this.productForm.value.is_featured),
      shipping_weight: this.optionalNumber('shipping_weight'),
      shipping_width: this.optionalNumber('shipping_width'),
      shipping_height: this.optionalNumber('shipping_height'),
      shipping_length: this.optionalNumber('shipping_length'),
      shipping_insurance_value: this.optionalNumber('shipping_insurance_value'),
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
          this.showSnackbar('Não foi possível atualizar o produto agora. Tente novamente.');
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
          this.showSnackbar('Não foi possível criar o produto agora. Tente novamente.');
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
            this.showSnackbar('Não foi possível enviar a imagem agora. Tente novamente.');
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
      this.showSnackbar('Preencha os campos obrigatórios antes de continuar.');
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
      return 'Valor não pode ser negativo';
    }
    return '';
  }

  private optionalNumber(controlName: string): number | null {
    const value = this.productForm.get(controlName)?.value;
    return value === null || value === '' || value === undefined ? null : Number(value);
  }
}
