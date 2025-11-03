import { Location } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CandidateService } from 'src/app/candidates/service/candidate.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { EmitEvent, EventStreamService, Events } from 'src/app/core/services/event-stream.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { JobDetailsService } from 'src/app/jobs/job-details/job-details.service';
import { VMSConfig } from 'src/app/library/smartTable/table/table.model';
import { JobStatus } from 'src/app/shared/enums';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { errorHandler } from 'src/app/shared/util/error-handler';

@Component({
  selector: 'app-offers',
  templateUrl: './offers.component.html',
  styleUrls: ['./offers.component.scss'],
})
export class OffersComponent implements OnInit, OnDestroy {
  private subscriptions = [];
  public user_type: any;
  public dataLoader: any;
  public vmsData: any;
  public tableConfig: VMSConfig;
  public isExpand = false;
  public totalPages = 0;
  public totalRecords = 0;
  gridContentType = 'candidate';
  tableLoaded = true;
  dataLoading = false;
  limit = 10;
  public filterSearch=true;
  countData: number [];
  pageNumber = 1;
  tabCount: any = {
    pending_approval: 0,
    pending_msp_review: 0,
    rejected: 0,
    accepted: 0,
    released: 0,
    pending_offer_approval:0
  };
  public jobStatus: any = JobStatus;
  public viewGrid = true;
  public gridVewJson: any = {};

  candidateInfo = false;
  candidateInfoEdit = {
    visibility: false,
    title: 'Edit',
  };
  jobInfo = false;
  jobInfoEdit = {
    visibility: false,
    title: 'Edit',
  };
  rateInfo = false;
  rateInfoEdit = {
    visibility: false,
    title: 'Edit',
  };
  offerPayRate = '';
  offerBillRate = '';
  notes = '';
  timesheetManager = '';
  jobManager = '';
  availableStartDate = '';
  noteInfo = false;
  candidateId;
  offerId;
  searchTerm;
  currentProgram;
  offersList = [];
  noDataJson;
  updatedOn;
  createdOn;
  filterStatus;
  filterCandidate;
  rotuterLinkParams;
  rotuterLinkParseFn;
  candidateName;
  public status: any = 'All Offers';
  selectedTab: string;
  baseURL:any;
  offerNewWorkflow: boolean = false;
  showOverlapWarning: boolean = false;
  allowAssignmentOverlap: boolean;
  overlapAssignmentData = [];
  constructor(
    public location: Location,
    private jobService: JobDetailsService,
    private alertService: AlertService,
    private route: ActivatedRoute,
    private storageService: StorageService,
    private eventStream: EventStreamService,
    private router: Router,
    private localDateFormat: LocalDateFormatPipe,
    private candidateService: CandidateService,
    private loaderService: LoaderService
  ) {}

  sortColMap = {
    offer_created: 'created_on',
    offer_updated: 'modified_on',
  };
  defaultSortObj = {
    name: 'created_on',
    order: 'DESC',
  };

  sortObj = {
    name: 'created_on',
    order: 'DESC',
  };

