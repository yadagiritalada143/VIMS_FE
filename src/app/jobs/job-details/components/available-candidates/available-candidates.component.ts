import { Component, OnInit, OnDestroy } from '@angular/core';
import { VMSConfig } from 'src/app/library/smartTable/table/table.model';
import { CandidateService } from 'src/app/candidates/service/candidate.service';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { ActivatedRoute, Router } from '@angular/router';
import { CustomcurrencyPipe } from 'src/app/shared/pipe/customcurrency.pipe';
import {
  EmitEvent,
  Events,
  EventStreamService,
} from 'src/app/core/services/event-stream.service';
import { StorageService } from 'src/app/core/services/storage.service';
import { UserPermissionService } from 'src/app/expense/services/user-permission.service';
import { UserType } from 'src/app/expense/enums/expense.enums';
import { JobStatus } from 'src/app/shared/enums';
import { JobDetailsService } from '../../job-details.service';
import { AuthorizationService } from 'src/app/core/services/authorize.service';
import { MasterTalentProfileService } from 'src/app/master-talent-profiles/master-talent-profile.service';
import { MasterProfilePermissions } from 'src/app/assignment/enums/master-profile-permissions';
@Component({
  selector: 'app-available-candidates',
  templateUrl: './available-candidates.component.html',
  styleUrls: ['./available-candidates.component.scss'],
})
export class AvailableCandidatesComponent implements OnInit , OnDestroy {
  userType: any;
  public vmsData: any;
  public tableConfig: VMSConfig;
  public isExpand = false;
  public totalPages = 0;
  public totalRecords = 0;
  public limit = 10;
  public pageNo = 1;
  tableLoaded = false;
  loadingData = true;
  isAdvance = false;
  searchTerm: any;
  filter: any = {};
  jobId: any;
  itemsPerPage = 10;
  rotuterLinkParams;
  rotuterLinkParseFn;
  templateId: any;
  currentJobStatus: string;
  currentOptStatus: boolean;
  status: string;
  jobDetails;
  baseURL;
  showPlusIcon : boolean = false;
  maskCandidate: boolean = this.authorizationService.authorize('mask_unique_id');
  subscriptions = [];
  constructor(
    private candidateService: CandidateService,
    private _alert: AlertService,
    private _loader: LoaderService,
    private route: ActivatedRoute,
    private router: Router,
    private eventStream: EventStreamService,
    public storageService: StorageService,
    private userPermissionService: UserPermissionService,
    public customCurrencyPipe: CustomcurrencyPipe,
    private jobService: JobDetailsService,
    private authorizationService: AuthorizationService,
    private mtpService: MasterTalentProfileService,
  ) { }
  programId;
  sortColMap = {
    'unique_id': 'unique_id',
  }

  defaultSortObj = {
    name: 'created_on',
    order: 'DESC'
  };

  sortObj = {
    name: 'created_on',
    order: 'DESC'
  };

