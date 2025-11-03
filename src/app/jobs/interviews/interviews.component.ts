import { Location } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { CalculateDurationService } from 'src/app/core/services/calculate-duration.service';
import { EmitEvent, EventStreamService, Events } from 'src/app/core/services/event-stream.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { JobDetailsService } from 'src/app/jobs/job-details/job-details.service';
import { VMSConfig } from 'src/app/library/smartTable/table/table.model';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { DATE_FORMAT } from 'src/app/wipro-timesheet/timesheet.enums';
@Component({
  selector: 'app-interviews',
  templateUrl: './interviews.component.html',
  styleUrls: ['./interviews.component.scss'],
})
export class InterviewsComponent implements OnInit, OnDestroy {
  private subscriptions = [];
  public vmsData: any;
  public tableConfig: VMSConfig;
  public isExpand = false;
  public totalPages = 0;
  public totalRecords = 0;
  public dataLoader: any;
  public pageNumber = 1;
  public limit = 10;

  gridContentType = 'interview';
  tableLoaded = false;
  dataLoading = true;
  public viewGrid: boolean = true;
  public gridVewJson: any = {};
  itemsPerPage: any;
  searchTerm: '';
  jobId = '';
  filterDataPage: number;
  isAdvanceSearch = false;
  filterpayLoad: any;
  todaysInterviewsList: any[];
  toDaysDate: string;
  rotuterLinkParams;
  rotuterLinkParseFn;
  public user_type: any;
  tabCount: any = {
    all: 0,
    pendingOfferCreation: 0,
    awaitingAcceptance: 0,
    pending_interview_review: 0

  };
  public status: any = 'All';
  filter: any = {};
  initFlag: boolean = true;
  countData: number[];
  selectedTab: string;
  public showSidePanel = "hidden";
  public sidePanelViewMode = false;
  public interviewId: any = null;
  public jId: any = null;
  submissionManager: any;
  currentProgram: any;
  isPendingInterviewReview: any;
  isVendorNeutral: any;
  userDetails: any;
  jobData: any;
  approvalList: any;
  isUserJobManager: boolean = true;
  //dateformat = this.globalConstants?.YMD_Date_Format;
  constructor(
    private _eventStrem: EventStreamService,
    private jobService: JobDetailsService,
    private route: ActivatedRoute,
    private _alert: AlertService,
    private router: Router,
    private datePipe: LocalDateFormatPipe,
    private storageService: StorageService,
    private localDatePipe: LocalDateFormatPipe,
    private location: Location,
    private calculate: CalculateDurationService,
  ) { }

