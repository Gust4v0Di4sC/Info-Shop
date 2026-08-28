
import { Component, Inject, OnDestroy, OnInit, Optional } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Client, ClientInsert } from '@app/models/client.model';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ClientFormService } from '@app/services/client-form.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, finalize, of, Subject, switchMap, takeUntil } from 'rxjs';
import { SharedMaterialModule } from '@app/shared/material/shared-material.module';
import { ViaCepService } from '@app/services/via-cep.service';
import { formatCep, formatCpf, formatPhone, onlyDigits } from '@app/shared/utils/input-masks';

@Component({
  selector: 'app-cliente-form',
  imports: [SharedMaterialModule, ReactiveFormsModule],
  templateUrl: './cliente-form.component.html',
  styleUrl: './cliente-form.component.scss'
})

export class ClienteFormComponent implements OnInit, OnDestroy {
  clientForm: FormGroup;
  clientId: string | null = null;
  isEditMode: boolean = false;
  imagePreview: string | null = null;
  selectedFile: File | null = null;
  isFetchingCep = false;
  cepErrorMessage = '';
  private readonly destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private clientService: ClientFormService,
    private snackBar: MatSnackBar,
    private viaCepService: ViaCepService,
    @Optional() public dialogRef: MatDialogRef<ClienteFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data:any 
  ) {
    this.clientForm = this.fb.group({
      name: ['', [Validators.required]],
      postalCode: [''],
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
    this.bindPostalCodeAutocomplete();

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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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
      postalCode: formatCep(this.extractPostalCode(client.address || '')),
      address: client.address,
      cpf: formatCpf(client.cpf),
      phone: formatPhone(client.phone),
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
      const clientData: ClientInsert = {
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
            this.showSnackbar('Não foi possível atualizar o cliente agora. Tente novamente.');
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
            this.showSnackbar('Não foi possível criar o cliente agora. Tente novamente.');
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
            this.showSnackbar('Não foi possível enviar a imagem agora. Tente novamente.');
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
      this.showSnackbar('Preencha os campos obrigatórios antes de continuar.');
    }
  } 

  onCancel(): void {
    this.dialogRef.close();
  }

  formatCpfField(): void {
    this.formatControl('cpf', formatCpf);
  }

  formatPhoneField(): void {
    this.formatControl('phone', formatPhone);
  }

  formatPostalCodeField(): void {
    this.formatControl('postalCode', formatCep);
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  private bindPostalCodeAutocomplete(): void {
    this.clientForm.get('postalCode')?.valueChanges.pipe(
      debounceTime(250),
      distinctUntilChanged(),
      switchMap(value => {
        const postalCode = onlyDigits(String(value || ''));

        if (postalCode.length !== 8) {
          this.isFetchingCep = false;
          this.cepErrorMessage = '';
          return of(null);
        }

        this.isFetchingCep = true;
        this.cepErrorMessage = '';

        return this.viaCepService.lookup(postalCode).pipe(
          finalize(() => {
            this.isFetchingCep = false;
          }),
        );
      }),
      takeUntil(this.destroy$),
    ).subscribe(address => {
      if (!address) {
        const postalCode = onlyDigits(String(this.clientForm.get('postalCode')?.value || ''));
        if (postalCode.length === 8) {
          this.cepErrorMessage = 'CEP nao encontrado. Preencha o endereco manualmente.';
        }
        return;
      }

      this.clientForm.patchValue({
        address: this.formatAddressSuggestion(address.postalCode, address.street, address.district, address.city, address.state),
      }, { emitEvent: false });
      this.cepErrorMessage = '';
    });
  }

  private formatAddressSuggestion(
    postalCode: string,
    street: string,
    district: string,
    city: string,
    state: string,
  ): string {
    return [
      street,
      district,
      city && state ? `${city}/${state}` : city || state,
      `CEP ${postalCode}`,
    ].filter(Boolean).join(' - ');
  }

  private extractPostalCode(address: string): string {
    return onlyDigits(address).slice(-8);
  }

  private formatControl(controlName: string, formatter: (value: string) => string): void {
    const control = this.clientForm.get(controlName);
    const formatted = formatter(String(control?.value || ''));

    if (control && control.value !== formatted) {
      control.setValue(formatted, { emitEvent: false });
    }
  }

  getErrorMessage(controlName: string, groupName?: string): string {
    const control = groupName ? 
      this.clientForm.get(`${groupName}.${controlName}`) :
      this.clientForm.get(controlName);

    if (control?.hasError('required')) {
      return 'Campo obrigatório';
    }
    if (control?.hasError('email')) {
      return 'Informe um e-mail válido';
    }
    return '';
  }
}
