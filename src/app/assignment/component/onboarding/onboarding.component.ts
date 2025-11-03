import { Component, Input, OnInit , Output , EventEmitter,  ChangeDetectorRef, HostListener } from '@angular/core';
import { VMSConfig } from 'src/app/library/smartTable/table/table.model';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { EventStreamService, Events, EmitEvent } from 'src/app/core/services/event-stream.service';
import { AssignmentService } from '../../assignment.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { ChecklistResponce, Tasks } from '../../assignment.model';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { Log, LOG_TYPE } from 'src/app/library/logs/logs.model';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { UsersType } from 'src/app/shared/enums';
import { Subscription } from 'rxjs';
import { AuthorizationService } from 'src/app/core/services/authorize.service';

@Component({
  selector: 'app-onboarding',
  templateUrl: './onboarding.component.html',
  styleUrls: ['./onboarding.component.scss']
})
export class OnboardingComponent implements OnInit {
  @Input() checkListID;
  @Input() assignmentID;
  @Input() workerID;
  _jobTemplateID: any;
  logs:Log= undefined;
  isOnboardingReview: boolean = false;
  isMsp : boolean;
  private subscriptions: Subscription[] = [];
  onboardingReviewerName: any;
  onboardingReviewTime: any;
  completedStatus: boolean = true;
  vendor_details: any;
  assignment_details: any;
  @Input() set jobTemplateID(data) {
    if (data) {
      this._jobTemplateID = data;
      this.onboardingListing();
      this.getQualificationTypes();
    }
  };
  get jobTemplateID() {
    return this._jobTemplateID;
  }
  @Input() assignmentStatus;
  @Input('vendorDetails') set vendorDetail(value:any) {
    if(value) {
      this.vendor_details = value;
    }
}
@Input('assignmentData') set assignmentData(value:any) {
  if(value) {
    this.assignment_details = value;
  }
}
  onboardingList: Tasks[] = [];
  onboardingData: ChecklistResponce;
  totalRecords = 0;
  itemPerPage = 1;
  public tableConfig: VMSConfig;
  public tableLoaded = false;
  dataLoading = false;
  programId: any;
  checkListId: any;
  searchKey = '';
  taskDetails = 'hidden'
  selectedTask: Tasks;
  credentialArr = [];
  currentTaskId = '';
  onboardingStatus = '';
  hello_sign_email_status = '';
  time_zone:any;
  @Output() updatedStatus = new EventEmitter();
  public noOnboarding: boolean = true;
  actionDropdownBox: boolean = false;
  selectedTaskData: any;
  public accountDetails = this.storageService.get('account');
  constructor(
    private loaderService: LoaderService,
    private eventStream: EventStreamService,
    private assignmentService: AssignmentService,
    private storageService: StorageService,
    private localDateFormatPipe : LocalDateFormatPipe,
    private changeDetectorRef: ChangeDetectorRef,
    private alertService: AlertService,
    private authorizationService: AuthorizationService
  ) { }

  ngOnInit(): void {
    this.noOnboarding = false;
    let programDetails = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.programId = programDetails['id'];
    this.isOnboardingReview = programDetails.config?.is_onboarding_review_required;
    let userType=this.storageService.get(StorageKeys.USER_TYPE);
    this.isMsp = userType.toUpperCase() === UsersType.MSP;
    this.subscriptions.push(this.eventStream.on(Events.RELOAD_ONBOARDING).subscribe((data) => {
      if (data) {
        this.onboardingListing();
      }
    }));
    this.tableConfig = {
      title: 'Onboarding Lists',
      columnList: [
        { name: 'name', title: 'Task Name', width: 20, isIcon: false, isImage: true, isContact: false, isNumberBadge: false, isNoOption: true },
        { name: 'status', title: 'Status', width: 15, isIcon: true, isImage: false, isContact: false, isNumberBadge: false },
        { name: 'start_date', title: 'Start Date', width: 12, isIcon: false, isImage: false, isContact: false, isNumberBadge: false, isNoOption: true },
        { name: 'due_date', title: 'Due Date', width: 13, isIcon: false, isImage: false, isContact: false, isNumberBadge: false, isNoOption: true },
        // { name: 'dependent_task', title: 'Dependency', width: 10, isIcon: false, isShowCheckBox: true, isCheckBoxReadonly: true, isImage: false, isContact: false, isNumberBadge: false, enableClick: false },
        // { name: 'dependent_task.name', title: 'Dependency Task', width: 15, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
        { name: 'actor', title: 'Actor', width: 15, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },

      ],
      isSort: true,
      isFilter: false,
      isSearch: false,
      isSetting: false,
      isTopPagination: true,
      isCreate: false,
      density: 'COMFORTABLE',
      isIdDifferent: false,
      tableWidth: "100%",
    };
    // this.getQualificationTypes();
    this.time_zone = new Date()
    .toTimeString()
    .slice(19, new Date().toTimeString()?.length - 1)
    .split(' ')
    .map(a => a.slice(0, 1))
    .join('');
  }

