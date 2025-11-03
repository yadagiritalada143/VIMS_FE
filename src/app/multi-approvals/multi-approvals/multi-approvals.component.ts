import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-multi-approvals',
  templateUrl: './multi-approvals.component.html',
  styleUrls: ['./multi-approvals.component.scss']
})
export class MultiApprovalsComponent implements OnInit {
  private _module: any;
  private _ID: any;
  
  @Input() multiApprovals:any;
  private _approvalAction: boolean;
  NoDataFound: any;
  @Input() set module(value: any) {
    this._module = value;
  }
  get module() {
    return this._module;
  }
  @Input() set ID(value: any) {
    this._ID = value;
  }
  get ID() {
    return this._ID;
  }
  @Input() set approvalAction(value:boolean){
    this._approvalAction = value;
  }
  get approvalAction(){
    return this._approvalAction;
  }

  constructor() { }

  ngOnInit(): void {

  }
  getApprovalResponse(event:any){
    if(event?.approvers && event?.approvers?.length > 0){
      this.NoDataFound = false
    } else{
      this.NoDataFound = true
    }
    
  }
  
}