  initializeTable = () => {
    this.tableConfig = {
      title: 'Available Candidates',
      isCreateButtonName: 'Create Candidate',
      tableNoDataObj: {
        headTitle: 'No Candiates Available',
        subTitle: 'There are no candiates available for this position',
        imageUrl: './assets/images/Resume folder-rafiki.svg',
        isButton: 'Create New candidate',

      },
      columnList: [
        {
          name: 'candidate_name',
          title: 'Candidate',
          width: 30,
          isIcon: true,
          isImage: true,
          isContact: false,
          isNumberBadge: false,
          isViewProfile: true,
          isVieworEditCandidate: true,
          isSubmitCandidate: this.userPermissionService.isUserRole(UserType.Vendor) || this.userPermissionService.isUserRole(UserType.Super_org) && this.currentJobStatus !== JobStatus.CLOSED,
          showPreviewIcon: true,
          canViewMtp: this.mtpService.hasPermission(MasterProfilePermissions.VIEW_MTP_SCREEN),
        },
        {
          name: 'preferences.availability_date',
          title: 'Availability',
          width: 14,
          isIcon: false,
          isImage: false,
          isContact: false,
          isNumberBadge: false,
        },
        {
          name: 'unique_id',
          title: 'Unique ID',
          width: 14,
          isIcon: false,
          isImage: false,
          isContact: false,
          isNumberBadge: false,
          isSort:true,
          isMasked: this.maskCandidate,
        },
        {
          name: 'preferences.rate.amount',
          title: 'Preferred Pay Rate',
          width: 14,
          isIcon: false,
          isImage: false,
          isContact: false,
          isNumberBadge: false,
        },
        {
          name: 'preferences.estimated_hours',
          title: 'Estimated Hours',
          width: 14,
          isIcon: false,
          isImage: false,
          isContact: false,
          isNumberBadge: true,
        },
        {
          name: 'estimated_pay',
          title: 'Estimated Pay',
          width: 14,
          isIcon: false,
          isImage: false,
          isContact: false,
          isNumberBadge: true,
        },
        // { name: 'match', title: 'Match', width: 10, isIcon: false, isImage: false, isContact: false,isNumberBadge: false,  isProfileMatch:true,isVieworEdit: true, isViewProfile:false, isDisableorDelete: false, isDelete: false, isWithdrawal:true},
      ],
      isExpand: false,
      isFilter: true,
      isSearch: true,
      isSetting: false,
      isTopPagination: true,
      hideResultCount: true,
      isCreate: this.showPlusIcon,
      density: 'COMFORTABLE',
      isTopHeader: true,
      permission:'submit_candidate',
      advanceFilter: [
        // { name: 'name', title: 'Candidate Name', filterType: 'TEXT' },
        {
          name: 'min',
          placeholder: 'Min',
          placeholder_1: 'Max',
          title: 'Preferred Pay Rate Range',
          filterType: 'RANGE',
        },
        // { name: 'min', placeholder: 'Min',  placeholder_1 : 'Max', title: 'Preferred Pay Rate Range', filterType: 'RANGE' },
      ],
    };
  }

  ngOnInit() {
    this.route.parent?.data.subscribe((result:any) => {
      if(result?.jobResolvedData){
        this.jobDetails = result.jobResolvedData;
        this.currentOptStatus = (this.jobDetails?.job?.opt_option === 'opt_out' || this.jobDetails?.job?.opt_option === 'pending_opt_action') ? false : true;
        this.userType = this.storageService.get('user_type');
        this.maskCandidate = this.maskCandidate && this.userType?.toUpperCase() !== UserType.Super_org;
        this.programId = this.storageService.get('PROGRAM_ID');
        this.baseURL = '/submission-manager';
        this.jobId = this.route.parent.snapshot.params['id'];
        this.templateId = this.route.snapshot.queryParams['templateId'];
        this.currentJobStatus = this.route.snapshot.queryParams['jobStatus'] || this.jobDetails?.status?.toLowerCase();
        this.rotuterLinkParams = { jobId: this.jobId };
        this.getStatus(this.jobDetails?.job?.status);
      }
    });
    this.eventStream.on(Events.JOB_OPT_OPTIONS).subscribe( data =>{
      this.currentOptStatus = data;
    });
    this.rotuterLinkParseFn = (rowData, options) =>
          `jobs/details/job-details/${options.jobId}/candidate/${rowData.id}/profile?isfromAvailableCandidate=true`;
    this.eventStream.on(Events.UPDATE_JOB_STATUS).subscribe((event)=>{
      if(this.status?.toUpperCase() != event?.toUpperCase()){
        this.getStatus(event, true);
      }
    });
    this.initializeTable();
    this.tableConfig.isCreate = this.showPlusIcon;
  }

  getStatus($event, isUpdated?){
    if($event){
      this.currentJobStatus = $event;
      this.hideAddCandidteIcon($event);
      if(isUpdated){
        this.tableConfig.isCreate = this.showPlusIcon;
      }
      this.status = $event;
      this.getAvailableCandidateList();
    }
  }

