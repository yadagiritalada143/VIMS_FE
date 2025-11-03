import { DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, ElementRef, HostListener, OnDestroy, OnInit, Renderer2, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ApprovalStatus } from 'src/app/shared/enums';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { ReasonCode, ReasonCodeResponce } from '../../assignment/assignment.model';
import { AlertService } from '../../core/components/alert/alert.service';
import { LoaderService } from '../../core/components/loader/loader.service';
import { EmitEvent, Events, EventStreamService } from '../../core/services/event-stream.service';
import { StorageKeys, StorageService } from '../../core/services/storage.service';
import { VendorService } from '../../program-setup/vendor/vendor.service';
import { errorHandler } from '../../shared/util/error-handler';
import { Tax } from '../assignment.model';
import { AssignmentService } from '../assignment.service';
import { Log , LOG_TYPE } from 'src/app/library/logs/logs.model';
import { FormRendererService } from 'src/app/library/form-renderer/form-renderer.service';
import { PendingItemTypes, SubStatusTypes } from '../enums/pending-item-types';
import { getDateFromString } from 'src/app/shared/util/date.util';
import { AccuracyPipe } from 'src/app/shared/pipe/accuracy.pipe';
import { AccuracyConfigEnum } from '../enums/accuracy-config';
import { UserType } from 'src/app/expense/enums/expense.enums';

export enum SOW_TYPE {
  SOW = 'sow',
  PROJECT = 'project',
}

@Component({
  selector: 'app-assignment-view',
  templateUrl: './assignment-view.component.html',
  styleUrls: ['./assignment-view.component.scss']
})
export class AssignmentViewComponent implements OnInit, OnDestroy {
  error : String;
  isActionAllow : Boolean = true;
  isTerminate = 'hidden';
  isEvalution = 'hidden';
  showEvaluationSidebar = undefined;
  public assignmentListData: any = {};
  status = 'approved';
  toggleContent = false;
  actionVisibility = false;
  jobDetails = true;
  availableCandidate = false;
  submittedCandidate = false;
  interviews = false;
  offers = false;
  assignment = false;
  approval = false;
  history = false;
  fixedHeader = false;
  lastScrollTop = 0;
  activeTab = 'assignment';
  assignmentid: any;
  programDetails: any;
  programId: string;
  userId: string;
  isUpdateAssignment = false
  configLink: string;
  is_approval_workflow = true
  newAssignmentId: string;
  temp: any;
  is_account_required = true;
  notes_for_approver = ''
  config: any;
  assignmentConfig: any;
  evaluationId: string;
  terminationId: string;
  fromQuickList = true;
  budget: any;
  jobTemplateId: any;
  checkListID: any;
  assignmentId: string = undefined;
  assignmentStatus: string = undefined;
  workerId: String = undefined;
  form_config: any;
  showOnboarding: boolean = true;
  @ViewChild('actionList', { read: ElementRef, static: false }) actionList: ElementRef;
  @ViewChild('action', { read: ElementRef, static: false }) action: ElementRef;
  evaluationItems: ReasonCode[];
  evaluationVisualData = [];
  showApprovalTab = false;
  isLock= false;
  public lockMessage: string;
  public hasPendingRequest = false;
  public openBudgetPanel = false;
  public approversList;
  public canApprove = false;
  public jobID: string;
  public pendingItem;
  public redirectToSow:any = '';
  public redirectSow = false;
  isEffectiveDateSetting : any;
  actionType : string = null;
  // public redirectToSow = false;
  public user_type: string;
  private subscrptions: Subscription[] = [];
  programType: any;
  logs: Log= undefined;
  assignmentSubStatus;
  accuracyConfig = AccuracyConfigEnum;
  public pageNumber = 1;
  public limit = 25;
  programTypeRateModel = {
    'billrate':'BILL_RATE',
    'markup':'MARKUP',
    'payrate':'PAY_RATE'
  }
  assignmentMetaTooltip
  vendorDetails: any;
  showData: boolean = false;
  constructor(
    private router: Router,
    private eventStream: EventStreamService,
    private vendorService: VendorService,
    private alertService: AlertService,
    private activatedRoute: ActivatedRoute,
    private storageService: StorageService,
    private loaderService: LoaderService,
    private datepipe: DatePipe,
    private assignmentService: AssignmentService,
    private changeDetectorRef: ChangeDetectorRef,
    private datePipe: LocalDateFormatPipe,
    private render: Renderer2,
    private _storageService: StorageService,
    private _formRendererService: FormRendererService,
    private accuracyPipe: AccuracyPipe
  ) {
    this.render.listen('window', 'click', (e: Event) => {      
      if ((this.action && this.action.nativeElement.contains(e.target) && !this.actionVisibility) || (this.actionList && this.actionList.nativeElement.contains(e.target))) {
        if(!this.isLock) {
          this.actionVisibility = true;
        }
      } else {
        this.actionVisibility = false;
      }
    });
    this.subscrptions.push(this.activatedRoute.queryParamMap
      .subscribe((params) => {
        this.activeTab = params['params']?.tab;
        if (!this.activeTab) {
          this.activeTab = 'assignment';
        }
      }
      ));

  }


