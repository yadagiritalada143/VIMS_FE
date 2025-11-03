import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { errorHandler } from '../../../../shared/util/error-handler';
import { JobDetailsService } from '../../job-details.service';
import { UserPermissionService } from 'src/app/expense/services/user-permission.service';
import { AccessType, ApprovalStatus, JobStatus, UsersType } from 'src/app/shared/enums';
import { IUser } from '../../interfaces/IUser';
import { EntityReferrences } from '../../enumerations/entityRef';
import { PopupService } from 'src/app/shared/service/popup.service';
import { Events , EmitEvent, EventStreamService } from 'src/app/core/services/event-stream.service';
import { Log , LOG_TYPE } from 'src/app/library/logs/logs.model';
import { AccuracyPipe } from 'src/app/shared/pipe/accuracy.pipe';

@Component({
  selector: 'app-approval',
  templateUrl: './approval.component.html',
  styleUrls: ['./approval.component.scss']
})
export class ApprovalComponent implements OnInit {

  public jobDetails: any;
  public user: any;
  public jobId = '';
  public programId: any;
  public approvalWorkflow: any;
  public approvalNote = 'hidden';
  public rejectNote = 'hidden';
  public userApproval: any;
  public historyData: any;
  public userType: any;
  public orderingMap: Map <string, number> = new Map <string, number> ();

  superAdminEdit = false;
  adminApprovalMode = 'sequence';
  summaryList: any[] = [];
  approvalHistory: any[] = [];
  approvalFor: any;
  approverId: any;
  isProgramAdmin : boolean;
  approvaChainId:string;
  approvalList: any[] = [];
  isJobApproved = false;
  jobStatus = '';
  hasOwnApprovalPending = false;
  approvalStatus = ApprovalStatus;
  approverUser: IUser[];
  logs: Log= undefined;
  viewMode : boolean = false;
  isMaxBudgetCalculation: boolean = false;
  JobStatus = JobStatus;

  constructor (
    private jobService: JobDetailsService,
    private alertService: AlertService,
    private route: ActivatedRoute,
    private storage: StorageService,
    private loader: LoaderService,
    private userPermissionService: UserPermissionService,
    private popupService: PopupService,
    private eventStreamService: EventStreamService,
    private accuracyPipe: AccuracyPipe,
    private router: Router
    ) { }

  ngOnInit(): void {
    const currentProgram = this.storage.get(StorageKeys.CURRENT_PROGRAM);
    this.user = JSON.parse(localStorage.getItem('user'));
    this.jobId = this.route.parent?.snapshot.params['id'];
    this.userType = this.storage.get('user_type');
    this.programId = currentProgram?.id;
    this.init();
  }

  init() {
    this.getJobDetails(this.jobId);
    // this.getJobApproval();
    // this.checkUserApproval();
    this.getApproversList();
  }

  getJobDetails(jobid) {
    if (jobid) {
      const http1 = this.jobService.getJobs(`${jobid}`);
      // const http2 = this.jobService.get(`/job-manager/programs/${this.programId}/prevchange/${this.jobId}`);
      forkJoin([http1])
        .subscribe((res: any) => {
          const data = res[0];
          // this.historyData = res[1].history;
          if (data) {
            this.jobDetails = data?.job;
            this.isMaxBudgetCalculation = this.jobDetails?.estimate_budget_type?.toLowerCase() === "max_budget";
            this.prepareSummaryList();
            this.prepareHistorySummary();
          }
        })

    }
  }

  reverseSnakeCase(string) {
    string = string?.split("_")?.join(" ");
    return string
  }

  prepareHistorySummary() {

    for (const property in this.historyData) {
      let value = this.historyData[property].old_value;
      if (property === 'location_id') {
        value = value?.work_location?.name;
      }

      if (property === 'budget_estimate') {
        value = this.accuracyPipe.
          transform(value * this.jobDetails?.no_of_openings, 'amount',
          { currencyCode: this.jobDetails?.currency?.toUpperCase() })?.toString()
      }

      if (property === 'max_bill_rate' || property === 'min_bill_rate') {
        value = this.accuracyPipe.
          transform(value, 'rate', { currencyCode: this.jobDetails?.currency?.toUpperCase() })?.toString()
      }

      this.replaceValueInSummaryList(property, value);

    }
  }

