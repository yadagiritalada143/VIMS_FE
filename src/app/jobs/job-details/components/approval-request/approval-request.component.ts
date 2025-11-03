import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-approval-request',
  templateUrl: './approval-request.component.html',
  styleUrls: ['./approval-request.component.scss']
})
export class ApprovalRequestComponent implements OnInit {
  @Input() visiblity = 'hidden';
  @Output() onRejectClose = new EventEmitter();
  @Output() rejectApproval = new EventEmitter();
  reject_data:any = {} ;
  constructor() { }

  ngOnInit(): void {
  }

  onRejectApproval() {
    if(this.reject_data && this.reject_data.approval_reason) {
      this.rejectApproval.emit(this.reject_data);
      this.sidebarClose();
    } else {
      
    }
 
  }
  sidebarClose() {
    this.onRejectClose.emit(this.visiblity = 'hidden');
    this.reject_data = {};
    this.visiblity = 'hidden'
  }

}