  ngOnInit(): void {
    this.router.routeReuseStrategy.shouldReuseRoute = function () {
      return false;
    };
    this.assignmentid = this.activatedRoute.snapshot.params.id;
    if (this.activatedRoute.snapshot.params.page === 'quick') {
      this.fromQuickList = true;
    } else {
      this.fromQuickList = false;
    }
    this.programDetails = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.programId = this.programDetails['id'];
    this.userId = this.storageService.get('user')['id'];
    this.configLink = `/assignment/programs/${this.programId}/config?assignment_id=${this.assignmentid}`
    this.subscrptions.push(this.assignmentService.getConfigJson(this.configLink).subscribe((data: any) => {
      if (data) {
        this.config = data.data.form_config;
        this.form_config = { navTabs: [] };
        this.config?.config?.nav_tabs?.forEach(navTab => {
          const item = { sectionLabel: null };
          item.sectionLabel = navTab.label;
          navTab.field_groups.forEach(f => {
            f.fields.forEach(field => {
              if (field.id) {
                item[field.id] = field.label;
                this.form_config[field.id] = field.label;
              }
              if (field.fields) {
                field.fields.forEach(nf => {
                  if (nf.id) {
                    item[nf.id] = nf.label;
                    this.form_config[nf.id] = nf.label;
                  }
                });
              }

            });
          });
          this.form_config.navTabs.push(item);
        });
      }
    }));
    // this.programType = this.programDetails?.config?.program_model || 'BILL_RATE';
    this.getBudjetDetails();
    this.getConfig();
    this.getRateFactor();
    this.getProgramAssigmentConfig();
    this.subscrptions.push(this.eventStream.on(Events.ON_PROFILE_UPDATE).subscribe((data) => {
      this.getAssignmentList();
    }));
    this.subscrptions.push(this.eventStream.on(Events.REVIEW_SUBMIT).subscribe((data) => {
      this.getProgramAssigmentConfig();
    }));
    this.subscrptions.push(this.activatedRoute.queryParamMap
      .subscribe((params) => {
        this.activeTab = params['params']?.tab;
        this.redirectToSow = params['params']?.redirectToSow;
         if(this.redirectToSow && this.redirectToSow === SOW_TYPE.PROJECT || this.redirectToSow === SOW_TYPE.SOW) {
          this.redirectSow = true;
         }
        // this.redirectToSow = !!params['params']?.redirectToSow;
        if (!this.activeTab) {
          this.activeTab = 'assignment';
        } else if (this.activeTab === 'budget') {
          this.openBudgetPanel = !!params.get('openPanel');
        }
      }
      ));
    this.user_type = this._storageService.get(StorageKeys.USER_TYPE)?.toLowerCase();
    if(this.user_type?.toLowerCase() === UserType.Vendor.toLowerCase()) {
      this.getVendorDetails();
    }
  }
  @HostListener('window:scroll', ['$event']) onScrollEvent($event) {
    const st = window.pageYOffset;
    if (st > this.lastScrollTop) {
      if (st > 40) {
        this.fixedHeader = true;
      }
    } else if (40 < st && st < this.lastScrollTop) {
      this.fixedHeader = true;
    } else if (st <= 40) {
      this.fixedHeader = false;
    }
    this.lastScrollTop = st;
  }

  rateFactor: any[] = ['st'];
  rateFactorAbbrivation: Map<string, string> = new Map([["st", "st"]]);
  getRateFactor() {
    // this.candidateData.vendor?.id
    let url = `/configurator/programs/${this.programId}/rate-factors?is_enabled=True`;

    this.vendorService.get(url)
      .subscribe((res: any) => {
        const { rate_factors } = res;
        if (rate_factors) {
          rate_factors?.forEach(element => {
            const name = element?.name?.toLowerCase();
            const abbreviation = element?.abbreviation?.toLowerCase();
            this.rateFactor.push(element?.name?.toLowerCase());
            this.rateFactorAbbrivation.set(name, abbreviation);
          });
        }
      })


  }

  setActiveTab(tab) {
    this.activeTab = tab;
    const {type, status, ...restParams} = this.activatedRoute?.snapshot?.queryParams;
    this.router.navigate([], { queryParams: { ...(restParams || {}), tab: tab } });
    if(this.assignmentListData?.assignment?.status?.toLowerCase() ==='pending') {
      this.getAssignmentDetails();
    }
  }