  ngOnInit(): void {
    this.currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.offerNewWorkflow = this.currentProgram?.config?.offer?.offer_details_new_ui ?? false;
    this.user_type = this.storageService.get('user_type');
    this.baseURL = '/submission-manager';
    this.route.paramMap.subscribe(param => {
      let status = param?.get('status');
      this.status = status ? status?.replace(/%20/g, ' ') : 'All Offers';
      if (this.status === 'filled-closed') {
        this.status = 'filled/closed';
      }
      if(this.status=='pending_review'){
        this.status = 'pending review';
      }
      this.storageService.set('job_listing_status', this.status);
      switch (status?.toLowerCase()) {
        case 'sourcing':
          this.onTabClick('Sourcing');
          break;
        case 'pending distribution':
          this.onTabClick('Pending Distribution');
          break;
        case 'pending_review':
          this.onTabClick('Pending Review');
          break;
        case 'pending approval':
          this.onTabClick('Pending Approval');
          break;
        case 'pending':
          this.onTabClick('Pending Approval');
          break;
        case 'halted':
          this.onTabClick('halted');
          break;
        case 'hold':
          this.onTabClick('hold');
          break;
        case 'filled-closed':
          this.onTabClick('Filled/Closed');
          break;
        case 'pending-background-check':
          this.onTabClick('Pending Background Check');
          break;
        default: {
          const index = this.tableConfig?.tabsList?.findIndex(item => status?.toLowerCase() === item.toLowerCase());
          if (index === -1) {
            status = 'All Offers';
          }
          this.onTabClick(status);
          break;
        }
      }
    });
    const status = this.storageService.get('job_listing_status');
    const limit = this.storageService.get('job_listing_limit');
    const page = this.storageService.get('job_listing_page');
    if (status) {
      this.status = status;
      let _status;
      if (this.status === 'pending') {
        _status = 'pending approval';
      } else if (this.status === 'pendingpmo') {
        _status = 'pending pmo';
      } else if (this.status === 'pending-background-check') {
        _status = 'pending background check';
      } else if (this.status === 'All') {
        _status = 'All Offers';
        this.selectedTab = 'All Offers';
      }
      this.selectedTab = _status || this.status;
    } else {
      this.selectedTab = 'All Offers';
    }
    if (page) {
      this.pageNumber = page;
    }

    if (limit) {
      this.limit = limit;
    }

    this.tableConfig = {
      title: 'Offers',
      columnList: [
        {
          name: 'candidate',
          title: 'Candidate',
          width: 10,
          isIcon: true,
          isImage: true,
          isContact: false,
          isNumberBadge: false,
          isVieworEdit: false,
          isNoOption: false,
          isCounterOffer: true,
          isRejectOffer: true,
          isAcceptOffer: true,
          isRejectCandidate: true,
          isOfferCandidateWithdrawal: true,
          showPreviewIcon: true,
          isEditOffer: true,
          isOnboardingCandidate: !this.disableOnboarding,
          isSort: true,
          isOfferReview:true
        },
        {
          name: 'status',
          title: 'Status',
          width: 10,
          isIcon: false,
          isImage: false,
          isContact: false,
          isNumberBadge: false,
          isSort: true,
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
          width: 20,
          isIcon: false,
          isImage: false,
          isContact: false,
          isNumberBadge: false,
        },
        {
          name: 'submission_id',
          title: 'Submission ID',
          width: 20,
          isIcon: false,
          isImage: false,
          isContact: false,
          isNumberBadge: false,
          isSort: true,
        },
        {
          name: 'offer_id',
          title: 'Offer ID',
          width: 15,
          isIcon: false,
          isImage: false,
          isContact: false,
          isNumberBadge: true,
        },
        {
          name: 'offer_created',
          title: 'Offer Created',
          width: 15,
          isIcon: false,
          isImage: false,
          isContact: false,
          isNumberBadge: false,
          isSort: true,
        },
        {
          name: 'offer_updated',
          title: 'Offer Last Updated',
          width: 15,
          isIcon: false,
          isImage: false,
          isContact: false,
          isNumberBadge: true,
          isSort: true,
        },
      ],
      tabsList: this.getTabsList(),
      isExpand: false,
      isFilter: true,
      isSearch: true,
      isSetting: false,
      isTopPagination: true,
      hideResultCount: true,
      isCreate: false,
      showTabs: true,
      isTopHeader: true,
      density: 'COMFORTABLE',
      // isTheme: true,
      tableWidth: '100%',
      tableNoDataObj: {
        headTitle: 'No offers found',
        subTitle: 'There are no Offer records found',
        imageUrl: './assets/images/freepik--Envelope--inject-10.svg',
        button: false,
      },
      advanceFilter: [
        { name: 'candidate', title: 'Candidate', filterType: 'TEXT' },
        {
          name: 'status',
          title: 'Status',
          filterType: 'SELECT',
          multiSelectData: [
            { name: 'Released', value: 'released' },
            { name: 'Accepted', value: 'accepted' },
            { name: 'Rejected', value: 'rejected' },
            { name: 'Withdrawn', value: 'withdrawn' },
            { name: 'Pending Approval', value: 'pending_approval' }
          ],
        },
        {
          name: 'offer_created',
          title: 'Offer Created',
          filterType: 'DATERANGE',
        },
        {
          name: 'offer_updated',
          title: 'Offer Last Updated',
          filterType: 'DATERANGE',
        },
      ],
    };
    this.currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.getCount();
    this.rotuterLinkParseFn = (rowData, options) =>
      rowData?.jobId
        ? `jobs/details/job-details/${rowData?.jobId}/candidate/${rowData?.candidateInfo?.id}/offers?offerId=${rowData?.id}`
        : '/jobs/offers';
    this.getOffersList();
    this.getAssignmentConfig();
    this.subscriptions.push(
      this.eventStream.on(Events.RELOAD_OFFERS).subscribe(data => {
        if (data) {
          this.getOffersList();
        }
      }),
    );
    if(this.currentProgram?.config?.generic_list_pages?.['offer']){
      this.getGlobalFlagsList();
    }
  }