  replaceValueInSummaryList(key, value) {
    if (this.historyData.hasOwnProperty(key)) {
      var index = this.summaryList.findIndex(summary => summary.key === key);
      if (index > -1) {
        this.summaryList[index].old_value = value;
      }
    }
  }

  public summaryListLength: number = 0;
  prepareSummaryList() {

    this.summaryList = [];
    this.summaryList.push({
      key: 'hierarchy',
      title: 'Hierarchy',
      old_value: this.jobDetails?.hierarchy[0]?.name,
      new_value: this.jobDetails?.hierarchy[0]?.name
    });

    this.summaryList.push({
      key: 'location_id',
      title: 'Work Location',
      old_value: this.jobDetails?.location?.name,
      new_value: this.jobDetails?.location?.name
    });

    if (this.jobDetails?.rate_model != 'PAY_RATE') {

      this.summaryList.push({
        key: 'min_bill_rate',
        title: 'Min bill Rate',
        old_value: this.accuracyPipe.transform(this.jobDetails?.min_bill_rate, 'rate', { currencyCode: this.jobDetails?.currency?.toUpperCase() })?.toString(),
        new_value: this.accuracyPipe.transform(this.jobDetails?.min_bill_rate, 'rate', { currencyCode: this.jobDetails?.currency?.toUpperCase() })?.toString()
      })

      this.summaryList.push({
        key: 'max_bill_rate',
        title: 'Max bill Rate',
        old_value: this.accuracyPipe.transform(this.jobDetails?.max_bill_rate, 'rate', { currencyCode: this.jobDetails?.currency?.toUpperCase() })?.toString(),
        new_value: this.accuracyPipe.transform(this.jobDetails?.max_bill_rate, 'rate', { currencyCode: this.jobDetails?.currency?.toUpperCase() })?.toString()
      })

    }

    if (this.jobDetails?.rate_model != 'BILL_RATE' && this.jobDetails?.rate_model != null && this.jobDetails?.rate_model != "MARKUP") {
      this.summaryList.push({
        key: 'min_pay_rate',
        title: 'Min Pay Rate',
        old_value: this.accuracyPipe.transform(this.jobDetails?.min_pay_rate, 'rate', { currencyCode: this.jobDetails?.currency?.toUpperCase() })?.toString(),
        new_value: this.accuracyPipe.transform(this.jobDetails?.min_pay_rate, 'rate', { currencyCode: this.jobDetails?.currency?.toUpperCase() })?.toString()
      })

      this.summaryList.push({
        key: 'max_pay_rate',
        title: 'Max Pay Rate',
        old_value: this.accuracyPipe.transform(this.jobDetails?.max_pay_rate, 'rate', { currencyCode: this.jobDetails?.currency?.toUpperCase() })?.toString(),
        new_value: this.accuracyPipe.transform(this.jobDetails?.max_pay_rate, 'rate', { currencyCode: this.jobDetails?.currency?.toUpperCase() })?.toString()
      })
    }

    this.summaryList.push({
      key: 'budget_estimate',
      title: 'Estimated Budget / Position',
      old_value: this.accuracyPipe.transform((this.isMaxBudgetCalculation ? (this.jobDetails?.rate_markup_info?.max_single_net_budget ?? this.jobDetails?.rate_markup_info?.single_net_budget ?? 0.00) : (this.jobDetails?.rate_markup_info?.single_net_budget ?? 0.00)), 'amount', { currencyCode: this.jobDetails?.currency?.toUpperCase() })?.toString(),
      new_value: this.accuracyPipe.transform((this.isMaxBudgetCalculation ? (this.jobDetails?.rate_markup_info?.max_single_net_budget ?? this.jobDetails?.rate_markup_info?.single_net_budget ?? 0.00) : (this.jobDetails?.rate_markup_info?.single_net_budget ?? 0.00)), 'amount', { currencyCode: this.jobDetails?.currency?.toUpperCase() })?.toString(),
    })

    this.summaryList.push({
      key: 'positions',
      title: 'Number of Positions',
      old_value: this.jobDetails?.positions,
      new_value: this.jobDetails?.positions
    });

    this.summaryList.push({
      key: 'total_estimate',
      title: this.isMaxBudgetCalculation ? 'Total Estimated Budget' : 'Estimated Budget',
      old_value: this.accuracyPipe.transform((this.isMaxBudgetCalculation ? (this.jobDetails?.max_budget ?? this.jobDetails?.budget_estimate ?? 0.00) : (this.jobDetails?.budget_estimate ?? 0.00)), 'amount', { currencyCode: this.jobDetails?.currency?.toUpperCase() })?.toString(),
      new_value: this.accuracyPipe.transform((this.isMaxBudgetCalculation ? (this.jobDetails?.max_budget ?? this.jobDetails?.budget_estimate ?? 0.00) : (this.jobDetails?.budget_estimate ?? 0.00)), 'amount', { currencyCode: this.jobDetails?.currency?.toUpperCase() })?.toString()
    });

    this.summaryListLength = this.summaryList.length;
    let masterSummaryList: Array <any> = [];

    if (this.jobDetails?.foundational_data) {

      this.jobDetails?.foundational_data.forEach(FDElement => {
        let value = '';
        FDElement.foundation_data.forEach((a, i) => {
          value += `${FDElement.foundation_data.length > 1 ? i + 1 + '. ' : ' '}${a.name} - ${a.code}\n`;
        });
        masterSummaryList.push({
          is_foundational: true,
          key: FDElement?.id,
          title: FDElement?.name,
          old_value: value,
          new_value: value,
        });
      });

    if(!this.orderingMap.size) {

      this.jobService.masterDataProgressiveLoader()
      .then(res => {
        this.orderingMap = res?.map;
        masterSummaryList.sort((x: any, y: any) => {
          return this.orderingMap.get(x.key) - this.orderingMap.get(y.key);
        });

        this.summaryList = [ ...this.summaryList, ...masterSummaryList ];

      });

    } else {
      masterSummaryList.sort((x: any, y: any) => {
        return this.orderingMap.get(x.key) - this.orderingMap.get(y.key);
      });
      this.summaryList = [ ...this.summaryList, ...masterSummaryList ];
    }

    }
  }