  getConfig() {
    const url = `/configurator/programs/${this.programId}/config?entity_code=assignment_onboarding_tab`;
    this.subscrptions.push(this.vendorService.get(url).subscribe((res: any) => {
      const { config } = res;
      const { assignment_onboarding_tab } = config;
      this.showOnboarding = assignment_onboarding_tab;
    }))
  }
  convertCase(str) {
    return str?.replaceAll('_', ' ')
  }
  getAssignmentList() {
    this.loaderService.show();
    this.showData = false;
    this.logs=undefined;
    let url = `/assignment/programs/${this.programId}/assignment/${this.assignmentid}?is_effective_date_wise=${this.isEffectiveDateSetting?.is_enabled ? this.isEffectiveDateSetting?.is_enabled : false}`;
    this.subscrptions.push(this.vendorService.get(url).subscribe(
      {next:(data: any) => {
        if (data?.data) {
           this.getActionAllow(data?.data?.assignments?.action_allow);
           this.isLock = data?.data?.assignments?.assignment?.is_lock;
          this.assignmentListData = {...data?.data?.assignments};
           if (this.assignmentListData?.worker) {
            this.assignmentListData.worker['worker_original_start_date'] = data?.data?.assignments?.worker?.original_start_date
          }
          this.assignmentId = this.assignmentListData?.assignment?.assignment_uuid;
          this.assignmentStatus = this.assignmentListData?.assignment?.status;
          this.assignmentSubStatus = this.assignmentListData?.assignment?.sub_status;
          this.workerId = this.assignmentListData?.worker?.candidate?.id || this.assignmentListData?.worker?.candidate_id?.id;
          this.jobTemplateId = this.assignmentListData?.assignment?.assignment_title?.id;
          this.programType = this.programTypeRateModel[this.assignmentListData?.finance?.rate_model] || 'BILL_RATE';
          this.getJobTemplateDetails();
          this.getPendingItem();
          this.getEvaluationList(this.programId);
          this.status = this.assignmentListData?.assignment?.status
          if (this.status?.toLowerCase() === 'closed') {
            this.assignmentListData.assignment.status = 'Assignment Closed';
            if (this.assignmentListData?.assignment?.action_allow?.can_evaluate) {
              this.openEvalution()
            }
          }
          this.assignmentService.setCurrency(data.assignments?.finance?.currency);
          const { is_available, request_type, request_sub_type } = this.assignmentListData?.pending_request || {};
          this.hasPendingRequest = is_available;
          this.showApprovalTab = is_available && this.assignmentSubStatus.toLowerCase() !== 'pending-closed' && this.assignmentSubStatus.toLowerCase() !== 'cancel-closed' && (request_sub_type === SubStatusTypes.PendingReview || request_sub_type === SubStatusTypes.PendingApproval);
          this.updatePendingRequestStatus(data.data.assignments?.assignment);
          // this.getBudjetDetails();
          if (this.hasPendingRequest) {
            this.getAproversList(request_type);
            this.assignmentSubStatus = request_sub_type;
          }
          else {
            this.canApprove = false;
          }
          // this.changeDetectorRef.detectChanges();
          if (this.assignmentListData?.finance?.rate && this.assignmentListData?.finance?.rate[0]?.rates?.length > 0 && this.assignmentListData?.finance?.rate[0]?.rates) {
            this.assignmentListData?.finance?.rate[0]?.rates?.forEach(element => {
              if (element?.rate_factor.toLowerCase() === 'st') {
                this.assignmentListData = {
                  ...this.assignmentListData,
                  regular_billrate: this.accuracyPipe.transform(element.billrate, this.accuracyConfig.rate, { isEdit: true}),
                  regular_payrate: this.accuracyPipe.transform(element.payrate, this.accuracyConfig.rate, { isEdit: true}),
                  regular_vendor_rate: this.accuracyPipe.transform(element.vendor_rate, this.accuracyConfig.rate, { isEdit: true})
                }
              } else {
                this.assignmentListData = {
                  ...this.assignmentListData,
                  [`${element?.name?.toLocaleLowerCase()}_billrate`]: this.accuracyPipe.transform(element.billrate, this.accuracyConfig.rate, { isEdit: true}),
                  [`${element?.name?.toLocaleLowerCase()}_payrate`]: this.accuracyPipe.transform(element.payrate, this.accuracyConfig.rate, { isEdit: true}),
                  [`${element?.name?.toLocaleLowerCase()}_vendor_rate`]: this.accuracyPipe.transform(element.vendor_rate, this.accuracyConfig.rate, { isEdit: true})
                }
              }
            });
          }
          if(this.isLock) {
            this.lockMessage = this.assignmentListData?.assignment?.alerts?.message;
          }
        }
        this.loaderService.hide();
        this.showData = true;
      },
      error: (err) => {
        this.showData = true;
        this.loaderService.hide();
      }}));
  }
   getActionAllow(val : any)
  {
    this.isActionAllow = ((val?.can_add_budget || val?.can_add_projects || val?.can_close || val?.can_evaluate ||
    val?.can_extend || val?.can_temporary_access || val?.can_update || val?.can_update_rates || val?.can_tax_update || val?.can_tax_update_pending || val?.can_cancel ) && !Boolean(val?.is_action_dropdown_disabled));
  }
  getAssignmentDetails() {
    let url = `/assignment/programs/${this.programId}/assignment/${this.assignmentid}`;
    this.subscrptions.push(this.vendorService.get(url).subscribe(
      {next:(data: any) => {
        if (data?.data) {
          this.assignmentListData = {...this.assignmentListData, ...data?.data?.assignments};
          this.assignmentStatus = this.assignmentListData?.assignment?.status;
          const { is_available, request_sub_type } = this.assignmentListData?.pending_request || {};
          this.hasPendingRequest = is_available;
          this.updatePendingRequestStatus(data.data.assignments?.assignment);
          this.showApprovalTab = is_available && (request_sub_type === SubStatusTypes.PendingReview || request_sub_type === SubStatusTypes.PendingApproval);
          this.changeDetectorRef.detectChanges();
        }
        this.getActionAllow(data?.data?.assignments?.action_allow);
      },
      error: (err) => {
        
    }}));
  }

