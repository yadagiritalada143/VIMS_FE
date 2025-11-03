import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { ReasonCodesService } from 'src/app/shared/service/reson-codes.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { UntypedFormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-mark-as-comp-side-panel',
  templateUrl: './mark-as-complete-side-panel.html',
  styleUrls: ['./mark-as-complete-side-panel.component.scss']
})
export class MarkAsComSidePanelComponent implements OnInit {
  @Input() visiblity = 'hidden';
  @Input() isView = false
  @Output() onSubmit = new EventEmitter();
  @Output() onClose = new EventEmitter();
  public approval_notes: any;
  private subscriptions = [];
  public reasonList= [];
  public reason: any = {} ;
  // rating: number;
  markAsComplete: any;
  
  constructor(public reasonCodesService: ReasonCodesService, 
    public alert: AlertService,
    private fb: UntypedFormBuilder) {
      this.markAsComplete = this.fb.group({
        rating1: ['', Validators.required],
        reason: [null, Validators.required],
        notes: [null, '']
      });
    }

  ngOnInit(): void { 
    this.gwtReasonCode();
    
  }

  gwtReasonCode() {
    this.subscriptions.push(
      this.reasonCodesService.getResoncodesFor('MARK_AS_COMPLETED').subscribe(data => {
        this.reasonList = data.reason_codes;
      })
    )
  }

  sidebarClose() {
    // this.approval_notes = '';
    this.reason = {} ;
    this.visiblity = 'hidden';
    this.onClose.emit();
  }

  submit() {
    if(this.reason.reason) {
    this.onSubmit.emit({
      reason: this.reason.reason,
      rating: this.reason.rating,
      notes: this.reason.notes
    });
    this.reason = {} ;
    // this.sidebarClose();
  } else {
    this.alert.error('Please select reason for Interview Mark as Complete')
  }
} 
 
}