  onboardingListing(page = 1) {
    this.logs= undefined;
    let programDetails = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.programId = programDetails['id'];
    if (this._jobTemplateID) {
      const pagination = `job_template_id=${this._jobTemplateID}&page=${page}&limit=${this.itemPerPage}`;
      this.loaderService.show();
      this.dataLoading = true;
      this.assignmentService.getOnBoardingDetails(this.programId, this.assignmentID, this.workerID, pagination).subscribe({
        next: (data: any) => {
          this.processResponse(data);
          this.eventStream.emit(new EmitEvent(Events.REVIEW_SUBMIT , {} ));
        },
        error: (err: any) => {
          // this.processResponse(err);
          // this.alert.error(errorHandler(err));
          this.logs = { type: LOG_TYPE.ERROR, heading: errorHandler(err),  autoClose: true, isShown: true, showReportButton: err?.status == 500 || err?.status == 404, additionalInfo:{trace_id: err?.error?.trace_id } };
          this.loaderService.hide();
          this.dataLoading = false;
        }
      })
    }
  }

  processResponse(data) {
    if (data) {
      this.dataLoading = false;
      this.onboardingData = data;
      this.onboardingList = data?.tasks;
      this.onboardingReviewerName = data?.onboarding_reviewer_name;
      this.onboardingReviewTime = data?.onboarding_review_time;
      this.onboardingStatus =  this.snakeCaseToTitle(data?.status);
      this.tableConfig.title = `Onboarding Lists ${this.onboardingStatus ? '(' + this.snakeCaseToTitle(this.onboardingStatus) + ')' : ''}`;
      this.completedStatus = true;
      this.onboardingList?.forEach((element: any) => {
        if (element) {
          this.completedStatus = this.completedStatus && (element?.status?.toLowerCase() === 'completed');
          const canUserEditTask = this.canUserEditTask(element);
          element.isAction = (this.authorizationService.authorize('reopen_onboarding_task') && (element?.status?.toLowerCase() == 'reopened' || element?.status?.toLowerCase() == 'completed')) || (canUserEditTask && element?.status?.toLowerCase() == 'reopened');
          const isActionNotAllowed = (element?.status?.toLowerCase() == 'completed' && element?.task_type?.toUpperCase() == "SIGN_DOCUMENT")
          || (element?.status?.toLowerCase() == 'completed' && this.onboardingStatus == "completed" && this.assignmentStatus?.toLowerCase() == "closed")
          if(isActionNotAllowed) {
            element.isAction = false;
          }
          element.status = this.snakeCaseToTitle(element.status);
          element.due_date = element.due_date ? element.due_date : element.due_date;
          element.start_date = element.start_date ? element.start_date : element.start_date;
          element.actor= element?.roles;
          element.showAllValues = false;
        }
      });
      this.totalRecords = data?.total_records;
      this.tableLoaded = true;
      this.itemPerPage = 10;
      if(this.completedStatus || this.onboardingStatus.toLowerCase() === 'reviewd') {
        this.updatedStatus.emit(true);
      }
      this.loaderService.hide();
    }
  }
  getActorValue(i) {
    this.onboardingList[i]['showAllValues'] = true;
  }

  canUserEditTask = (element: any): boolean => {
    let canUserEditTask: boolean = false;
    if (this.accountDetails?.organization?.category == UsersType.SUPER_ORG) canUserEditTask = true;
    else {
      if (element.roles?.length > 0) {
        canUserEditTask = element.roles.some(role => role.name?.toLowerCase() == this.accountDetails?.role?.name?.toLowerCase() && role?.organization_category?.toLowerCase() == this.accountDetails?.organization?.category?.toLowerCase());
      }
      else {
        canUserEditTask =
          (element?.role?.name?.toLowerCase() == this.accountDetails?.role?.name?.toLowerCase() &&
            element?.role?.organization_category?.toLowerCase() == this.accountDetails?.organization?.category?.toLowerCase()) ||
          element?.role?.name?.toLowerCase() == '';
      }
    }
    return canUserEditTask;
  }

  snakeCaseToTitle(snakeCaseString) {
    if (!snakeCaseString) {
      return '';
    }
    snakeCaseString = snakeCaseString?.toLowerCase()?.split('_');
    for (let i = 0; i < snakeCaseString?.length; i++) {
      snakeCaseString[i] = snakeCaseString[i][0]?.toUpperCase() + snakeCaseString[i]?.slice(1);
    }

    return snakeCaseString.join(' ');
  }
  onPaginationClick(e) {
    this.onboardingListing(e);
  }

