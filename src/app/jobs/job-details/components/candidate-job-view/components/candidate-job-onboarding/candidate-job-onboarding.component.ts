import { Component, OnInit , ChangeDetectorRef, HostListener} from '@angular/core';
import { VMSConfig } from 'src/app/library/smartTable/table/table.model';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { EmitEvent, Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { ChecklistResponce, Tasks } from 'src/app/assignment/assignment.model';
import { AssignmentService } from 'src/app/assignment/assignment.service';
import { JobDetailsService } from 'src/app/jobs/job-details/job-details.service';
import { ActivatedRoute, } from '@angular/router';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { LocalDateTimeFormatPipe } from 'src/app/shared/pipe/local-date-time-format.pipe';
import { Subscription } from 'rxjs';
import { UsersType } from 'src/app/shared/enums';
import { AuthorizationService } from 'src/app/core/services/authorize.service';
@Component({
  selector: 'app-candidate-job-onboarding',
  templateUrl: './candidate-job-onboarding.component.html',
  styleUrls: ['./candidate-job-onboarding.component.scss']
})
export class CandidateJobOnboardingComponent implements OnInit {
  statusDropdwon = false;
  public dataLoader: any;
  public vmsData: any;
  public tableConfig: VMSConfig;
  public isExpand = false;
  public totalPages = 0;
  public totalRecords = 0;
  credentialArr = [];
  programId: any;
  jobId:any;
  gridContentType = 'candidate';
  tableLoaded:boolean = false;
  currentProgram: any = {}
  dataLoading = false;
  itemPerPage = 10;
  public viewGrid: boolean = true;
  public gridVewJson: any = {};
  _jobTemplateID: any;
  onboardingData: ChecklistResponce;
  onboardingList: Tasks[] = [];
  currentTaskId = '';
  onboardingStatus = '';
  searchKey = '';
  taskDetails = 'hidden';
  selectedTask: Tasks;
  CandidateId: any;

  template='';
  public noOnboarding: boolean = true;
  public loading: boolean = true;
  visibleIndices = new Set<number>();
  time_zone:any;
  userType:any;
  isOnboardingReview: boolean = false;
  onboardingReviewerName;
  onboardingReviewTime;
  completedStatus : boolean;
  private subscriptions: Subscription[] = [];
  actionDropdownBox: boolean = false;
  selectedTaskData: any;
  public accountDetails = this.storageService.get('account');
  assignment_status;
  constructor( private _eventStrem: EventStreamService,
    private storageService: StorageService,
    private loaderService: LoaderService,
    private assignmentService: AssignmentService,
    private eventStream: EventStreamService,
    private jobDetailService: JobDetailsService,
    private route: ActivatedRoute,
    private alert: AlertService,
    private localDateTimeFormatPipe : LocalDateTimeFormatPipe,
    private changeDetectorRef: ChangeDetectorRef,
    private authorizationService: AuthorizationService
    ) {}

  ngOnInit(): void {
    this.noOnboarding = false;
    this.loading = true;
    this.route.parent?.params.subscribe(params => {
      this.jobId = params['id'];
      this.currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
      this.userType=this.storageService.get(StorageKeys.USER_TYPE);
      this.CandidateId = params['candidateId'];
    });
    const programDetails = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.programId = programDetails['id'];
    this.getCandidateDetailsById();
    this.tableConfig = {
      title: 'On Boarding',
      columnList: [
        { name: 'name', title: 'Task Name', width: 10, isIcon: false, isImage: true, isContact: false, isNumberBadge: false },
        { name: 'status', title: 'Status', width: 10, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
        { name: 'start_date', title: 'Start Date', width: 15, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
        { name: 'due_date', title: 'Due Date', width: 15, isIcon: false, isImage: false, isContact: false, isNumberBadge: true },
        { name: 'dependency', title: 'Dependency', width: 10, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
        { name: 'dependency_task', title: 'Dependency Task', width: 18, isIcon: false, isImage: false, isContact: false, isNumberBadge: true },
        { name: 'actor', title: 'Actor', width: 10, isIcon: false, isImage: false, isContact: false, isNumberBadge: false, isCandidateStatus: false }
      ],
      isExpand: false,
      isFilter: true,
      isSearch: true,
      isSetting: true,
      isTopPagination: false,
      hideResultCount: true,
      isCreate: true,
      density: 'COMFORTABLE',
      isTheme: true,
      tableWidth: '100%',
      // advanceFilter: [
      //   { name: 'availability', title: 'Availability', filterType: 'DATERANGE'},
      //   { name: 'est_pay', title: 'Estimated Pay Rate', filterType: 'DATERANGE'},
      //   { name: 'modified_on', title: 'Date Updated range', filterType: 'DATERANGE'},
      //  ]
    };
   // this.onboardingListing();
    this.getQualificationTypes();

    this.time_zone = new Date()
      .toTimeString()
      .slice(19, new Date().toTimeString().length - 1)
      .split(' ')
      .map(a => a.slice(0, 1))
      .join('');

    this.subscriptions.push(this.eventStream.on(Events.RELOAD_ONBOARDING).subscribe((data) => {
      if (data) {
        this.onboardingListing();
      }
    }))
      this.isOnboardingReview = this.currentProgram.config?.is_onboarding_review_required;
  }

  getJobDetails(jobid,page=1) {
    if (jobid) {
      this.jobDetailService.getJobs(`${jobid}`).subscribe(data => {
        if (data) {
          let jobData :any = data?.job;
          this.template =jobData?.template
            this.jobDetailService.getOnBoardingDetails(this.programId, this.jobId, this.CandidateId,jobData?.template).subscribe({
              next: (data) => {
              this.noOnboarding = false;
              this.loading = false;
              this.processResponse(data);
            },
            error: (error) => {
              this.alert.error(errorHandler(error));
              this.noOnboarding = true;
              this.loading = false;
            }});
        }
      })
    }
  }

  getFormatDate(date){
    let newDate = this.getDateTime(date);
    return `${newDate}`;
  }

  getDateTime(d) {
    let t = new Date(d * 1000).toISOString();
    return this.localDateTimeFormatPipe.transform(`${t}`);
  }

  onboardingListing(page = 1) {
    this.template=this.storageService.get('viewd_job')?.template;
      this.jobDetailService.getOnBoardingDetails(this.programId, this.jobId, this.CandidateId,this.template).subscribe({
        next: (data) => {
        this.noOnboarding = false;
        this.loading = false;
        this.processResponse(data);
      },
      error: (error) => {
        this.noOnboarding = true;
        this.loading = false;
      }});
  }

  processResponse(data) {
    if (data) {
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
          const canUserEditTask = this.canUserEditTask(element)
          element.isAction = (this.authorizationService.authorize('reopen_onboarding_task') && (element?.status?.toLowerCase() == 'reopened' || element?.status?.toLowerCase() == 'completed')) || (canUserEditTask && element.status?.toLowerCase() == 'reopened');
          const isActionNotAllowed = (element?.status?.toLowerCase() == 'completed' && element?.task_type?.toUpperCase() == "SIGN_DOCUMENT")
          || (element?.status?.toLowerCase() == 'completed' && this.onboardingStatus?.toLowerCase() == "completed" && this.assignment_status?.toLowerCase() == "closed");
          if(isActionNotAllowed) {
            element.isAction = false;
          }
          element.status = this.snakeCaseToTitle(element.status);
          element.due_date = element.due_date ? element.due_date : element.due_date;
          element.start_date = element.start_date ? element.start_date : element.start_date;
          element.actor= this.getActorName(element);
        }
      });
      this.totalRecords = data?.total_records;
      this.tableLoaded = true;
      this.itemPerPage = 10;
      this.loaderService.hide();
    }else{

    }
  }

  getActorName = (element: any) => {
    let actorName: string;
    if (element.roles?.length > 0) {
      const names = element.roles.map((role) => {
        return  role?.name + '(' + (role?.organization_category ? role?.organization_category : '')+ ')';
      });
      if (names?.length > 0) actorName = names.join(', ');
    } else {
      actorName =  element?.role?.name + '(' + (element?.role?.organization_category ? element?.role?.organization_category  : '') + ')';
    }
    return actorName;
  };

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

  onClickView(e) {
  //  if(e.dependent_task && !e.dependent_task?.updated_documents){
  //   return false;
  //  }
    this.selectedTask = undefined;
    this.selectedTask = e;
    this.taskDetails = 'visible';
    this.currentTaskId = e.id;
    this.eventStream.emit(new EmitEvent(Events.CANDIDATE_UPDATE_TASK_ID, { taskId: this.currentTaskId}));
  }

  onSortClick(e) {}

  onSearch(e) {
    this.searchKey = e
    //this.onboardingListing()
  }

  onCloseTaskDetails(event) {
    if (event) {
      this.onboardingListing()
    }
    this.taskDetails = 'hidden'
    this.selectedTask=undefined;
  }

  onPaginationClick(e) {
    //this.onboardingListing(e);
  }

  onclickButton(index){
    if (!this.visibleIndices.delete(index)) {
      this.visibleIndices.add(index);
    }
    this.statusDropdwon = true;
  }

  getQualificationTypes() {
    this.assignmentService.getQualificationTypes(this.programId).subscribe({
      next: (data1: any) => {
      if (data1 && data1?.qualification_types?.length > 0) {
        this.assignmentService.getCredentialsQualification(this.programId, data1?.qualification_types[0]?.id).subscribe({
          next: (data2: any) => {
          if (data2) {
            this.credentialArr = data2?.qualifications;
          }
        },
        error: (err) => {
          this.alert.error(errorHandler(err));
        }});
      }
    },
    error: (err) => {
      this.alert.error(errorHandler(err));
    }});
  }

  clickToApproveOnboardingReview() {
    this._eventStrem.emit(
      new EmitEvent(Events.REVIEW_ONBOARDING, {
        value: true,
        candId: this.CandidateId,
        moduleId: this.jobId,
        moduleType: "jobs",
        isCompletedStatus: this.completedStatus
      })
    );
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
    this.jobDetailService.updateTaskDetails(this.programId, this.jobId, this.CandidateId, taskDetails?.id, payload).subscribe({
      next: (res) => {
        this.alert.success("Onboarding reopened successfully.");
        this.onboardingListing();
        this.loaderService.hide();
      },
      error: (err) => {
        this.loaderService.hide();
        this.alert.error(err?.error?.error?.message);
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

  getCandidateDetailsById() {
    let url = `/submission-manager/programs/${this.programId}/jobs/${this.jobId}/candidates/${this.CandidateId}`;
    this.jobDetailService.get(url).subscribe({
      next: (data: any) => {
        if (data) {
          const assignment_id = data?.candidate?.assignment_id;
          this.getAssignmentDetails(assignment_id);
        }
      },
  });
  }

  getAssignmentDetails(assignment_id) {
    this.jobDetailService.fetchAssignments(assignment_id).subscribe((res)=>{
      this.assignment_status = res?.data?.assignments?.assignment?.status;
      this.onboardingListing();
    })
  }

}
