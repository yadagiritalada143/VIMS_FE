import { Component, OnDestroy, OnInit } from '@angular/core';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { JobDetailsService } from '../../job-details.service';
import { errorHandler } from '../../../../shared/util/error-handler';
import { ActivatedRoute, Router } from '@angular/router';
import { VMSConfig } from 'src/app/library/smartTable/table/table.model';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import {
  EventStreamService,
  Events,
  EmitEvent,
} from 'src/app/core/services/event-stream.service';
import { JobStatus, UsersType } from 'src/app/shared/enums';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { AuthorizationService } from 'src/app/core/services/authorize.service';
import { MasterProfilePermissions } from 'src/app/assignment/enums/master-profile-permissions';
import { MasterTalentProfileService } from 'src/app/master-talent-profiles/master-talent-profile.service';
import { CandidateService } from 'src/app/candidates/service/candidate.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
@Component({
  selector: 'app-offers',
  templateUrl: './offers.component.html',
  styleUrls: ['./offers.component.scss'],
})
export class OffersComponent implements OnInit, OnDestroy {
  private subscriptions = [];
  public dataLoader: any;
  public vmsData: any;
  public tableConfig: VMSConfig;
  public isExpand = false;
  public totalPages = 0;
  public totalRecords = 0;
  gridContentType = 'candidate';
  tableLoaded = true;
  dataLoading = false;
  itemsPerPage = '';
  public viewGrid: boolean = true;
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
  currentJobid;
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
  userType: string;
  pageNo: number;
  limit: number;
  candidateName: any;
  public jobStatus: any = JobStatus;
  currentJobStatus:any;
  offerNewWorkflow: boolean = false;
  sortColMap = {
    'offer_created' : 'created_on',
    'offer_updated': 'modified_on',
  }

  defaultSortObj = {
    name: 'created_on',
    order: 'DESC'
  };

  sortObj = {
    name: 'created_on',
    order: 'DESC'
  };
  baseURL;
  maskCandidate: boolean = this.authorizationService.authorize('mask_unique_id');
  showOverlapWarning: boolean = false;
  allowAssignmentOverlap: boolean;
  overlapAssignmentData = [];
  constructor(
    private jobService: JobDetailsService,
    private alertService: AlertService,
    private route: ActivatedRoute,
    private storageService: StorageService,
    private eventStream: EventStreamService,
    private router: Router,
    private localDatePipeFormat : LocalDateFormatPipe,
    private authorizationService: AuthorizationService,
    private masterTalentProfileService: MasterTalentProfileService,
    private candidateService: CandidateService,
    private loaderService: LoaderService
  ) { }