  getGlobalFlagsList() {
    this.jobService.get('/configurator/global-launch?limit=50')
    .subscribe({
      next: (data: any) => {
        if(data?.global_launch_data?.length > 0) {
          this.tableConfig.enableGenricListViewButton =  data.global_launch_data.find(config => config.slug === 'offer_list_view_\'try_new_view\'')?.is_enabled;
            if(this.tableConfig.enableGenricListViewButton){
              this.tableConfig.genericListConfig = {'URL':'jobs/genericlist/OfferModule/Offer','oldURL':'jobs/offers'};
            }
          }
      },
    });
  }

  get disableOnboarding() {

    return this.currentProgram?.config?.is_onboading_disabled
  }
  onSortClick(event) {
    if (!!event) {
      if (this.sortColMap[event.name]) {
        event.name = this.sortColMap[event.name];
      }
      this.sortObj = event;
    } else {
      this.sortObj = this.defaultSortObj;
    }
    if(this.sortObj && this.sortObj.name === 'candidate') this.sortObj.name = 'first_name';
    this.getOffersList();
  }
  toggleCandidateInfo() {
    this.candidateInfo = !this.candidateInfo;
  }
  getTabsList() {
    const pendingApproval = !this.currentProgram?.config?.disable_pending_background_check;
    if (this.user_type == 'PROGRAM' || this.user_type == 'SUPER_ORG' || this.user_type == 'VENDOR') {
      if(!this.tabCount.pending_msp_review){
        return [
          'All Offers', 'Pending Approval', 'Rejected', 'Accepted', 'Released',
          ...(pendingApproval ? ['Pending Background Check'] : []),
          'Pending Assignment Creation'

        ]
      }
      return ['All Offers', 'Pending Approval', 'Pending PMO', 'Rejected', 'Accepted', 'Released', ...(pendingApproval ? ['Pending Background Check'] : [])];
    } else if (this.user_type == 'MSP') {
      if (this.currentProgram?.config?.offer?.pending_offer_review || this.currentProgram?.config?.offer?.counter_offer_review) {
        return ['All Offers', 'Pending Review', 'Pending Approval', 'Rejected', 'Accepted', 'Released', ...(pendingApproval ? ['Pending Background Check'] : []),
        'Pending Assignment Creation'];
      }

      if(!this.tabCount.pending_msp_review){
        return [
          'All Offers','Pending Approval', 'Rejected', 'Accepted', 'Released',  ...(pendingApproval ? ['Pending Background Check'] : []),
          'Pending Assignment Creation'
        ]
      }
      return ['All Offers','Pending Approval','Pending PMO', 'Rejected', 'Accepted', 'Released', ...(pendingApproval ? ['Pending Background Check'] : []),
      'Pending Assignment Creation'];

    } else if (this.user_type == 'CLIENT') {
      return ['All Offers','Pending Approval', 'Pending Assignment Creation'];
    }
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
  getOffersList() {
    this.dataLoading = true;
    let sort = '';
    let search='';
    if(this.filterSearch){
     search = this.searchTerm ? '&k=' + this.searchTerm : '';
    }
    let filterCandidate = this.filterCandidate ? '&candidate_id=' + this.filterCandidate : '';
    let createdOn = this.createdOn ? '&created_on=' + this.createdOn : '';
    let updatedOn = this.updatedOn ? '&modified_on=' + this.updatedOn : '';
    let filterStatus = this.filterStatus ? '&status=' + this.filterStatus : '';
    let programId = this.currentProgram?.id;
    sort = `${sort}${(this.sortObj && this.sortObj.order)  ?  this.sortObj.order.toLocaleLowerCase() === 'desc' ? '&order_by=desc' : '&order_by=asc' : ""}&key=${this.sortObj.name}`;
    let url = `${this.baseURL}/programs/${programId}/offers?limit=${this.limit}&page=${this.pageNumber}${search}${filterCandidate}${createdOn}${updatedOn}${filterStatus}${sort}`;
    this.subscriptions.push(
      this.jobService.get(url).subscribe({
        next: (data: any) => {
          if (data) {
            this.offersList = data?.offers;
            let offers = [];

            data?.offers.forEach((item, index) => {
              let job_title = item?.job?.title;

            //   this.candidateName = item?.do_not_rehire
            //     ? `${item?.candidate?.first_name} ${item?.candidate?.middle_name || ''} ${item?.candidate?.last_name}
            // <div class="custom-tooltip"> <i class="material-icons"> no_accounts </i> <span class="tooltiptext">Do Not Re-hire</span> </div> `
            //     : `${item?.candidate?.first_name} ${item?.candidate?.middle_name || ''} ${item?.candidate?.last_name}`;

            let candidate_name1 = item?.candidate?.middle_name
                ? `${item?.candidate?.first_name} ${item?.candidate?.middle_name} ${item?.candidate?.last_name}`
                : `${item?.candidate?.first_name} ${item?.candidate?.last_name}`;

              candidate_name1=this.jobService.toTitleCase(candidate_name1);

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

              candidate_name1 += `</div>`;

              this.candidateName=candidate_name1;
              let offer = {
                ...item,
                candidate: this.candidateName,
                candidateId: item?.candidate?.id,
                status: this.checkStatus(item?.status),
                jobId: item?.job?.id,
                job_id: item?.job?.job_id,
                submission_id: item?.submission_id,
                job: job_title,
                offer_id: item?.offer_id,
                offer_created: this.localDateFormat.transform(item?.created_on),
                offer_updated: this.localDateFormat.transform(item?.modified_on),
                candidateInfo: item.candidate,
                candidate_submission_status: item?.candidate_submission_status,
                taxes: item?.taxes
              };
              offers.push(offer);
            });
            this.vmsData = { offer: offers };
            this.gridVewJson = this.vmsData.offer;
            this.dataLoading = false;
            this.totalRecords = data?.total_records;
            this.tableLoaded = true;
            this.filterSearch=true;
          }
        },
       error: (err) => {
          this.dataLoading = false;
          this.filterSearch=true;
          this.alertService.error(errorHandler(err));
        },
  }),
    );
  }
  checkStatus(status) {
    if (status?.toLowerCase() === this.jobStatus?.PENDING_APPROVAL?.toLowerCase()) {
      status = 'Pending approval';
    } else if (status?.toLowerCase() === this.jobStatus?.RELEASE_JOB?.toLowerCase()) {
      status = 'Release job';
    } else if (status?.toLowerCase() === this.jobStatus?.PENDING_APPROVAL_SOURCING?.toLowerCase()) {
      status = 'Pending approval sourcing';
    } else if (status?.toLowerCase() === this.jobStatus?.PENDING_APPROVAL_HALTED.toLowerCase()) {
      status = 'Halted';
    } else if (status?.toLowerCase() === this.jobStatus?.PENDING_APPROVAL_HOLD?.toLowerCase()) {
      status = 'Hold';
    } else if (status?.toLowerCase() === this.jobStatus?.FILLED_OR_CLOSED?.toLowerCase()) {
      status = 'Filled/Closed';
    } else if (status?.toLowerCase() === this.jobStatus?.PENDING_OFFER_REVIEW?.toLowerCase()) {
      status = 'Pending Review';
    } else if (status?.toLowerCase() === this.jobStatus?.COUNTERED_PENDING_REVIEW?.toLowerCase() && !this.offerNewWorkflow) {
      status = 'Countered Pending Review';
    } else if (status?.toLowerCase() === this.jobStatus?.COUNTERED_PENDING_REVIEW?.toLowerCase() && this.offerNewWorkflow) {
      status = 'Counter Pending Review';
    } else if (status?.toLowerCase() === this.jobStatus?.COUNTERED_PENDING_APPROVAL?.toLowerCase() && this.offerNewWorkflow) {
      status = 'Counter Pending Approval';
    } else if (status?.toLowerCase() === this.jobStatus?.PENDING_DISTRIBUTION?.toLowerCase()) {
      status = 'Pending Distribution';
    } else if (status?.toLowerCase() === this.jobStatus?.OFFER_CANCELLED?.toLowerCase()) {
      status = 'Cancelled';
    } else if (status?.toLowerCase() === this.jobStatus?.COUNTERED_CANCELLED?.toLowerCase()) {
      status = 'Countered Review Cancelled';
    }
    return status;
  }

  onTabClick(e) {
    if (typeof e === 'object') {
      return;
    } else {
      // this.filter = {};
      this.selectedTab=e?.toLowerCase();
      this.status = e;
      let route = e?.toLowerCase();
      if (route === 'filled/closed') {
        route = 'filled-closed';
        this.status = 'filled-closed';
      }
      if (route === 'pending approval') {
        route = 'pending';
        this.status = 'PENDING_APPROVAL';
      } else if (route === 'pending review') {
        route = 'pending_review';
        this.status = 'PENDING_OFFER_REVIEW';
      } else if (route === 'pending pmo') {
        route = 'pendingpmo';
        this.status = 'PENDING_MSP_REVIEW';
      } else if (route === 'rejected') {
        route = 'rejected';
        this.status = 'rejected';
      } else if (route === 'accepted') {
        route = 'accepted';
        this.status = 'accepted';
      } else if (route === 'pending background check') {
        route = 'pending-background-check';
        this.status = 'PENDING_BACKGROUND_CHECK';
      } else if (route === 'all offers') {
        route = undefined;
        this.status = '';
      }
      else if (route === 'pending assignment creation') {
        route = 'pending-assignment-creation';
        this.status = 'PENDING_ASSIGNMENT_CREATION';
      }
      this.limit = 10;
      this.pageNumber = 1;
      this.filterStatus = this.status;
      if (route) {
        this.location.replaceState(`jobs/offers/${route}`);
      } else {
        this.location.replaceState(`jobs/offers`);
      }
      this.filterSearch=false;
      this.getOffersList();
    }
  }

  getCount() {
    let programId = this.currentProgram?.id;
    let url = `${this.baseURL}/programs/${programId}/offers/stats`;
    this.subscriptions.push(
      this.jobService.get(url).subscribe((data: any) => {
        this.tabCount = data?.stats;
        this.vmsTableTabConfig();
      }),
    );
  }

  vmsTableTabConfig() {
    this.countData = [];
    this.tableConfig.tabsList?.forEach(tab => {
      if (this.user_type == 'PROGRAM' || this.user_type == 'SUPER_ORG' || this.user_type == 'VENDOR') {
        if (tab === 'All Offers') {
          this.countData?.push(this.tabCount?.all || 0);
        } else if (tab === 'Pending Approval') {
          this.countData?.push(this.tabCount?.pending_approval || 0);
        } else if (tab === 'Pending PMO') {
          this.countData?.push(this.tabCount?.pending_msp_review || 0);
        } else if (tab === 'Rejected') {
          this.countData?.push(this.tabCount?.rejected || 0);
        } else if (tab === 'Accepted') {
          this.countData?.push(this.tabCount?.accepted || 0);
        } else if (tab === 'Released') {
          this.countData?.push(this.tabCount?.released || 0);
        } else if (tab === 'Pending Background Check') {
          this.countData?.push(this.tabCount?.pending_background_check || 0);
        }
        else if (tab === 'Pending Assignment Creation') {
          this.countData?.push(this.tabCount?.pending_assignment_creation || 0);
        }
      } else if (this.user_type == 'MSP') {
        if (tab === 'All Offers') {
          this.countData?.push(this.tabCount?.all || 0);
        } else if (tab === 'Pending Approval') {
          this.countData?.push(this.tabCount?.pending_approval || 0);
        } else if(tab === 'Pending Review'){
          this.countData?.push(this.tabCount?.pending_offer_review || 0);
        } else if (tab === 'Pending PMO') {
          this.countData?.push(this.tabCount?.pending_msp_review || 0);
        } else if (tab === 'Rejected') {
          this.countData?.push(this.tabCount?.rejected || 0);
        } else if (tab === 'Accepted') {
          this.countData?.push(this.tabCount?.accepted || 0);
        } else if (tab === 'Released') {
          this.countData?.push(this.tabCount?.released || 0);
        } else if (tab === 'Pending Background Check') {
          this.countData?.push(this.tabCount?.pending_background_check || 0);
        }
          else if (tab === 'Pending Assignment Creation') {
          this.countData?.push(this.tabCount?.pending_assignment_creation || 0);
        }
      } else if (this.user_type == 'CLIENT') {
        if (tab === 'All Offers') {
          this.countData?.push(this.tabCount?.all || 0);
        } else if (tab === 'Pending Approval') {
          this.countData?.push(this.tabCount?.pending_approval || 0);
        }
          else if (tab === 'Pending Assignment Creation') {
          this.countData?.push(this.tabCount?.pending_assignment_creation || 0);
        }
      }
    });
  }

  previewClicked(event) {
    this.eventStream.emit(
      new EmitEvent(Events.JOB_DETAIL_SIDEBAR_VIEW, {
        value: event,
        selectedIndex: 4,
        candidateId: event.candidateInfo.id,
        job_id: event.jobId,
        details: event,
      }),
    );
  }

  onExpandClick(event) {}
  onEditClick(event) {}
  onCreateClick(event) {}
  disableClicked(event) {}
  onDeleteClick(event) {}
  columnClicked(event) {}
  onSearch(term) {
    this.searchTerm = term;
    this.getOffersList();
  }
  onListFilter(event) {
    // this.filterCandidate = event?.candidate;
    this.searchTerm = event?.candidate;
    this.updatedOn = event?.offer_updated ? event?.offer_updated?.[0] + '-' + event?.offer_updated?.[1] : null;
    this.createdOn = event?.offer_created?.[0] ? event?.offer_created?.[0] + '-' + event?.offer_created?.[1] : null;
    this.selectedTab = 'All Offers';
    this.filterStatus = event?.status;
    this.getOffersList();
  }

  openCounterOfferSidebar($event) {
    this.router.navigateByUrl(
      `jobs/details/job-details/${$event.jobId}/candidate/${$event.candidateInfo.id}/offers?offerId=${$event?.id}&counterOffer=true`,
    );
  }

  withdrawalClicked(event) {
    if (event.status == 'RELEASED') {
      this.eventStream.emit(
        new EmitEvent(Events.WITHDRAW_CANDIDATE, {
          value: true,
          candidateId: event.candidateId,
          jobId: event.jobId,
        }),
      );
    }
  }
  onWithdrawnCandidate(event){
    if(event){
      this.getOffersList();
      this.getCount();
    }
  }
  openAcceptOfferSidebar($event) {
    if ($event) {
      this.eventStream.emit(
        new EmitEvent(Events.JOB_DETAIL_SIDEBAR_ACCEPT_OFFER, {
          ...$event,
          isopen: true,
          jobId: $event?.jobId,
          taxData: $event?.taxes
        }),
      );
    }
  }

  openRejectOfferSidebar($event) {
    if ($event) {
      this.eventStream.emit(
        new EmitEvent(Events.JOB_DETAIL_SIDEBAR_REJECT_OFFER, {
          ...$event,
          isopen: true,
          jobId: $event?.jobId,
        }),
      );
    }
  }
  clickToRejectCandidate(event) {
    if (event.status == 'RELEASED' || event.status == 'ACCEPTED' || event.status == 'REJECTED') {
      this.eventStream.emit(
        new EmitEvent(Events.REJECT_CANDIDATE, {
          value: true,
          candidateId: event.candidateId,
          jobId: event?.jobId,
        }),
      );
    }
  }
  onPaginationClick(e) {
    this.pageNumber = e;
    this.getOffersList();
  }
  onClickRecords(event) {
    this.limit = event;
    this.pageNumber = 1;
    this.getOffersList();
  }

  ngOnDestroy(): void {
    this.subscriptions?.forEach(sub => sub.unsubscribe());
  }
  onOnboardingCandidate($event) {
    this.router.navigateByUrl(`jobs/details/job-details/${$event?.jobId}/candidate/${$event.candidateInfo.id}/onboarding`);
  }
  clickToOfferReview($event) {
    if ($event) {
      if ($event?.jobId) {
        this.router.navigateByUrl(
          `jobs/details/job-details/${$event?.jobId}/candidate/${$event?.candidateInfo?.id}/offers?offerId=${$event?.id}`
        );
      }
    }
  }
  clickToEditOfferReview($event){
    if ($event) {
      if ($event?.jobId) {
        this.router.navigateByUrl(
          `jobs/details/job-details/${$event?.jobId}/candidate/${$event?.candidateInfo?.id}/offers?offerId=${$event?.id}&offerEdit=true&offerPageMode=edit`
        );
      }
    }
  }
  clickToCancelOfferReview($event){
    let status = $event?.status.toLowerCase();
    if(status == 'countered pending review'){
      this.eventStream.emit(
        new EmitEvent(Events.COUNTERED_REVIEW_OFFER, {
          id: $event?.id,
          isopen: true,
          jobId: $event?.jobId,
        })
      );
    }
    else if(status == 'pending review') {
      this.eventStream.emit(
        new EmitEvent(Events.JOB_DETAIL_SIDEBAR_REJECT_REVIEW_OFFER, {
          id: $event?.id,
          isopen: true,
          jobId: $event?.jobId,
        })
      );
    }
  }
  getAssignmentConfig(){
    this.loaderService.show();
    this.candidateService.getAssignmentConfig(this.currentProgram?.id).subscribe({
      next:(data:any)=>{
        if(data){
          this.allowAssignmentOverlap = data?.config?.overlapping_assignments?.is_allow;
        }
        this.loaderService.hide();
      },
      error:(err)=>{
        this.alertService.error(errorHandler(err));
        this.loaderService.hide();
      }
    })
  }

  checkOverlap(event){
    if(event){
      if(this.allowAssignmentOverlap){
        this.openAcceptOfferSidebar(event);
      }
      else{
        //Check overlapping assignments if setting is disabled
        this.loaderService.show();
        this.candidateService.getOverlappingAssignment(
          this.currentProgram?.id,
          event?.candidateId,
          event?.stages?.[0]?.start_date,
          event?.stages?.[0]?.end_date,
          'MM/DD/YYYY'
        ).then((data:any)=>{
          this.loaderService.hide();
          if(data?.is_assignment_allow){
            this.openAcceptOfferSidebar(event);
          }
          else{
            this.showOverlapWarning = true;
            this.overlapAssignmentData = data?.details || [];
          }
        })
      }
    }
  }
}
