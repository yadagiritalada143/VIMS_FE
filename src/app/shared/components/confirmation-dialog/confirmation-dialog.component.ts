import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-confirmation-dialog',
  templateUrl: './confirmation-dialog.component.html',
  styleUrls: ['./confirmation-dialog.component.scss']
})
export class ConfirmationDialogComponent implements OnInit {

  @Input() message: string;
  @Input() setModalStyle: boolean;
  @Input() btnOkText: string;
  @Input() btnCancelText: string;
  @Input() showConfirmDialog = true;
  @Input() disableOkButton: boolean = false;
  @Input() disableCancelButton: boolean = false;

  constructor(private activeModal: NgbActiveModal) { }

  ngOnInit(): void {
  
  }
  public decline() {
    this.activeModal.close(false);
  }

  public accept() {
    this.activeModal.close(true);
  }

  public dismiss() {
    this.activeModal.dismiss();
    this.showConfirmDialog = false;
  }
}
 