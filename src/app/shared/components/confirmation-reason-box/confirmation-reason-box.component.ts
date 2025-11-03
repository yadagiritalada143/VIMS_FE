import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-confirmation-reason-box',
  templateUrl: './confirmation-reason-box.component.html',
  styleUrls: ['./confirmation-reason-box.component.scss']
})
export class ConfirmationReasonBoxComponent implements OnInit {

  @Input() message: string;
  @Input() reasonCodes;
  @Input() showConfirmDialog = true;
  requiredCheck = false;

  public resp = {
    "rollback_reason": null,
    "rollback_notes": null
  };

  constructor(private activeModal: NgbActiveModal) { }

  ngOnInit(): void {

  }
  public decline() {
    this.activeModal.close(false);
  }

  public accept() {
    if (this.resp.rollback_reason && this.resp.rollback_notes) {
      this.requiredCheck= false;
      this.activeModal.close(this.resp);
    } else {
      this.requiredCheck = true;
    }
  }

  public dismiss() {
    this.activeModal.dismiss();
    this.showConfirmDialog = false;
  }
}