  hideAddCandidteIcon(jobStatus){
    let status = jobStatus.toLowerCase();
    if(status === 'halted' || status === 'hold' || status === 'filled' || status === 'closed'){
      this.showPlusIcon =  false;
    } else{
      this.showPlusIcon = true;
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
    this.getAvailableCandidateList()
  }

  getAvailableCandidateList(pageNo = 1) {
    this._loader.hide();
    this.loadingData = true;
    let search = this.searchTerm ? '&k=' + encodeURIComponent(this.searchTerm) : '';
    if (this.sortObj && this.sortObj.order === 'DESC') {
      search = search + '&sort_field=-' + this.sortObj.name;
    } else {
      search = search + '&sort_field=' + this.sortObj.name;
    }
    let url = `${this.baseURL}/programs/${this.programId}/jobs/${this.jobId}/candidates?is_inversed=true&limit=${this.limit}&page=${pageNo}&is_enabled=true`;
    this.candidateService.get(url + search)
      .subscribe({
        next: (data: any) => {
          let _this = this;
          data?.candidates?.map((element) => {
            let candidate_name = element.middle_name
              ? `${element.first_name} ${element.middle_name} ${element.last_name}`
              : `${element.first_name} ${element.last_name}`;
            element.candidate_name = this.jobService.toTitleCase(candidate_name);
            if (
              element?.preferences?.rate?.amount &&
              element?.preferences?.estimated_hours
            ) {
              element.estimated_pay =
                element?.preferences?.rate?.amount *
                element?.preferences?.estimated_hours;
            } else {
              element.estimated_pay = 0;
            }
            if (element?.preferences.rate.amount) {
              element.preferences.rate.amount = element?.preferences.rate.amount ? _this?.customCurrencyPipe?.transform(element?.preferences.rate.amount, element?.preferences.rate?.currency?.toLowerCase()) : '-'
            }
            if (element?.estimated_pay) {
              element.estimated_pay = element?.estimated_pay ? _this?.customCurrencyPipe?.transform(element?.estimated_pay, element?.preferences.rate?.currency?.toLowerCase()) : '-'
            }
            element.orgStatus = this.currentJobStatus;
          });
          this.vmsData = { candidate: data?.candidates };
          this.loadingData = false;
          this.totalRecords = data?.total_records;
          this.itemsPerPage = data?.items_per_page;
          this.tableLoaded = true;
          this._loader.hide();
        },
        error: (err) => {
          this.loadingData = false;
          this._loader.hide();
          this._alert.error(errorHandler(err));
        }
  });
  }

  onClickNext(event) {
    if (event) {
      this.router.navigate(['/candidates/create']);
    }
  }
  //submit candidate btn

  previewClicked(event) {
    this.eventStream.emit(
      new EmitEvent(Events.JOB_DETAIL_SIDEBAR_VIEW, {
        value: event,
        selectedIndex: 0,
        candidateId: event?.id,
        job_id: this.jobId,
        reference_page: 'available-candidate',
      })
    );
  }

  onEditClick(eve) {
    this.router.navigate([`candidates/edit/${eve.id}`], {
      queryParams: {
        job_id: this.jobId,
        reference_page: 'available-candidate',
      },
    });
  }

  // onEditClick(data) {
  //   this.router.navigate(['/candidates/edit'], {
  //     queryParams: {
  //       candidateSubmission: true,
  //       jobId: 1,
  //       type: 'updateThensubmit',
  //       candidateId: data.id,
  //     },
  //   });
  // }
  cloneClicked(e) { }
  onExpandClick(e) { }

  onPaginationClick(e) {
    if (this.isAdvance) {
      this.getAvailableCandidateListFilter(e);
    } else {
      this.pageNo = e;
      this.getAvailableCandidateList(e);
    }
  }

  onClickRecords(event) {
    this.limit = event;
    this.getAvailableCandidateList(1);
  }

  onDeleteClick(role) { }

  disableClicked(role) { }

  onCreateClick(e) {
    let jobData = this.storageService?.get('viewd_job');
    if (jobData) {
      if ((this.userType === 'VENDOR' || this.userType === 'SUPER_ORG') && (jobData?.status === 'hold' || jobData?.status === 'halted' || jobData?.status === 'rejected')) {
        this._alert.error('Submissions are not allowed for the job');
        return;
      } else {
        this.router.navigate(['/candidates/create'], { queryParams: { job: jobData?.id, submit: true, returnUrl: encodeURIComponent(this.router.url) } });
      }
    }
  }

  columnClicked(columnData) { }

  viewProfileClicked(event) {
    if (event) {
      this.eventStream.emit(
        new EmitEvent(Events.JOB_DETAIL_SIDEBAR_VIEW, { value: event })
      );
    }
  }

  onListFilter(event) {
    if (event) {
      this.isAdvance = true;
      if (event.min) {
        if (!this.filter.pay_rate) {
          this.filter.pay_rate = {};
        }
        this.filter.pay_rate = { min: event.min };
      }
      if (event.max) {
        if (!this.filter.pay_rate.hasOwnProperty('min')) {
          this.filter.pay_rate = {};
          this.filter.pay_rate = { ...{ max: event.max } };
        } else {
          this.filter.pay_rate = {
            ...{ min: event.min },
            ...{ max: event.max },
          };
        }
      }

      this.getAvailableCandidateListFilter(1);
    } else {
      this.isAdvance = false;
      this.getAvailableCandidateList();
    }
  }
  getAvailableCandidateListFilter(pageNo = 1) {
    let url = `${this.baseURL}/candidates/advanced-filters?program_id=${this.programId}`;
    this.filter.pagination = {
      limit: this.limit,
      page: pageNo,
    };
    this.candidateService.post(url, { filters: this.filter }).subscribe({
      next: (data: any) => {
        data?.candidates.map((element) => {
          let candidate_name1 = element.middle_name
            ? `${element.first_name} ${element.middle_name} ${element.last_name}`
            : `${element.first_name} ${element.last_name}`;
          element.candidate_name = candidate_name1;
          if (
            element?.preferences?.rate?.amount &&
            element?.preferences?.estimated_hours
          ) {
            element.estimated_pay =
              element?.preferences?.rate?.amount *
              element?.preferences?.estimated_hours;
          } else {
            element.estimated_pay = 0;
          }
          element.orgStatus = this.currentJobStatus;
        });
        this.vmsData = { candidate: data?.candidates };
        this.loadingData = false;
        this.totalRecords = data?.total_records;
        this.itemsPerPage = data?.items_per_page;
        this.tableLoaded = true;
        this._loader.hide();
      },
      error: (err) => {
        this.loadingData = false;
        this._alert.error(errorHandler(err));
      }
  });
  }

  onWithdrawProfileClick(event) {
    // this.router.navigate(['/candidates/submit-candidate'],
    // { queryParams: { candidateSubmission: true, jobId: this.jobId, type:'submit', candidateId:event.id} });
  }
  onSubmitedCandidate(event) {
    if (this.validJob()) {
      this.router.navigate(['/candidates/submit-candidate'], {
        queryParams: { jobId: this.jobId, candidateId: event.id, templateId: this.templateId, isSubmitted: false },
      });
    }

    // let program  = this.storageService.get(StorageKeys.CURRENT_PROGRAM);

    // let job = this.storageService.get('viewd_job');

    // let url = `/configurator/programs/${program?.id}/jobs/${job?.uid}/candidates/submit`
    // this.candidateService.post(url, data).subscribe(data => {

    //   this._loader.hide();
    //   this._alert.success('Candidate submittted successfully');
    // }, err => {
    //   this.loadingData = false;
    //   this._alert.error(errorHandler(err));
    // });
  }

  onSearch(event) {
    this.searchTerm = event ? decodeURIComponent(event) : '';
    this.getAvailableCandidateList(1);
  }

  private validJob = () => {
    if (!this.currentJobStatus) {
      return true;
    } else {
      this.currentJobStatus = this.currentJobStatus.toLowerCase();
      return !(this.currentJobStatus === JobStatus.HALTED || this.currentJobStatus === JobStatus.HOLD
        || this.currentJobStatus === JobStatus.FILLED || this.currentJobStatus === JobStatus.CLOSED);
    }
  }

  ngOnDestroy(): void {
      this.subscriptions?.forEach(sub=>sub?.unsubscribe());
  }
}