  updatePendingRequestStatus(assignment) {
    if(assignment?.status === ApprovalStatus?.pending && assignment?.approval_notify) {
      this.hasPendingRequest= true;
    } else if(assignment?.status === ApprovalStatus?.pending && this.assignmentListData?.pending_request?.request_type ==='create') {
      this.hasPendingRequest= true;
    } else if((assignment?.status === ApprovalStatus.pending) && assignment?.hasOwnProperty('approval_notify') && !assignment?.approval_notify) {
      this.hasPendingRequest= false;
    }
  }

  checkStatus(sub_status) {
    let name = undefined;
    if (sub_status === SubStatusTypes.PendingReview) {
      name = 'Review'
    } else if (sub_status === SubStatusTypes.PendingOnboarding) {
      name = 'Onboarding'
    } else if (sub_status === SubStatusTypes.PendingApproval) {
      name = 'Approval'
    } else {
      name = 'Approval'
    }
    return name;
  }


  shortAssignmentId(assignmentId = '') {
    if (assignmentId?.includes("AM-")) {
      assignmentId = assignmentId?.substr(assignmentId?.lastIndexOf("AM-"))
    }
    return assignmentId;
  }


  hasAssignmentActionAccess(permission = null) {
    const user_permission = this.storageService.get('user_permission');
    const requiredPermission = ["update_assignment", "close_assignment", "evaluate_assignment", "account_code_setup_action", "temporary_access","quick_tax_update"];
    const user = this.storageService.get('user');
    if (user?.is_superuser) {
      return true;
    }
    if (permission !== null) {
      return user_permission?.some(r => r === permission)
    }
    return user_permission?.some(r => requiredPermission?.indexOf(r) >= 0)
  }
  getBudjetDetails() {
    this.subscrptions.push(this.assignmentService.getBudgetDetails(this.programId, this.assignmentid).subscribe((data: any) => {
      this.budget = data.data.budget;
      this.changeDetectorRef.detectChanges()
    }));
  };
  getJobTemplateDetails() {
    if (this.jobTemplateId) {
      this.subscrptions.push(this.assignmentService.getJobTemplateDetails(this.programId, this.jobTemplateId).subscribe((data: any) => {
        if (data) {
          this.checkListID = data?.job_template?.checklist?.id;
          this.jobID = data?.job_template?.job_id;
        }
      }));
    }
  }

  toggleSection() {
    this.toggleContent = !this.toggleContent;
  }

  jobActions() {
    this.actionVisibility = !this.actionVisibility;
  }

  getPendingItem() {
    this.assignmentService.getAssignmentHistory(this.programId, this.assignmentId, this.pageNumber, this.limit).subscribe(
      {next:(res: any) => {
        this.pendingItem = undefined;
        if(res?.data && res?.data?.assignment) {
          this.pendingItem = res?.data?.assignment.find(({ status }) => status?.toLowerCase() === ApprovalStatus.pending);
        }
      },
      error: (err) => { }
    });
  }

  getPendingStatus() {
    this.pendingItem = undefined;
  }

  // optOut() {
  //   this.actionVisibility = false;
  // }

  // submitCandidate() {
  //   this.actionVisibility = false;
  // }

  // addSubmission() {
  //   this.actionVisibility = false;
  //   this.router.navigate(['/candidates/submit'], { queryParams: { candidateSubmission: true, jobId: 1, type: 'addThenSubmit' } });
  // }

  updateFormShow() {
    this.router.navigate([`/assignment/edit-assignment/${this.assignmentId}`])
  }

  getFieldValue(slug, value) {
    for (let i = 0; i < this.storageService.get(slug)?.length; i++) {
      let data = this.storageService.get(slug)[i]
      if (data?.id === value) {
        return data?.template_name
      }
    }
  }

