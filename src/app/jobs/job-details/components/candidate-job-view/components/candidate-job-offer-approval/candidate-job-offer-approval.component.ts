import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { StorageService ,StorageKeys} from 'src/app/core/services/storage.service';
import { JobService } from 'src/app/jobs/job.service';
import { ActivatedRoute } from '@angular/router';
import { ApprovalStatus } from 'src/app/shared/enums';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { Log , LOG_TYPE } from 'src/app/library/logs/logs.model';
import { EmitEvent , Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { UserPermissionService } from 'src/app/expense/services/user-permission.service';

@Component({
  selector: 'app-candidate-job-offer-approval',
  templateUrl: './candidate-job-offer-approval.component.html',
  styleUrls: ['./candidate-job-offer-approval.component.scss']
})
export class CandidateJobOfferApprovalComponent implements OnInit {
  @Output() hideApprovalRequest = new EventEmitter();
  @Input() currentJobid: any;
  @Input() offerId: any;
  @Input() candidateId: any;
  @Input() offerData: any;
  approvalList: any = [];
  hasOwnApprovalPending = false;
  public programId: any;
  user: any;
  jobId: any;
  userType: any;
  approvalStatus = ApprovalStatus;
  offerStatus = '';
  approvalFor: any;
  approverId: any;
  public approvalNote = 'hidden';
  public rejectNote = 'hidden';
  approvalHistory: any[] = [];
  adminApprovalMode = 'sequence';
  superAdminEdit = false;
  public approvalWorkflow: any;
  isProgramAdmin:boolean;
  approvaChainId:string;
  logs: Log= undefined;
  toggleDescription:boolean = false;
  currentProgram;
  isReassignedUser: any;
  constructor(public jobService : JobService, private storage: StorageService,private route: ActivatedRoute,public alertService: AlertService, public loader: LoaderService,
    private eventStreamService: EventStreamService,
    private userPermissionService: UserPermissionService,

    ) { }

  ngOnInit(): void {
    this.user = JSON.parse(localStorage.getItem('user'));
    this.jobId = this.currentJobid;
    this.offerId = this.route.snapshot.queryParams.offerId || this.offerId;
    this.currentProgram = this.storage.get(StorageKeys.CURRENT_PROGRAM);
    this.userType = this.storage.get('user_type');
    this.programId = this.currentProgram?.id;
    if(this.jobId){
      this.init()
    }


  }
  init() {
    this.getApproversList();
  }
  get sidePanelViewMode() {
    return !this.hasOwnApprovalPending;
  }
  reverseSnakeCase(value) {
    value = value?.toLowerCase();
    if(value){
      value = value.split("_").join(" ");
      value = this.toTitleCase(value);
    }
    return value
  }
  toTitleCase(str) {
    return str.replace(
      /\w\S*/g,
      function (txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
      }
    );
  }
  goToDetailsPage() {
    this.hideApprovalRequest.emit(true)
  }
  getApproversList() {
    this.jobService.get(`/approval/programs/${this.programId}/offers/${this.offerId}/approval-instances`)
      .subscribe((res: any) => {
          this.approvalList = res?.approvers;
          this.offerStatus = res?.status;
          this.assignProgramAdminToMember();
          this.hasOwnApprovalPending = Boolean(res.pending_approvals);
      })
  }

  get hasApprovalOverridePermission() {
    let canOverRideApprovalProcess = false;
    if (this.userPermissionService.isUserSuperAdmin()) {
      canOverRideApprovalProcess = true;
    } else {
      const user_permission: [] = this.storage.get('user_permission');
      if (user_permission && user_permission.length > 0) {
        canOverRideApprovalProcess = user_permission.some(permission => permission === 'admin_override_on_approval')
      }
    }
    return canOverRideApprovalProcess;
  }

  assignProgramAdminToMember = () =>{
    this.approvalList?.forEach(approval => {
      if (approval?.members?.length > 0) {
        let prgramAdmin = approval.members?.find(mem => mem.is_program_admin);
          approval?.members.forEach(mem => {
          if(!mem.is_active && prgramAdmin){
            mem.prgram_admin_fullname = prgramAdmin.first_name + (prgramAdmin.middle_name ?? ' ')+ (prgramAdmin.last_name ?? '');
          }
        });
      }
    });
  }

  getStatusStyleClass(status) {
    status = status.toLowerCase();
    let className = '';
    switch (status) {
      case this.approvalStatus.pending:
        className = 'no-approved-panel';
        break;
      case this.approvalStatus.approved:
        className = 'approved-panel';
        break;
      case this.approvalStatus.rejected:
        className = 'rejected-panel';
        break;
      default:
        break;
    }
    return className;
  }
  openApprovalPanel(status, approverId = '',is_program_admin = false,approval_chain_id='',isReassignedUser = false) {
    this.approvalFor = status;
    this.approvalNote = "visible";
    this.isProgramAdmin = is_program_admin;
    this.approvaChainId = approval_chain_id;
    this.approverId = approverId;
    this.isReassignedUser = isReassignedUser;
  }

  openRejectPanel() {
    this.rejectNote = "visible";
  }
  onSidePanelClose() {
    this.approvalNote = "hidden";
    this.superAdminEdit = false;
  }
  afterSuccess() {
    window.location.reload();
  }

  getNotActiveProfileMessage = (profile): string => {
    let message = 'Approval is deactivated';
    if(!profile?.is_active && profile.prgram_admin_fullname){
     message = `Approval is replaced by ${profile.prgram_admin_fullname}`;
    }
    return message;
 }

  onSubmit(event) {
    this.loader.show();
    this.logs=undefined;
    let { superAdminEdit, approval_for, approval_reason, approval_notes,approval_chain_id, is_program_admin, is_reassigned_user} = event;
    let payload = {
      'status': approval_for.toUpperCase(),
      'status_reason': approval_reason,
      'status_note': approval_notes,
      "approval_chain_id": approval_chain_id,
      "inactive_member_flag": is_program_admin,
      'is_forced_approval': (superAdminEdit && this.adminApprovalMode !== 'sequence'),
      "is_reassigned_user": is_reassigned_user
    };
    this.jobService.put(`/approval/programs/${this.programId}/offers/${this.offerId}/approval-request`, payload)
      .subscribe({
        next: (res: any) => {
        this.init();
        this.loader.hide();
        this.afterSuccess();
        this.onSidePanelClose();
      },
      error: (err) => {
        this.loader.hide();
        // this.alertService.error(errorHandler(err));
       let logs = this.showError(err);
       this.emitLogs(logs)
      }});
  }
  showError(err) {
    this.logs = {
      type: LOG_TYPE.ERROR, heading: err?.error?.error?.message ? err?.error?.error?.message : (typeof err == 'string' ? err : ''), messages: [], autoClose: true, isShown: true, showReportButton: (err?.status == 500 || err?.status == 400), additionalInfo: { trace_id: err?.error?.trace_id }
    };
    err?.error?.error?.errors?.forEach(msg => {
      if (msg?.message) {
        this.logs.messages.push(msg?.message);
      }
    });
    return this.logs;
  }
  emitLogs(logs){
    this.eventStreamService.emit(new EmitEvent(Events.SHOW_OFFER_REJECT_LOGS, logs));

  }
}
