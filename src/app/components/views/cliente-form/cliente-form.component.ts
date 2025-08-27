import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit, Optional } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Client } from '../../../models/client.model';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ClientFormService } from './../../../services/client-form.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-cliente-form',
  imports: [MatButtonModule,MatFormFieldModule,MatIcon,MatInputModule,CommonModule,MatCardModule, ReactiveFormsModule],
  providers: [ClientFormService],
  templateUrl: './cliente-form.component.html',
  styleUrl: './cliente-form.component.scss'
})

export class ClienteFormComponent implements OnInit {
  clientForm: FormGroup;
  clientId: string | null = null;
  isEditMode: boolean = false;
  imagePreview: string | null = null;
  selectedFile: File | null = null;

  constructor(
    private fb: FormBuilder,
    private clientService: ClientFormService,
    private snackBar: MatSnackBar,
    @Optional() public dialogRef: MatDialogRef<ClienteFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data:any 
  ) {
    this.clientForm = this.fb.group({
      name: ['', [Validators.required]],
      address: ['', [Validators.required]],
      age: ['', [Validators.required]],
      cpf: ['', [Validators.required]],
      phone: ['', [Validators.required]],
      imageUrl: [null]
    });

    if (data?.client) {
      this.isEditMode = true;
      this.clientId = data.client.id;
      this.loadClientData(data.client);
    }
  }

  ngOnInit(): void {
    console.log('ngOnInit - isEditMode:', this.isEditMode); // Debug log
    console.log('ngOnInit - productId:', this.clientId); 

    if (this.clientId) {
      this.clientService.getClientById(this.clientId).subscribe({
        next: (client) => {
          console.log('Client loaded:', client); // Debug log
          this.loadClientData(client);
        },
        error: (error) => {
          console.error('Error loading Client:', error);
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

  private loadClientData(client: any): void {
    this.clientForm.patchValue({
      name: client.name,
      age: client.age,
      address: client.address,
      cpf: client.cpf,
      phone: client.phone,
      imageUrl:  client.imageUrl // Compatibilidade com db.json
    });
  
    if (client.imageUrl) {
      this.imagePreview =  client.imageUrl;
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

   private saveClient(imageUrl?: string | null): void {
      // Prepara os dados do produto
      const clientData: Client = {
        name: this.clientForm.value.name,
        age: Number(this.clientForm.value.age),
        address: this.clientForm.value.address,
        cpf: this.clientForm.value.cpf,
        phone: this.clientForm.value.phone,
        imageUrl: imageUrl || this.clientForm.value.imageUrl 
      };
    
      if (this.isEditMode && this.clientId) {
        // Atualiza o cliente existente
        this.clientService.updateClient(this.clientId, clientData).subscribe({
          next: (response) => {
            console.log('Cliente atualizado com sucesso:', response);
            this.showSnackbar('Cliente atualizado com sucesso!');
            this.dialogRef.close(response);
          },
          error: (error) => {
            console.error('Erro ao atualizar Cliente:', error);
            this.showSnackbar('Erro ao atualizar o Cliente. Tente novamente.');
          },
        });
      } else {
        // Cria um novo cliente
        this.clientService.createClient(clientData).subscribe({
          next: (response) => {
            console.log('Cliente criado com sucesso:', response);
            this.showSnackbar('Cliente criado com sucesso!');
            this.dialogRef.close(response);
          },
          error: (error) => {
            console.error('Erro ao criar Cliente:', error);
            this.showSnackbar('Erro ao criar o Cliente. Tente novamente.');
          },
        });
      }
    }

  onSubmit(): void {
    if (this.clientForm.valid) {
      console.log('Formulário válido:', this.clientForm.value);
  
      if (this.selectedFile) {
        // Caso um arquivo tenha sido selecionado
        console.log('Arquivo selecionado para upload:', this.selectedFile);
  
        this.clientService.uploadImage(this.selectedFile).subscribe({
          next: (response) => {
            console.log('Imagem enviada com sucesso:', response);

            this.clientForm.patchValue({
              imageUrl: response.imageUrl
            });
  
            // Salva o produto usando a URL da imagem enviada
            
            this.saveClient(response.imageUrl);
          },
          error: (error) => {
            console.error('Erro no upload da imagem:', error);
            this.showSnackbar('Erro no upload da imagem. Tente novamente.');
          },
        });
      } else {
        // Caso nenhum arquivo tenha sido selecionado
        console.log('Nenhum arquivo selecionado. Salvando produto diretamente.');
        this.saveClient(this.clientForm.get('imageUrl')?.value || null);
      }
    } else {
      console.error('Formulário inválido:', this.clientForm.value);
  
      // Marca os campos como "tocados" para exibir mensagens de erro no template
      this.markFormGroupTouched(this.clientForm);
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

  getErrorMessage(controlName: string, groupName?: string): string {
    const control = groupName ? 
      this.clientForm.get(`${groupName}.${controlName}`) :
      this.clientForm.get(controlName);

    if (control?.hasError('required')) {
      return 'Campo obrigatório';
    }
    if (control?.hasError('email')) {
      return 'Email inválido';
    }
    return '';
  }
}
