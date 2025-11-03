import { Injectable } from '@angular/core';
import { NgbPopover } from '@ng-bootstrap/ng-bootstrap';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PopupService {
  currentPopOver: NgbPopover;
  selectedPopupId: number;
  private messageSource = new BehaviorSubject(null);
  sendAlertFlag = this.messageSource.asObservable();

  constructor() { }

  closeCurrentPopup() {
    if (this.currentPopOver) {
      this.currentPopOver.close();
      this.selectedPopupId = null;
    }
  }

  closeAlert(message: string) {
    this.messageSource.next(message)
  }
}