  deepSearchItems(object, key, predicate) {
    let ret = [];
    if (object.hasOwnProperty(key) && predicate(key, object[key]) === true) {
      ret = [...ret, object];
    }
    if (Object.keys(object).length) {
      for (let i = 0; i < Object.keys(object).length; i++) {
        let value = object[Object.keys(object)[i]];
        if (typeof value === "object" && value != null) {
          let o = this.deepSearchItems(object[Object.keys(object)[i]], key, predicate);
          if (o != null && o instanceof Array) {
            ret = [...ret, ...o];
          }
        }
      }
    }
    return ret;
  }

  onSubmit(event) {
    this.loaderService.show();
    if (event['hierarchy_id']) {
      event['hierarchy_id'] = event['hierarchy_id'][0]
    }
    const customObject = this.deepSearchItems(this.config, 'source', (k, v) => v === 'CUSTOM');
    let foundational = [];
    let customData = [];
    if (customObject?.length > 0) {
      customObject?.forEach(custom => {
        if (custom?.slug) {
          let object = { key: custom.slug, value: event[custom?.slug] };
          if (custom?.source_type === 'foundational') {
            foundational.push(object);
          } else {
            customData.push(object);
          }
        }
      })
    }

    this.temp = {
      ...event,
      "foundational": foundational,
      "custom": customData,
      "original_start_date": event['worker_original_start_date'],
      "assignment_title": this.getFieldValue('assignment_title_uuid', event['assignment_title_uuid']),
      "tax": this.getDataById('taxes', event),
      "fee": this.getDataById('fees', event),
      "tax_type": "adjustment",
      "is_approval_workflow": this.is_approval_workflow,
      "is_account_required": this.is_account_required,
      "notes_for_approver": this.notes_for_approver
    }
    if (event?.impacted_timesheet_data?.length > 0) {
      let impacted_timesheets = [];
      event.impacted_timesheet_data.forEach(timesheet => {
        if (timesheet.selected && timesheet.is_enable) {
          impacted_timesheets.push(timesheet.timesheet_uuid);
        }
      });
      if (impacted_timesheets?.length > 0) {
        this.temp.impacted_timesheets = impacted_timesheets;
        delete this.temp['impacted_timesheet_data'];
      }
    }

    let rates = [];
    for (let index = 0; index < this.rateFactor.length; index++) {
      let element = this.rateFactor[index];
      const rateFactorObj = {
        rate_factor: this.rateFactorAbbrivation.get(element)
      };
      if (element !== 'st') {
        if (this.temp.hasOwnProperty(`${element}_billrate`)) {
          rateFactorObj['billrate'] = this.accuracyPipe.transform(this.temp[`${element}_billrate`], this.accuracyConfig.rate, { isEdit: true});
          rateFactorObj['payrate'] = this.accuracyPipe.transform(this.temp[`${element}_payrate`], this.accuracyConfig.rate, { isEdit: true});
          rateFactorObj['vendor_rate'] = this.accuracyPipe.transform(this.temp[`${element}_vendor_rate`], this.accuracyConfig.rate, { isEdit: true});
          rates.push(rateFactorObj);
        }
      } else if (element === 'st') {
        rateFactorObj['billrate'] = this.accuracyPipe.transform(this.temp['regular_billrate'], this.accuracyConfig.rate, { isEdit: true});
        rateFactorObj['payrate'] = this.accuracyPipe.transform(this.temp['regular_payrate'], this.accuracyConfig.rate, { isEdit: true});
        rateFactorObj['vendor_rate'] = this.accuracyPipe.transform(this.temp['regular_vendor_rate'], this.accuracyConfig.rate, { isEdit: true});
        rates.push(rateFactorObj);
      }

    }

    this.temp['rate'] = [{ rates }];
    this.onSave();
  }
  getDataById(id: string, data) {
    for (let tab of this.config?.config?.nav_tabs) {
      for (let group of tab.field_groups) {
        for (let field of group.fields) {
          if (field.group_type) {
            if ((field.group_type === 'ARRAY') || (field.group_type === 'FOOTER_ARRAY')) {
              
            } else if ((field.group_type === "TABLE") || (field.group_type === "DISPLAY_TABLE")) {
              if (group?.id === id) {
                let temp: Tax[] = [];
                for (let { index, row } of field?.row.map((row, index) => ({ index, row }))) {
                  let tempData: Tax = {}
                  tempData.entity_name = row?.id
                  for (let col of field?.fields[index]) {
                    if (col?.id === 'types') {
                      tempData.amount_type = this.getValuekey(col?.slug, data)
                    }
                    if (col?.id === 'value') {
                      tempData.amount_value = this.getValuekey(col?.slug, data)
                    }
                    if (col?.id === 'applicable_on') {
                      tempData.applicable_on = this.getValuekey(col?.slug, data)
                    }
                  }
                  temp.push(tempData)
                }
                return temp;
              }
            }
          } else {
          }
        }
      }
    }
  }
  getValuekey(key: string, data) {
    let keys = key.split('.')
    if (keys.length > 1) {
      keys.forEach(k => {
        data = data[k]
      })
    } else {
      data = data[key]
    }
    return data
  }
  getDetails(event) {
    if (event) {
      this.getAssignmentList();
    }
  }