  programId;
  ngOnInit(): void {
    this.currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.userDetails = this.storageService.get(StorageKeys.CURRENT_USER);
    this.jobData = this.storageService.get('viewd_job');
    this.isVendorNeutral = this.currentProgram.config?.is_vendor_neutral;
    this.isPendingInterviewReview = this.currentProgram.config?.interview?.pending_interview_review;
    this.submissionManager = '/submission-manager';
    this.programId = this.storageService.get('PROGRAM_ID');
    this.user_type = this.storageService.get('user_type');
    this.route.paramMap.subscribe(param => {
      let status = param.get('status');
      this.status = status?.replace(/%20/g, " ");
      switch (status?.toLowerCase()) {
        case 'completed_pending_offer': this.onTabClick('completed_pending_offer'); break;
        case 'pending': this.onTabClick('pending'); break;
        case 'pending_review': this.onTabClick('pending_review'); break;
        default: {
          const index = this.tableConfig?.tabsList?.findIndex(item => status?.toLowerCase() === item?.toLowerCase());
          if (index === -1) {
            status = 'All';
          }
          this.onTabClick(status);
          break;
        }
      }
    });
    this.rotuterLinkParseFn = (rowData, options) => `jobs/details/job-details/${rowData?.jobId}/candidate/${rowData?.candidateId}/interviews/details?id=${rowData?.interviewId}`;
    this.user_type == 'CLIENT' ?? this.checkUserApproval();
    this.tableConfig = {
      title: 'Interviews',
      columnList: [
        { name: 'candidateName', title: 'Candidate', isIcon: true, isImage: true, isContact: false, isNumberBadge: false, isWithdrawal: false, isCreateOffer: this.isUserJobManager, isRejectCandidate: true, isCancelInterview: true, isInterviewReview:true, isEditInterviewReview: true, isCancelInterviewReview: true, isScheduleInterview: true, isRescheduleInterview: true, isEditInterview: true, isRateInterview: true, showPreviewIcon: true , isSort: true },
        { name: 'status', title: 'Status', isIcon: false, isImage: false, isContact: false, isNumberBadge: false, isCandidateStatus: false , isSort: true },
        {
          name: 'job', title: 'Job', width: 20, isIcon: false, isImage: false, isContact: false, isNumberBadge: false,
        },
        {
          name: 'job_id', title: 'Job ID', width: 15, isIcon: false, isImage: false, isContact: false, isNumberBadge: false,
        },
        {
          name: 'submission_id', title: 'Submission ID', width: 15, isIcon: false, isImage: false, isContact: false, isNumberBadge: false , isSort: true
        },
        { name: 'name', title: 'Interview Title', isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
        { name: 'interviewer', title: 'Interviewer', isIcon: false, isImage: false, isContact: false, isNumberBadge: false, isArray: true, isMultiUser: true },
        { name: 'date', title: 'Date', isIcon: false, isImage: false, isContact: false, isNumberBadge: true },
        { name: 'time', title: 'Start Time', isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
        { name: 'duration', title: 'Duration', isIcon: false, isImage: false, isContact: false, isNumberBadge: false , isSort: true },
        { name: 'type', title: 'Type', isIcon: false, isIconList: true, isImage: false, isContact: false, isNumberBadge: false },
        { name: 'created_on', title: 'Created On', isIcon: false, isImage: false, isContact: false, isNumberBadge: false , isSort: true},
      ],
      tabsList: this.getTabList(),
      showTabs: true,
      isExpand: false,
      isFilter: false,
      isSearch: false,
      isSetting: false,
      tableNoDataObj: {
        headTitle: 'No Interviews are Available',
        subTitle: 'There are no interviews for now',
        imageUrl: './assets/images/no-interviews.svg',
        button: false,
      },
      isTopPagination: true,
      hideResultCount: true,
      isCreate: false,
      density: 'COMFORTABLE',
      tableWidth: "2500px",
      isTopHeader: true,
      advanceFilter: [
        //Candidate name
        { name: 'name', title: 'Interview Title', filterType: 'TEXT' },
        //Interview status
        {
          name: 'status', title: 'Status', filterType: 'SELECT', multiSelectData: [
            { name: "PENDING ACCEPTANCE", value: "PENDING_ACCEPTANCE"},
            { name: "CANCELLED", value: "CANCELLED"},
            { name: "ACCEPTED", value: "ACCEPTED"},
            { name: "REJECTED", value: "REJECTED"},
            { name: "COMPLETED", value: "COMPLETED"},
          ]
        },
        //Interview Title
        // { name: 'title', title: 'Interview Title', filterType: 'TEXT'},
        // interview date
        { name: 'scheduled_on', title: 'Date', filterType: 'DATERANGE' },
        //Interview Mode
        {
          name: 'type', title: 'Interview Type', filterType: 'SELECT', multiSelectData: [
            { name: 'In Person', value: 'F2F' },
            { name: 'Over Phone', value: 'PHONE' },
            { name: 'Virtual', value: 'VIRTUAL' },
          ]
        },
        //Interview created on date
        { name: 'created_on', title: 'Created On', filterType: 'DATERANGE' },
      ]
    };

    if (this.user_type == 'VENDOR' ) {
      this.tableConfig.columnList = this.tableConfig.columnList.filter((item) => item.name !== 'date' && item.name !== 'time' && item.name !== 'duration' && item.name !== 'type');
    }

    if (this.isVendorNeutral) {
      this.tableConfig.columnList = this.tableConfig.columnList.filter((item) => item.name !== 'interviewer');
    }
    this.toDaysInterview();
    this.getInterviews();
    this.subscriptions.push(this._eventStrem.on(Events.SHOW_GRID_LAYOUT).subscribe((data) => {
      // this.viewGrid = false;
      if (data) {
        this.viewGrid = false;
      } else {
        this.viewGrid = true;
      }
    }));
    this.subscriptions.push(this._eventStrem.on(Events.UPDATED_CANDIDATE_STATUS).subscribe((data) => {
      if (data) {
        this.getInterviews();
      }
    }));
    this.getTabCount();

    if(this.currentProgram?.config?.generic_list_pages?.['interview']){
      this.getGlobalFlagsList();
    }
  }

  getGlobalFlagsList() {
    this.jobService.get('/configurator/global-launch?limit=50')
    .subscribe({
      next: (data: any) => {
        if(data?.global_launch_data?.length > 0) {
            this.tableConfig.enableGenricListViewButton =  data.global_launch_data.find(config => config.slug === 'interview_list_view_\'try_new_view\'')?.is_enabled;
            if(this.tableConfig.enableGenricListViewButton){
              this.tableConfig.genericListConfig = {'URL':'jobs/genericlist/InterviewModule/Interview','oldURL':'jobs/interviews'};
            }
          }
      },
    })
  }

  checkUserApproval() {
    if ( this.jobData?.job_manager_id == this.userDetails?.id ) {
      this.isUserJobManager = true;
    } else {
      this.jobService.get(`/approval/programs/${this.programId}/jobs/${this.jobId}/approval-instances`).subscribe((res: any) => {
        this.approvalList = res?.approvers?.forEach(approver => {
          if (approver?.members.find(member => member.id == this.userDetails?.id)) {
            this.isUserJobManager = true;
          } else {
            this.isUserJobManager = false;
          }
        });
      })
    }
  }
  vmsTableTabConfig() {
    this.countData = [0, 0, 0];
    if ((this.user_type == 'MSP' || this.user_type == 'CLIENT') && !this.isPendingInterviewReview) {
    this.tableConfig.tabsList?.forEach((tab) => {
      if (tab === 'All') {
        this.countData.splice(0, 1, this.tabCount?.all);
      } else if (tab === 'Pending Offer Creation') {
        this.countData.splice(1, 1, this.tabCount?.pendingOfferCreation);
      }
    });
   } else  if (this.user_type == 'VENDOR') {
    this.tableConfig.tabsList?.forEach((tab) => {
      if (tab === 'All') {
        this.countData.splice(0, 1, this.tabCount?.all);
      } else if (tab === 'Awaiting Acceptance') {
        this.countData.splice(1, 1, this.tabCount?.awaitingAcceptance);
      }
    });
   } else  if (this.user_type == 'PROGRAM' || this.user_type == 'SUPER_ORG') {
    this.tableConfig.tabsList?.forEach((tab) => {
      if (tab === 'All') {
        this.countData.splice(0, 1, this.tabCount?.all);
      } else if (tab === 'Pending Offer Creation') {
        this.countData.splice(1, 1, this.tabCount?.pendingOfferCreation);
      } else if (tab === 'Awaiting Acceptance') {
        this.countData.splice(2, 1, this.tabCount?.awaitingAcceptance);
      }
    });
  } else if (this.isPendingInterviewReview) {
    this.tableConfig.tabsList?.forEach((tab => {
      if (tab === 'All') {
        this.countData.splice(0, 1, this.tabCount?.all)
      } else if (tab === 'Pending Review') {
        this.countData.splice(1, 1, this.tabCount?.pending_interview_review)
      } else if (tab === 'Pending Offer Creation') {
        this.countData.splice(2, 1, this.tabCount?.pendingOfferCreation);
      }
    }))
   }
  }
  getTabList() {
    if (this.user_type == 'VENDOR') {
      return [
        'All',
        'Awaiting Acceptance'
      ]
    } else if (this.user_type == 'MSP') {
      if (this.isPendingInterviewReview) {
        return [
          'All',
          'Pending Review',
          'Pending Offer Creation'
        ]
      } else {
        return [
          'All',
          'Pending Offer Creation'
        ]
      }
  } else if (this.user_type == 'PROGRAM' || this.user_type == 'SUPER_ORG') {
      return [
        'All',
        'Pending Offer Creation',
        'Awaiting Acceptance'
      ]
    } else if (this.user_type == 'CLIENT') {
      return [
        'All'
      ]
    }
  }

  onTabClick(e) {
    if (typeof e === 'object') {
      return;
    } else {
      this.filter = {};
      this.status = e;
      let route = e?.toLowerCase();
      if (route == 'completed_pending_offer' || route == 'pending offer creation') {
        route = 'completed_pending_offer';
        this.status = 'completed_pending_offer';
        this.pageNumber = 1;
        this.getInterviews();
      } else if (route == 'awaiting acceptance' || route == 'pending') {
        route = 'pending';
        this.status = 'pending';
        this.pageNumber = 1;
        this.getInterviews();
      } else if (route == 'pending_review' || route == 'pending review') {
        route = 'pending_review';
        this.status = 'pending_interview_review';
        this.pageNumber = 1;
        this.getInterviews();
      } else {
        this.pageNumber = 1;
        route = undefined;
        this.status = '';
        this.getInterviews();
      }
      if(route){
        this.location.replaceState(`jobs/interviews/${route}`);
     } else {
        this.location.replaceState(`jobs/interviews`);
     }
     if (this.status) {
       let _status;
       if (this.status === 'completed_pending_offer') {
         _status = "Pending Offer Creation"
       } else if (this.status === 'pending') {
         _status = "awaiting acceptance"
        } else if (this.status === 'pending_interview_review') {
          _status = "Pending Review"
       }
       this.selectedTab = _status || this.status;
     } else {
       this.selectedTab = "All";
     }
    }
  }
  getInterviews() {
    let status = this.status?.toUpperCase();
    this.dataLoader = true;
    this.toDaysDate = this.datePipe.transform(new Date());

    this.subscriptions.push(this.jobService.getAllInterviewList(status, this.searchTerm, this.pageNumber, this.limit, this.sortObj, this.currentProgram.id).subscribe({
      next: (data: any) => {
      if (data) {
        this.dataLoader = false;
        this.vmsData = this.transformData(data);
        this.tableLoaded = true;
        this.dataLoading = false;
        this.totalRecords = data?.total_records;
        this.itemsPerPage = data?.items_per_page;
        this.gridVewJson = this.vmsData;
        if (this.initFlag) {
          this.vmsTableTabConfig();
          this.initFlag = false;
        }
      }
    },
    error: err => {
      this.dataLoader = false;
      this._alert.error(errorHandler(err));
    }}));
  }


  onPaginationClick(e) {
    this.pageNumber = e;
    this.getInterviews();
  }
  onClickRecords(event) {
    this.limit = event;
    this.pageNumber = 1;
    this.getInterviews();
  }
  getTabCount() {
    this.subscriptions.push(this.jobService.getLatestTabCount(this.currentProgram.id).subscribe((data: any) => {
      if (data) {
        this.tabCount.pending_interview_review = data?.stats?.pending_interview_review ? data?.stats?.pending_interview_review : 0;
        this.tabCount.all = data?.stats?.all ? data?.stats?.all : 0;
        this.tabCount.pendingOfferCreation = data?.stats?.completed_pending_offer ? data?.stats?.completed_pending_offer : 0;
        this.tabCount.awaitingAcceptance = data?.stats?.awaiting_acceptance ? data?.stats?.awaiting_acceptance : 0;
        this.vmsTableTabConfig();
      }
    }));
  }

  toDaysInterview() {
    let date = this.datePipe.transform(new Date(), 'YYYY-MM-DD');
    this.subscriptions.push(this.jobService.getTodaysInterviewByProgramUsier(date, this.currentProgram.id).subscribe((data: any) => {
      if (data) {
        data?.interviews?.forEach(item => {
          let time;
          let index;
          let candidate_name1 = (item?.candidate?.middle_name) ? `${item?.candidate?.first_name} ${item?.candidate?.middle_name} ${item?.candidate?.last_name}` : `${item?.candidate?.first_name} ${item?.candidate?.last_name}`;
          item['current_name'] = candidate_name1;
          index = item?.schedules?.findIndex(element => element?.is_accepted == true)
          item?.schedules?.forEach(element => {
            index == -1 ? item['startTime'] = element?.start_time : item['startTime'] = item.schedules[index].start_time;
            item.duration = this.calculate.calculateDuration(element?.start_time, element?.end_time);
            // if (element.is_accepted === true) {
            //   item.duration = this.calculate.calculateDuration(element?.start_time, element?.end_time);
            // }
            if (element.is_prefered === true) {
              date = element?.date;
              time = element?.start_time;
              var date1 = parseInt(time.split(":")[0]);
              var date1Minute = parseInt(time.split(":")[1]) == 0 ? 0 : parseInt(time.split(":")[1]);
              var date2 = new Date();
              var currentTimeInSec = ((date2.getHours() * 3600) + (date2.getMinutes() * 60));
              var interviewEndTimeInsec = (((date1 * 3600) + (date1Minute * 60)) + ((item?.duration) * 60));
              var Difference_In_Time = ((date1 * 3600) + (date1Minute * 60)) - ((date2.getHours() * 3600) + (date2.getMinutes() * 60));
              item['timeEST'] = date1 > 12 ? date1 + ' pm' : date1 + ' am';
              if (Difference_In_Time > 0 && ((date2.getHours() * 3600) + (date2.getMinutes() * 60)) < ((date1 * 3600) + (date1Minute * 60))) {
                item['timeDifference'] = Difference_In_Time;
                item['currentStatus'] = 'wait';
              } else if (Difference_In_Time < 0 && (interviewEndTimeInsec < currentTimeInSec)) {
                item['timeDifference'] = 'Completed';
                item['currentStatus'] = 'Completed';
              } else {
                item['timeDifference'] = 'In Progress';
                item['currentStatus'] = 'In Progress';
              }
            }
            date1 = null;
            date2 = null;
          });
        });
        this.todaysInterviewsList = data?.interviews;
      }
    }));
  }

  clickToRejectCandidate(event) {
  }
  // clickToCreateOffer(event) {
  //   this.eventStream.emit(
  //     new EmitEvent(Events.JOB_DETAIL_SIDEBAR_CREATE_OFFER, {
  //       id: event.candidateId,
  //       jobId:event.jobId,
  //       isopen: true,
  //       job: event.job
  //     })
  //   );
  // }
  clickToCreateOffer(event) {
    this.router.navigateByUrl(
      `jobs/details/job-details/${event.jobId}/candidate/${event.candidateId}/offers?createOffer=true`
    );
  }
  withdrawalClicked(event) {
    // if (event.status == 'SUBMITTED') {
    //   this._eventStrem.emit(new EmitEvent(Events.WITHDRAW_CANDIDATE, { value: true, candidateId: event.id, jobId: this.jobId }));
    // } else if (event.status == 'WITHDRAWN') {
    //   this.router.navigate(['/candidates/submit'], { queryParams: { candidateSubmission: true, jobId: this.jobId, type: 'submit', candidateId: event.id } });
    // }
  }

  completeInterviewClick(event) {
    this.showSidePanel = "visible";
    this.interviewId = event.interviewId;
    this.jId = event.jobId;
    // Need to call api onced Ravi answered the queries
  }

  onSidePanelClose() {
    this.showSidePanel = "hidden";
  }

  onSubmit(event) {
     let payLoad:any = {
       status: 'COMPLETED'
     } ;
     if( event?.reason) {
      payLoad.status_reason = event?.reason
    };
    if( event?.rating) {
      payLoad.interview_rating = event?.rating
    };
    if( event?.notes) {
      payLoad.status_note = event?.notes
    }
    this.onMarkAsCompleted(payLoad, this.interviewId, this.jId);

  }

  onMarkAsCompleted(payload, interviewId,jobId) {
    this.subscriptions.push(this.jobService.put(`${this.submissionManager}/programs/${this.programId}/jobs/${jobId}/interviews/${interviewId}`, payload).subscribe({
      next: (data: any) => {
        this._alert.success('Candidate Interview status Successfully Updated')
      },
      error: (error) => {
        this._alert.error(errorHandler(error))
      },
      complete :() => {
        this.onSidePanelClose();
        this._eventStrem.emit(
          new EmitEvent(Events.UPDATED_CANDIDATE_STATUS, true)
        );
      }
    }));
  }

  previewClicked(event) {
    if (event) {
      this._eventStrem.emit(
        new EmitEvent(Events.JOB_DETAIL_SIDEBAR_VIEW, {
          value: event,
          selectedIndex: 3,
          candidateId: event.candidateId,
          job_id: event.jobId,
          interviewId: event.interviewId
        })
      );
    }
  }

  onEditClick(event) {

    this.router.navigateByUrl(
      `jobs/details/job-details/${event.jobId}/candidate/${event?.candidateId}/interviews/edit/${event?.interviewId}`
    );
  }

  selectAllClicked(e) { }
  selectClicked(e) { }
  onSearch(term) {
    this.searchTerm = term;
    this.getInterviews();
  }
  onListFilter(e) {
    this.dataLoading = true;
    this.isAdvanceSearch = true;
    this.filterpayLoad = e;
    this.filterInterviews(e);
  }
  scheduleInterview(event) {
    if (event) {
      if (event.jobId) {
        this.router.navigateByUrl(
          `jobs/details/job-details/${event.jobId}/candidate/${event.candidateId}/interviews/create`
        );
      }
    }
  }
  rescheduleInterview(event) {
    this.router.navigateByUrl(
      `jobs/details/job-details/${event.jobId}/candidate/${event?.candidateId}/interviews/re-schedule/${event?.interviewId}`
    );
  }
  clickToEditInterview(event) {
    this.router.navigateByUrl(
      `jobs/details/job-details/${event.jobId}/candidate/${event?.candidateId}/interviews/edit/${event?.interviewId}`
    );
  }
  cancelInterview(e) {
    if (e) {
      this._eventStrem.emit(new EmitEvent(Events.CANCEL_INTERVIEW, { value: e }));
    }
  }

  clickToReviewInterview (event) {
    this.router.navigateByUrl(`jobs/details/job-details/${event.jobId}/candidate/${event?.candidateId}/interviews/details?id=${event.interviewId}`);
  }
  rejectInterview(e) {
    if (e) {
      this._eventStrem.emit(new EmitEvent(Events.REJECT_CANDIDATE, { value: e }));
    }
  }

  showInterviewSidebar() {
    this._eventStrem.emit(new EmitEvent(Events.JOB_DETAIL_SIDEBAR_VIEW, {
      selectedMenu: 'interview'
    }));
  }

  sortColMap = {
  }

  defaultSortObj = {
    name: 'created_on',
    order: 'DESC'
  };

  sortObj = {
    name: 'created_on',
    order: 'DESC'
  };

  onSortClick(event) {
    if (!!event) {
      if(this.sortColMap[event.name]) {
        event.name = this.sortColMap[event.name]
      }
      this.sortObj = event;
    } else {
      this.sortObj = this.defaultSortObj
    }
    if(this.sortObj && this.sortObj?.name === 'candidateName') this.sortObj.name = 'first_name';
    this.pageNumber = 1;
    this.getInterviews()
  }
  // Advance filter for interviews:
  filterInterviews(payload = null, pageNo = 1) {
    let programId = this.storageService.get('PROGRAM_ID');
    let filter;
    if (payload !== null) {
      filter = {
        filters: {
          name: payload['name'],
          status: payload['status'],
          scheduled_on: payload['scheduled_on'],
          type: payload['type'],
          created_on: payload['created_on']
        },
        pagination: {
          limit: 10,
          page: pageNo
        }
      }
    } else {
      filter = {
        pagination: {
          limit: 10,
          page: pageNo,
        }
      }
      if (this.filterpayLoad) {
        filter['filters'] = {
          name: this.filterpayLoad['name'],
          status: this.filterpayLoad['status'],
          scheduled_on: this.filterpayLoad['scheduled_on'],
          type: this.filterpayLoad['type'],
          created_on: this.filterpayLoad['created_on']
        }
      }
    }
    this.subscriptions.push(this.jobService.post(`${this.submissionManager}/programs/${programId}/jobs/${payload['jobId']}/interviews/advance-filter`, filter).subscribe({
      next: (data: any) => {
        this.vmsData = this.transformData(data);
        this.tableLoaded = true;
        this.dataLoading = false;
        this.totalRecords = data?.total_records;
        this.itemsPerPage = data?.items_per_page;
      },
     error: (err) => {
        this.tableLoaded = true;
        this._alert.error(errorHandler(err));
      }
  }));
  }
  getWorkedRehire(arr) {
    if (arr instanceof Array) {
      let str = arr?.join(', ');
      return str?.toLowerCase().replace(/_/g, ' ')
        .replace(/(?: |\b)(\w)/g, function (key, p1) {
          return key.toUpperCase();
        });
    }
    else {
      return arr?.toLowerCase().replace(/_/g, ' ')
        .replace(/(?: |\b)(\w)/g, function (key, p1) {
          return key.toUpperCase();
        })
    }
  }
  // trans form data in listing format
  transformData(data) {
    let interviews = [];
    data.interviews.forEach(item => {
      let type = {};
      let date;
      let time;
      let duration;
      if (item.interview_type === 'F2F') {
        type = { "face_to_face": true };
      } else if (item.interview_type === 'VIRTUAL') {
        type = { "video": true };
      } else if (item.interview_type === 'PHONE') {
        type = { "audio": true };
      }
      // let candidate_name1 = item?.do_not_rehire ? `${item?.candidate?.first_name} ${item?.candidate?.middle_name || ''} ${item?.candidate?.last_name}
      // <div class="custom-tooltip"> <i class="material-icons"> no_accounts </i> <span class="tooltiptext">Do Not Re-hire</span> </div> `
      // : `${item?.candidate?.first_name} ${item?.candidate?.middle_name || ''} ${item?.candidate?.last_name}`


      let candidate_name1 = item?.candidate?.middle_name
      ? `${item?.candidate?.first_name} ${item?.candidate?.middle_name} ${item?.candidate?.last_name}`
      : `${item?.candidate?.first_name} ${item?.candidate?.last_name}`;
    candidate_name1 = this.jobService.toTitleCase(candidate_name1)
    candidate_name1 = `${candidate_name1} <div>`;

    if (item?.is_rehire) {
      candidate_name1 += ` <span class="custom-tooltip"> <img src='assets/images/rehire.svg' /> <span class="tooltiptext"><strong>Re-hire</strong> ${item?.candidate_worked_as ? `- `+this.getWorkedRehire(item?.candidate_worked_as) : ``}</span> </span>`;
    }

    if (item?.do_not_rehire) {
      candidate_name1 += `<span class="custom-tooltip"> <i class="material-icons"> no_accounts </i> <span class="tooltiptext">Do Not Re-hire</span> </span>`;
    }

    if (item?.ot_mismatch) {
      candidate_name1 += `<span class="custom-tooltip"> <span class="material-icons-round" style="color:red">hourglass_top</span>  <span class="tooltiptext">OT Exempt Mismatch</span> </span>`;
    }
      candidate_name1 += ` </div>`;
      item.schedules?.forEach(element => {
        if (element.is_accepted === true) {
          date = this.datePipe.transform(element?.date, this.currentProgram?.defaultDateFormat, null, null, true, DATE_FORMAT.FORMATMDY);
          time = element?.start_time;
          let durationString = this.calculate.calculateDuration(element?.start_time, element?.end_time);
          duration = `${durationString} mins`
        }
      });
      const interviewer = item?.interviewers.filter(x => x.member_type === "INTERVIEWER");
      if(item?.interview_status) {
        item.interview_status = this.getDisplayStatus(item?.interview_status);
      }
      // if(item?.interview_status?.toLowerCase()==='pending_interview_review'){
      //   item.interview_status='pending review';
      // }
      // if(item?.interview_status?.toLowerCase()==='pending_acceptance'){
      //   item.interview_status='pending acceptance';
      // }
      let interview = {
        "name": this.jobService.toTitleCase(item?.name),
        "candidateName": candidate_name1,
        "candidateId": item.candidate?.id,
        'job':item?.job?.title,
        'jobId':item?.job?.id,
        'job_id': item?.job?.job_id,
        'submission_id': item.submission_id,
        "interviewId": item.id,
        "interview_type": item.interview_type,
        "type": type,
        "location": item.location,
        "instructions": item.instructions,
        "time_zone": item.time_zone,
        "duration": duration,
        "status": item.interview_status,
        "candidate_submission_status": item.candidate_submission_status,
        "offer_status": item.offer_status,
        "date": date,
        "time": time,
        "interviewers": item.interviewers,
        "interviewer": interviewer.map(i => i.full_name),
        "schedules": item.schedules,
        "created_on": this.datePipe.transform(item?.created_on),
        "interviewTitle": item.name,
        "offer_visibility": item?.offer_visibility,
        "job_status": item?.job?.job_status
      }
      interviews.push(interview);
    });
    return { 'interview': interviews };
  }

  getDisplayStatus (_status: string) {
    let inteviewStatus = _status;
    switch (_status) {
      case 'PENDING_INTERVIEW_REVIEW':
        inteviewStatus = 'pending review';
        break;
      case 'PENDING_ACCEPTANCE':
        inteviewStatus = 'pending acceptance';
        break;
      case 'PENDING_CONFIRMATION':
        inteviewStatus = 'pending confirmation';
        break;
    }
    return inteviewStatus;
  }
  ngOnDestroy(): void {
    this.subscriptions?.forEach(sub => sub.unsubscribe());
  }

  getDate(d) {
    return this.localDatePipe.transform(new Date(d).toISOString(), 'MM/dd/yyyy');
  }

}
