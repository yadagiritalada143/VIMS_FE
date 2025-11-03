import { Component, ElementRef, Input, OnChanges,Output,EventEmitter, OnDestroy, OnInit, Renderer2, SimpleChanges, ViewChild } from '@angular/core';
import { EmitEvent, Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { ExpenseModel } from '../../models/expense.model';
import { ExpenseStatusMessage, ExpenseType, UserType, Permissions } from '../../enums/expense.enums';
import { ExpenseDetailService } from '../../pages/expense-detail/expense-detail.service';
import { ConfirmationDialogService } from 'src/app/shared/components/confirmation-dialog/confirmation-dialog.service';
import { ExpenseStatusService } from '../../services/expense-status.service';
import { StorageService } from 'src/app/core/services/storage.service';
import { StatusMessageData } from 'src/app/shared/interfaces';
import { StatusMessageTypes } from 'src/app/shared/enums';
import { IExpenseType } from '../../interfaces/expense.interfaces';
import { AuthorizationService } from 'src/app/core/services/authorize.service';
import { DownloadReportComponent } from '../../../reports/components/download-report/download-report.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DownloadReportService } from 'src/app/reports/components/download-report/download-report.service';
import { ActivatedRoute } from '@angular/router';
import { Log, LOG_TYPE } from 'src/app/library/logs/logs.model';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
export enum expense_type {
misc_expense = 'Misc Expense'
}
@Component({
  selector: 'app-expense-header',
  templateUrl: './expense-header.component.html',
  styleUrls: ['./expense-header.component.scss'],
})
export class ExpenseHeaderComponent implements OnInit, OnChanges, OnDestroy {
  @Input() data: ExpenseModel;
  @Input() isDisabledBtn: boolean;
  @Output() expType = new EventEmitter();
  @ViewChild('expenseOptionsList', { read: ElementRef, static: false }) expenseOptionsList: ElementRef;
  @ViewChild('expenseOptionBtn', { read: ElementRef, static: false }) expenseOptionBtn: ElementRef;
  @ViewChild('managerCount', { read: ElementRef, static: false }) managerCount: ElementRef;
  @ViewChild('managerNameDropdown', { read: ElementRef, static: false }) managerNameDropdown: ElementRef;
  @ViewChild('expenseBreadcumDropdownTrigger', {read: ElementRef, static: false}) 
  expenseBreadcumDropdownTrigger : ElementRef;
  
  public userType = UserType;
  public expense_type = expense_type;
  public isExpenseManager = false;

  public isOpenWithdraw = false;
  public isOpenModify = false;
  public isOpenReject = false;
  public isOpenDelete = false;
  public noBudgetForOperation = false;
  public currentUserId: string;
  public isWorker = false;
  public statusMessageData: StatusMessageData;
  public expenseType: IExpenseType;
  public optionsVisibility = false;

  public readonly ExpenseStatusMessage = ExpenseStatusMessage;
  public readonly StatusMessageTypes = StatusMessageTypes;
  public readonly ExpenseType = ExpenseType;
  reportKey: any;
  logs: Log = undefined;
  isShowApprovalButton: boolean = false;
  user_type: any;
  approval_chain_id: any;
  isLock = false;
  currentMemberId: any;
  is_reassigned_user: any;
  showHideManagerList:boolean = false;
  approvalOption: boolean = false;
  adminOption: boolean;
  constructor(
    private eventStream: EventStreamService,
    private expenseDetailService: ExpenseDetailService,
    private confirmationService: ConfirmationDialogService,
    private expenseStatusService: ExpenseStatusService,
    private _route: ActivatedRoute,
    private _downloadReportService: DownloadReportService,
    private modalService: NgbModal,
    private storageService: StorageService,
    private render: Renderer2,
    private authorizationService: AuthorizationService,
    private alertService: AlertService,
    private loader: LoaderService
  ) {
    this.render.listen('window', 'click', (e: Event) => {
      if (
        (this.expenseOptionBtn && this.expenseOptionBtn.nativeElement.contains(e.target) && !this.optionsVisibility) ||
        (this.expenseOptionsList && this.expenseOptionsList.nativeElement.contains(e.target))
      ) {
        this.optionsVisibility = true;
      } 
      else if (
        (this.managerCount && this.managerCount.nativeElement.contains(e.target) && !this.showHideManagerList) ||
        (this.managerNameDropdown && this.managerNameDropdown.nativeElement.contains(e.target)) 
      ){
        const buttonPosition = this.managerCount.nativeElement.getBoundingClientRect();
        this.showHideManagerList = true;
        this.managerNameDropdown.nativeElement.style.top = `${buttonPosition.top + buttonPosition.height}px`;
        this.managerNameDropdown.nativeElement.style.left = `${buttonPosition.left}px`;
        this.render.addClass(document.body, 'manager-dropdown-overflow');
      } 
      else if(this.expenseBreadcumDropdownTrigger && this.expenseBreadcumDropdownTrigger.nativeElement.contains(e.target)){
        this.approvalOption = true;
      }

      else {
        this.approvalOption = false;
        this.optionsVisibility = false;
        this.showHideManagerList = false;
        this.render.removeClass(document.body, 'manager-dropdown-overflow');
      }
    });
  }

  ngOnInit() {
    const user = this.storageService.get('user');
    this.user_type = this.storageService.get('user_type');
    this.reportKey = this._route.snapshot.params['expenseId'];
    this.isWorker = user?.is_candidate;
    this.setStatusMessageData();
    this.expenseStatusService.getExpenseType();
    this.currentUserId = this.storageService.get('account').id;
    this.expenseType = this.expenseStatusService.expenseType;
    if( this.expenseType){
      this.expType.emit(this.expenseType);
    }
    if (this.data?.expense_status?.toLowerCase() === this.ExpenseStatusMessage.pending  || this.data?.expense_status?.toLowerCase() === this.ExpenseStatusMessage.pending_review) {
      this.getUserApprovals();
    } 
    this.eventStream.on(Events.SHOW_ERROR_STATUS_EXPENSE_LOGS).subscribe((data:any) => {
       this.logs = data
    });
    this.getExpenseLockStatus();
  }

  ngOnChanges(changes: SimpleChanges) {
    const { data } = changes;
    if (!data?.firstChange) {
      if (!this.noBudgetForOperation) {
        this.setStatusMessageData();
      }
      if (this.data?.expense_status?.toLowerCase() === this.ExpenseStatusMessage.pending || this.data?.expense_status?.toLowerCase() === this.ExpenseStatusMessage.pending_review) {
        this.getUserApprovals();
      } else {
        this.noBudgetForOperation = false;
        this.setStatusMessageData();
      }
    }
    if(this.data){
      this.expenseDetailService.dataload(true)
    }
  }

  getExpenseLockStatus(){
  return new Promise((resolve) => { 
    this.expenseStatusService.getExpenseLockStatus(this.data.expense_id).subscribe((data:any) => {
      this.isLock = data?.data?.is_lock;
      if(this?.isLock){
        this.showError(data?.message);
      }
      resolve({});
    });
  });
  }

  private getUserApprovals() {
    this.expenseStatusService.getListOfApprovers(this.data.expense_id).subscribe((data:any) => {
      this.currentMemberId = undefined;
      this.isExpenseManager = false;
      let isPreviousLevelPending = false;
      data?.approvers?.forEach((element) => {
       let isDelegated;
        let isManager = element?.members?.some((el, index) => {
          if (el?.id === this.currentUserId) {
            this.is_reassigned_user = el?.is_reassigned_user;
          }
          if (element?.status === 'PENDING' && el?.status === 'PENDING' && !isPreviousLevelPending) {
            if(index + 1 == element?.members?.length) {
              isPreviousLevelPending = true;
            }
            if (el?.delegated_to && el?.delegated_to?.length > 0){
             let delegated = el?.delegated_to?.some((dl) => {
                if (dl?.id === this.currentUserId) {
                  return dl?.is_approval_allowed;
                } else {
                  return dl?.is_approval_allowed;
                }
              });
              if (delegated) {
                if(!this.currentMemberId || !isDelegated){
                  this.currentMemberId = el?.id;
                  isDelegated = delegated;
                  return el?.is_approval_allowed;
                }
              } else {
                if (el?.id === this.currentUserId) {
                  // if(!this.currentMemberId){
                  // this.currentMemberId = el?.id;
                  // }
                  return el?.is_approval_allowed;
                }
              }
          } else  if (el?.id === this.currentUserId) {
            // if(!this.currentMemberId){
            // this.currentMemberId = el?.id;
            // }
            return el?.is_approval_allowed;
          } else {
              this.approval_chain_id = element?.approval_chain_id;
              return el?.is_approval_allowed;
            }
            this.approval_chain_id = element?.approval_chain_id;
          }
        })
        if (isManager || isDelegated) {
          this.isExpenseManager = true;
          this.approval_chain_id = element?.approval_chain_id;
        } else{
          // V2M-25890 commented because of this ticket
          // this.isExpenseManager = false;
        }
      });

      // V2M-24143
      const isAdminOverride = this.authorizationService?.authorize(Permissions?.ADMIN_OVERRIDE_ON_APPROVAL)
      if (isAdminOverride && (this.approval_chain_id === data?.approvers[data?.approvers?.length - 1]?.approval_chain_id) && data?.approvers?.find((approval) => approval?.status === 'PENDING')?.approval_chain_id) {
        this.approval_chain_id = data?.approvers?.find((approval) => approval?.status === 'PENDING')?.approval_chain_id;
      }
      // End
    });
    if (this.user_type?.toLowerCase() !== 'vendor' && !this.isWorker) {
      this.expenseDetailService.getAssignmentBudget(this.data.assignment.id).subscribe((res:any) => {
        this.noBudgetForOperation = Number(res.left_budget) < Number(this.data.calculation.total_amount);
        if(this.noBudgetForOperation){
          this.isShowApprovalButton = false;
        } else{
          this.isShowApprovalButton = true;
        }
        this.statusMessageData = this.noBudgetForOperation || this.data?.is_budget_insufficient
          ? {
            status: ExpenseStatusMessage.rejected,
            approve_reject_by: this.data?.approve_reject_by,
            updated_by: '',
            delegation: null,
            impersonation: null,
            date: '',
            modification_by:null,
            modification_at:null,
            modification_reason:null,
            modification_note:null,
            isModified:  false,
          }
          : this.statusMessageData;
      });
    }
  }

  public submitExpenseForApprovalById() {
    this.confirmationService.confirm('', 'Are you sure you want to submit?', 'Submit', 'Cancel').then(confirmed => {
      if (confirmed) {
        this.expenseDetailService.submitExpenseForApprovalById(this.data.expense_id, this.data.expense_type);
      }
    });
  }

  async rejectExpense() {
    this.isOpenReject = true;
    setTimeout(() => {
      this.eventStream.emit(new EmitEvent(Events.REJECT_EXPENSE, { isReject: true, approval_chain_id: this.approval_chain_id,currentMemberId:this.currentMemberId}));
    });
  }

  async withdrawExpense() {
    await this.getExpenseLockStatus();
    if(!this.isLock){
      this.isOpenWithdraw = true;
      setTimeout(() => {
        this.eventStream.emit(new EmitEvent(Events.WITHDRAW_EXPENSE, true));
      });
    }
  }
  openApprovalOption(){
    this.adminOption = true;
    if(!this.data?.actions_allow?.can_perform_workflow){
      this.approveExpense();
    } else if(this.data?.actions_allow?.can_perform_workflow && this.data?.expense_type == expense_type.misc_expense){
      this.approveExpense();
    }
  }
  openReleseOption(){
    this.approvalOption = true;
    if(!this.data?.actions_allow?.can_perform_workflow){
      this.releaseExpense();
    } else if(this.data?.actions_allow?.can_perform_workflow && this.data?.expense_type == expense_type.misc_expense){
      this.releaseExpense();
    }
  }

  async approveExpense(approvalType?:any) {
    let is_forced_approval = false;
    if(approvalType == 'entire'){
      is_forced_approval= true
    }
    if (this.noBudgetForOperation) {
      this.showError('Assignment Budget insufficient for Approval.');
    } else {
      this.expenseStatusService.approveExpense(this.data.expense_id, this.approval_chain_id,is_forced_approval,this.currentMemberId);
    }
  }
  hideApprovalOption() {
    this.approvalOption = false;
    this.adminOption = false;
  }
  public releaseExpense(approvalType?:any){
   let is_forced_approval = false;
    if(approvalType == 'entire'){
      is_forced_approval= true
    }
    this.expenseStatusService.releaseExpense(this.data.expense_id, this.approval_chain_id,is_forced_approval,this.currentMemberId,this.is_reassigned_user);
  }

  public getStatusText(status: string) {
    return status?.toLowerCase() === this.ExpenseStatusMessage.draft ? 'Last Updated' : 'Submitted';
  }

  public getWokerName(status: string) {
    return status?.toLowerCase() === this.ExpenseStatusMessage.draft ? this.data?.updated_by?.name : this.data?.submitted_by?.name;
  }

  public modifyExpense() {
    this.isOpenModify = true;
    setTimeout(() => {
      this.eventStream.emit(new EmitEvent(Events.MODIFY_EXPENSE, true));
    });
  }
  discardExpense() {
    this.loader.show();
    this.expenseStatusService.discardExpense(this.data?.expense_id).subscribe({next:(data:any) => {
      this.loader.hide();
      this.alertService.success(data?.data?.message);
      this.expenseDetailService.navigateBackToList();
    },error: (err) => {
      this.loader.hide();
      this.showError(err);
    }});
  }

  showError(err) {
    window.scrollTo(0, 0);
    this.logs = {
      type: LOG_TYPE.ERROR, heading: err?.error?.error?.message ? err?.error?.error?.message : err, messages: [], autoClose: true, isShown: true, showReportButton: (err?.status == 500 || err?.status == 400), additionalInfo: { trace_id: err?.error?.trace_id }
    };
    err?.error?.error?.errors?.forEach(msg => {
      if (msg?.message) {
        this.logs.messages.push(msg?.message);
      }
    });
  }

  public setStatusMessageData() {
    this.statusMessageData = {
      status: this.data?.expense_status,
      approve_reject_by: this.data?.approve_reject_by,
      updated_by: this.data?.updated_by,
      delegation: this.data?.delegation,
      impersonation: this.data?.impersonation,
      date: this.data?.updated_date,
      is_archive: this.data?.is_archive,
      modification_by:null,
      modification_at:null,
      modification_reason:null,
      modification_note:null,
      isModified:  false,
      reason: '',
      notes: '',
    };
    switch (this.data?.expense_status?.toLowerCase()) {
      case ExpenseStatusMessage.rejected:
      case ExpenseStatusMessage.approved: {
        this.statusMessageData = {
          ...this.statusMessageData,
          date: this.data.approved_reject_date,
          reason: this.data.approved_reject_reason,
          notes: this.data.approved_reject_notes,
        };
        break;
      }
      case ExpenseStatusMessage.pending: {
        this.statusMessageData = {
          ...this.statusMessageData,
          date: this.data.submitted_date,
        };
        break;
      }
      case ExpenseStatusMessage.withdrawn: {
        this.statusMessageData = {
          ...this.statusMessageData,
          reason: this.data.withdraw_reason,
          notes: this.data.withdraw_notes,
        };
        break;
      }
      case ExpenseStatusMessage.modified: {
        this.statusMessageData = {
          ...this.statusMessageData,
          reason: this.data.modify_reason,
          notes: this.data.modify_notes,
        };
        break;
      }
      case ExpenseStatusMessage.deleted: {
        this.statusMessageData = {
          ...this.statusMessageData,
          reason: this.data.delete_reason,
          notes: this.data.delete_notes,
        };
        break;
      }
    }

    if(this.data?.modification_at){
      this.statusMessageData = {
        ...this.statusMessageData,
        modification_by: this.data?.modification_by,
        modification_at: this.data?.modification_at,
        modification_reason: this.data?.modification_reason,
        modification_note: this.data?.modification_note,
        isModified:  true,
      };
    }
  }

  public deleteExpense(event) {
    event.stopPropagation();
    this.optionsVisibility = false;
    this.isOpenDelete = true;
    setTimeout(() => {
      this.eventStream.emit(new EmitEvent(Events.DELETE_EXPENSE, true));
    });
  }
  openDownloadReportModal() {
    const modalRef = this.modalService.open(DownloadReportComponent);
    modalRef.componentInstance.isexpenseReport = true;
    this._downloadReportService.downloadReportFormats[1].display = false;
    modalRef.componentInstance.reportKey = this.reportKey;
  }
  public updateExpenseDetails() {
    this.expenseDetailService.getExpenseDetailsById(this.data.expense_id, true);
  }

  public canSubmit() {
    const type = this.expenseType?.value ? this.expenseType?.value : 'expense';
    return (
      this.authorizationService.authorize('create_' + type) ||
      (this.authorizationService.authorize('modify_' + type) && this.data.is_modified_record)
    );
  }

  get hasOverrideApprovalPermission() {
    return this.authorizationService.authorize(Permissions?.ADMIN_OVERRIDE_ON_APPROVAL);
  }
  get hasApproveExpensePermission() {
    return this.authorizationService.authorize('approve_' + (this.expenseType?.value ? this.expenseType?.value : 'expense'));
  }
  get hasRejectExpensePermission() {
    return this.authorizationService.authorize('reject_' + (this.expenseType?.value ? this.expenseType?.value : 'expense'));
  }

  ngOnDestroy() {
    this.expenseStatusService.unsubscribe();
  }
}