  getHistory() {
    let url = `/job-manager/${this.programId}/prevchange/${this.jobId}`;
    this.jobService.get(url).subscribe({
      next: (data: any) => {
      if (data.history) {
        this.historyData = data.history;
      }
    }, 
    error: (err) => {
      this.alertService.error(errorHandler(err));
    }});
  }

  onSubmit(event) {
    this.loader.show();
    let { superAdminEdit, approval_for, approval_reason, approval_notes,approval_chain_id,is_program_admin} = event;
    let payload = {
      'status': approval_for.toUpperCase(),
      'status_reason': approval_reason,
      'status_note': approval_notes,
      "approval_chain_id": approval_chain_id,
      "inactive_member_flag": is_program_admin,
      'is_forced_approval': (superAdminEdit && this.adminApprovalMode !== 'sequence')
    };
    this.jobService.put(`/approval/programs/${this.programId}/jobs/${this.jobId}/approval-request`, payload)
      .subscribe({
        next: (res: any) => {
          const account = this.storage.get(StorageKeys?.CURRENT_ACCOUNT);
          const accessType = account?.role?.access;  //OWN OR ALL OR TRUE_OWN
          const isUserJobManager = (this.jobDetails?.job_manager_id == account?.id);
          if(!isUserJobManager && this.userType?.toUpperCase() == UsersType.CLIENT?.toUpperCase()  && accessType?.toUpperCase() != AccessType.ALL?.toUpperCase()) {
            this.router.navigate(['/jobs/list/all']);
          } else {
          this.init();
          this.afterSuccess();
        }
        this.loader.hide();
      },
      error: (err) => {
        this.loader.hide();
        let logs = this.showError(err);
       this.emitLogs(logs)
      }});
  }

  afterSuccess() {
    window.location.reload();
  }

  snakeCaseToTitle(snakeCaseString) {
    if (!snakeCaseString) {
      return '';
    }

    snakeCaseString = snakeCaseString.toLowerCase().split('_');
    for (let i = 0; i < snakeCaseString.length; i++) {
      snakeCaseString[i] = snakeCaseString[i][0].toUpperCase() + snakeCaseString[i].slice(1);
    }

    return snakeCaseString.join(' ');
  }

  showApproveReject(id) {
    return this.userApproval && this.userApproval.some(appr => (appr.id === id && appr.is_approval_required));
  }

  get sidePanelViewMode() {
    return !this.hasOwnApprovalPending;
  }