  convertDateFormat(dateString: string) {
    const dateFormat= this.assignmentService.getDefaultDateFormat();
    if (!dateString) {
      return;
    }
    let date, month, year, dateArray, formatArray;
    if (dateString.includes('-')) {
      dateArray = dateString.split('-');
      formatArray = dateFormat.split('-');

    } else if (dateString.includes('/')) {
      dateArray = dateString.split('/');
      formatArray = dateFormat.split('/');
    }

    if (dateFormat.includes('-')) {
      formatArray = dateFormat.split('-');

    } else if (dateFormat.includes('/')) {
      formatArray = dateFormat.split('/');
    }

    for (let index = 0; index < formatArray.length; index++) {
      const abb = formatArray[index];
      if (abb.toLowerCase().includes('mm')) {
        month = dateArray[index];
      } else if (abb.toLowerCase().includes('yy')) {
        year = dateArray[index];
      } else if (abb.toLowerCase().includes('dd')) {
        date = dateArray[index];
      }
    }
    return `${year}-${month}-${date}`
  }

  onDateSubmit(event) {
    if(event){
      event.start_date= this.convertDateFormat(event?.start_date);
      event.end_date=this.convertDateFormat(event?.end_date);
    }
    this.loaderService.show();
    this.subscrptions.push(this.assignmentService.updateAssignmentDetails(this.programId, this.assignmentid, event).subscribe(
      {next:(data: any) => {
      if (data?.code === 200) {
        this.getAssignmentList();
        this.getBudjetDetails();
        this.alertService.success('Assignment updated successfully!');
        this.isUpdateAssignment = false;
        this.loaderService.hide();
        this.eventStream.emit(new EmitEvent(Events.UPDATE_ASSIGNMENT_DURATION, false));
      }
    }, error: (err) => {
      this.loaderService.hide();
      this.error = err?.error?.error?.errors[0]?.message || errorHandler(err);
      // this.alertService.error(errorHandler(err));
    }}))
  }

  onSave() {
    this.subscrptions.push(this.assignmentService.updateAssignmentDetails(this.programId, this.assignmentid, this.temp).subscribe({next:(data: any) => {
      if (data?.code === 200) {
        this.getAssignmentList();
        this.getBudjetDetails();
        this.alertService.success('Assignment updated successfully!');
        this.isUpdateAssignment = false;
        this.loaderService.hide()
      }
    }, error: (err) => {
      this.loaderService.hide();
      if (err?.error?.error?.errors?.length > 0 && err.error.error.errors[0]?.message) {
        this.alertService.error(err.error.error.errors[0].message);
      } else if (err?.error?.error?.message) {
        this.alertService.error(err.error?.error.message)
      } else {
        this.alertService.error(errorHandler(err));
      }
      //  this.alertService.error(errorHandler(err.error.data[0].message), { type: { INTERVAL_TIME: 5000 } })
    }}));
  }

  // getPickListData() {
  //   this.assignmentService.getPickListData(this.programId).subscribe(data => {
  //     if (data) {
  //       for (let d of data?.picklists) {
  //         if (d?.name === 'Evaluation type') {
  //           this.evaluationId = d?.id
  //         } else if (d?.name === 'termination_request_reasons') {
  //           this.terminationId = d?.id
  //         }
  //       }
  //     }
  //   })
  // }


  getEvaluationList(programID) {
    let reasonArray = [];
    let reasoncode;
    this.subscrptions.push(this.assignmentService.getReasonCodeAction(programID).subscribe((reason: any) => {
      if (reason) {
        reasonArray = reason.reason_code_actions;
        reasonArray.forEach(item => {
          if (item?.code?.toUpperCase() === 'REQUEST_EVALUATION' && item?.entity_ref?.toUpperCase() === 'ASSIGNMENTS') {
            reasoncode = item.id;
            this.getEvaluationCode(programID, reasoncode);
          }
        })
      }
    }));
  }

  getAproversList(requestType: PendingItemTypes) {
    this.canApprove = false;
    this.subscrptions.push(this.assignmentService.getApproversList(
      this.programId, this.assignmentId, requestType
    ).subscribe(res => {
      if (res) {
        this.approversList = res;
        if (this.approversList.pending_approvals > 0) {
          const pendingLevel = this.approversList.approvers.find(approver =>
            approver?.status?.toLowerCase() === ApprovalStatus.pending);
          this.canApprove = pendingLevel?.members.find(member => member.id === this.userId)?.is_approval_allowed;
        }
      }
    }));
  }

