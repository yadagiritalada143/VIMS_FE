import { Injectable } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmationDialogComponent } from './confirmation-dialog.component';

@Injectable({
  providedIn: 'root'
})
export class ConfirmationDialogService {
  constructor(private modalService: NgbModal) { }
  
  public confirm(
    title: string,
    message: string,
    btnOkText: string = 'OK',
    btnCancelText: string = '',
    dialogSize: 'sm'|'lg' = 'sm', 
    options: any = {},
    setModalStyle:boolean = false,
    ): Promise<boolean> {

    const modalRef = this.modalService.open(ConfirmationDialogComponent, { size: dialogSize });

    if(title==="") modalRef.componentInstance.title = title;
    modalRef.componentInstance.message = message;
    modalRef.componentInstance.btnOkText = btnOkText;
    modalRef.componentInstance.btnCancelText = btnCancelText;
    modalRef.componentInstance.setModalStyle = setModalStyle;

    if(options?.['disableOkButton'])
      modalRef.componentInstance.disableOkButton = options['disableOkButton'];

    if(options?.['disableCancelButton'])
      modalRef.componentInstance.disableCancelButton = options['disableCancelButton'];

    return modalRef.result;
  
  }

}