  onClickView(e) {
    // if(e.dependent_task && !e.dependent_task?.updated_documents ){
    //   return false;
    // }
    this.selectedTask = undefined;
    this.selectedTask = e;
    this.taskDetails = 'visible';
    this.currentTaskId = e.id;
    this.hello_sign_email_status = e?.hello_sign_email_status ?? '';
    this.eventStream.emit(new EmitEvent(Events.UPDATE_TASK_ID, { taskId: this.currentTaskId, hello_sign_email_status: e?.hello_sign_email_status }));
  }

  onSortClick(e) {

  }
  onSearch(e) {
    this.searchKey = e
    this.onboardingListing()
  }

  onCloseTaskDetails(event) {
    if (event) {
      this.onboardingListing()
    }
    this.taskDetails = 'hidden';
    this.selectedTask = undefined;
  }
  getQualificationTypes() {
    this.assignmentService.getQualificationTypes(this.programId).subscribe({
      next: (data1: any) => {
        this.logs= undefined;
        if (data1 && data1?.qualification_types?.length > 0) {
          this.assignmentService.getCredentialsQualification(this.programId, data1?.qualification_types[0]?.id).subscribe({
            next: (data2: any) => {
              if (data2) {
                this.credentialArr = data2?.qualifications;
              }
            },
            error: (err) => {
              this.logs = { type: LOG_TYPE.ERROR, heading: errorHandler(err),  autoClose: true, isShown: true, showReportButton: err?.status == 500 , additionalInfo:{trace_id: err?.error?.trace_id } };
              // this.alert.error(errorHandler(err));
            }
          });
        }
      },
      error: (err) => {
        this.logs = { type: LOG_TYPE.ERROR, heading: errorHandler(err),  autoClose: true, isShown: true, showReportButton: err?.status == 500 , additionalInfo:{trace_id: err?.error?.trace_id } };
        // this.alert.error(errorHandler(err));
      }
    });
  }

  getFormatDate(date){
    let newDate = this.getDateTime(date);
    return `${newDate}`;
  }


  getDateTime(d, format?:string) {
    format= format || this.assignmentService.getDefaultDateFormat()+ " hh:mm:ss a z";
    let t = new Date(d * 1000).toISOString();
    return this.localDateFormatPipe.transform(`${t}`);
  }

  showOnboardingReview($event) {
    if($event) {
    this.eventStream.emit(new EmitEvent(Events.REVIEW_ONBOARDING , {assignmentId : this.assignmentID , candId : this.workerID , value : true } ));
    }
  }

  actionButtonClick(event) {
    const actionPosition = event.target.getBoundingClientRect();
    const recordPopup = document.getElementById("actionDropdownList");
    recordPopup.style.top = (actionPosition.top + 40) + "px";
    recordPopup.style.left = (actionPosition.left) + "px";
    recordPopup.setAttribute("data-value", recordPopup.style.top);
    this.actionDropdownBox = true;
  }

  hideActionButton() {
    this.actionDropdownBox = false;
    document.getElementById("actionDropdownList").removeAttribute('data-value');
  }

  @HostListener('window:scroll', []) onWindowScroll() {
    const actionActiveItem = document.getElementById("actionDropdownList").getAttribute('data-value');
    if(actionActiveItem) {
      const actionTop = actionActiveItem.replace('px', '');
      const actionPosition = (~~actionTop) - window.pageYOffset;
      const recordPopup = document.getElementById("actionDropdownList");
      recordPopup.style.top = actionPosition + 'px';
      this.changeDetectorRef.detectChanges();
    }
  }

  reopenTask(taskDetails) {
    const payload = {
      status: "REOPENED"
    }
    this.loaderService.show();
    this.assignmentService.updateTaskDetails(this.programId, this.assignmentID, this.workerID, taskDetails?.id, payload).subscribe({
      next: (res) => {
        this.alertService.success("Onboarding reopened successfully.");
        this.onboardingListing();
      },
      error: (err) => {
        this.loaderService.hide();
        this.alertService.error(err?.error?.error?.message);
      }
    }
    )
  }

  editTask(taskDetails) {
    this.onClickView(taskDetails);
  }

  selectTask(onBoardingTaskData) {
    this.selectedTaskData = onBoardingTaskData;
    this.selectedTaskData.status = this.selectedTaskData?.status?.toLowerCase();
  }

  ngOnDestroy(): void {
    this.subscriptions?.forEach(sub => sub.unsubscribe());
   }
}
