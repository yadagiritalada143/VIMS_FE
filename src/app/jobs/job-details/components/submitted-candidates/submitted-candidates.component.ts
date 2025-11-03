import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { EmitEvent, Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { CandidateService } from 'src/app/candidates/service/candidate.service';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { Router, ActivatedRoute } from '@angular/router';
import { VMSConfig } from 'src/app/library/smartTable/table/table.model';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { UserType } from 'src/app/dashboard/dashboard.enums';
import { AccuracyPipe } from 'src/app/shared/pipe/accuracy.pipe';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { JobDetailsService } from 'src/app/jobs/job-details/job-details.service';
import { AuthorizationService } from 'src/app/core/services/authorize.service';
import { LOG_TYPE } from 'src/app/library/logs/logs.model';
import * as _ from 'lodash';
import { MasterProfilePermissions } from 'src/app/assignment/enums/master-profile-permissions';
import { MasterTalentProfileService } from 'src/app/master-talent-profiles/master-talent-profile.service';

@Component({
  selector: 'app-submitted-candidates',
  templateUrl: './submitted-candidates.component.html',
  styleUrls: ['./submitted-candidates.component.scss'],
})
export class SubmittedCandidatesComponent implements OnInit, OnDestroy {
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
  filterpayLoad: any;
  filters: any = {};
  currentProgram: any;
  public limit = 10;
  public pageNumber = 1;
  countDuplicate: number = 0;
  payload: any = {};
  rotuterLinkParams;
  rotuterLinkParseFn;
  templateId: any;
  // @ViewChild(GridViewComponent) public grid: GridViewComponent;
  userRole: any;
  jobStatus: any;
  filterSubmissionData: any;
  baseURL: any;
  public user_type: any;
  isVendorNeutral: boolean;
  isShowVendor: boolean = true;
  isShowVendorColumn: boolean = true;
  logs:any;
  isMasked = this.authorizationService.authorize('mask_unique_id');
  selectedCanForComparison = [];
  showCompareScreen:boolean = false;
  candidatesInfo:any;
  showCandidateScore: boolean = false;
  isScoringEnabled: boolean = false;
  isVendor: boolean = false;
  scoringFactors = [];
  savedScoringFactors = [];
  compareDisabled: boolean = true;
  currentOptStatus: boolean;
  profileId:string;
  public mtpDetails: any = null;
  offerNewWorkflow: boolean = false;
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
    private changeDetection: ChangeDetectorRef,
    private masterTalentProfileService:MasterTalentProfileService,
  ) {}

  ngOnInit(): void {
    this.currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.offerNewWorkflow = this.currentProgram?.config?.offer?.offer_details_new_ui ?? false;
    this.baseURL = '/submission-manager';
    this.userRole = this.storageService.get('account')?.role?.organization_category?.toLowerCase();
    this.jobId = this.route.parent?.snapshot.params['id'];
    this.user_type = this.storageService.get('user_type');
    this.isVendorNeutral = this.storageService.get('CurrentProgram')?.config?.is_vendor_neutral;
    if(this.user_type?.toLowerCase() == "vendor"){
      this.isVendor = true;
      this.isShowVendor = false;
    }
    this.isMasked = this.isMasked && this.user_type?.toUpperCase() !== UserType.Super_org;
    this.templateId = this.route.snapshot.queryParams['templateId'];
    if((this.user_type?.toLowerCase() == "client") && this.isVendorNeutral){
      this.isShowVendor = false;
      this.isShowVendorColumn = false;
    }
    this.eventStream.on(Events.JOB_OPT_OPTIONS).subscribe( data =>{
      this.currentOptStatus = data;
    })
    this.rotuterLinkParams = { jobId: this.jobId };
    this.rotuterLinkParseFn = (rowData, options) => `jobs/details/job-details/${options?.jobId}/candidate/${rowData?.id}/submissions`;
    this.isScoringEnabled = this.currentProgram?.config?.candidate_matching_score?.is_enabled && this.authorizationService.authorize('view_submitted_candidate_matching_score');
    if(this.isScoringEnabled) {
      this.scoringFactors = [
        { name: 'skills', value: 0 },
        { name: 'labor_category', value: 0 },
        { name: 'job_title', value: 0 },
        { name: 'education', value: 0 },
        { name: 'certification', value: 0 }
      ]
      const key_parameters = this.currentProgram?.config?.candidate_matching_score?.key_parameters;
      this.scoringFactors?.forEach(factor=>{
        factor.value = key_parameters[factor?.name];
      })
      this.savedScoringFactors = _.cloneDeep(this.scoringFactors);
    }
    this.getSubmissionStatus();
    this.tableConfig = {
      title: 'Submitted Candidates',
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
          canViewMtp: this.masterTalentProfileService.hasPermission(MasterProfilePermissions.VIEW_MTP_SCREEN),
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
          isMasked: this.isMasked
        },
        {
          name: 'availability',
          title: 'Availability',
          width: 12,
          isIcon: false,
          isImage: false,
          isContact: false,
          isNumberBadge: false,
          isDate: true,
        },
        {
          name: 'vendor',
          title: 'Vendor',
          width: 15,
          isIcon: false,
          isImage: false,
          isContact: false,
          isSort: true,
          isNumberBadge: false,
        },
        {
          name: 'rateValue',
          title: (this.user_type === UserType.Vendor? 'Vendor': 'Client')+' Bill Rate',
          width: 15,
          isIcon: false,
          isImage: false,
          isContact: false,
          isNumberBadge: true,
        },
        // {
        //   name: 'est_hours',
        //   title: 'Estimated Hours',
        //   width: 10,
        //   isIcon: false,
        //   isImage: false,
        //   isContact: false,
        //   isNumberBadge: false,
        //   hideBadege: true,

        // },
        // {
        //   name: 'est_pay',
        //   title: 'Estimated Bill',
        //   width: 8,
        //   isIcon: false,
        //   isImage: false,
        //   isContact: false,
        //   isNumberBadge: true,
        //   hideBadege: true,
        // },
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
        // {
        //   name: 'candidate_matching_score.score',
        //   title: 'Profile Matching',
        //   width: 15,
        //   isIcon: false,
        //   isImage: false,
        //   isContact: false,
        //   isSort: true,
        //   isNumberBadge: false,
        //   isProfileMatch: false,
        //   isCandidateStatus: false,
        //   linearProgressBar: true,
        // },
        {
          name: 'candidate_matching_score.score',
          title: 'Profile Matching',
          width: 15,
          isIcon: false,
          isImage: false,
          isContact: false,
          isSort: true,
          isNumberBadge: false,
          isProfileMatch: false,
          isCandidateStatus: false,
          linearProgressBar: false,
          circularProgressBar: true
        },
        // { name: 'match', title: 'Match', width: 12, isIcon: false, isImage: false, isContact: false, isNumberBadge: false, isVieworEdit: false, isDisableorDelete: false, isDelete: false, isViewProfile: false, isWithdrawal: true, isProfileMatch: true },
        // { name: 'match', title: 'Match', width: 12, isIcon: false, isImage: false, isContact: false, isVieworEdit: false, isDisableorDelete: false, isDelete: false, isViewProfile: false, isWithdrawal: true, isNumberBadge: false, isProfileMatch: true},
      ],
      isExpand: false,
      isFilter: true,
      isSearch: true,
      isSetting: true,
      isTopPagination: true,
      hideResultCount: true,
      isCreate: false,
      density: 'COMFORTABLE',
      tableWidth: '1200px',
      isTopHeader: true,
      isCheckboxOption: this.isScoringEnabled,
      showComparisonBtn: this.isScoringEnabled,
      showScoreCalculator: this.isScoringEnabled,
      scoreFactors: [...this.scoringFactors],
      tableNoDataObj: {
        headTitle: 'No Candidates Submitted',
        subTitle: 'There are no Candidates Submitted',
        imageUrl: './assets/images/no-data.svg',
        isButton:
          this.userRole.toUpperCase() !== UserType.MSP && this.userRole.toUpperCase() !== UserType.Client
            ? 'View Available candidates'
            : undefined,
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

    this.hideVendor();
    if(this.isScoringEnabled) {
      this.sortObj.name = 'candidate_matching_score';
      this.submitCandidateScore(this.scoringFactors);
    } else {
      this.getSubmittedCandidateList();
    }
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
    this.getHideProfileMatching();
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

  onClickShortListCandidate(event) {
    if (event) {
      this.showCompareScreen = false;
      this.getSubmittedCandidateList(1);
    }
  }

  onRejectCandidate(event) {
    if (event) {
      this.showCompareScreen = false;
      this.getSubmittedCandidateList(1);
    }
  }

  onClickBacktoSubmittedCandidates(event){
    if(event){
      this.showCompareScreen = false;
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

  hideVendor(){
    const vendor = 'vendor';
    if (!this.isShowVendor) {
      this.tableConfig.columnList = this.tableConfig?.columnList.filter(item => item.name !== vendor);
    }
  }

  getHideUniqueId() {
    const hidePIIFlag = this.authorizationService.authorize('hide_pii_flag');
    let uniqueId = 'unique_id';
    if (hidePIIFlag) {
      this.tableConfig.columnList = this.tableConfig?.columnList.filter(item => item.name !== uniqueId);
    }
  }

  getHideProfileMatching() {
    const hideProfileMatching = !this.isScoringEnabled;
    if (hideProfileMatching) {
      this.tableConfig.columnList = this.tableConfig?.columnList.filter(item => item.name !== 'candidate_matching_score.score');
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

  getSubmittedCandidateList(pageNo = 1, scoringFactors?) {
    this.dataLoader = true;
    let search = this.searchTerm ? '&k=' + this.searchTerm : '';
    search = `${search}${this.sortObj && this.sortObj.order ? (this.sortObj.order === 'DESC' ? '&order_by=desc' : '&order_by=asc') : ''}`;
    if (this.sortObj) {
      if (this.sortObj.name === 'candidate') search = `${search}&key=first_name`;
      else search = `${search}&key=${this.sortObj.name}`;
    }
    var cand_arr = [];
    // let programId = "04f00cc1-67ef-435b-884a-654e20587a2a";
    let programId = this.currentProgram?.id;
    let JobID = this.jobId; // this.jobId;
    this.countDuplicate = 0;
    this.subscriptions.push(
      this.candidateService.getSubmittedCandidate(this.limit, pageNo, search, programId, JobID, this.isScoringEnabled , scoringFactors).subscribe({
        next: (data: any) => {
          if (data) {
            this.dataLoader = false;
            const hasMtpViewPermission:boolean = this.masterTalentProfileService.hasPermission(MasterProfilePermissions.VIEW_MTP_SCREEN);
            data?.candidates?.forEach(element => {
              this.jobStatus = element?.job?.job_status;
              let candidate_name1 = element?.middle_name
                ? `${element?.first_name} ${element?.middle_name} ${element?.last_name}`
                : `${element?.first_name} ${element?.last_name}`;
              candidate_name1 = this.jobService.toTitleCase(candidate_name1);
              const cand_full_name = candidate_name1;
              candidate_name1 = `${candidate_name1} <div>`;
              if (element?.is_rehire) {
                candidate_name1 += ` <span class="custom-tooltip"> <img src='assets/images/rehire.svg' /> <span class="tooltiptext"><strong>Re-hire</strong> ${
                  element?.candidate_worked_as ? `- ` + this.getWorkedRehire(element?.candidate_worked_as) : ``
                }</span> </span>`;
              }
              if(!this.isVendor){
                if(element?.is_duplicate_unique_id){
                  this.countDuplicate += 1;
                  candidate_name1 += ` <span class="custom-tooltip"> <i class="material-icons mr-8">report</i> <span class="tooltiptext">Potential Duplicate Submittal</span> </span>`;
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
                mtp_id: hasMtpViewPermission ? element.mtp_id : null,
                candidate: candidate_name1,
                cand_full_name,
                unique_id: element?.unique_id,
                availability: element?.available_date,
                rateValue: this.accuracyPipe.transform(element?.bill_rate, 'rate', {currencyCode: currency}),
                est_hours: element?.job?.estimated_hours,
                status: element?.status,
                vendor: element?.vendor?.name,
                est_pay: this.accuracyPipe.transform(element?.job?.estimated_bill_rate, 'rate', {currencyCode: currency}),
                submitted_on: this.datePipe.transform(element.submitted_on)+' '+this.datePipe.transform(element.submitted_on,'hh:mm:ss a z'),
                job_status: element?.job?.job_status,
                job_manager_id : element?.job?.job_manager_id,
                job_rate_model: this.currentProgram?.config?.is_rate_model_and_markup_from_job_hierarchy ? element?.job?.rate_model : this.currentProgram?.config?.program_model,
                //element?.job?.rate_model
                is_schedule_interview: element?.is_schedule_interview,
                is_preidentified_candidate: element?.is_preidentified_candidate,
                offerID: element?.offer_id,
                opt_option: element?.job?.opt_option,
                // "submittenOn": Difference_In_Days,
                match: {
                  matchValue: 20,
                  status: element.status,
                },
                is_budget_exceeded: element?.is_budget_exceeded ? element?.is_budget_exceeded : false,
                offer_visibility: element?.offer_visibility,
                candidate_matching_score: element?.candidate_matching_score,
                candidate_ref_id: element?.candidate_ref_id,
                candidate_name_initials: element?.candidate_name_initials,
                candidate_image: element?.candidate_image
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
        },
       error: (err) => {
          this.dataLoader = false;
          this._alert.error(errorHandler(err));
        },
  }),
    );
  }

  setCount(data: number){
    this.countDuplicate += data;
  }
  getDisplayStatus(offer_status: string) {
    let offerStatus = offer_status;
    switch (offer_status) {
      case 'OFFER_RELEASED':
        offerStatus = 'offer released';
        break;
      case 'OFFER_ACCEPTED':
        offerStatus = 'offer accepted';
        break;
      case 'RELEASED':
        offerStatus = 'released';
        break;
      case 'ACCEPTED':
        offerStatus = 'accepted';
        break;
      case 'REJECTED':
        offerStatus = 'rejected';
        break;
      case 'COUNTERED':
        offerStatus = 'countered';
        break;
      case 'WITHDRAWN':
        offerStatus = 'withdrawn';
        break;
      case 'SUBMITTED':
        offerStatus = 'submitted';
        break;
      case 'OFFER_REJECTED':
        offerStatus = 'offer rejected';
        break;
      case 'OFFER_COUNTERED':
        offerStatus = 'offer countered';
        break;
      case 'PENDING_SHORTLIST':
        offerStatus = 'pending shortlist';
        break;
      case 'PENDING_SHORTLIST_REVIEW':
        offerStatus = 'pending shortlist review';
      break;
      case 'SHORTLIST_REVIEW_REJECTED':
        offerStatus = 'shortlist review rejected';
      break;
      case 'OFFER_PENDING_APPROVAL':
        offerStatus = 'Pending Offer Approval';
        break;
      case 'REHIRE_CHECK_PENDING':
        offerStatus = 'Re-Hire Check Pending';
        break;
      case 'REHIRE_REJECTED':
        offerStatus = 'Re-Hire Rejected';
        break;
      case 'OFFER_WITHDRAWN':
        offerStatus = 'offer withdrawn';
        break;
      case "PENDING_OFFER_REVIEW":
        offerStatus = 'Pending Offer Review';
        break;
      case "COUNTERED_PENDING_REVIEW":
        offerStatus = 'Countered Pending Review';
        break;
      case "COUNTERED_CANCELLED":
        offerStatus = 'Countered Review Cancelled';
        break;
      case "OFFER_CANCELLED":
        offerStatus = 'Offer Cancelled';
        break;
      case "COUNTERED_OFFER_REVIEW_CANCELLED":
        offerStatus = 'Countered Offer Review Cancelled';
        break;
      case "COUNTERED_OFFER_PENDING_REVIEW":
        if(!this.offerNewWorkflow) offerStatus = 'Countered Offer Pending Review';
        else offerStatus = 'Counter Offer Pending Review'
        break;
      case"OFFER_COUNTERED_PENDING_APPROVAL":
        offerStatus = 'Counter Offer Pending Approval';
        break;
      case 'INTERVIEW_CANCELLED':
        offerStatus = 'Interview Cancelled';
        break;
      case "PENDING_INTERVIEW_ACCEPTANCE":
        offerStatus = 'Pending Interview Acceptance';
        break;
      case 'INTERVIEW_ACCEPTED':
        offerStatus = 'Interview Accepted';
        break;
      case 'INTERVIEW_REJECTED':
        offerStatus = 'Interview Rejected';
        break;
      case 'INTERVIEW_COMPLETED':
        offerStatus = 'Interview Completed';
        break;
      case 'PENDING_INTERVIEW_REVIEW':
        offerStatus = 'Pending Interview Review';
        break;
      case 'INTERVIEW_PENDING_ACCEPTANCE':
        offerStatus = 'Interview Pending Acceptance';
        break;
      case 'PENDING_INTERVIEW_CONFIRMATION':
        offerStatus = 'pending interview confirmation';
        break;
      case "COUNTERED_OFFER_PENDING_APPROVAL":
        offerStatus = 'Countered Offer Pending Approval';
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

  withdrawalClicked(event) {
    if (event.status?.toLowerCase() == 'submitted') {
      this._eventStrem.emit(
        new EmitEvent(Events.WITHDRAW_CANDIDATE, {
          value: true,
          candidateId: event.id,
          jobId: this.jobId,
        }),
      );
    } else if (event.status.toLowerCase() == 'withdrawn' || event.status.toLowerCase() == 'rejected' || event?.status?.toLowerCase() == 're-hire rejected') {
      this.router.navigate(['/candidates/submit-candidate'], {
        queryParams: { jobId: this.jobId, candidateId: event.id, templateId: this.templateId, isSubmitted: true },
      });
    }
  }
  clickToRejectCandidate(event) {
    if (event.status?.toLowerCase() == 'submitted' || event?.status?.toLowerCase() == 're-hire check pending') {
      this._eventStrem.emit(
        new EmitEvent(Events.REJECT_CANDIDATE, {
          value: true,
          candidateId: event.id,
          jobId: this.jobId,
        }),
      );
    }
  }

  clickToShortListReviewReject(event){
    this._eventStrem.emit(
      new EmitEvent(Events.SHORTLIST_REVIEW_REJECT, {
        value: true,
        candidateId: event?.id,
        jobId: this.jobId,
        status: event?.status
      })
    );
  }

  clickToShortListReview(event){
    this.logs = undefined;
    if (event) {
      if (event?.id) {
        let payload = {
          "candidates": [
            {
              "candidate_id": event?.id
            },
          ]
        }
        if(event?.status == "pending shortlist review"){
          this.candidateService.shortlistReviewCandidate(payload, this.currentProgram?.id, this.jobId, true).subscribe({
            next: (data: any) => {
              if (data) {
                this._alert.success('Candidate reviewed successfully.');
                this.getSubmittedCandidateList();
              }
            },
            error: (error) => {
              this.showError(error);
            }
          });
        }
      }
    }
  }

  clickToCancelOfferReview($event){
    let status = $event?.status.toLowerCase();
    if(status == 'countered offer pending review'){
      this.eventStream.emit(
        new EmitEvent(Events.COUNTERED_REVIEW_OFFER, {
          id: $event?.offerID,
          isopen: true,
          jobId: this.jobId,
        })
      );
    }
  }

  clickToEditOfferReview($event){
    if ($event) {
      if ($event?.id) {
        this.router.navigateByUrl(
          `jobs/details/job-details/${this.jobId}/candidate/${$event?.id}/offers?offerId=${$event?.offerID}&offerEdit=true&offerPageMode=edit`
        );
      }
    }
  }

  clickToOfferReview($event) {
    if ($event) {
      if ($event?.id) {
        this.router.navigateByUrl(
          `jobs/details/job-details/${this.jobId}/candidate/${$event?.id}/offers?offerId=${$event?.offerID}`
        );
      }
    }
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

  potentialDuplicate(event) {
    if (event) {
      this.eventStream.emit(new EmitEvent(Events.POTENTIAL_DUPLICATE, { value: true }))
    }
  }

  onEditClick(data) {}
  cloneClicked(e) {}
  onExpandClick(e) {}

  onPaginationClick(e) {
    this.pageNumber = e;
    this.getSubmittedCandidateList(e);
  }

  sortColMap = {
    submitted_on: 'created_on',
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
      if(event?.name == 'candidate_matching_score.score') {
        event.name = 'candidate_matching_score'
      }
      if (this.sortColMap[event.name]) {
        event.name = this.sortColMap[event.name];
      }
      this.sortObj = event;
      if(this.isScoringEnabled) {
        this.submitCandidateScore(this.savedScoringFactors);
      } else {
        this.getSubmittedCandidateList(1);
      }
    }
  }

  onClickRecords(event) {
    this.limit = event;
    this.pageNumber = 1;
    this.getSubmittedCandidateList(1);
  }
  clickToScheduleInterview(event) {
    if (event) {
      // this._eventStrem.emit(new EmitEvent(Events.RE_SCHEDULE_INTERVIEW,
      //   {
      //     data : event,
      //     jobId : this.jobId ,
      //     programID: this.currentProgram?.id,
      //     interviewId: "4ae8519b-7617-4fc3-bb7b-b23f8f8cb07d"
      //   }
      // ));
      // this._eventStrem.emit(
      //   new EmitEvent(Events.SCHEDULE_INTERVIEW, {
      //     data: event,
      //     jobId: this.jobId,
      //     programID: this.currentProgram?.id,
      //   })
      // );
      this.router.navigateByUrl(`jobs/details/job-details/${this.jobId}/candidate/${event.id}/interviews/create`);
    }
  }
  clickTorRehireCheck(event) {
    if (event) {
      if (event.id) {
        this.router.navigateByUrl(`jobs/details/job-details/${this.jobId}/candidate/${event?.id}/submissions?is_submission=true`);
      }
    }
  }

  submittedCandidates(event) {}
  clickViewSubmittedCandidate(event) {
    if (event) {
      this._eventStrem.emit(new EmitEvent(Events.VIEW_SUBMITTED_CANDIDATE_PROFILE, { value: event }));
    }
  }
  onDeleteClick(role) {}

  disableClicked(role) {}

  onCreateClick(e) {}

  columnClicked(columnData) {}

  clickToCreateOffer(event) {
    this.router.navigateByUrl(`jobs/details/job-details/${this.jobId}/candidate/${event.id}/offers?createOffer=true`);
  }
  onClickNext(event) {
    if (event) {
      this.eventStream.emit(new EmitEvent(Events.JOB_TAB_CHANGE,'available'));
      this.router.navigate(['/jobs/details/job-details', this.jobId, 'available']);
    }
  }

  onSearch(term) {
    this.searchTerm = term;
    if(this.isScoringEnabled) {
      this.submitCandidateScore(this.savedScoringFactors);
    } else {
      this.getSubmittedCandidateList();
    }
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
                this.jobStatus = element?.job?.job_status;
                let candidate_name1 = element?.middle_name
                  ? `${element?.first_name} ${element?.middle_name} ${element?.last_name}`
                  : `${element?.first_name} ${element?.last_name}`;
                const cand_full_name = candidate_name1;
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
                    candidate_name1 += ` <span class="custom-tooltip"> <i class="material-icons mr-8">report</i> <span class="tooltiptext">Potential Duplicate Submittal</span> </span>`;
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
                  cand_full_name,
                  unique_id: element?.unique_id,
                  availability: element?.available_date,
                  rateValue: this.accuracyPipe.transform(element?.bill_rate, 'rate', {currencyCode: currency}),
                  est_hours: element?.job?.estimated_hours,
                  status: element.status,
                  vendor: element?.vendor?.name,
                  est_pay: this.accuracyPipe.transform(element?.job?.estimated_bill_rate, 'rate', {currencyCode: currency}),
                  submitted_on: this.datePipe.transform(element.submitted_on)+' '+this.datePipe.transform(element.submitted_on,'hh:mm:ss a z'),
                  submittenOn: Difference_In_Days,
                  job_status: element?.job?.job_status,
                  job_manager_id : element?.job?.job_manager_id,
                  job_rate_model: this.currentProgram?.config?.is_rate_model_and_markup_from_job_hierarchy ? element?.job?.rate_model : this.currentProgram?.config?.program_model,
                  is_schedule_interview: element?.is_schedule_interview,
                  offerID: element?.offer_id,
                  opt_option: element?.job?.opt_option,
                  match: {
                    matchValue: 20,
                    status: element.status,
                  },
                  is_budget_exceeded: element?.is_budget_exceeded ? element?.is_budget_exceeded : false,
                  is_show_rehire: element?.is_approver,
                  offer_visibility: element?.offer_visibility,
                  candidate_ref_id: element?.candidate_ref_id,
                  candidate_name_initials: element?.candidate_name_initials,
                  candidate_image: element?.candidate_image
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

  filterData(programID, jobID, payLoad) {}

  ngOnDestroy(): void {
    this.subscriptions?.forEach(sub => sub.unsubscribe());
  }

  candidateScoreFlyout($event) {
    this.showCandidateScore = true;
    this.changeDetection.detectChanges();
    if($event) {
      this.eventStream.emit(new EmitEvent(Events.VIEW_CANDIDATE_SCORE, {
        value: true,
        data: $event,
        scoreFactors: this.savedScoringFactors
      }));
    }
  }

  selectAllClicked(data) {
    this.selectedCanForComparison = data?.selected?.filter(res=>res?.isChecked);
    this.getComparisonPayload(this.selectedCanForComparison)
  }

  selectClicked(data) {
    if(!data?.selected?.isChecked) {
      const idx = this.selectedCanForComparison.findIndex((res)=>res?.id == data?.selected?.id);
      this.selectedCanForComparison.splice(idx, 1);
    } else {
      this.selectedCanForComparison.push(data?.selected);
    }
    this.getComparisonPayload(this.selectedCanForComparison)
  }

  getComparisonPayload(data){
    let candidatesArr = data?.map((obj) => obj.id);
    this.compareDisabled = candidatesArr.length > 1 ? false : true;
    let payloadCandidates = {
      program_id : this.currentProgram?.id,
      job_id: this.jobId,
      candidate_ids: candidatesArr,
      weights: this.weightPayload([...this.savedScoringFactors])
    }
    this.candidatesInfo = payloadCandidates;
  }

  weightPayload(arr){
    let obj = {};
    for (const item of arr) {
      obj[item.name] = this.isScoringEnabled ? (isNaN(item.value) ? item.value : parseInt(item.value)) : 0;
    }
    return obj;
  }

  navigateToCompareScreen(event) {
    if(this.selectedCanForComparison?.length > 1) {
      this.showCompareScreen = true;
    }
  }


  closeSidebar() {
    this.showCandidateScore = false
  }

  submitCandidateScore(event) {
    let scoreFactorQuery = "";
    this.savedScoringFactors = _.cloneDeep(event);;
    event?.forEach((scoreObj,i)=> scoreFactorQuery+=scoreObj?.name+"="+(scoreObj?.value ? scoreObj?.value : 0)+ (i == event?.length-1 ? "" : "&"));
    this.getSubmittedCandidateList(1,scoreFactorQuery);
  }

  openLinkingModal(mtpId){
    if (this.authorizationService.authorize(MasterProfilePermissions.VIEW_MTP_SCREEN)) {
      this.mtpDetails = true;
      this.profileId = mtpId;
    }
  }
  closemtpModal(){
    this.mtpDetails = false;
  }
}