  getEvaluationCode(programID, reasoncode) {
    this.subscrptions.push(this.assignmentService.getEvaluationListItems(programID, reasoncode).subscribe({next:(data: ReasonCodeResponce) => {
      if (data) {
        this.evaluationItems = data.reason_codes;
        this.evaluationItems.forEach(element => {
          this.evaluationVisualData[element.id] = -1;
        });
        this.checkRatings();
      }
    }, error: (err)=> {
    }}))
  }

  checkRatings() {
    let valueList = this.assignmentListData?.assignment?.evaluation?.score_list || [];
    if (this.assignmentListData?.evaluation !== null) {
      for (let valuedata of valueList) {
        for (let dataItem of this.evaluationItems) {
          if (valuedata.evaluation_type == dataItem.id) {
            valuedata['name'] = dataItem?.name;
            this.evaluationVisualData[valuedata.evaluation_type] = valuedata.evaluation_score;
          }
        }
      }
    }
  }
  onBackClick(event) {
    this.isUpdateAssignment = false
  }

  onReviewClick(event) {

  }

  onClickCreateBtn(event) {

  }

  getDropDownData(event) { }

  openExtension() {
    this.router.navigate([`/assignment/edit-assignment/${this.assignmentId}`], { queryParams: { update_for: 'date' } });
  }

  openRateChange() {
    this.router.navigate([`/assignment/edit-assignment/${this.assignmentId}`], { queryParams: { update_for: 'rate' } });
  }

  openTaxUpdate() {
    this.router.navigate([`/assignment/edit-assignment/${this.assignmentId}`], { queryParams: { update_for: 'tax' } });
  }

  openTermination(type?) {
    this.actionType = type ? type : 'close';
    this.actionVisibility = false;
    this.isTerminate = 'visible';
  }

  onCloseTermination(event) {
    this.isTerminate = event
    this.getAssignmentList();
    this.getBudjetDetails();
    if (this.assignmentStatus?.toLowerCase() === 'pending') {
      this.eventStream.emit(new EmitEvent(Events.RELOAD_ONBOARDING, true));
    }
  }

  openEvalution() {
    this.actionVisibility = false;
    this.isEvalution = 'visible';
  }

  onCloseEvalution(event) {
    if (event) {
      this.getAssignmentList();
      this.getBudjetDetails();
    }
    this.isEvalution = 'hidden'

  }

  openBudgetPending() {
    const queryParams = this.activatedRoute?.snapshot?.queryParams || {};
    if (this.assignmentListData.pending_request?.request_type === PendingItemTypes.AdditionalBudget) {
      this.openBudgetPanel = false;
      this.activeTab = 'budget';
      this.eventStream.emit(new EmitEvent(Events.ADD_ADDITIONAL_BUDGET,true));
      this.router.navigate([], { queryParams: { ...queryParams, tab: 'budget', openPanel: true , openTimesheetListTab : false } });
    } else if (this.assignmentListData.pending_request?.request_sub_type === SubStatusTypes.PendingOnboarding) {
      this.activeTab = 'onboarding';
      this.router.navigate([], { queryParams: { ...queryParams, tab: 'onboarding', openPanel: true , openTimesheetListTab : false } });
    } else {
      this.activeTab = 'approval'; // review and  approval
      this.router.navigate([], { queryParams: { ...queryParams, tab: 'approval' , openTimesheetListTab : false } });
    }
  }

  approveAssignment() {
    this.actionVisibility = false;
    let temp = {
      status: "approved",
      modified_by: this.userId,
      modified_on: this.datepipe.transform(new Date(), 'y-M-dd h:m:s')
    }
    this.loaderService.show()
    this.subscrptions.push(this.assignmentService.approveAssignment(this.programId, this.assignmentid, temp).subscribe({next:(data: any) => {
      this.loaderService.hide()
      this.getAssignmentList();
      this.alertService.success('')
    }, error: (err) => {
      this.loaderService.hide()
      this.alertService.error(errorHandler(err))
    }}));
  }

  // getFormattedDate(date) {
  //   let formattedDate = '';
  //   if (date) {
  //     const parsedDate = new Date(date);
  //     date = date?.split(' ');
  //     let onlyDate = date?.length > 0 ? date[0] : "";
  //     let allDate = onlyDate?.split('-');
  //     if (allDate?.length === 3) {
  //       let month = parsedDate?.toLocaleString('default', { month: 'long' });
  //       formattedDate = `${month} ${allDate[2]}, ${allDate[0]}`;
  //     }
  //   }
  //   return formattedDate;
  // }

  getFormattedDate(date) {
    if (date) {
      return this.datePipe.transform(getDateFromString(date));
    }
  }

  onSubmitAccess(payload) {
    this.logs=undefined;
    this.subscrptions.push(this.vendorService.put(`/assignment/programs/${this.programId}/assignment/${this.assignmentId}/temporary-access`, [payload])
      .subscribe({next:(res: any) => {
        const { message } = res;
        this.alertService.success(message);
        this.getAssignmentList();
        this.emitLogs(this.logs);

      }, error: (err) => {
        let logs=this.showError(err?.error?.error?.errors[0]?.message);
        this.emitLogs(logs);
      }}));
  }

