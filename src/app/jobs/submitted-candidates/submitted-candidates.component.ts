import { Location } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MasterProfilePermissions } from 'src/app/assignment/enums/master-profile-permissions';
import { CandidateService } from 'src/app/candidates/service/candidate.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { AuthorizationService } from 'src/app/core/services/authorize.service';
import { EmitEvent, EventStreamService, Events } from 'src/app/core/services/event-stream.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { UserType } from 'src/app/dashboard/dashboard.enums';
import { JobDetailsService } from 'src/app/jobs/job-details/job-details.service';
import { LOG_TYPE } from 'src/app/library/logs/logs.model';
import { VMSConfig } from 'src/app/library/smartTable/table/table.model';
import { MasterTalentProfileService } from 'src/app/master-talent-profiles/master-talent-profile.service';
import { AccuracyPipe } from 'src/app/shared/pipe/accuracy.pipe';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { errorHandler } from 'src/app/shared/util/error-handler';

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
  public userrole: string;
  public usercategory: string;
  public userid;
  profileId:string;
  public mtpDetails: any = null;
  payload: any = {};
  rotuterLinkParams;
  rotuterLinkParseFn;
  public user_type: any;
  public showRehireCheck: boolean = false;
  tabCount: any = {
    all: 0,
    resumeToReview: 0,
    submitted: 0,
    shortlisted: 0,
    rehire: 0,
    offer_accepted: 0,
    rejected: 0,
  };
  filter: any = {};
  initFlag: boolean = true;
  countData: number[];
  public status: any = 'All';
  selectedTab: string;
  public submissionid;
  userRole: any;
  currentUserId: any;
  checkCurrentUser: any;
  // @ViewChild(GridViewComponent) public grid: GridViewComponent;
  baseUrl: any;
  logs:any;
  isMasked = this.authorizationService.authorize('mask_unique_id');
  offerNewWorkflow: boolean = false;
  constructor(
    private _eventStrem: EventStreamService,
    private jobDetailService: JobDetailsService,
    private candidateService: CandidateService,
    private _alert: AlertService,
    private _loader: LoaderService,
    private router: Router,
    private datePipe: LocalDateFormatPipe,
    private storageService: StorageService,
    private eventStream: EventStreamService,
    private route: ActivatedRoute,
    private location: Location,
    private authorizationService: AuthorizationService,
    public accuracyPipe: AccuracyPipe,
    private masterTalentProfileService:MasterTalentProfileService
  ) {}

  ngOnInit(): void {
    this.currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.offerNewWorkflow = this.currentProgram?.config?.offer?.offer_details_new_ui ?? false;
    this.userid = this.storageService.get(StorageKeys.CURRENT_USER)?.id;
    this.user_type = this.storageService.get('user_type');
    this.isMasked = this.isMasked && this.user_type?.toUpperCase() !== UserType.Super_org;
    this.baseUrl = '/submission-manager';
    this.getmember();
    this.rotuterLinkParseFn = (rowData, options) =>
      rowData?.jobId
        ? `jobs/details/job-details/${rowData?.jobId}/candidate/${rowData?.id}/submissions?is_submission=true`
        : '/jobs/submissions';
    const u = JSON.parse(localStorage.getItem('account'));
    this.userRole = u?.role?.organization_category?.toLowerCase();
    this.currentUserId = u?.role?.id;
    let userID = this.currentProgram?.config?.submission?.shortlist_role_id;
    this.checkCurrentUser = userID?.find(x => x === this.currentUserId) ? true : false;
    this.route.paramMap.subscribe(param => {
      let status = param.get('status');
      this.status = status?.replace(/%20/g, ' ');
      switch (status?.toLowerCase()) {
        case 'pending_shortlist':
          this.onTabClick('pending_shortlist');
          break;
        case 'shortlisted':
          this.onTabClick('shortlisted');
          break;
        case 'submitted':
          this.onTabClick('submitted');
          break;
        case 'offer_accepted':
          this.onTabClick('offer_accepted');
          break;
        case 'rehire':
          this.onTabClick('rehire');
          break;
        case 'rejected':
          this.onTabClick('rejected');
          break;
        default: {
          status = 'All';
          this.onTabClick(status);
          break;
        }
      }
    });
    this.tableConfig = {
      title: 'Submitted Candidates',
      columnList: [
        {
          name: 'candidate',
          title: 'Candidate Name',
          width: 20,
          isIcon: true,
          isImage: true,
          isContact: false,
          isSort: true,
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
          canViewMtp: this.masterTalentProfileService.hasPermission(MasterProfilePermissions.VIEW_MTP_SCREEN),
          isOfferReview:true
        },
        {
          name: 'status',
          title: 'Status',
          width: 10,
          isIcon: false,
          isImage: false,
          isContact: false,
          isSort: true,
          isNumberBadge: false,
          isCandidateStatus: false,
        },
        {
          name: 'job',
          title: 'Job',
          width: 20,
          isIcon: false,
          isImage: false,
          isContact: false,
          isNumberBadge: false,
        },
        {
          name: 'job_id',
          title: 'Job ID',
          width: 15,
          isIcon: false,
          isImage: false,
          isContact: false,
          isNumberBadge: false,
        },
        {
          name: 'submission_unique_id',
          title: 'submission ID',
          width: 15,
          isIcon: false,
          isImage: false,
          isContact: false,
          // isSort: true,
          isNumberBadge: false,
        },
        {
          name: 'candidate_id',
          title: 'Unique Id',
          width: 15,
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
          width: 15,
          isIcon: false,
          isImage: false,
          isContact: false,
          isNumberBadge: false,
        },
        {
          name: 'rateValue',
          title: (this.user_type === UserType.Vendor? 'Vendor': 'Client')+' Bill Rate',
          width: 10,
          isIcon: false,
          isImage: false,
          isContact: false,
          isNumberBadge: true,
        },
        // {
        //   name: 'est_hours',
        //   title: 'Estimated Hours',
        //   width: 7,
        //   isIcon: false,
        //   isImage: false,
        //   isContact: false,
        //   isNumberBadge: false,
        // },
        // {
        //   name: 'est_pay',
        //   title: 'Estimated Bill',
        //   width: 8,
        //   isIcon: false,
        //   isImage: false,
        //   isContact: false,
        //   isNumberBadge: true,
        // },
        {
          name: 'submitted_on',
          title: 'Submitted On',
          width: 10,
          isIcon: false,
          isImage: false,
          isContact: false,
          isNumberBadge: false,
          isProfileMatch: false,
          isCandidateStatus: false,
          isSort: true,
        },

        // { name: 'match', title: 'Match', width: 12, isIcon: false, isImage: false, isContact: false, isNumberBadge: false, isVieworEdit: false, isDisableorDelete: false, isDelete: false, isViewProfile: false, isWithdrawal: true, isProfileMatch: true },
        // { name: 'match', title: 'Match', width: 12, isIcon: false, isImage: false, isContact: false, isVieworEdit: false, isDisableorDelete: false, isDelete: false, isViewProfile: false, isWithdrawal: true, isNumberBadge: false, isProfileMatch: true},
      ],
      tabsList: this.getTabList(),
      showTabs: true,
      isExpand: false,
      isFilter: false,
      isSearch: true,
      isSetting: false,
      isTopPagination: true,
      hideResultCount: true,
      isCreate: false,
      density: 'COMFORTABLE',
      tableWidth: '1200px',
      isTopHeader: true,
      tableNoDataObj: {
        headTitle: 'No Candidates Submitted',
        subTitle: 'There are no Candidates Submitted',
        imageUrl: './assets/images/no-data.svg',
        button: false,
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
          multiSelectData: [
            { name: 'SUBMITTED', value: 'SUBMITTED' },
            { name: 'WITHDRAWN', value: 'WITHDRAWN' },
            { name: 'REJECTED', value: 'REJECTED' },
          ],
        },
      ],
    };

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
    this.getTabCount();
    this.getHideUniqueId();
  }

  getGlobalFlagsList() {
    this.jobDetailService.get('/configurator/global-launch?limit=50')
    .subscribe({
      next: (data: any) => {
        if(data?.global_launch_data?.length > 0) {
          this.tableConfig.enableGenricListViewButton =  data.global_launch_data.find(config => config.slug === 'submission_list_view_\'try_new_view\'')?.is_enabled;
            if(this.tableConfig.enableGenricListViewButton){
              this.tableConfig.genericListConfig = {'URL':'jobs/genericlist/SubmissionModule/Submission','oldURL':'jobs/submissions'};
            }
        }
      },
    });
  }

  getmember() {
    let url = `/configurator/programs/${this.currentProgram?.id}/members/${this.userid}`;
    this.subscriptions.push(
      this.jobDetailService.get(url).subscribe((data: any) => {
        if (data) {
          this.userrole = data?.member?.role?.name;
          this.usercategory = data?.member?.organization?.category;
          if (this.userrole == 'HR Manager' || this.usercategory == 'CLIENT') {
            this.tableConfig.tabsList = this.getTabList();
          }
        }
      }),
    );
  }

  getHideUniqueId() {
    const hidePIIFlag = this.authorizationService.authorize('hide_pii_flag');
    let uniqueId = 'candidate_id';
    if (hidePIIFlag) {
      this.tableConfig.columnList = this.tableConfig?.columnList.filter(item => item.name !== uniqueId);
    }
  }

  get shortlistActor(){
    let currentConfig = this.currentProgram?.config?.submission?.shortlist_details;
    let shortActor = false;
    let getValue;
     currentConfig?.filter(item =>{
      if(item?.short_actor === this.user_type){
        shortActor = true
        getValue = item?.short_role_id?.find(x => x === this.currentUserId) ? true : false;
      }
    });
    return (
      shortActor && getValue
    )
  }

  get resumesToReview(){
    if(this.currentProgram?.config?.submission?.is_shortlisting_enabled){
      if(this.shortlistActor || this.user_type.toLowerCase() === 'msp' ||
         this.currentProgram?.config?.submission?.hm_shortlist_review && this.user_type.toLowerCase() === 'client' ||
         this.currentProgram?.config?.submission?.can_client_view_non_shortlisted_candidates && this.user_type.toLowerCase() === 'client' ||
         this.user_type.toLowerCase() === 'super_org') {
            return true;
         }
      }
    else{
      return false;
    }
  }
  getTabList() {
    const rehireCheck = this.currentProgram?.config?.is_rehire_approval_required;
    /* if (this.user_type == 'PROGRAM'|| this.user_type == 'CLIENT') {

      if(!this.tabCount.shortlisted){
        return [
          'All',
          'Resumes to Review',
          'Submitted', */

    const submitted = this.authorizationService.authorize('view_submitted_submission');
    const offered = this.authorizationService.authorize('view_offered_submission');
    const rejected = this.authorizationService.authorize('view_rejected_submission');

    if (this.user_type == 'PROGRAM' || this.user_type == 'CLIENT') {
      if (!this.tabCount.shortlisted) {
        return [
          'All',
          ...(this.resumesToReview ? ['Resumes to Review'] : []),
          ...(submitted ? ['Submitted'] : []),
          ...(offered ? ['Offer Accepted'] : []),
          ...(rejected ? ['Rejected'] : []),
        ];
      }
      return [
        'All',
        /* 'Resumes to Review',
        'Submitted',
        'Shortlisted', */

        ...(this.resumesToReview ? ['Resumes to Review'] : []),
        ...(submitted ? ['Submitted'] : []),
        'Shortlisted',
        ...(offered ? ['Offer Accepted'] : []),
        ...(rejected ? ['Rejected'] : []),
      ];
    } else if (this.user_type == 'MSP') {
      if (!this.tabCount.shortlisted) {
        return ['All', ...(this.resumesToReview ? ['Resumes to Review'] : []), ...(rehireCheck ? ['Rehire Check'] : [])];
      }
      return ['All', ...(this.resumesToReview ? ['Resumes to Review'] : []), 'Shortlisted', ...(rehireCheck ? ['Rehire Check'] : [])];
    } else if (this.user_type == 'VENDOR') {
      if (!this.tabCount.shortlisted) {
        return ['All'];
      }
      return ['All', 'Shortlisted'];
    } else if (this.userrole == 'HR Manager' || this.usercategory == 'CLIENT') {
      if (!this.tabCount.shortlisted) {
        return ['All', ...(this.resumesToReview ? ['Resumes to Review'] : []), 'Submitted', ...(rehireCheck ? ['Rehire Check'] : [])];
      }
      return [
        'All',
        ...(this.resumesToReview ? ['Resumes to Review'] : []),
        'Submitted',
        'Shortlisted',
        ...(rehireCheck ? ['Rehire Check'] : []),
      ];
    } else if (this.user_type == 'SUPER_ORG') {
      if (!this.tabCount.shortlisted) {
        return [
          'All',
          ...(this.resumesToReview ? ['Resumes to Review'] : []),
          'Submitted',
          ...(rehireCheck ? ['Rehire Check'] : []),
          ...(rejected ? ['Rejected'] : []),
        ];
      }
      return [
        'All',
        ...(this.resumesToReview ? ['Resumes to Review'] : []),
        'Submitted',
        'Shortlisted',
        ...(rehireCheck ? ['Rehire Check'] : []),
        ...(rejected ? ['Rejected'] : []),
      ];
    }
  }
  vmsTableTabConfig() {
    this.countData = [];
    if (this.user_type == 'MSP') {
      this.tableConfig.tabsList?.forEach(tab => {
        if (tab === 'All') {
          this.countData.push(this.tabCount?.all);
        } else if (tab === 'Resumes to Review') {
          this.countData.push(this.tabCount?.resumeToReview);
        } else if (tab === 'Rehire Check') {
          this.countData.push(this.tabCount?.rehire);
        }
      });
    } else if (this.user_type == 'VENDOR') {
      this.tableConfig.tabsList?.forEach(tab => {
        if (tab === 'All') {
          this.countData.push(this.tabCount?.all);
        } else if (tab === 'Resumes to Review') {
          this.countData.push(this.tabCount?.resumeToReview);
        } else if (tab === 'Shortlisted') {
          this.countData.push(this.tabCount?.shortlisted);
        }
      });
    } else {
      this.tableConfig.tabsList?.forEach(tab => {
        if (tab === 'All') {
          this.countData.push(this.tabCount?.all);
        } else if (tab === 'Resumes to Review') {
          this.countData.push(this.tabCount?.resumeToReview);
        } else if (tab === 'Submitted') {
          this.countData.push(this.tabCount?.submitted);
        } else if (tab === 'Shortlisted') {
          this.countData.push(this.tabCount?.shortlisted);
        } else if (tab === 'Offer Accepted') {
          this.countData.push(this.tabCount?.offer_accepted);
        } else if (tab === 'Rejected') {
          this.countData.push(this.tabCount?.rejected);
        } else if (tab === 'Rehire Check') {
          this.countData.push(this.tabCount?.rehire);
        }
      });
    }
  }

  onTabClick(e) {
    if (typeof e === 'object') {
      return;
    } else {
      this.filter = {};
      this.status = e;
      let route = e?.toLowerCase();
      if (route == 'resumes to review' || route == 'pending_shortlist') {
        route = 'pending_shortlist';
        this.status = 'pending_shortlist';
        this.pageNumber = 1;
        this.getSubmittedCandidateCount(1);
      } else if (route == 'submitted') {
        route = 'submitted';
        this.status = 'submitted';
        this.pageNumber = 1;
        this.getSubmittedCandidateCount(1);
      } else if (route == 'shortlisted') {
        route = 'shortlisted';
        this.status = 'shortlisted';
        this.pageNumber = 1;
        this.getSubmittedCandidateCount(1);
      } else if (route === 'offer_accepted' || route === 'offer accepted') {
        route = 'offer_accepted';
        this.status = 'offer_accepted';
        this.pageNumber = 1;
        this.getSubmittedCandidateCount(1);
      } else if (route == 'rejected') {
        route = 'rejected';
        this.status = 'rejected';
        this.pageNumber = 1;
        this.getSubmittedCandidateCount(1);
      } else if (route == 'rehire check' || route == 'rehire') {
        route = 'rehire';
        this.status = 'rehire_check_pending';
        this.pageNumber = 1;
        this.getSubmittedCandidateCount(1);
      } else if (route == 'rejected') {
        route = 'rejected';
        this.status = 'rejected';
        this.pageNumber = 1;
        this.getSubmittedCandidateCount(1);
      } else if (route == 'all') {
        route = undefined;
        this.status = '';
        this.pageNumber = 1;
        this.getSubmittedCandidateList(1);
      } else {
        route = undefined;
        this.status = '';
        this.getSubmittedCandidateList(1);
      }
      if (route) {
        this.location.replaceState(`jobs/submissions/${route}`);
      } else {
        this.location.replaceState(`jobs/submissions`);
      }
      if (this.status) {
        let _status;
        if (this.status === 'pending_shortlist') {
          _status = 'resumes to review';
        } else if (this.status === 'submitted') {
          _status = 'submitted';
        } else if (this.status === 'shortlisted') {
          _status = 'shortlisted';
        } else if (this.status === 'offer_accepted') {
          _status = 'offer accepted';
        } else if (this.status === 'rejected') {
          _status = 'rejected';
        } else if (this.status === 'offer_accepted') {
          _status = 'offer accepted';
        } else if (this.status === 'rejected') {
          _status = 'rejected';
        } else if (this.status === 'rehire_check_pending') {
          _status = 'rehire check';
        }

        this.selectedTab = _status || this.status;
      } else {
        this.selectedTab = 'All';
      }
    }
    if(this.currentProgram?.config?.generic_list_pages?.['submission']){
       this.getGlobalFlagsList();
    }
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
  getTabCount() {
    this.subscriptions.push(
      this.candidateService.getLatestTabCount().subscribe((data: any) => {
        if (data) {
          this.tabCount.all = data?.stats?.all ? data?.stats?.all : 0;
          if (this.user_type === 'MSP') {
            this.tabCount.resumeToReview = data?.stats?.pending_shortlist ? data?.stats?.pending_shortlist : 0;
          } else if (this.user_type === 'CLIENT') {
            this.tabCount.resumeToReview = data?.stats?.pending_shortlist ? data?.stats?.pending_shortlist : 0;
          }
          this.tabCount.all = data?.stats?.all ? data?.stats?.all : 0;
          this.tabCount.submitted = data?.stats?.submitted ? data?.stats?.submitted : 0;
          this.tabCount.shortlisted = data?.stats?.shortlisted ? data?.stats?.shortlisted : 0;
          this.tabCount.rehire = data?.stats?.rehire_check_pending ? data?.stats?.rehire_check_pending : 0;
          this.tabCount.offer_accepted = data?.stats?.offer_accepted ? data?.stats?.offer_accepted : 0;
          this.tabCount.rejected = data?.stats?.rejected ? data?.stats?.rejected : 0;
          this.tabCount.resumeToReview = data?.stats?.pending_shortlist ? data?.stats?.pending_shortlist : 0;
          this.vmsTableTabConfig();
        }
      }),
    );
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
    this.pageNumber = 1;
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
  getSubmittedCandidateCount(pageNo = 1) {
    this.dataLoader = true;
    let programID = this.currentProgram?.id;
    let status = this.status?.toUpperCase();
    let search = this.searchTerm ? '&k=' + this.searchTerm : '';
    var cand_arr = [];
    this.subscriptions.push(
      this.candidateService.getAllCandidateCount(this.limit, pageNo, search, programID, status).subscribe({
        next: (data: any) => {
          if (data) {
            this.dataLoader = false;
            data?.submissions.forEach((element, index) => {
              let candidate_name1 = element?.middle_name
                ? `${element?.first_name} ${element?.middle_name} ${element?.last_name}`
                : `${element?.first_name} ${element?.last_name}`;
              let name_initial = `${element?.first_name.charAt(0)}${element?.last_name.charAt(0)}`;
              candidate_name1 = `${candidate_name1} <div>`;
              if (element?.is_rehire) {
                candidate_name1 += ` <span class="custom-tooltip"> <img src='assets/images/rehire.svg' /> <span class="tooltiptext"> <strong>Re-hire</strong> ${
                  element?.candidate_worked_as ? `- ` + this.getWorkedRehire(element?.candidate_worked_as) : ``
                }</span> </span>`;
              }
              if (element?.do_not_rehire) {
                candidate_name1 += ` <span class="custom-tooltip"> <i class="material-icons"> no_accounts </i> <span class="tooltiptext">Do Not Re-hire</span> </span>`;
              }
              if (element?.ot_mismatch) {
                candidate_name1 += ` <span class="custom-tooltip"> <span class="material-icons-round" style="color:red">hourglass_top</span>  <span class="tooltiptext">OT Exempt Mismatch</span> </span>`;
              }
              if((this.user_type.toUpperCase()===UserType.Client ||this.user_type.toUpperCase()===UserType.MSP) && element?.is_duplicate_unique_id_with_same_job){
                candidate_name1 += ` <span class="custom-tooltip"> <i class="material-icons mr-8">report</i> <span class="tooltiptext">Potential Duplicate Submittal</span> </span>`;
              }
              candidate_name1 += ` </div>`;

              let job_title = element?.job?.title;
              let vendor_name = element?.vendor?.name;

              if (element.status) {
                element.status = this.getDisplayStatus(element.status);
              }

              let currency = element?.job?.currency;
              let candidate_list_data = {
                id: element.id,
                name_initial: name_initial,
                candidate: candidate_name1,
                candidate_id: element?.candidate_id,
                job: job_title,
                jobId: element?.job?.id,
                vendor: vendor_name,
                opt_option: element?.job?.opt_option,
                availability: this.changeDateFormat(element?.available_date),
                rateValue: element?.bill_rate ? this.accuracyPipe.transform(element?.bill_rate, 'rate', {currencyCode: currency} ) : '',
                est_hours: element?.job?.estimated_hours,
                status: element.status,
                est_pay: element?.job?.estimated_bill_rate
                ? this.accuracyPipe.transform(element?.job?.estimated_bill_rate, 'rate', {currencyCode: currency})
                  : '',
                submitted_on: this.datePipe.transform(element.modified_on) + ' ' + this.datePipe.transform(element.modified_on,'hh:mm:ss a z'),
                job_id: element?.job?.job_id,
                job_manager_id : element?.job?.job_manager_id,
                submission_unique_id: element?.submission_unique_id,
                hideOptions: element.status === 'offer accepted' ? true : false,
                job_status: element?.job?.job_status,
                job_rate_model: this.currentProgram?.config?.is_rate_model_and_markup_from_job_hierarchy ? element?.job?.rate_model : this.currentProgram?.config?.program_model,
                offerID: element?.offer_id,
                match: {
                  matchValue: 20,
                  status: element.status,
                },
                is_budget_exceeded: element?.is_budget_exceeded ? element?.is_budget_exceeded : false,
                is_show_rehire: element?.is_approver,
                offer_visibility: element?.offer_visibility,
                mtp_id: element?.mtp_id,
              };
              cand_arr.push(candidate_list_data);
              this.setData(data, cand_arr, data?.submissions.length);
            });
            this.vmsData = { candidate: cand_arr };
            if (this.initFlag) {
              this.vmsTableTabConfig();
              this.initFlag = false;
            }
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
          if (data?.submissions.length === 0) {
            this.setData(data, [], data?.submissions.length);
          }
          this.vmsTableTabConfig();
          if (data) {
            this._loader.hide();
          } else {
            this.dataLoader = false;
            this._alert.error(`No data found.`);
          }
        },
        error: err => {
          this.dataLoader = false;
          this._alert.error(errorHandler(err));
        },
  }),
    );
  }

  setData(data, cand_arr, totalDataLength) {
    this.vmsData = { candidate: cand_arr };
    if (totalDataLength === this.vmsData.candidate.length) {
      if (this.initFlag) {
        this.vmsTableTabConfig();
        this.initFlag = false;
      }
      this.gridVewJson = this.vmsData;
      this.dataLoading = false;
      this.totalRecords = data?.total_records;
      this.itemsPerPage = data?.items_per_page;
      this.tableLoaded = true;
      this._loader.hide();
    }
  }

  clickToCancelOfferReview($event){
    let status = $event?.status.toLowerCase();
    if(status == 'countered offer pending review'){
      this.eventStream.emit(
        new EmitEvent(Events.COUNTERED_REVIEW_OFFER, {
          id: $event?.offerID,
          isopen: true,
          jobId: $event?.jobId,
        })
      );
    }
  }

  clickToEditOfferReview($event){
    if ($event) {
      if ($event?.jobId) {
        this.router.navigateByUrl(
          `jobs/details/job-details/${$event?.jobId}/candidate/${$event?.id}/offers?offerId=${$event?.offerID}&offerEdit=true&offerPageMode=edit`
        );
      }
    }
  }


  clickToOfferReview($event) {
    if ($event) {
      if ($event?.id) {
        this.router.navigateByUrl(
          `jobs/details/job-details/${$event?.jobId}/candidate/${$event?.id}/offers?offerId=${$event?.offerID}`
        );
      }
    }
  }

  clickToShortListReviewReject(event){
    this._eventStrem.emit(
      new EmitEvent(Events.SHORTLIST_REVIEW_REJECT, {
        value: true,
        candidateId: event?.id,
        jobId: event?.jobId,
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
          this.candidateService.shortlistReviewCandidate(payload, this.currentProgram?.id, event?.jobId, true).subscribe({
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

  getSubmittedCandidateList(pageNo = 1) {
    this.dataLoader = true;
    let search = this.searchTerm ? '&k=' + this.searchTerm : '';
    search = `${search}${this.sortObj && this.sortObj.order ? (this.sortObj.order === 'DESC' ? '&order_by=desc' : '&order_by=asc') : ''}`;
    if (this.sortObj) {
      if (this.sortObj.name === 'candidate') search = `${search}&key=first_name`;
      else search = `${search}&key=${this.sortObj.name}`;
    }
    var cand_arr = [];
    let programId = this.currentProgram?.id;

    this.subscriptions.push(
      this.candidateService.getAllSubmittedCandidate(this.limit, pageNo, search, programId).subscribe({
        next: (data: any) => {
          if (data) {
            this.dataLoader = false;
            const hasMtpViewPermission:boolean = this.masterTalentProfileService.hasPermission(MasterProfilePermissions.VIEW_MTP_SCREEN);
            data?.submissions.forEach(element => {
              let candidate_name1 = element?.middle_name
                ? `${element?.first_name} ${element?.middle_name} ${element?.last_name}`
                : `${element?.first_name} ${element?.last_name}`;
              candidate_name1 = this.jobDetailService.toTitleCase(candidate_name1);
              let name_initial = `${element?.first_name.charAt(0)?.toUpperCase()}${element?.last_name.charAt(0)?.toUpperCase()}`;
              candidate_name1 = `${candidate_name1} <div>`;

              if (element?.is_rehire) {
                candidate_name1 += ` <span class="custom-tooltip"> <img src='assets/images/rehire.svg' /> <span class="tooltiptext"><strong>Re-hire</strong> ${element?.candidate_worked_as ? `- ` + this.getWorkedRehire(element?.candidate_worked_as) : ``
                  }</span> </span>`;
              }
              if (element?.do_not_rehire) {
                candidate_name1 += ` <span class="custom-tooltip"> <i class="material-icons"> no_accounts </i> <span class="tooltiptext">Do Not Re-hire</span> </span>`;
              }
              if (element?.ot_mismatch) {
                candidate_name1 += ` <span class="custom-tooltip"> <span class="material-icons-round" style="color:red">hourglass_top</span>  <span class="tooltiptext">OT Exempt Mismatch</span> </span>`;
              }
              if((this.user_type.toUpperCase()===UserType.Client ||this.user_type.toUpperCase()===UserType.MSP) && element?.is_duplicate_unique_id_with_same_job){
                candidate_name1 += ` <span class="custom-tooltip"> <i class="material-icons mr-8">report</i> <span class="tooltiptext">Potential Duplicate Submittal</span> </span>`;
              }
              candidate_name1 += ` </div>`;

              let job_title = element?.job?.title;
              let vendor_name = element?.vendor?.name;
              if (element.status) {
                element.status = this.getDisplayStatus(element.status);
              }
              // let estPay = element.est_pay ? `$ ${element.est_pay}` :'' ;
              let currency = element?.job?.currency;

              let candidate_list_data = {
                id: element.id,
                mtp_id : hasMtpViewPermission ? element.mtp_id: null,
                name_initial: name_initial,
                candidate: candidate_name1,
                candidate_id: element?.is_duplicate_unique_id
                  ? `${element?.candidate_id} <div class="custom-tooltip unique-id-icon"> <i class="material-icons"> report_problem </i> <span class="tooltiptext">Potential Duplicate</span> </div>`
                  : element?.candidate_id,
                job: job_title,
                jobId: element?.job?.id,
                vendor: vendor_name,
                opt_option: element?.job?.opt_option,
                availability: this.changeDateFormat(element?.available_date),
                rateValue: element?.bill_rate ? this.accuracyPipe.transform(element?.bill_rate, 'rate', {currencyCode: currency}) : '',
                est_hours: element?.job?.estimated_hours,
                status: element.status,
                est_pay: element?.job?.estimated_bill_rate
                  ? this.accuracyPipe.transform(element?.job?.estimated_bill_rate, 'rate', {currencyCode: currency})
                  : '',
                submitted_on: this.datePipe.transform(element.modified_on) + ' ' + this.datePipe.transform(element.modified_on,'hh:mm:ss a z'),
                job_id: element?.job?.job_id,
                job_manager_id : element?.job?.job_manager_id,
                submission_unique_id: element?.submission_unique_id,
                hideOptions: element.status === 'offer accepted' ? true : false,
                // "submittenOn": Difference_In_Days,
                job_status: element?.job?.job_status,
                job_rate_model: this.currentProgram?.config?.is_rate_model_and_markup_from_job_hierarchy ? element?.job?.rate_model : this.currentProgram?.config?.program_model,
                offerID: element?.offer_id,
                match: {
                  matchValue: 20,
                  status: element.status,
                },
                is_budget_exceeded: element?.is_budget_exceeded ? element?.is_budget_exceeded : false,
                is_show_rehire: element?.is_approver,
                offer_visibility: element?.offer_visibility,
              };
              cand_arr.push(candidate_list_data);
              this.setData(data, cand_arr, data?.submissions.length);
            });
            this.vmsData = { candidate: cand_arr };
            if (this.initFlag) {
              this.vmsTableTabConfig();
              this.initFlag = false;
            }
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
       error: err => {
          this.dataLoader = false;
          this._alert.error(errorHandler(err));
        },
  }),
    );
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
      case "OFFER_WITHDRAWN":
       offerStatus='offer withdrawn';
      break;
      case "INTERVIEW_PENDING_INTERVIEW_REVIEW":
      offerStatus = 'Pending Review';
      break;
      case "PENDING_INTERVIEW_ACCEPTANCE":
      offerStatus = 'Pending Interview Acceptance';
      break;
      case "INTERVIEW_REJECTED":
      offerStatus = 'Interview Rejected';
      break;
      case "INTERVIEW_CANCELLED":
      offerStatus = 'Cancelled';
      break;
      case "INTERVIEW_ACCEPTED":
      offerStatus = 'Interview Accepted';
      break;
      case 'INTERVIEW_COMPLETED':
        offerStatus = 'Interview Completed';
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
      case "PENDING_INTERVIEW_REVIEW":
      offerStatus = 'Pending Review';
      break;
      case "INTERVIEW_SCHEDULED":
      offerStatus = 'Scheduled';
      break;
      case "INTERVIEW_REJECTED":
      offerStatus = 'Rejected';
      break;
      case "INTERVIEW_CANCELLED":
      offerStatus = 'Cancelled';
      break;
      case "INTERVIEW_ACCEPTED":
      offerStatus = 'Accepted';
      break;
      case "PENDING_INTERVIEW_CONFIRMATION":
      offerStatus = 'Pending Interview Confirmation';
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

  changeDateFormat(ts) {
    if (ts) {
      return this.datePipe.transform(ts,null,null,null,true);
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

  withdrawalClicked(event) {
    if (event?.status?.toUpperCase() == 'SUBMITTED') {
      this._eventStrem.emit(
        new EmitEvent(Events.WITHDRAW_CANDIDATE, {
          value: true,
          candidateId: event.id,
          jobId: event.jobId,
        }),
      );
    } else  {
      this.router.navigate(['/candidates/submit-candidate'], {
        queryParams: { jobId: event.jobId, candidateId: event.id, isSubmitted: true },
      });
    }
  }
  clickToRejectCandidate(event) {
    if (event?.status?.toUpperCase() == 'SUBMITTED' || event?.status?.toLowerCase() == 're-hire check pending') {
      this._eventStrem.emit(
        new EmitEvent(Events.REJECT_CANDIDATE, {
          value: true,
          candidateId: event.id,
          jobId: event.jobId,
        }),
      );
    }
  }
  clickTorRehireCheck(event) {
    if (event) {
      if (event.jobId) {
        this.router.navigateByUrl(`jobs/details/job-details/${event?.jobId}/candidate/${event?.id}/submissions?is_submission=true`);
      }
    }
  }

  previewClicked(event) {
    if (event.jobId) {
      this.eventStream.emit(
        new EmitEvent(Events.JOB_DETAIL_SIDEBAR_VIEW, {
          value: event,
          selectedIndex: 2,
          candidateId: event.id,
          job_id: event.jobId,
        }),
      );
    }
  }

  onEditClick(data) {}
  cloneClicked(e) {}
  onExpandClick(e) {}

  onPaginationClick(e) {
    this.pageNumber = e;
    if (this.status) {
      this.getSubmittedCandidateCount(e);
    } else {
      this.getSubmittedCandidateList(e);
    }
  }

  onClickRecords(event) {
    this.limit = event;
    this.pageNumber = 1;
    if (this.status) {
      this.getSubmittedCandidateCount(1);
    } else {
      this.getSubmittedCandidateList(1);
    }
  }
  clickToScheduleInterview(event) {
    if (event) {
      if (event.jobId) {
        this.router.navigateByUrl(`jobs/details/job-details/${event.jobId}/candidate/${event.id}/interviews/create`);
      }

      // this._eventStrem.emit(new EmitEvent(Events.RE_SCHEDULE_INTERVIEW,
      //   {
      //     data : event,
      //     jobId : this.jobId ,
      //     programID: this.currentProgram?.id,
      //     interviewId: "4ae8519b-7617-4fc3-bb7b-b23f8f8cb07d"
      //   }
      // ));
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
    this.router.navigateByUrl(`jobs/details/job-details/${event.jobId}/candidate/${event.id}/offers?createOffer=true`);
  }
  onClickNext(event) {
    if (event && event.jobId) {
      this.router.navigate(['/jobs/details/job-details', event.jobId, 'available']);
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
          this.changeDateFormat(event.available_date[0]),
          this.changeDateFormat(event.available_date[1]),
        ];
      }

      if (event.min && event.max) {
        this.payload.filters.estimated_pay_rate_range = [event.min, event.max];
      }

      if (event.submitted_on) {
        this.payload.filters.submitted_on = event.submitted_on.map(d => new Date(d));
      }

      if (event.status) {
        this.payload.filters.status = [event.status];
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
        .post(`${this.baseUrl}/programs/${programID}/jobs/${this.jobId}/candidates/advanced-filters`, this.payload)
        .subscribe({
          next: (data: any) => {
            if (data) {
              this.dataLoader = false;
              data?.candidates.forEach(element => {
                let candidate_name1 = element?.middle_name
                  ? `${element?.first_name} ${element?.middle_name} ${element?.last_name}`
                  : `${element?.first_name} ${element?.last_name}`;
                let name_initial = `${element?.first_name.charAt(0)}${element?.last_name.charAt(0)}`;
                candidate_name1 = `${candidate_name1} <div>`;

                if (element?.is_rehire) {
                  candidate_name1 += ` <span class="custom-tooltip"> <img src='assets/images/rehire.svg' /> <span class="tooltiptext"><strong>Re-hire</strong> ${
                    element?.candidate_worked_as ? `- ` + this.getWorkedRehire(element?.candidate_worked_as) : ``
                  }</span> </span>`;
                }
                if (element?.do_not_rehire) {
                  candidate_name1 += ` <span class="custom-tooltip"> <i class="material-icons"> no_accounts </i> <span class="tooltiptext">Do Not Re-hire</span> </span>`;
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
                let currency = element?.job?.currency;
                let candidate_list_data = {
                  id: element.id,
                  name_initial: name_initial,
                  candidate: candidate_name1,
                  availability: this.changeDateFormat(element.available_date),
                  rateValue: element?.bill_rate ? this.accuracyPipe.transform(element?.bill_rate, 'rate', {currencyCode: currency}) : '',
                  est_hours: element.estimated_hours,
                  status: element.status,
                  est_pay: element?.job?.estimated_bill_rate
                    ? this.accuracyPipe.transform(element?.job?.estimated_bill_rate, 'rate', {currencyCode: currency})
                    : '',
                  submitted_on: this.datePipe.transform(element.modified_on) + ' ' + this.datePipe.transform(element.modified_on,'hh:mm:ss a z'),
                  submittenOn: Difference_In_Days,
                  job_status: element?.job?.job_status,
                  job_manager_id : element?.job?.job_manager_id,
                  offerID: element?.offer_id,
                  opt_option: element?.job?.opt_option,
                  match: {
                    matchValue: 20,
                    status: element.status,
                  },
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
          error: err => {
            this._alert.error(errorHandler(err));
            this._loader.hide();
          },
  }),
    );
  }

  filterData(programID, jobID, payLoad) {}

  openLinkingModal(mtpId){
    if (this.authorizationService.authorize(MasterProfilePermissions.VIEW_MTP_SCREEN)) {
      this.mtpDetails = true;
      this.profileId = mtpId;
    }
  }
  closemtpModal(){
    this.mtpDetails = false;
  }
  ngOnDestroy(): void {
    this.subscriptions?.forEach(sub => sub.unsubscribe());
  }
}