  getApproversList() {
    this.jobService.get(`/approval/programs/${this.programId}/jobs/${this.jobId}/approval-instances`)
      .subscribe((res: any) => {
        this.approvalList = res.approvers;
        this.jobStatus = res.status;
        this.assignProgramAdminToMember();
        this.hasOwnApprovalPending = Boolean(res.pending_approvals) || res?.status?.toUpperCase() === 'PENDING';
      })
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

  openApprovalPanel(status, approverId = '',is_program_admin = false,approval_chain_id='',mode:string = 'approval') {
    this.approvalFor = status;
    this.approvalNote = "visible";
    this.approverId = approverId;
    this.approvalHistory = [];
    this.isProgramAdmin = is_program_admin;
    this.approvaChainId = approval_chain_id;
    this.viewMode = this.sidePanelViewMode;
    if(mode === 'view'){
      this.viewMode =true;
    };
    this.setApprovalHistoryDetails(approverId, status);
  }

  setApprovalHistoryDetails = (approverId, status) => {
    if (this.approvalList && this.approvalList.length > 0
        && (status?.toLowerCase() === 'rejected' || status?.toLowerCase() === 'approved') && this.viewMode) {
      this.approvalList.forEach(approval => {
        if (approval?.members?.length > 0) {
          let approvalHistory;
          if(approverId){
            approvalHistory = approval?.members.filter(mem => (mem?.status === 'REJECTED' || mem?.status === 'APPROVED') && mem.id === approverId)
          }else{
            approvalHistory = approval?.members.filter(mem => mem?.status === 'REJECTED' || mem?.status === 'APPROVED')
          }
          if (approvalHistory && approvalHistory.length > 0) {
            let approvalHist = approvalHistory.map(his => {
              if (his) {
                return {
                first_name: his.first_name,
                midddle_name: his.midddle_name,
                last_name:his.last_name,
                full_name: `${his.first_name} ${his.middle_name ?? ''} ${his.last_name}`,
                title:his.title,
                id:his.id,
                 modified_by: {
                    full_name: `${his.status_modified_by?.first_name} ${his.status_modified_by?.last_name}`,
                    first_name: his.status_modified_by?.first_name,
                    last_name: his.status_modified_by?.last_name,
                    title: his.status_modified_by?.title,
                    id: his.status_modified_by?.id
                  },
                  role_name: this.reverseSnakeCase(approval?.role?.name),
                  approval_notes: his.status_note,
                  approval_reason: his.status_reason,
                  approval_status: his.status,
                  approval_on: his.status_modified_on,
                  isActive: his.is_active
                }
              }
            });
            this.approvalHistory.push(...approvalHist);
          }
        }
      })
    }
  }

  openRejectPanel() {
    this.rejectNote = "visible";
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

  onSidePanelClose() {
    this.approvalNote = "hidden";
    this.superAdminEdit = false;
  }

  handleMemberProfileOpenApproverPanel(data: {
    status: string;
    approverId: string;
    approval_chain_id:string;
    is_program_admin:boolean;
    mode:string
  }) {
    this.openApprovalPanel(data.status, data.approverId,data.is_program_admin,data.approval_chain_id,data.mode);
  }

  replaceApprover(value: {
    selectedApprover: IUser,
    existingUserId: string
  }, level: number) {
    this.jobService.updateApprover(this.programId, EntityReferrences.jobs, this.jobId, value.selectedApprover.id, value.existingUserId, null).subscribe({
      next: (res: any) => {
      if (res && 'member_id' in res) {
        this.alertService.success('Approver replaced successfully');
        this.getApproversList();
        this.popupService.closeCurrentPopup();
      }
    },
    error: (err) => {
      this.alertService.error(err);
    }});
  }

  replaceLevelApprover(value: {
    selectedApprover: IUser,
    existingUserId: string
  }, level: number) {
    this.jobService.updateApprover(this.programId, EntityReferrences.jobs, this.jobId, value.selectedApprover.id, null, level).subscribe({
      next: (res: any) => {
      if (res && 'member_id' in res) {
        this.alertService.success('Approver replaced successfully');
        this.getApproversList();
      }
    }, 
    error: (err) => {
      this.alertService.error(err);
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

  emitLogs(logs) {
    this.eventStreamService.emit(new EmitEvent(Events.SHOW_JOB_REJECT_LOGS, logs));
  }

}