  ngOnDestroy(): void {
    this.subscrptions.forEach(sub => sub.unsubscribe());
  }

  temporaryAcccess() {
    this.eventStream.emit(new EmitEvent(Events.TEMPORARY_ACCESS, {status: this.assignmentListData?.assignment?.status, temporary_access: this.assignmentListData?.assignment?.temporary_access, access: true}));
  }

  navigateToAccountCodeSetup() {
    this.router.navigate(['/setup/account-codes'], { queryParams: { assignmentId: this.assignmentId, workerId: this.assignmentListData?.worker?.user?.id } });
  }
  get disableOnboarding() {

    return this.programDetails?.config?.is_onboading_disabled
  }

  navigateToActivityBasedPricing() {
    this.router.navigate(['/assignment/activity'],{ queryParams: { assignmentId: this.assignmentId} });
  }
  
  navigateBack() {
    const { sow } = this.assignmentListData;
    let sowId = null;
    let sowProjectId = null;
    this.activatedRoute.queryParams.subscribe(params => {
       sowId = params['sow_id'];
       sowProjectId = params['project_id'];
    });
    const isVendor = this.user_type === 'vendor';
    let url = '';
     if(this.redirectToSow === SOW_TYPE.PROJECT) {
     url =  `${isVendor ? '/vendor_sow/' : '/sow/'}${sowId || sow?.id}${isVendor ? '/vendor_milestones/' : '/milestones/'}${sowProjectId || sow?.project?.id}/resources`
     } else if(this.redirectToSow === SOW_TYPE.SOW) {
      url =  `${isVendor ? '/vendor_sow/' : '/sow/'}${sowId || sow?.id}/resourceassignment`
     } else {
      url = '/assignment/all-list'
     }
    // const url = this.redirectToSow ?
    //   `${isVendor ? '/vendor_sow/' : '/sow/'}${sow?.id}${isVendor ? '/vendor_projects/' : '/projects/'}${sow?.project?.id}/resources`
    //   : '/assignment/all-list';
    //   console.log('redirect to is nowowww', this.redirectTo);
    //     this.router.navigate([this.redirectTo]);
      // const url = this.redirectToSow ?
      // `${isVendor ? '/vendor_sow/' : '/sow/'}${sow?.id}${isVendor ? '/vendor_projects/' : '/projects/'}${sow?.project?.id}/resources`
      // : '/assignment/all-list';
    this.router.navigate([url]);
  }

  showError(err) {
    this.logs = {
      type: LOG_TYPE.ERROR, heading: err?.error?.error?.message ? err?.error?.error?.message : (typeof err == 'string' ? err : ''), messages: [], autoClose: true, isShown: true, showReportButton: (err?.status == 500 || err?.status == 400), additionalInfo: { trace_id: err?.error?.trace_id }
    };
    return this.logs;
  }
  emitLogs(logs) {
    this.eventStream.emit(new EmitEvent(Events.SHOW_SPECIAL_TEMPRORY_ACCESS_LOGS, logs));
    this.logs = undefined;
  }

  getProgramAssigmentConfig() {
    this._formRendererService.get(`/configurator/programs/${this.programId}/config?entity_code=assignment_setting`).subscribe(res => {
      const { config } = res;
      this.assignmentConfig = config;if(this.assignmentConfig?.hasOwnProperty('effective_date_wise') && this.assignmentConfig?.effective_date_wise?.is_allow){
        this.isEffectiveDateSetting = this.assignmentConfig?.effective_date_wise?.options?.find(res => res?.key === 'allow_view');
       }
       this.getAssignmentList();
    });
  }
  taskUpdated($event) {
    if($event && this.assignmentStatus?.toLowerCase() === 'pending') {
      this.getAssignmentList();
    }
  }

  getAssignmentLockStatus(lockObj) {
    this.isLock = lockObj.lockStatus;
    this.lockMessage = lockObj.message;
  }

  
  showDetailTooltip() {
    const metabox = document.querySelector(".detail-meta .updated").getBoundingClientRect();
    const targettooltip = document.querySelector(".meta-tooltip");
    if(targettooltip) {
      targettooltip.setAttribute('style', 'left:' + metabox.left + 'px; top:' + metabox.top + 'px');
      this.assignmentMetaTooltip = true;
    }
  }

  hideDetailTooltip() {
    this.assignmentMetaTooltip = false;
  }
  getVendorDetails() {
    let ORGANIZATION_ID = this.storageService.get(StorageKeys.ORGANIZATION_ID);
    let url =  `/configurator/programs/${this.programId}/vendors/${ORGANIZATION_ID}`;
    this.assignmentService.get(url).subscribe(
      {next: (data: any) => {
        if (data) {
           this.vendorDetails = data?.program_vendor

        }
      },
      error: (error) => {
        // this.alert.error(error);
        // this._loader.hide();
      }
    });
  }
}
