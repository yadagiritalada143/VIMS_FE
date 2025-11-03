import { Injectable } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmationReasonBoxComponent } from './confirmation-reason-box.component';
@Injectable({
  providedIn: 'root'
})
export class ConfirmationReasonBoxService {
  constructor(private modalService: NgbModal) { }
  
  public confirm(
    message: string,
    reasonCodes,
    dialogSize: 'sm'|'lg'|'xl' = 'xl'): Promise<boolean> {
    const modalRef = this.modalService.open(ConfirmationReasonBoxComponent, { size: dialogSize });
    modalRef.componentInstance.message = message;
    modalRef.componentInstance.reasonCodes = reasonCodes;
    return modalRef.result;
  }

}
