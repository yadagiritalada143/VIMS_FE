import { Component, OnDestroy, OnInit } from '@angular/core';
import { EmitEvent, Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { JobDetailsService } from '../../job-details.service';
import { Router, ActivatedRoute } from '@angular/router';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { VMSConfig } from 'src/app/library/smartTable/table/table.model';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { CalculateDurationService } from 'src/app/core/services/calculate-duration.service';
import { MasterTalentProfileService } from 'src/app/master-talent-profiles/master-talent-profile.service';
import { MasterProfilePermissions } from 'src/app/assignment/enums/master-profile-permissions';
//import { GlobalConstants } from 'src/app/shared/globalconstants'
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
  public showSidePanel = "hidden";
  public sidePanelViewMode = false;
  public interviewId: any = null;
  submissionManager: any;
  currentProgram: any;
  isPendingInterviewReview: any;
  interviews: any;
  userDetails: any;
  jobData: any;
  isUserJobManager: boolean = true;
  userType: any;
  //dateformat = this.globalConstants?.YMD_Date_Format;
  constructor(
    private _eventStrem: EventStreamService,
    private jobService: JobDetailsService,
    private route: ActivatedRoute,
    private _alert: AlertService,
    private router: Router,
    private storageService: StorageService,
    private localDateFormat: LocalDateFormatPipe,
    private calculate: CalculateDurationService,
    private masterTalentProfileService: MasterTalentProfileService
  ) { }

  programId;
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
  ngOnInit(): void {
    this.submissionManager = '/submission-manager';
    this.currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.userDetails = this.storageService.get(StorageKeys.CURRENT_USER);
    this.userType = this.storageService.get('user_type');
    this.jobData = this.storageService.get('viewd_job');
    this.isPendingInterviewReview = this.currentProgram.config?.interview?.pending_interview_review;
    this.jobId = this.route.parent?.snapshot.params['id'];
    this.programId = this.storageService.get('PROGRAM_ID');
    this.rotuterLinkParams = { jobId: this.jobId };
    this.rotuterLinkParseFn = (rowData, options) => `jobs/details/job-details/${options?.jobId}/candidate/${rowData?.candidateId}/interviews/details?id=${rowData?.interviewId}`;
    this.checkUserApproval();
    this.tableConfig = {
      title: 'Interviews',
      columnList: [
        { name: 'candidateName', title: 'Candidate', isIcon: true, isImage: true, isContact: false, isNumberBadge: false, isWithdrawal: true, isCreateOffer: this.isUserJobManager, isRejectCandidate: true, isCancelInterview: true, isRescheduleInterview: true, isInterviewReview: true, isEditInterviewReview: true, isCancelInterviewReview: true, isEditInterview: true, isRateInterview: true, showPreviewIcon: true, isSort: true, isScheduleInterview: true, canViewMtp: this.masterTalentProfileService.hasPermission(MasterProfilePermissions.VIEW_MTP_SCREEN)  },
        { name: 'status', title: 'Status', isIcon: false, isImage: false, isContact: false, isNumberBadge: false, isCandidateStatus: false, isSort: true },
        { name: 'name', title: 'Interview Title', isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
        { name: 'interviewer', title: 'Interviewer', isIcon: false, isImage: false, isContact: false, isNumberBadge: false, isArray: true, isMultiUser: true },
        { name: 'date', title: 'Date', isIcon: false, isImage: false, isContact: false, isNumberBadge: true },
        { name: 'time', title: 'Start Time', isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
        { name: 'duration', title: 'Duration', isIcon: false, isImage: false, isContact: false, isNumberBadge: false, isSort: true },
        { name: 'type', title: 'Type', isIcon: false, isIconList: true, isImage: false, isContact: false, isNumberBadge: false },
        { name: 'created_on', title: 'Created On', isIcon: false, isImage: false, isContact: false, isNumberBadge: false, isSort:true },
      ],
      isExpand: false,
      isFilter: true,
      isSearch: true,
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
            { name: 'Phone', value: 'PHONE' },
            { name: 'Virtual', value: 'VIRTUAL' },
          ]
        },
        //Interview created on date
        { name: 'created_on', title: 'Created On', filterType: 'DATERANGE' },
      ]
    };

    if (this.userType == 'VENDOR' ) {
      this.tableConfig.columnList = this.tableConfig.columnList.filter((item) => item.name !== 'date' && item.name !== 'time' && item.name !== 'duration' && item.name !== 'type');
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
  }
  checkUserApproval() {
    if (this.userType == 'CLIENT') {
      if ( this.jobData?.job_manager_id == this.userDetails?.id ) {
        this.isUserJobManager = true;
      } else {
        this.jobService.get(`/approval/programs/${this.programId}/jobs/${this.jobId}/approval-instances`).subscribe((res: any) => {
          res?.approvers?.forEach(approver => {
            if (approver?.members.find(member => member.id == this.userDetails?.id)) {
              this.isUserJobManager = true;
            } else {
              this.isUserJobManager = false;
            }
          });
        })
      }
    }
  }
  onSortClick(event) {
    if (!!event) {
      if (this.sortColMap[event.name]) {
        event.name = this.sortColMap[event.name]
      }
      this.sortObj = event;
    } else {
      this.sortObj = this.defaultSortObj
    }
    if(this.sortObj && this.sortObj?.name === 'candidateName') this.sortObj.name = 'first_name';
    this.getInterviews();
  }
  getInterviews() {
    let sort = `${(this.sortObj && this.sortObj.order)  ? this.sortObj.order.toLocaleLowerCase() === 'desc' ? '&order_by=desc' : '&order_by=asc' : ""}&key=${this.sortObj.name}`;
    this.toDaysDate = this.localDateFormat.transform(new Date(), 'MM/dd/yyyy');
    this.subscriptions.push(this.jobService.getInterviewList(this.jobId, this.searchTerm, null,sort).subscribe({
      next: (data: any) => {
      if (data) {
        this.vmsData = this.transformData(data);
        this.tableLoaded = true;
        this.dataLoading = false;
        this.totalRecords = data?.total_records;
        this.itemsPerPage = data?.items_per_page;
        this.gridVewJson = this.vmsData;
        this.interviews = data.intervews;
      }
    },
    error: err => {
      this._alert.error(errorHandler(err));
    }}));
  }


  toDaysInterview() {
    let date = this.localDateFormat.transform(new Date(), 'yyyy-MM-dd');
    this.subscriptions.push(this.jobService.getTodaysInterview(this.jobId, date).subscribe((data: any) => {
      if (data) {
        data?.interviews?.forEach(item => {
          let time;
          let candidate_name1 = (item?.candidate?.middle_name) ? `${item?.candidate?.first_name} ${item?.candidate?.middle_name} ${item?.candidate?.last_name}` : `${item?.candidate?.first_name} ${item?.candidate?.last_name}`;
          item['current_name'] = candidate_name1;
          item?.schedules?.forEach(element => {
            item['startTime'] = element?.start_time;
            if (element.is_accepted === true) {
              item.duration = this.calculate.calculateDuration(element?.start_time, element?.end_time);
            }
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
      }
    }));
  }

  clickToRejectCandidate(event) {
  }
  clickToCreateOffer(event) {
    this.router.navigateByUrl(
      `jobs/details/job-details/${this.jobId}/candidate/${event.candidateId}/offers?createOffer=true`
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
    //this.onMarkAsCompleted({ 'status': 'COMPLETED' }, event.interviewId)
    // Need to call api onced Ravi answered the queries
  }
  onSidePanelClose() {
    this.showSidePanel = "hidden";
  }

  onSubmit(event) {
    let payLoad: any = {
      status: 'COMPLETED'
    } ;
    if(event?.reason) {
      payLoad.status_reason = event?.reason
    };
    if(event?.rating) {
      payLoad.interview_rating = event?.rating
    };
    if( event?.notes) {
      payLoad.status_note = event?.notes
    }
    this.onMarkAsCompleted(payLoad, this.interviewId)
    this.showSidePanel = "hidden";
  }


  onMarkAsCompleted(payload, interviewId) {
    this.tableLoaded = false;
    this.subscriptions.push(this.jobService.put(`${this.submissionManager}/programs/${this.programId}/jobs/${this.jobId}/interviews/${interviewId}`, payload).subscribe({
      next: (data) => {
        this.tableLoaded = true;
        this._alert.success('Candidate Interview status Successfully Updated')
        this.getInterviews();
      },
      error: (error) => {
        this.tableLoaded = true;
        this._alert.error(errorHandler(error))
      }}));
  }

  previewClicked(event) {
    if (event) {
      this._eventStrem.emit(
        new EmitEvent(Events.JOB_DETAIL_SIDEBAR_VIEW, {
          value: event,
          selectedIndex: 3,
          candidateId: event.candidateId,
          job_id: this.jobId,
          interviewId: event.interviewId
        })
      );
    }
  }

  onEditClick(event) {

    this.router.navigateByUrl(
      `jobs/details/job-details/${this.jobId}/candidate/${event?.candidateId}/interviews/edit/${event?.interviewId}`
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
    this.router.navigateByUrl(
      `jobs/details/job-details/${this.jobId}/candidate/${event.candidateId}/interviews/create`
    );
  }

  rescheduleInterview(event) {
    this.router.navigateByUrl(
      `jobs/details/job-details/${this.jobId}/candidate/${event?.candidateId}/interviews/re-schedule/${event?.interviewId}`
    );
  }
  clickToEditInterview(event) {
    this.router.navigateByUrl(
      `jobs/details/job-details/${this.jobId}/candidate/${event?.candidateId}/interviews/edit/${event?.interviewId}`
    );
  }
  cancelInterview(e) {
    if (e) {
      this._eventStrem.emit(new EmitEvent(Events.CANCEL_INTERVIEW, { value: e }));
    }
  }
  clickToReviewInterview (event) {
    this.router.navigateByUrl(`jobs/details/job-details/${this.jobId}/candidate/${event?.candidateId}/interviews/details?id=${event.interviewId}`);
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
    this.subscriptions.push(this.jobService.post(`${this.submissionManager}/programs/${programId}/jobs/${this.jobId}/interviews/advance-filter`, filter).subscribe({
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
          date = this.localDateFormat.transform(element?.date, null, null, null, true),
          time = element?.start_time;
          let durationString = this.calculate.calculateDuration(element?.start_time, element?.end_time);
          duration = `${durationString} mins`;
        }
      });
      const interviewer = item?.interviewers.filter(x => x.member_type === "INTERVIEWER");
      if(item?.status) {
        item.status = this.getDisplayStatus(item?.status);
      }
      // if(item?.status?.toLowerCase()==='pending_interview_review'){
      //   item.status='pending review';
      // }
      // if(item?.status?.toLowerCase()==='pending_acceptance'){
      //   item.status='pending acceptance';
      // }

      let interview = {
        "name": this.jobService.toTitleCase(item.name),
        "candidateName": candidate_name1,
        "candidateId": item.candidate?.id,
        "interviewId": item.id,
        "interview_type": item.interview_type,
        "type": type,
        "location": item.location,
        "instructions": item.instructions,
        "time_zone": item.time_zone,
        "duration": duration,
        "status": item.status,
        "offer_status": item.offer_status,
        "candidate_submission_status": item.candidate_submission_status,
        "date": date,
        "time": time,
        "interviewers": item.interviewers,
        "interviewer": interviewer.map(i => i.full_name),
        "schedules": item.schedules,
        "created_on": this.localDateFormat.transform(item.created_on, null, null, null, true),
        "interviewTitle": item.name,
        "offer_visibility": item?.offer_visibility,
        "job_status": item?.job?.job_status,
        "mtp_id": item?.candidate.mtp_id
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

}
