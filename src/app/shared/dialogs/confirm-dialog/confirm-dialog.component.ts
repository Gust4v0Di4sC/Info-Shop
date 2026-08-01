import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { SharedMaterialModule } from '@app/shared/material/shared-material.module';

@Component({
  selector: 'app-confirm-dialog',
  imports: [SharedMaterialModule],
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.scss'],
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { message: string },
  ) {}

  close(confirm: boolean): void {
    this.dialogRef.close(confirm);
  }
}
