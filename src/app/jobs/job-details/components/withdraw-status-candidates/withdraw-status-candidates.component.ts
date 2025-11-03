import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { EmitEvent, Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { CandidateService } from 'src/app/candidates/service/candidate.service';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { Router, ActivatedRoute } from '@angular/router';
import { VMSConfig } from 'src/app/library/smartTable/table/table.model';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { AccuracyPipe } from 'src/app/shared/pipe/accuracy.pipe';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { JobDetailsService } from 'src/app/jobs/job-details/job-details.service';
import { AuthorizationService } from 'src/app/core/services/authorize.service';
import { LOG_TYPE } from 'src/app/library/logs/logs.model';

@Component({
  selector: 'app-withdraw-status-candidates',
  templateUrl: './withdraw-status-candidates.component.html',
  styleUrls: ['./withdraw-status-candidates.component.scss']
})
export class WithdrawStatusCandidatesComponent implements OnInit {
  private subscriptions = [];
  public dataLoader: any;
  public vmsData: any;
  public tableConfig: VMSConfig;
  public isExpand = false;
  public totalPages = 0;
  public totalRecords = 0;
  gridContentType = 'candidate';
  tableLoaded = false;
  dataLoading = true;
  public viewGrid: boolean = true;
  public gridVewJson: any = {};
  itemsPerPage: any;
  searchTerm: any;
  jobId: any;
  filterDataPage: number;
  isAdvanceSearch = false;
  isVendor: boolean = false;
  filterpayLoad: any;
  filters: any = {};
  currentProgram: any;
  public limit = 10;
  public pageNumber = 1;
  payload: any = {};
  rotuterLinkParams;
  rotuterLinkParseFn;
  templateId: any;
  // @ViewChild(GridViewComponent) public grid: GridViewComponent;
  userRole: any;
  jobStatus: any;
  filterSubmissionData: any;
  baseURL: any;
  @Output() countData = new EventEmitter<number>();
  public user_type: any;
  logs:any;
  countDuplicate: number = 0;
  constructor(
    private _eventStrem: EventStreamService,
    private candidateService: CandidateService,
    private _alert: AlertService,
    private _loader: LoaderService,
    private route: ActivatedRoute,
    private router: Router,
    private storageService: StorageService,
    private eventStream: EventStreamService,
    public  accuracyPipe: AccuracyPipe,
    private datePipe: LocalDateFormatPipe,
    public jobService: JobDetailsService,
    private authorizationService: AuthorizationService,
  ) { }


  ngOnInit(): void {
    this.currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.baseURL = '/submission-manager';
    this.userRole = this.storageService.get('account')?.role?.organization_category?.toLowerCase();
    this.jobId = this.route.parent?.snapshot.params['id'];
    this.user_type = this.storageService.get('user_type');
    if(this.user_type?.toLowerCase() == "vendor"){
      this.isVendor = true;
    }
    this.templateId = this.route.snapshot.queryParams['templateId'];
    this.rotuterLinkParams = { jobId: this.jobId };
    this.rotuterLinkParseFn = (rowData, options) => `jobs/details/job-details/${options?.jobId}/candidate/${rowData?.id}/submissions`;
    this.getSubmissionStatus();
    this.tableConfig = {
      title: 'Withdrawn Candidates',
      columnList: [
        {
          name: 'candidate',
          title: 'Candidate Name',
          width: 25,
          isIcon: true,
          isImage: true,
          isContact: false,
          isNumberBadge: false,
          isVieworEdit: false,
          isDisableorDelete: false,
          isDelete: false,
          isViewProfile: false,
          isWithdrawal: true,
          isViewEnabled: true,
          isScheduleInterview: true,
          isCreateOffer: true,
          isRejectCandidate: true,
          showPreviewIcon: true,
          isSort: true,
        },
        {
          name: 'status',
          title: 'Status',
          width: 10,
          isIcon: false,
          isImage: false,
          isContact: false,
          isNumberBadge: false,
          isCandidateStatus: false,
          isSort: true,
        },
        {
          name: 'unique_id',
          title: 'Unique ID',
          width: 13,
          isIcon: false,
          isImage: false,
          isContact: false,
          isSort: true,
          isNumberBadge: false,
        },
        {
          name: 'status_reason',
          title: 'Withdraw Reason',
          width: 12,
          isIcon: false,
          isImage: false,
          isContact: false,
          isNumberBadge: false,
          isDate: true,
        },
        {
          name: 'submitted_on',
          title: 'Submitted On',
          width: 15,
          isIcon: false,
          isImage: false,
          isContact: false,
          isSort: true,
          isNumberBadge: false,
          isProfileMatch: false,
          isCandidateStatus: false,
        },
        // { name: 'match', title: 'Match', width: 12, isIcon: false, isImage: false, isContact: false, isNumberBadge: false, isVieworEdit: false, isDisableorDelete: false, isDelete: false, isViewProfile: false, isWithdrawal: true, isProfileMatch: true },
        // { name: 'match', title: 'Match', width: 12, isIcon: false, isImage: false, isContact: false, isVieworEdit: false, isDisableorDelete: false, isDelete: false, isViewProfile: false, isWithdrawal: true, isNumberBadge: false, isProfileMatch: true},
      ],
      isExpand: false,
      isFilter: false,
      isSearch: true,
      isSetting: true,
      isTopPagination: true,
      hideResultCount: true,
      isCreate: false,
      density: 'COMFORTABLE',
      tableWidth: '1200px',
      isTopHeader: true,
      tableNoDataObj: {
        headTitle: 'No Withdrawals Found',
        subTitle: 'There are no withdrawals',
        imageUrl: './assets/images/no-withdrawals.svg'
      },
      advanceFilter: [
        {
          name: 'available_date',
          title: 'Available Date Range',
          filterType: 'DATERANGE',
        },
        // { name: 'estimated_pay_rate_range', title: 'Estimated Pay Rate', filterType: 'TEXT' },
        {
          name: 'min',
          placeholder: 'Min',
          placeholder_1: 'Max',
          title: 'Estimated Pay Rate',
          filterType: 'RANGE',
        },
        // { name: 'matching_score_min', placeholder: 'Min', placeholder_1: 'Max', title: 'Match % Score', filterType: 'RANGE' },

        // { name: 'matching_score_min', title: 'Match % Score', filterType: 'TEXT' },
        {
          name: 'submitted_on',
          title: 'Submitted Date Range',
          filterType: 'DATERANGE',
        },
        {
          name: 'status',
          title: 'Status',
          filterType: 'SELECT',
          multiSelectData: this.filterSubmissionData,
        },
      ],
    };
    this.subscriptions?.push(this._eventStrem.on(Events.WITHDRAW_CANDIDATE_SUCCESS).subscribe(data => {
      if (data) {
        this.getSubmittedCandidateList();
      }
    }));
    this.getSubmittedCandidateList();
    this.subscriptions.push(
      this._eventStrem.on(Events.SHOW_GRID_LAYOUT).subscribe(data => {
        // this.viewGrid = false;
        if (data) {
          this.viewGrid = false;
        } else {
          this.viewGrid = true;
        }
      }),
    );

    this.subscriptions.push(
      this._eventStrem.on(Events.SEARCH_IN_SUB_CANDIDATE).subscribe(data => {
        if (data) {
          this.searchTerm = data.value;
          this.getSubmittedCandidateList();
        }
      }),
    );
    this.getHideUniqueId();
  }

  onUpdateRecordClick(e) {
    if (e) {
      this.limit = e;
      this.getSubmittedCandidateList(1);
    }
  }
  onClickWithdrawnCandidate(event) {
    if (event) {
      this.getSubmittedCandidateList(1);
    }
  }
  getWorkedRehire(arr) {
    if (arr instanceof Array) {
      let str = arr?.join(', ');
      return str
        ?.toLowerCase()
        .replace(/_/g, ' ')
        .replace(/(?: |\b)(\w)/g, function (key, p1) {
          return key.toUpperCase();
        });
    } else {
      return arr
        ?.toLowerCase()
        .replace(/_/g, ' ')
        .replace(/(?: |\b)(\w)/g, function (key, p1) {
          return key.toUpperCase();
        });
    }
  }

  getHideUniqueId() {
    const hidePIIFlag = this.authorizationService.authorize('hide_pii_flag');
    let uniqueId = 'unique_id';
    if (hidePIIFlag) {
      this.tableConfig.columnList = this.tableConfig?.columnList.filter(item => item.name !== uniqueId);
    }
  }

  getSubmissionStatus() {
    let page = 'submission';
    let programId = this.currentProgram?.id;
    this.filterSubmissionData = [];
    this.subscriptions.push(
      this.candidateService.getStatus(programId, page).subscribe((data: any) => {
        let submissionStatusData = data.status;
        submissionStatusData.forEach((i, o) => {
          let newArr = {};
          newArr['name'] = Object.values(submissionStatusData[o]).toString();
          newArr['value'] = Object.keys(submissionStatusData[o]).toString();
          this.filterSubmissionData.push(newArr);
        });
      }),
    );
  }
  getSubmittedCandidateList(pageNo = 1) {
    this.dataLoader = true;
    let search = this.searchTerm ? '&k=' + this.searchTerm : '';
    search = `${search}${this.sortObj && this.sortObj.order ? (this.sortObj.order === 'DESC' ? '&order_by=desc' : '&order_by=asc') : ''}`;
    if (this.sortObj) {
      if (this.sortObj.name === 'candidate') search = `${search}&key=first_name`;
      else search = `${search}&key=${this.sortObj.name}`;
    }
    var cand_arr = [];
    // let programId = "04f00cc1-67ef-435b-884a-654e20587a2a";
    search = `${search}&status=withdrawn`;
    let programId = this.currentProgram?.id;
    let JobID = this.jobId; // this.jobId;
    this.subscriptions.push(
      this.candidateService.getSubmittedCandidate(this.limit, pageNo, search, programId, JobID).subscribe({
        next: (data: any) => {
          if (data) {
            this.dataLoader = false;
            data?.candidates?.forEach(element => {
              let candidate_name1 = element?.middle_name
                ? `${element?.first_name} ${element?.middle_name} ${element?.last_name}`
                : `${element?.first_name} ${element?.last_name}`;
              candidate_name1 = this.jobService.toTitleCase(candidate_name1);
              candidate_name1 = `${candidate_name1} <div>`;
              if (element?.is_rehire) {
                candidate_name1 += ` <span class="custom-tooltip"> <img src='assets/images/rehire.svg' /> <span class="tooltiptext"><strong>Re-hire</strong> ${
                  element?.candidate_worked_as ? `- ` + this.getWorkedRehire(element?.candidate_worked_as) : ``
                }</span> </span>`;
              }
              if(!this.isVendor){
                if(element?.is_duplicate_unique_id){
                  this.countDuplicate += 1;
                  candidate_name1 += ` <span class="custom-tooltip"> <i class="material-icons mr-8">report</i> <span class="tooltiptext">Potential Duplicate Candidate</span> </span>`;
                }
              }
              if (element?.do_not_rehire) {
                candidate_name1 += ` <span class="custom-tooltip"> <i class="material-icons"> no_accounts </i> <span class="tooltiptext">Do Not Re-hire</span> </span>`;
              }
              if (element?.ot_mismatch) {
                candidate_name1 += ` <span class="custom-tooltip"> <span class="material-icons-round" style="color:red">hourglass_top</span>  <span class="tooltiptext">OT Exempt Mismatch</span> </span>`;
              }

              candidate_name1 += ` </div>`;
              if (element.status) {
                element.status = this.getDisplayStatus(element.status);
              }
              let currency = element?.job?.currency;
              let candidate_list_data = {
                id: element.id,
                candidate: candidate_name1,
                unique_id: element?.unique_id,
                availability: element?.available_date,
                rateValue: this.accuracyPipe.transform(element?.bill_rate, 'rate', {currencyCode: currency}),
                est_hours: element?.job?.estimated_hours,
                status: element?.status,
                est_pay: this.accuracyPipe.transform(element?.job?.estimated_bill_rate, 'rate', {currencyCode: currency}),
                submitted_on: this.datePipe.transform(element.modified_on)+' '+this.datePipe.transform(element.modified_on,'hh:mm:ss a z'),
                job_status: element?.job?.job_status,
                job_rate_model: this.currentProgram?.config?.is_rate_model_and_markup_from_job_hierarchy ? element?.job?.rate_model : this.currentProgram?.config?.program_model,
                //element?.job?.rate_model
                is_schedule_interview: element?.is_schedule_interview,
                is_preidentified_candidate: element?.is_preidentified_candidate,
                status_reason: element?.status_reason || '-',
                offerID: element?.offer_id,
                opt_option: element?.job?.opt_option,
                // "submittenOn": Difference_In_Days,
                match: {
                  matchValue: 20,
                  status: element.status,
                },
                is_budget_exceeded: element?.is_budget_exceeded ? element?.is_budget_exceeded : false,
                offer_visibility: element?.offer_visibility,
              };
              cand_arr.push(candidate_list_data);
            });
            this.vmsData = { candidate: cand_arr };
            this.gridVewJson = this.vmsData;
            this.dataLoading = false;
            this.totalRecords = data?.total_records;
            this.itemsPerPage = data?.items_per_page;
            this.tableLoaded = true;
            this._loader.hide();
          } else {
            this.dataLoader = false;
            this._alert.error(`No data found.`);
          }
          this.setCount();
        },
       error: (err) => {
          this.dataLoader = false;
          this._alert.error(errorHandler(err));
        },
  }),
    );
  }

  setCount(){
    this.countData.emit(this.countDuplicate);
  }

  getDisplayStatus(offer_status: string) {
    let offerStatus = offer_status;
    switch (offer_status) {
      case 'WITHDRAWN':
        offerStatus = 'withdrawn';
        break;
    }
    return offerStatus;
  }
  datemodified(aDate) {
    let year = aDate?.slice(0, 4);
    let month = aDate?.slice(5, 7);
    let date = aDate?.slice(8, 10);
    let fullDate = date?.concat('-', month + '-', year);
    return fullDate;
  }


  showError(err) {
    window.scrollTo(0, 0);
    this.logs = {
      type: LOG_TYPE.ERROR, heading: err?.error?.error?.message ? err?.error?.error?.message : (typeof err == 'string' ? err : ''), messages: [], autoClose: true, isShown: true, showReportButton: (err?.status == 500 || err?.status == 400), additionalInfo: { trace_id: err?.error?.trace_id }
    };
    err?.error?.error?.errors?.forEach(msg => {
      if (msg?.message) {
        this.logs.messages.push(msg?.message);
      }
    });
  }

  previewClicked(event) {
    let thiss = this;
    this.eventStream.emit(
      new EmitEvent(Events.JOB_DETAIL_SIDEBAR_VIEW, {
        value: event,
        selectedIndex: 2,
        candidateId: event.id,
        job_id: thiss.jobId,
      }),
    );
  }

  onPaginationClick(e) {
    this.pageNumber = e;
    this.getSubmittedCandidateList(e);
  }

  sortColMap = {
    submitted_on: 'modified_on',
  };

  defaultSortObj = {
    name: 'created_on',
    order: 'DESC',
  };

  sortObj = {
    name: 'created_on',
    order: 'DESC',
  };

  onSortClick(event) {
    if (!!event) {
      if (this.sortColMap[event.name]) {
        event.name = this.sortColMap[event.name];
      }
      this.sortObj = event;
    } else {
      this.sortObj = this.defaultSortObj;
    }
    this.getSubmittedCandidateList(1);
  }

  onClickRecords(event) {
    this.limit = event;
    this.pageNumber = 1;
    this.getSubmittedCandidateList(1);
  }


  submittedCandidates(event) {}
  clickViewSubmittedCandidate(event) {
    if (event) {
      this._eventStrem.emit(new EmitEvent(Events.VIEW_SUBMITTED_CANDIDATE_PROFILE, { value: event }));
    }
  }

  clickToCreateOffer(event) {
    this.router.navigateByUrl(`jobs/details/job-details/${this.jobId}/candidate/${event.id}/offers?createOffer=true`);
  }
  onClickNext(event) {
    if (event) {
      this.router.navigate(['/jobs/details/job-details', this.jobId, 'available']);
    }
  }
  selectAllClicked(data) {}
  selectClicked(data) {}
  onSearch(term) {
    this.searchTerm = term;
    this.getSubmittedCandidateList();
  }

  convertDate(ts) {
    var todate = new Date(ts).getDate();
    var tomonth = new Date(ts).getMonth() + 1;
    var toyear = new Date(ts).getFullYear();
    var original_date = toyear + '-' + tomonth + '-' + todate;
    return original_date;
  }

  getFormattedDate(date) {
    if (date) {
      return this.datePipe.transform(date);
    }
  }

  onListFilter(event) {
    if (event) {
      this.payload = {
        filters: {
          // available_date: [
          //   this.convertDate(event.available_date[0]),
          //   this.convertDate(event.available_date[1]),
          // ],
          // estimated_pay_rate_range: [event.min, event.max],
          // submitted_on: event.submitted_on,
          // status: event.status,
        },
        pagination: {
          limit: 25,
          page: 1,
        },
      };
      if (event.available_date && event.available_date[0] && event.available_date[0]) {
        this.payload.filters.available_date = [
          this.getFormattedDate(event.available_date[0]),
          this.getFormattedDate(event.available_date[1]),
        ];
      }

      if (event.min && event.max) {
        this.payload.filters.estimated_pay_rate_range = [event.min, event.max];
      }

      if (event.submitted_on) {
        this.payload.filters.submitted_on = event.submitted_on.map(d => new Date(d).getTime());
      }

      if (event.status) {
        this.payload.filters.status = event.status;
      }

      this.getSubmittedCandidateListFilter();
    } else {
      this.getSubmittedCandidateList();
    }
  }
  getSubmittedCandidateListFilter() {
    let programID = this.currentProgram?.id;
    var cand_arr = [];

    this.subscriptions.push(
      this.candidateService
        .post(`${this.baseURL}/programs/${programID}/jobs/${this.jobId}/candidates/advanced-filters`, this.payload)
        .subscribe({
          next: (data: any) => {
            if (data) {
              this.dataLoader = false;
              data?.candidates.forEach(element => {
                let candidate_name1 = element?.middle_name
                  ? `${element?.first_name} ${element?.middle_name} ${element?.last_name}`
                  : `${element?.first_name} ${element?.last_name}`;

                candidate_name1 = `${candidate_name1} <div>`;
                if (element?.is_rehire) {
                  candidate_name1 += ` <span class="custom-tooltip"> <img src='assets/images/rehire.svg' /> <span class="tooltiptext"><strong>Re-hire</strong> ${
                    element?.candidate_worked_as ? `- ` + this.getWorkedRehire(element?.candidate_worked_as) : ``
                  }</span> </span>`;
                }
                if (element?.do_not_rehire) {
                  candidate_name1 += ` <span class="custom-tooltip"> <i class="material-icons"> no_accounts </i> <span class="tooltiptext">Do Not Re-hire</span> </span>`;
                }
                if(!this.isVendor){
                  if(element?.is_duplicate_unique_id){
                    candidate_name1 += ` <span class="custom-tooltip"> <i class="material-icons mr-8">report</i> <span class="tooltiptext">Potential Duplicate Candidate</span> </span>`;
                  }
                }
                if (element?.ot_mismatch) {
                  candidate_name1 += ` <span class="custom-tooltip"> <span class="material-icons-round" style="color:red">hourglass_top</span>  <span class="tooltiptext">OT Exempt Mismatch</span> </span>`;
                }

                candidate_name1 += ` </div>`;

                let date1 = new Date(element.modified_on);
                let today = new Date();
                // To calculate the time difference of two dates
                let Difference_In_Time = Math.round(today.getTime() - date1.getTime());
                // To calculate the no. of days between two dates
                let Difference_In_Days = Math.round(Difference_In_Time / (1000 * 3600 * 24));
                if (element.status) {
                  element.status = this.getDisplayStatus(element.status);
                }
                let currency = element?.job?.currency;

                let candidate_list_data = {
                  id: element.id,
                  candidate: candidate_name1,
                  unique_id: element?.unique_id,
                  availability: element?.available_date,
                  rateValue: this.accuracyPipe.transform(element?.bill_rate, 'rate', {currencyCode: currency}),
                  est_hours: element?.job?.estimated_hours,
                  status: element.status,
                  est_pay: this.accuracyPipe.transform(element?.job?.estimated_bill_rate, 'rate', {currencyCode: currency}),
                  submitted_on: this.datePipe.transform(element.modified_on)+' '+this.datePipe.transform(element.modified_on,'hh:mm:ss a z'),
                  submittenOn: Difference_In_Days,
                  job_status: element?.job?.job_status,
                  job_rate_model: this.currentProgram?.config?.is_rate_model_and_markup_from_job_hierarchy ? element?.job?.rate_model : this.currentProgram?.config?.program_model,
                  is_schedule_interview: element?.is_schedule_interview,
                  offerID: element?.offer_id,
                  opt_option: element?.job?.opt_option,
                  status_reason: element?.status_reason || '-',
                  match: {
                    matchValue: 20,
                    status: element.status,
                  },
                  is_budget_exceeded: element?.is_budget_exceeded ? element?.is_budget_exceeded : false,
                  is_show_rehire: element?.is_approver,
                  offer_visibility: element?.offer_visibility,
                };
                cand_arr.push(candidate_list_data);
              });
              this.vmsData = { candidate: cand_arr };
              this.gridVewJson = this.vmsData;
              this.dataLoading = false;
              this.totalRecords = data?.total_records;
              this.itemsPerPage = data?.items_per_page;
              this.tableLoaded = true;
              this._loader.hide();
            }
          },
          error: (err) => {
            this._alert.error(errorHandler(err));
            this._loader.hide();
          },
  }),
    );
  }

  reSubmitCandidate(event){
    this.router.navigate(['/candidates/submit-candidate'], {
      queryParams: { jobId: this.jobId, candidateId: event.id, templateId: this.templateId, isSubmitted: true },
    });
  }
  ngOnDestroy(): void {
    this.subscriptions?.forEach(sub => sub.unsubscribe());
  }

}