  ngOnInit(): void {
    this.userType = this.storageService.get('user_type');
    this.baseURL = '/submission-manager';
    this.maskCandidate = this.maskCandidate && this.userType?.toUpperCase() !== UsersType.Super_org;
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
          isOfferReview:true,
          canViewMtp: this.masterTalentProfileService.hasPermission(MasterProfilePermissions.VIEW_MTP_SCREEN),
        },
        {
          name: 'candidateUnique_id',
          title: 'Unique ID',
          width: 10,
          isIcon: false,
          isImage: false,
          isContact: false,
          isNumberBadge: false,
          isMasked: this.maskCandidate
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
          isSort: true
        },
        {
          name: 'offer_updated',
          title: 'Offer Last Updated',
          width: 15,
          isIcon: false,
          isImage: false,
          isContact: false,
          isNumberBadge: true,
          isSort: true
        },
      ],
      isExpand: false,
      isFilter: true,
      isSearch: true,
      isSetting: true,
      isTopPagination: true,
      hideResultCount: true,
      isCreate: false,
      isTopHeader: true,
      density: 'COMFORTABLE',
      // isTheme: true,
      tableWidth: '100%',
      tableNoDataObj: {
        headTitle: 'No offers found',
        subTitle: 'There are no offers created for this job',
        imageUrl: './assets/images/freepik--Envelope--inject-10.svg',
        button: this.userType !== 'VENDOR',
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
    this.offerNewWorkflow = this.currentProgram?.config?.offer?.offer_details_new_ui ?? false;
    this.currentJobid = this.route.parent?.snapshot.params['id'];
    this.getJobDetails(this.currentJobid);
    this.getAssignmentConfig();
    this.rotuterLinkParams = { jobId: this.currentJobid };
    this.rotuterLinkParseFn = (rowData, options) =>
      `jobs/details/job-details/${options?.jobId}/candidate/${rowData?.candidateInfo?.id}/offers?offerId=${rowData?.id}`;

    // this.getOffersList();
    if (this.currentJobid) {
      // this.getOfferDetails();
      this.getOffersList();
    }
    this.subscriptions.push(this.eventStream.on(Events.RELOAD_OFFERS).subscribe((data) => {
      if (data) {
        this.getOffersList();
      }
    }));
  }

  get disableOnboarding() {

    return this.currentProgram?.config?.is_onboading_disabled
  }

  onSortClick(event) {
    if (!!event) {
      if(this.sortColMap[event.name]) {
        event.name = this.sortColMap[event.name]
      }
      this.sortObj = event;
    } else {
      this.sortObj = this.defaultSortObj
    }
    if(this.sortObj && this.sortObj.name === 'candidate') this.sortObj.name = 'first_name';
    this.getOffersList()
  }
  getJobDetails(id){
    this.jobService.loadJob(id).subscribe((res: any) => {
      this.currentJobStatus = res?.job?.status;
    });
  }
  toggleCandidateInfo() {
    this.candidateInfo = !this.candidateInfo;
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
    let search = this.searchTerm ? this.searchTerm : '';
    let filterCandidate = this.filterCandidate
      ? this.filterCandidate
      : '';
    let createdOn = this.createdOn ? this.createdOn : '';
    let updatedOn = this.updatedOn ? this.updatedOn : '';
    let filterStatus = this.filterStatus ? this.filterStatus : '';
    let programId = this.currentProgram?.id;
    let page = this.pageNo ? `${this.pageNo}` : 1;
    let limit = this.limit ? this.limit : 10;

    let params = {};
    params['page'] = page.toString();
    params['limit'] = limit.toString();
    params['k'] = search.toString();
    params['candidate_id'] = filterCandidate.toString();
    params['created_on'] = createdOn.toString();
    params['modified_on'] = updatedOn.toString();
    params['status'] = filterStatus.toString();
    if(this.sortObj && this.sortObj.name !== ""){
      params['sort_field'] = this.sortObj && this.sortObj.name !== "" ? this.sortObj.name : "";
      if(this.sortObj.order !== '')
        params['order_by'] = this.sortObj.order.toLocaleLowerCase()
    }
    let url = `${this.baseURL}/programs/${programId}/jobs/${this.currentJobid
      }/offers?level=basic`;
    this.subscriptions.push(this.jobService.get(url, params).subscribe({
      next: (data: any) => {
        if (data) {
          this.offersList = data?.offers;
          let offers = [];
          if (!data?.offers.length && !!search) {
            let noDataObj = {
              headTitle: 'No records found',
              subTitle: 'There are no records found for this search',
              imageUrl: './assets/images/freepik--Envelope--inject-10.svg',
              button: false
            };
            this.tableConfig.tableNoDataObj = { ...noDataObj };
          }
          data?.offers.forEach((item) => {

            // this.candidateName = item?.do_not_rehire ? `${item?.candidate?.first_name} ${item?.candidate?.middle_name || ''} ${item?.candidate?.last_name}
            // <div class="custom-tooltip"> <i class="material-icons"> no_accounts </i> <span class="tooltiptext">Do Not Re-hire</span> </div> `
            // : `${item?.candidate?.first_name} ${item?.candidate?.middle_name || ''} ${item?.candidate?.last_name}`

            let candidate_name1 = item?.candidate?.middle_name
                ? `${item?.candidate?.first_name} ${item?.candidate?.middle_name} ${item?.candidate?.last_name}`
                : `${item?.candidate?.first_name} ${item?.candidate?.last_name}`;

              candidate_name1=this.jobService.toTitleCase(candidate_name1);
              candidate_name1 = `${candidate_name1} <div>`;

              if (item?.is_rehire) {
                candidate_name1 += ` <span class="custom-tooltip"> <img src='assets/images/rehire.svg' /> <span class="tooltiptext"><strong>Re-hire</strong> ${item?.candidate_worked_as ? `- `+this.getWorkedRehire(item?.candidate_worked_as) : ``}</span> </span>`;
              }

              if (item?.do_not_rehire) {
                candidate_name1 += ` <span class="custom-tooltip"> <i class="material-icons"> no_accounts </i> <span class="tooltiptext">Do Not Re-hire</span> </span>`;
              }

              if (item?.ot_mismatch) {
                candidate_name1 += ` <span class="custom-tooltip"> <span class="material-icons-round" style="color:red">hourglass_top</span>  <span class="tooltiptext">OT Exempt Mismatch</span> </span>`;
              }
              candidate_name1 += ` </div>`;

            this.candidateName=candidate_name1;

            let offer = {
              ...item,
              candidate: this.candidateName,
              candidateId: item?.candidate?.id,
              candidateUnique_id: item?.candidate?.unique_id,
              status: this.checkStatus(item?.status),
              offer_id: item?.offer_id,
              offer_created: this.localDatePipeFormat.transform(item?.created_on),
              offer_updated: this.localDatePipeFormat.transform(item?.modified_on),
              candidateInfo: item.candidate,
              candidate_submission_status: item?.candidate_submission_status,
              taxes: item?.taxes,
              mtp_id: item?.candidate.mtp_id,

            };
            offers.push(offer);
          });
          this.vmsData = { offer: offers };
          this.gridVewJson = this.vmsData.offer;
          this.dataLoading = false;
          this.totalRecords = data?.total_records;
          this.itemsPerPage = data?.items_per_page;
          this.tableLoaded = true;
        }
      },
      error: (err) => {
        this.dataLoading = false;
        this.alertService.error(errorHandler(err));
      }
  }));
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
    } else if (status?.toLowerCase() === this.jobStatus?.PENDING_DISTRIBUTION?.toLowerCase()) {
      status = 'Pending Distribution';
    } else if (status?.toLowerCase() === this.jobStatus?.OFFER_CANCELLED?.toLowerCase()) {
      status = 'Cancelled';
    } else if (status?.toLowerCase() === this.jobStatus?.COUNTERED_CANCELLED?.toLowerCase()) {
      status = 'Countered Review Cancelled';
    } else if (status?.toLowerCase() === this.jobStatus?.COUNTERED_PENDING_REVIEW?.toLowerCase() && !this.offerNewWorkflow) {
      status = 'Countered Pending Review';
    }else if (status?.toLowerCase() === this.jobStatus?.COUNTERED_PENDING_REVIEW?.toLowerCase() && this.offerNewWorkflow) {
      status = 'Counter Pending Review';
    }else if (status?.toLowerCase() === this.jobStatus?.COUNTERED_PENDING_APPROVAL?.toLowerCase() && this.offerNewWorkflow) {
      status = 'Counter Pending Approval';
    }
    return status;
  }
  releaseOffer() {
    const payload = {
      available_start_date: this.availableStartDate,
      bill_rate: this.offerBillRate,
      pay_rate: this.offerPayRate,
      notes: this.notes,
    };
    this.subscriptions.push(this.jobService
      .releaseOffer(payload, this.currentJobid, this.candidateId)
      .subscribe({
        next: (data) => {
          if (data) {
            this.alertService.success('Offer released successfully');
          }
        },
        error: (err) => {
          this.alertService.error(errorHandler(err));
        }
  }));
  }

  previewClicked(event) {
    this.eventStream.emit(
      new EmitEvent(Events.JOB_DETAIL_SIDEBAR_VIEW, {
        value: event,
        selectedIndex: 4,
        candidateId: event.candidateInfo.id,
        job_id: this.currentJobid,
        details: event,
      })
    );
  }

  onExpandClick(event) { }
  onEditClick(event) { }
  onPaginationClick(event) {
    this.pageNo = event;
    this.getOffersList();
  }
  onCreateClick(event) { }
  disableClicked(event) { }
  onDeleteClick(event) { }
  columnClicked(event) { }
  onSearch(term) {
    if (term != this.searchTerm) {
      this.searchTerm = term;
      this.pageNo = 1;
      this.getOffersList();
    }
  }
  onListFilter(event) {
    // this.filterCandidate = event?.candidate;
    this.searchTerm = event?.candidate;
    this.updatedOn = event?.offer_updated
      ? event?.offer_updated?.[0] + '-' + event?.offer_updated?.[1]
      : null;
    this.createdOn = event?.offer_created?.[0]
      ? event?.offer_created?.[0] + '-' + event?.offer_created?.[1]
      : null;
    this.filterStatus = event?.status;
    this.pageNo = 1;
    this.getOffersList();
  }

  openCounterOfferSidebar($event) {
    this.router.navigateByUrl(
      `jobs/details/job-details/${this.currentJobid}/candidate/${$event.candidateInfo.id}/offers?offerId=${$event?.id}&counterOffer=true`
    );
  }




  withdrawalClicked(event) {
    if (event.status == 'RELEASED') {
      this.eventStream.emit(
        new EmitEvent(Events.WITHDRAW_CANDIDATE, {
          value: true,
          candidateId: event.candidateId,
          jobId: this.currentJobid,
        })
      );
    }
  }

  onWithdrawnCandidate(event){
    if(event){
      this.getOffersList();
    }
  }
  openAcceptOfferSidebar($event) {
    if ($event) {
      this.eventStream.emit(
        new EmitEvent(Events.JOB_DETAIL_SIDEBAR_ACCEPT_OFFER, {
          ...$event,
          isopen: true,
          jobId: this.currentJobid,
          taxData: $event?.taxes
        })
      );
    }
  }

  openRejectOfferSidebar($event) {
    if ($event) {
      this.eventStream.emit(
        new EmitEvent(Events.JOB_DETAIL_SIDEBAR_REJECT_OFFER, {
          ...$event,
          isopen: true,
          jobId: this.currentJobid,
        })
      );
    }
  }
  clickToRejectCandidate(event) {

    if (event.status == 'RELEASED') {
      this.eventStream.emit(
        new EmitEvent(Events.REJECT_CANDIDATE, {
          value: true,
          candidateId: event.candidateId,
          jobId: this.currentJobid,
        })
      );
    }
  }

  changerecords(event) {
    this.pageNo = 1;
    this.limit = event;
    this.getOffersList();
  }

  ngOnDestroy(): void {
    this.subscriptions?.forEach(sub => sub.unsubscribe());
  }

  openEditOfferSidebar($event) {
    this.router.navigateByUrl(
      `jobs/details/job-details/${this.currentJobid}/candidate/${$event.candidateInfo.id}/offers?offerId=${$event?.id}&offerEdit=true&offerPageMode=edit`
    );

  }

  onOnboardingCandidate($event) {
    this.router.navigateByUrl(
      `jobs/details/job-details/${this.currentJobid}/candidate/${$event.candidateInfo.id}/onboarding`
    );
  }

  clickToOfferReview($event) {
    if ($event) {
      if ($event?.id) {
        this.router.navigateByUrl(
          `jobs/details/job-details/${this.currentJobid}/candidate/${$event?.candidateInfo?.id}/offers?offerId=${$event?.id}`
        );
      }
    }
  }
  clickToEditOfferReview($event){
    if ($event) {
      if ($event?.id) {
        this.router.navigateByUrl(
          `jobs/details/job-details/${this.currentJobid}/candidate/${$event?.candidateInfo?.id}/offers?offerId=${$event?.id}&offerEdit=true&offerPageMode=edit`
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
          jobId: this.currentJobid,
        })
      );
    }
    else if(status == 'pending review') {
      this.eventStream.emit(
        new EmitEvent(Events.JOB_DETAIL_SIDEBAR_REJECT_REVIEW_OFFER, {
          id: $event?.id,
          isopen: true,
          jobId: this.currentJobid,
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
          'YYYY-MM-DD'
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
