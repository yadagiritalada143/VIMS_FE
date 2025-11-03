import { Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { AccessControlService } from 'src/app/core/services/access-control.service';
import { EmitEvent, EventStreamService, Events } from 'src/app/core/services/event-stream.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { VMSConfig } from 'src/app/library/smartTable/table/table.model';
import { ConfirmationDialogService } from 'src/app/shared/components/confirmation-dialog/confirmation-dialog.service';
import { JobStatus, UsersType } from 'src/app/shared/enums';
import { AccuracyPipe } from 'src/app/shared/pipe/accuracy.pipe';
import { SnakeToTitleCasePipe } from 'src/app/shared/pipe/snake-to-title-case.pipe';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { JobDetailsService } from '../job-details/job-details.service';
import { JobService } from '../job.service';

@Component({
  selector: 'app-job-list',
  templateUrl: './job-list.component.html',
  styleUrls: ['./job-list.component.scss'],
})
export class JobListComponent implements OnInit {
  vmsData = [];
  filter: any = {};
  public user_type: any;

  public tableConfig: VMSConfig;
  public jobStatus: any = JobStatus;
  public searchTerm: any;
  public dataLoading = true;
  public totalPages = 0;
  public totalRecords = 10;
  public itemPerPage = 10;
  public pageNo = 1;
  public currentProgram;
  public VmsTabCountChange:boolean=false;
  selectedTab: string = undefined;
  public status: any = 'All Jobs';
  userDetails: any;
  selectedRecords = 10;
  tabCount: any = {
    sourcing: 0,
    active_jobs: 0,
    pendingApprovalHalted: 0,
    pendingApprovalHold: 0,
    filledOrClosed: 0,
    pendingReview: 0,
    pendingDistribution: 0,
    pendingApproval: 0,
    pendingJobs: 0,
    myPendingApproval:0
  };
  initFlag: boolean = true;
  countData: number[];
  isOptOutText: string = 'opt_in';
  isOptOut = true;
  closeSidebar: boolean = false;
  jobId: any;
  jobListSubscription: Subscription;
  genericListEnabled:boolean = false;
  constructor(
    public jobService: JobService,
    private loaderService: LoaderService,
    private alertService: AlertService,
    private router: Router,
    private route: ActivatedRoute,
    private storageService: StorageService,
    private eventStream: EventStreamService,
    public JobDetailsService: JobDetailsService,
    public accuracyPipe: AccuracyPipe,
    private location: Location,
    private _confirmService: ConfirmationDialogService,
    private accessControlService: AccessControlService,
    private snakeToTitleCasePipe: SnakeToTitleCasePipe
  ) {}

  ngOnInit(): void {
    this.currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.user_type = this.storageService.get('user_type');
    this.userDetails = this.storageService.get('user');
    this.route.paramMap.subscribe(param => {
      let status = param.get('status') || 'All Jobs';
      this.status = status.replace(/%20/g, ' ');
      if (this.status === 'filled-closed') {
        this.status = 'filled/closed';
      }
      if (this.status === 'new-job-requests') {
        this.status = 'new job requests';
      }
      if (this.status === 'my-pending-approval') {
        this.status = 'my pending approval';
      }
      this.storageService.set('job_listing_status', this.status);
      switch (status.toLowerCase()) {
        case 'sourcing':
          this.onTabClick('Sourcing');
          break;
        case 'active_jobs':
          this.onTabClick('Active Jobs');
          break;
        case 'pending distribution':
          this.onTabClick('Pending Distribution');
          break;
        case 'pending review':
          this.onTabClick('Pending Review');
          break;
        case 'pending approval':
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
        case 'new-job-requests':
          this.onTabClick('New Job Requests');
          break;
        case 'my-pending-approval':
          this.onTabClick('My Pending Approval');
          break;
        default: {
          const index = this.tableConfig?.tabsList?.findIndex(item => status?.toLowerCase() === item.toLowerCase());
          if (index === -1) {
            status = 'All Jobs';
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
      this.selectedTab = this.status;
    }

    if (page) {
      this.pageNo = page;
    }

    if (limit) {
      this.itemPerPage = limit;
    }

    this.vmsTableConfig();
    // this.currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    if (this.currentProgram) {
      this.getJobList(page ? this.pageNo : null);
    }
    if(this.currentProgram?.config?.generic_list_pages?.['job']){
      this.getGlobalFlagsList();
    }

  }


  getGlobalFlagsList() {
    this.jobService.get('/configurator/global-launch?limit=50')
    .subscribe({
      next: (data: any) => {
        if(data?.global_launch_data?.length > 0) {
            this.tableConfig.enableGenricListViewButton =  data.global_launch_data.find(config => config.slug === 'job_list_view_\'try_new_view\'')?.is_enabled;
            if(this.tableConfig.enableGenricListViewButton){
              this.tableConfig.genericListConfig = {'URL':'jobs/genericlist/JobModule/Job','oldURL':'jobs/list'};
            }
          }
      },
    })
  }

  get hideRateAuthority() {
    return this.JobDetailsService.rateAuthority();
  }

  vmsTableConfig() {
    if (this.user_type == 'PROGRAM' || this.user_type == 'SUPER_ORG') {
      this.tableConfig = {
        title: 'Jobs',
        searchPlaceHolder: 'Search by JOB TITLE or JOB ID.',
        columnList: [
          {
            name: 'template_name', //'title.title',
            title: 'Job Title',
            width: 15,
            isIcon: true,
            icon: 'expand_more',
            isImage: true,
            isContact: false,
            isNumberBadge: false,
            isOptOut: false,
            isSubmitCandidate: false,
            isSort: true,
            isAddAndSubmit: true,
            isRejectedJob: true,
            isDraftJob: true,
            isCloneJob: true,
            isDistribute: true,
            isReject: true,
            isApprove: true,
            isHold: true,
            isReDistribute: true,
            isHaltSubmission: true,
            isRelease: true,
            isClose: true,
            isEditJob: true,
            toolTipVisibility: true,
          },
          /* {
            name: 'template_name',
            title: 'Template',
            width: 10,
            isIcon: false,
            isImage: false,
            isContact: false,
            isNumberBadge: true,
            isSort: true,
          }, */
          {
            name: 'status',
            title: 'Status',
            width: 10,
            isIcon: false,
            isImage: false,
            isContact: false,
            isNoOption: false,
            isNumberBadge: false,
            isSort: true,
            toolTipVisibility: false,
          },
          {
            name: 'job_id',
            title: 'ID',
            width: 5,
            isIcon: false,
            isImage: false,
            isContact: false,
            isNumberBadge: false,
            isSort: true,
            toolTipVisibility: true,
          },
          {
            name: 'location.name',
            title: 'Location',
            width: 8,
            isIcon: false,
            isImage: false,
            isContact: false,
            isNumberBadge: false,
            // isSort: true,
            toolTipVisibility: true,
          },
          {
            name: 'hierarchyName',
            title: 'Hierarchy',
            width: 10,
            isIcon: false,
            isImage: false,
            isContact: false,
            isNumberBadge: true,
            // isSort: true,
            toolTipVisibility: true,
          },
          {
            name: 'start_date',
            title: 'Duration',
            width: 10,
            isIcon: false,
            isImage: false,
            isContact: false,
            isNumberBadge: false,
            isRange: true,
            rangeNameList: ['start_date', 'end_date'],
            isSort: true,
            toolTipVisibility: true,
          },
          // {
          //   name: 'hired_count',
          //   title: 'Hired',
          //   width: 5,
          //   isIcon: false,
          //   isImage: false,
          //   isContact: false,
          //   isNumberBadge: true,
          //   isSort: true,
          // },
          // {
          //   name: 'counts.submitted_candidates',
          //   title: 'Submissions',
          //   width: 5,
          //   isIcon: false,
          //   isImage: false,
          //   isContact: false,
          //   isNumberBadge: true,
          //   isSort: true,
          // },

          {
            name: 'positions',
            title: 'No of Positions',
            width: 5,
            isIcon: false,
            isImage: false,
            isContact: false,
            isNumberBadge: true,
            isSort: true,
            toolTipVisibility: false,
          },
          {
            name: 'submission_count',
            title: 'Submitted Candidates',
            width: 5,
            isIcon: false,
            isImage: true,
            isContact: false,
            isNumberBadge: true,
            isSort: false,
            isNoOption: true,
            toolTipVisibility: false,
          },
          {
            name: 'budget_estimate',
            title: 'Estimated Budget',
            width: 8,
            isIcon: false,
            isImage: false,
            isContact: false,
            isNumberBadge: true,
            isSort: true,
            toolTipVisibility: true,
          },
          /*  {
             name: 'direct_sourcing_distribution',
             title: 'Direct Sourcing Distribution',
             width: 7,
             isIcon: false,
             isImage: false,
             isContact: false,
             isNumberBadge: false,
             isSort: true
           },
           {
             name: 'submissions_from_direct_sourcing',
             title: 'Submissions from Direct Sourcing',
             width: 7,
             isIcon: false,
             isImage: false,
             isContact: false,
             isNumberBadge: false,
             isSort: true
           }, */
        ],
        tabsList: [
          'All Jobs',
          'Active Jobs',
          'Sourcing',
          'My Pending Approval',
          'Pending Distribution',
          // 'Pending Review', SO-239
          'Pending Approval',
          'Halted',
          'Hold',
          'Filled/Closed',
        ],
        showTabs: true,
        isExpand: false,
        isFilter: true,
        isSearch: true,
        isSetting: true,
        isTopPagination: true,
        // isDistributionList: true,
        isJobList: true,
        isCreate: true,
        density: 'COMFORTABLE',
        tableWidth: '2500px',
        isCreateButtonName: 'Job',
        advanceFilter: [
          { name: 'name', title: 'Job Title', filterType: 'TEXT' },
          {
            name: 'status',
            title: 'Status',
            filterType: 'SELECT',
            multiSelectData: [
              { name: 'Sourcing', value: 'sourcing' },
              { name: 'Pending Distribution', value: 'open' },
              // { name: 'Pending Review', value: 'pending_review' }, SO-239
              { name: 'Pending Approval', value: 'pending_approval_combined' },
              { name: 'Halt', value: 'halted' },
              { name: 'Hold', value: 'hold' },
              { name: 'Filled/Closed', value: 'filled_or_closed' },
              { name: 'Rejected', value: 'rejected' },
              { name: 'Draft', value: 'draft' },
            ],
          },
        ],
      };
    } else if (this.user_type == 'MSP') {
      this.tableConfig = {
        title: 'Jobs',
        searchPlaceHolder: 'Search by JOB TITLE or JOB ID.',
        columnList: [
          {
            name: 'template_name',
            title: 'Job Title',
            width: 15,
            isIcon: true,
            icon: 'expand_more',
            isImage: true,
            isContact: false,
            isNumberBadge: false,
            isRejectedJob: true,
            isDraftJob: true,
            isCloneJob: true,
            isEditorReview: true,
            isOptOut: false,
            isSubmitCandidate: false,
            isAddAndSubmit: true,
            isSort: true,
            isDistribute: true,
            isReject: true,
            isApprove: false,
            isHold: true,
            isReDistribute: true,
            isHaltSubmission: true,
            isRelease: true,
            isClose: true,
            isReview: true,
            isEditAndReview: true,
            isEditJob: true,
            toolTipVisibility: true,
          },

          {
            name: 'status',
            title: 'Status',
            width: 8,
            isIcon: false,
            isImage: false,
            isContact: false,
            isNoOption: false,
            isNumberBadge: false,
            isSort: true,
            toolTipVisibility: false,
          },
          {
            name: 'job_id',
            title: 'Job ID',
            width: 5,
            isIcon: false,
            isImage: false,
            isContact: false,
            isNumberBadge: false,
            isSort: true,
            toolTipVisibility: true,
          },
          {
            name: 'location.name',
            title: 'Work Location',
            width: 10,
            isIcon: false,
            isImage: false,
            isContact: false,
            isNumberBadge: false,
            // isSort: true,
            toolTipVisibility: true,
          },
          {
            name: 'program_name',
            title: 'Program',
            width: 10,
            isIcon: false,
            isImage: false,
            isContact: false,
            isNumberBadge: true,
            // isSort: true,
            toolTipVisibility: true,
          },
          {
            name: 'hierarchyName',
            title: 'Hierarchy',
            width: 10,
            isIcon: false,
            isImage: false,
            isContact: false,
            isNumberBadge: true,
            // isSort: true,
            toolTipVisibility: true,
          },
          {
            name: 'start_date',
            title: 'Duration',
            width: 10,
            isIcon: false,
            isImage: false,
            isContact: false,
            isNumberBadge: false,
            isRange: true,
            rangeNameList: ['start_date', 'end_date'],
            isSort: true,
            toolTipVisibility: true,
          },
          {
            name: 'positions',
            title: 'No of Positions',
            width: 5,
            isIcon: false,
            isImage: false,
            isContact: false,
            isNumberBadge: true,
            isSort: true,
            toolTipVisibility: false,
          },
          {
            name: 'submission_count',
            title: 'Submitted Candidates',
            width: 5,
            isIcon: false,
            isImage: true,
            isContact: false,
            isNumberBadge: true,
            isSort: false,
            isNoOption: true,
            toolTipVisibility: false,
          },
          {
            name: 'job_manager.name',
            title: 'Job Manager',
            width: 10,
            isIcon: true,
            isImage: false,
            isContact: false,
            isNumberBadge: false,
            // isSort: true,
            toolTipVisibility: true,
          },
          // {
          //   name: 'hired_count',
          //   title: 'Hired',
          //   width: 5,
          //   isIcon: false,
          //   isImage: false,
          //   isContact: false,
          //   isNumberBadge: true,
          //   // isSort: true,
          // },
          {
            name: 'budget_estimate',
            title: 'Estimated Budget',
            width: 10,
            isIcon: false,
            isImage: false,
            isContact: false,
            isNumberBadge: true,
            isSort: true,
            toolTipVisibility: true,
          },
        ],
        tabsList: [
          'All Jobs',
          'Active Jobs',
          'Sourcing',
          // 'My Pending Approval', SO-596 Hide My Pending Approval tab for MSP
          'Pending Distribution',
          'Pending Review',
          'Pending Approval',
          'Halted',
          'Hold',
          'Filled/Closed',
        ],
        showTabs: true,
        isExpand: false,
        isFilter: true,
        isSearch: true,
        isSetting: true,
        isTopPagination: true,
        // isDistributionList: true,
        isCreate: true,
        density: 'COMFORTABLE',
        tableWidth: '2500px',
        isCreateButtonName: 'Job',
        advanceFilter: [
          { name: 'name', title: 'Job Title', filterType: 'TEXT' },
          {
            name: 'status',
            title: 'Status',
            filterType: 'SELECT',
            multiSelectData: [
              { name: 'Pending Review', value: 'pending_review' },
              { name: 'Pending Approval', value: 'pending_approval' },
              { name: 'Pending Approval - Sourcing', value: 'pending_approval_sourcing' },
              { name: 'Pending Approval - Hold', value: 'pending_approval_hold' },
              { name: 'Pending Approval - Halted', value: 'pending_approval_halted' },
              { name: 'Open', value: 'open' },
              { name: 'Sourcing', value: 'sourcing' },
              { name: 'Halted', value: 'halted' },
              { name: 'Hold', value: 'hold' },
              { name: 'Rejected', value: 'rejected' },
              { name: 'Filled', value: 'filled' },
              { name: 'Closed', value: 'closed' },
              { name: 'Draft', value: 'draft' },
            ],
          },
        ],
      };
    } else if (this.user_type == 'VENDOR' || !this.user_type) {
      this.tableConfig = {
        title: 'Jobs',
        searchPlaceHolder: 'Search by JOB TITLE or JOB ID.',
        columnList: [
          {
            name: 'template_name', //'title',
            title: 'Job Title',
            width: 15,
            isIcon: true,
            icon: 'expand_more',
            isImage: true,
            isContact: false,
            isNumberBadge: false,
            isOptOut: false,
            isOptInOptOut: true,
            isRejectedJob: false,
            isDraftJob: true,
            isCloneJob: true,
            isSubmitCandidate: true,
            isSort: true,
            isAddAndSubmit: false,
            toolTipVisibility: true,
          },
          {
            name: 'status',
            title: 'Status',
            width: 10,
            isIcon: false,
            isImage: false,
            isContact: false,
            isNoOption: false,
            isNumberBadge: false,
            isSort: true,
            toolTipVisibility: false,
          },
          {
            name: 'job_id',
            title: 'Job ID',
            width: 6,
            isIcon: false,
            isImage: false,
            isContact: false,
            isNumberBadge: false,
            isSort: true,
            toolTipVisibility: true,
          },
          {
            name: 'location.name',
            title: 'Work Location',
            width: 13,
            isIcon: false,
            isImage: false,
            isContact: false,
            isNumberBadge: false,
            // isSort: true,
            toolTipVisibility: true,
          },
          {
            name: 'job_manager.name',
            title: 'Job Manager',
            width: 10,
            isIcon: true,
            isImage: false,
            isContact: false,
            isNumberBadge: true,
            // isSort: true,
            toolTipVisibility: true,
          },
          {
            name: 'start_date',
            title: 'Duration',
            width: 14,
            isIcon: false,
            isImage: false,
            isContact: false,
            isNumberBadge: false,
            isRange: true,
            rangeNameList: ['start_date', 'end_date'],
            isSort: true,
            toolTipVisibility: true,
          },
          {
            name: 'positions',
            title: 'No of Positions',
            width: 5,
            isIcon: false,
            isImage: false,
            isContact: false,
            isNumberBadge: true,
            isSort: true,
            toolTipVisibility: false,
          },
          {
            name: 'submission_count',
            title: 'Submitted Candidates',
            width: 5,
            isIcon: false,
            isImage: true,
            isContact: false,
            isNumberBadge: true,
            isSort: false,
            isNoOption: true,
            toolTipVisibility: false,
          },
          // {
          //   name: 'hired_count',
          //   title: 'Hired',
          //   width: 8,
          //   isIcon: false,
          //   isImage: false,
          //   isContact: false,
          //   isNumberBadge: true,
          //   // isSort: true,
          // },
          {
            name: 'budget_estimate',
            title: 'Estimated Budget',
            width: 8,
            isIcon: false,
            isImage: false,
            isContact: false,
            isNumberBadge: true,
            isSort: true,
            toolTipVisibility: true,
          },
        ],
        tabsList: ['All Jobs', 'Active Jobs', 'Sourcing', 'Halted', 'Hold', 'Filled/Closed', 'New Job Requests'],
        showTabs: true,
        isExpand: false,
        isFilter: true,
        isSearch: true,
        isSetting: true,
        isTopPagination: true,
        isCreate: true,
        density: 'COMFORTABLE',
        tableWidth: '2000px',
        advanceFilter: [
          { name: 'name', title: 'Job Title', filterType: 'TEXT' },
          {
            name: 'status',
            title: 'Status',
            filterType: 'SELECT',
            multiSelectData: [
              { name: 'Open', value: 'open' },
              { name: 'Sourcing', value: 'sourcing' },
              { name: 'Halted', value: 'halted' },
              { name: 'Hold', value: 'hold' },
              { name: 'Filled', value: 'filled' },
              { name: 'Closed', value: 'closed' },
            ],
          },
        ],
      };
      if(this.user_type == 'VENDOR') {
        this.tableConfig?.advanceFilter.findIndex(object => {
          if(object.name == 'status') {
            const indexOfMuntiselectdata = object?.multiSelectData?.findIndex(value => {
              return value.name == 'Open'
            })
            object.multiSelectData.splice(indexOfMuntiselectdata, 1);
          };
        })
      }
      if(this.hideRateAuthority){
        const indexOfObject = this.tableConfig?.columnList.findIndex(object => {
          return object.name === 'budget_estimate';
        });
        this.tableConfig?.columnList.splice(indexOfObject, 1);
      }
    } else if (this.user_type == 'CLIENT') {
      this.tableConfig = {
        title: 'Jobs',
        searchPlaceHolder: 'Search by JOB TITLE or JOB ID.',
        columnList: [
          {
            name: 'template_name',
            title: 'Job Title',
            width: 15,
            isIcon: false,
            icon: 'expand_more',
            isImage: true,
            isContact: false,
            isNumberBadge: false,
            isRejectedJob: true,
            isDraftJob: true,
            isCloneJob: true,
            isOptOut: false,
            isSubmitCandidate: false,
            isAddAndSubmit: true,
            isSort: true,
            isDistribute: true,
            isApprove: true,
            isReject: false,
            isHold: true,
            isReDistribute: true,
            isHaltSubmission: true,
            isRelease: true,
            isClose: true,
            isEditJob: true,
            toolTipVisibility: true,
          },
          {
            name: 'status',
            title: 'Status',
            width: 8,
            isIcon: false,
            isImage: false,
            isContact: false,
            isNoOption: false,
            isNumberBadge: false,
            isSort: true,
            toolTipVisibility: false,
          },
          {
            name: 'job_id',
            title: 'Job ID',
            width: 5,
            isIcon: false,
            isImage: false,
            isContact: false,
            isNumberBadge: false,
            isSort: true,
            toolTipVisibility: true,
          },
          {
            name: 'location.name',
            title: 'Work Location',
            width: 10,
            isIcon: false,
            isImage: false,
            isContact: false,
            isNumberBadge: false,
            toolTipVisibility: true,
          },
          {
            name: 'hierarchyName',
            title: 'Hierarchy',
            width: 10,
            isIcon: false,
            isImage: false,
            isContact: false,
            isNumberBadge: true,
            // isSort: true,
            toolTipVisibility: true,
          },
          {
            name: 'start_date',
            title: 'Duration',
            width: 10,
            isIcon: false,
            isImage: false,
            isContact: false,
            isNumberBadge: false,
            isRange: true,
            rangeNameList: ['start_date', 'end_date'],
            isSort: true,
            toolTipVisibility: true,
          },
          {
            name: 'positions',
            title: 'No of Positions',
            width: 5,
            isIcon: false,
            isImage: false,
            isContact: false,
            isNumberBadge: true,
            isSort: true,
            toolTipVisibility: false,
          },
          {
            name: 'submission_count',
            title: 'Submitted Candidates',
            width: 5,
            isIcon: false,
            isImage: true,
            isContact: false,
            isNumberBadge: true,
            isSort: false,
            isNoOption: true,
            toolTipVisibility: false,
          },
          {
            name: 'job_manager.name',
            title: 'Job Manager',
            width: 10,
            isIcon: true,
            isImage: false,
            isContact: false,
            isNumberBadge: true,
            // isSort: true,
            toolTipVisibility: true,
          },
          {
            name: 'budget_estimate',
            title: 'Estimated Budget',
            width: 8,
            isIcon: false,
            isImage: false,
            isContact: false,
            isNumberBadge: true,
            isSort: true,
            toolTipVisibility: true,
          },
        ],
        tabsList: [
          'All Jobs',
          'Active Jobs',
          'Sourcing',
          'My Pending Approval',
          'Pending Distribution',
          // 'Pending Review', SO-239
          'Pending Approval',
          'Halted',
          'Hold',
          'Filled/Closed',
        ],
        showTabs: true,
        isExpand: false,
        isFilter: true,
        isSort: true,
        isSearch: true,
        isSetting: true,
        isTopPagination: true,
        isCreate: true,
        // fullPageTable:true,
        density: 'COMFORTABLE',
        tableWidth: '1500px',
        advanceFilter: [
          { name: 'name', title: 'Job Title', filterType: 'TEXT' },
          {
            name: 'status',
            title: 'Status',
            filterType: 'SELECT',
            multiSelectData: [
              // { name: 'Pending Review', value: 'pending_review' }, SO-239
              { name: 'Pending Approval', value: 'pending_approval' },
              { name: 'Pending Approval - Sourcing', value: 'pending_approval_sourcing' },
              { name: 'Pending Approval - Hold', value: 'pending_approval_hold' },
              { name: 'Pending Approval - Halted', value: 'pending_approval_halted' },
              { name: 'Open', value: 'open' },
              { name: 'Sourcing', value: 'sourcing' },
              { name: 'Halted', value: 'halted' },
              { name: 'Hold', value: 'hold' },
              { name: 'Rejected', value: 'rejected' },
              { name: 'Filled', value: 'filled' },
              { name: 'Closed', value: 'closed' },
              { name: 'Draft', value: 'draft' },
            ],
          },
        ],
      };
    }
    this.tableConfig.permission = this.storageService.get(StorageKeys.USER_PERMISSION)?.find(e => e === 'create_job')
  }

  vmsTableTabConfig() {
    this.countData = [];
    if (this.user_type == 'VENDOR') {
      this.tableConfig.tabsList?.forEach(tab => {
        if (tab === 'All Jobs') {
          this.countData.push(this.tabCount?.all_jobs);
        } else if (tab === 'Active Jobs') {
          this.countData.push(this.tabCount?.active_jobs);
        } else if (tab === 'Sourcing') {
          this.countData.push(this.tabCount?.sourcing);
        } else if (tab === 'Halted') {
          this.countData.push(this.tabCount?.pendingApprovalHalted);
        } else if (tab === 'Hold') {
          this.countData.push(this.tabCount?.pendingApprovalHold);
        } else if (tab === 'Filled/Closed') {
          this.countData.push(this.tabCount?.filledOrClosed);
        } else if (tab === 'New Job Requests') {
          this.countData.push(this.tabCount?.pendingJobs);
        }
      });
    } else {
      this.tableConfig.tabsList?.forEach(tab => {
        if (tab === 'All Jobs') {
          this.countData.push(this.tabCount?.all_jobs);
        } else if (tab === 'Active Jobs') {
          this.countData.push(this.tabCount?.active_jobs);
        } else if (tab === 'Sourcing') {
          this.countData.push(this.tabCount?.sourcing);
        } else if (tab === 'Pending Distribution') {
          this.countData.push(this.tabCount?.pendingDistribution);
        } else if (tab === 'Pending Review') {
          this.countData.push(this.tabCount?.pendingReview);
        } else if (tab === 'Pending Approval') {
          this.countData.push(this.tabCount?.pendingApproval);
        } else if (tab === 'Halted') {
          this.countData.push(this.tabCount?.pendingApprovalHalted);
        } else if (tab === 'Hold') {
          this.countData.push(this.tabCount?.pendingApprovalHold);
        } else if (tab === 'Filled/Closed') {
          this.countData.push(this.tabCount?.filledOrClosed);
        } else if (tab === 'My Pending Approval') {
          this.countData.push(this.tabCount?.myPendingApproval);
        }
      });
    }
  }

  onCreateClick(e) {
    this.router.navigate(['/jobs/create']);
  }

  shortlistActor(){
    const u = JSON.parse(localStorage.getItem('account'));
    const currentUserId = u?.role?.id;
    let currentConfig = this.currentProgram?.config?.submission?.shortlist_details;
    let shortActor = false;
    let getValue;
     currentConfig?.filter(item =>{
      if(item?.short_actor === this.user_type){
        shortActor = true
        getValue = item?.short_role_id?.find(x => x === currentUserId) ? true : false;
      }
    });
    return (
      shortActor && getValue
    )
  }

  getJobList(pageNo = 1) {
    this.dataLoading = true;
    this.pageNo = pageNo;
    if (this.pageNo === null) {
      this.pageNo = 1;
    }
    //this.currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    if (pageNo === 1 && !this.searchTerm) {
      //this.loaderService.show();
    }
    let qry = '?';
    if (this.filter.searchTerm) {
      qry = qry + 'title_or_template=' + this.filter.searchTerm;
      // qry = qry + 'q='+ this.filter.searchTerm;
      // qry = qry + 'title=' + this.filter.searchTerm;
    }
    if (this.filter.hasOwnProperty('status')) {
      qry = qry + '&status=' + this.filter.status;
    }

    if (this.filter.hasOwnProperty('sort_key') && this.filter.hasOwnProperty('sort_by')) {
      qry = qry + '&key=' + this.filter.sort_key;
      qry = qry + '&order_by=' + this.filter.sort_by;
    } else {
      qry = qry + '&order_by=desc&key=created_on';
    }
    if (this.user_type === 'VENDOR') {
      qry = qry + '&exclude_opt_out=true';
    }
    this.status = this.status.replace(/%20/g, ' ');
    if (this.status) {
      this.storageService.set('job_listing_status', this.status, true);
    }
    if (this.status === 'New Job Requests') {
      qry = qry + '&submission_count__lte=0';
    }
    // template_name  status job_id  start_date  budget_estimate

    if ((this.status && this.status.indexOf('All Jobs') === -1) || this.status.indexOf('all jobs') === -1) {
      let jobStatus = '';
      if (this.status === 'Open Jobs') {
        jobStatus = 'Open (Approved)';
      } else if (this.status === 'Filled Jobs' || this.status === 'filled jobs') {
        jobStatus = 'Filled';
      } else if (this.status === 'Closed Jobs' || this.status === 'closed jobs') {
        jobStatus = 'Closed';
      } else if (this.status.indexOf('My Pending Approval') !== -1 || this.status.indexOf('my pending Approval') !== -1) {
        jobStatus = 'my_pending_approval';
      } else if (this.status.indexOf('Pending Approval') !== -1 || this.status.indexOf('pending approval') !== -1) {
        jobStatus = 'pending_approval_combined';
      } else if (this.status.indexOf('Sourcing') !== -1 || this.status.indexOf('sourcing') !== -1) {
        jobStatus = 'sourcing';
      } else if (this.status.indexOf('Halted') !== -1 || this.status.indexOf('halted') !== -1) {
        jobStatus = 'halted';
      } else if (this.status.indexOf('Hold') !== -1 || this.status.indexOf('hold') !== -1) {
        jobStatus = 'hold';
      } else if (this.status.indexOf('Filled/Closed') !== -1 || this.status.indexOf('filled/closed') !== -1) {
        jobStatus = 'filled_or_closed';
      } else if (this.status.indexOf('Pending Review') !== -1 || this.status.indexOf('pending review') !== -1) {
        jobStatus = 'pending_review';
      } else if (this.status.indexOf('Pending Distribution') !== -1 || this.status.indexOf('pending distribution') !== -1) {
        jobStatus = 'open';
      } else if (this.status.indexOf('Active Jobs') !== -1 || this.status.indexOf('active jobs') !== -1) {
        jobStatus = 'active_jobs';
      } else if (this.status.indexOf('New Job Requests') !== -1 || this.status.indexOf('new job requests') !== -1) {
        jobStatus = 'sourcing';
      } else if (this.status.indexOf('Active Jobs') !== -1 || this.status.indexOf('active jobs') !== -1) {
        jobStatus = 'active_jobs';
      }

      if (jobStatus) {
        qry = qry + '&status=' + jobStatus;
      }
    }
    let url;
    this.itemPerPage = this.selectedRecords;
    qry = qry + '&limit=' + this.itemPerPage + '&page=' + this.pageNo;
    if (this.user_type === 'VENDOR') {
      url = `/job-manager/programs/${this.currentProgram?.id}/job_distribution/vendor/jobs${qry}`;
    }else{
      url = '/job-manager/programs/' + this.currentProgram?.id + '/jobs' + qry;
    }

    this.storageService.set('job_listing_page', this.pageNo, true); // need to move to route param
    this.storageService.set('job_listing_limit', this.itemPerPage, true);
    const isShortListActor = this.user_type?.toUpperCase() == UsersType.CLIENT && !this.shortlistActor();
    const can_client_view_non_shortlisted_candidates = this.currentProgram?.config?.submission?.can_client_view_non_shortlisted_candidates;
    if(this.jobListSubscription) {
      this.jobListSubscription?.unsubscribe();
    }
    if(this.initFlag || this.VmsTabCountChange) {
      this.countData = null;
    }
    this.jobListSubscription = this.jobService.get(url).subscribe({
     next: (data: any) => {
        let _this = this;
        if (data?.jobs) {
          data?.jobs.map(function (job) {
            job.hierarchyName =  job?.hierarchy?.[0]?.name;
            job.submission_count = (can_client_view_non_shortlisted_candidates || isShortListActor) ? job?.shortlisted_candidate_count : job?.submission_count;
            job.submission_count = job?.submission_count > 0 ? job?.submission_count?.toString() : '--';
            job.orgStatus = job.status;
            if (!job.is_delete) {
              if (job?.status?.toLowerCase() === _this.jobStatus.PENDING_APPROVAL?.toLowerCase()) {
                job.status = 'Pending approval';
              } else if (job?.status?.toLowerCase() === _this.jobStatus.ACTIVE?.toLowerCase()) {
                job.status = 'Active Jobs';
              } else if (job?.status?.toLowerCase() === _this.jobStatus.RELEASE_JOB?.toLowerCase()) {
                job.status = 'Release job';
              } else if (job?.status?.toLowerCase() === _this.jobStatus.PENDING_APPROVAL_SOURCING?.toLowerCase()) {
                job.status = 'Pending approval sourcing';
              } else if (job?.status?.toLowerCase() === _this.jobStatus.PENDING_APPROVAL_HALTED.toLowerCase()) {
                job.status = 'Halted';
              } else if (job?.status?.toLowerCase() === _this.jobStatus.PENDING_APPROVAL_HOLD?.toLowerCase()) {
                job.status = 'Hold';
              } else if (job?.status?.toLowerCase() === _this.jobStatus.FILLED_OR_CLOSED?.toLowerCase()) {
                job.status = 'Filled/Closed';
              } else if (job?.status?.toLowerCase() === _this.jobStatus.PENDING_REVIEW?.toLowerCase()) {
                job.status = 'Pending Review';
              } else if (job?.status?.toLowerCase() === _this.jobStatus.PENDING_DISTRIBUTION?.toLowerCase()) {
                job.status = 'Pending Distribution';
              }

              // job.is_enabled = true;
              if (!job.hired_count) {
                job.hired_count = 0;
              }
              // if (!job?.count?.submitted_candidates) {
              //   job.count.submitted_candidates = 0;
              // }
              if (!job.positions) {
                job.positions = 0;
              }
              if (!job.budget_estimate) {
                job.budget_estimate = 0;
              } else {
                job.budget_estimate = job?.budget_estimate
                  ? _this?.accuracyPipe?.transform(job?.budget_estimate, 'amount', { currencyCode: job?.currency })
                  : '-';
              }
              if (job.submissions_from_direct_sourcing) {
                job.submissions_from_direct_sourcing = 'NA';
              }
              if (job.job_manager) {
                let name = '';
                if (job.job_manager.first_name) {
                  name = job.job_manager.first_name;
                }
                if (job.job_manager.last_name) {
                  name = name + ' ' + job.job_manager.last_name;
                }
                // let name = job.job_manager?.first_name
                // ? `${job.job_manager?.first_name}  ${job.job_manager?.last_name}`
                // : `${job.job_manager?.last_name} ${job.job_manager?.last_name}`;
                job.job_manager.name = name;
              }
              if (job.direct_sourcing_distribution) {
                job.direct_sourcing_distribution = 'NA';
              }
              job.program_name = _this.currentProgram?.name || '';
              job.is_super_view_user =!_this.accessControlService.accessControl();
              if(_this.user_type == UsersType.VENDOR) {
                job.is_belongs_to_job_module = true;
              }
            }
          });

          this.vmsData = data?.jobs;
          this.vmsData.forEach(vd => {
            vd.status = vd.status.toLowerCase() === 'halt' ? 'HALTED' : vd.status;
            vd.location.name = this.snakeToTitleCasePipe.transform(vd?.location?.name, ' ', true);
          });

          this.totalRecords = data?.total_records;
        }
        // this.loaderService.hide();
        if (this.initFlag || this.VmsTabCountChange) {
          this.getJobTabCount();
          this.initFlag = false;
          this.VmsTabCountChange=false;
        }
        this.dataLoading = false;
        // }
      },
      error: err => {
        //this.loaderService.hide();
        this.dataLoading = false;
        this.alertService.error(errorHandler(err));
        this.vmsData = new Array();
        this.totalRecords = 0;
      },
  });
  }

  getFormattedDate(date) {
    if (date) {
    } else {
      return null;
    }
  }

  onPaginationClick(event) {
    this.getJobList(event);
  }
  onClickRecords(event) {
    this.selectedRecords = event;
    this.getJobList((this.pageNo = 1));
  }
  onSortClick(event) {
    if (event) {
      if (!this.filter) {
        this.filter = {};
      }
      this.filter.sort_key = event?.name;
      this.filter.sort_by = event?.order?.toLowerCase();
      this.getJobList();
    }
  }

  sortColumnWise(event) {
    if (event?.order) {
      switch (event.name) {
        case 'template_name':
          event.order == 'ASC'
            ? this.vmsData.sort((a, b) => (a.template_name > b.template_name ? -1 : 1))
            : this.vmsData.sort((a, b) => (a.template_name > b.template_name ? 1 : -1));
          break;

        case 'status':
          event.order == 'ASC'
            ? this.vmsData.sort((a, b) => (a.status > b.status ? -1 : 1))
            : this.vmsData.sort((a, b) => (a.status > b.status ? 1 : -1));
          break;

        case 'id':
          event.order == 'ASC' ? this.vmsData.sort((a, b) => (a.id > b.id ? -1 : 1)) : this.vmsData.sort((a, b) => (a.id > b.id ? 1 : -1));
          break;

        case 'hierarchy.name':
          event.order == 'ASC'
            ? this.vmsData.sort((a, b) => (a.hierarchy.name > b.hierarchy.name ? -1 : 1))
            : this.vmsData.sort((a, b) => (a.hierarchy.name > b.hierarchy.name ? 1 : -1));
          break;

        case 'start_date':
          event.order == 'ASC'
            ? this.vmsData.sort((a, b) => (a.start_date > b.start_date ? -1 : 1))
            : this.vmsData.sort((a, b) => (a.start_date > b.start_date ? 1 : -1));
          break;

        case 'hired':
          event.order == 'ASC'
            ? this.vmsData.sort((a, b) => (a.hired > b.hired ? -1 : 1))
            : this.vmsData.sort((a, b) => (a.hired > b.hired ? 1 : -1));
          break;

        case 'submissions':
          event.order == 'ASC'
            ? this.vmsData.sort((a, b) => (a.submissions > b.submissions ? -1 : 1))
            : this.vmsData.sort((a, b) => (a.submissions > b.submissions ? 1 : -1));
          break;

        case 'positions':
          event.order == 'ASC'
            ? this.vmsData.sort((a, b) => (a.positions > b.positions ? -1 : 1))
            : this.vmsData.sort((a, b) => (a.positions > b.positions ? 1 : -1));
          break;

        case 'budget_estimate':
          event.order == 'ASC'
            ? this.vmsData.sort((a, b) => (a.budget_estimate > b.budget_estimate ? -1 : 1))
            : this.vmsData.sort((a, b) => (a.budget_estimate > b.budget_estimate ? 1 : -1));
          break;

        case 'positions':
          event.order == 'ASC'
            ? this.vmsData.sort((a, b) => (a.positions > b.positions ? -1 : 1))
            : this.vmsData.sort((a, b) => (a.positions > b.positions ? 1 : -1));
          break;

        case 'direct_sourcing_distribution':
          event.order == 'ASC'
            ? this.vmsData.sort((a, b) => (a.direct_sourcing_distribution > b.direct_sourcing_distribution ? -1 : 1))
            : this.vmsData.sort((a, b) => (a.direct_sourcing_distribution > b.direct_sourcing_distribution ? 1 : -1));
          break;

        case 'submissions_from_direct_sourcing':
          event.order == 'ASC'
            ? this.vmsData.sort((a, b) => (a.submissions_from_direct_sourcing > b.submissions_from_direct_sourcing ? -1 : 1))
            : this.vmsData.sort((a, b) => (a.submissions_from_direct_sourcing > b.submissions_from_direct_sourcing ? 1 : -1));
          break;

        case 'location.city':
          event.order == 'ASC'
            ? this.vmsData.sort((a, b) => (a.location.city > b.location.city ? -1 : 1))
            : this.vmsData.sort((a, b) => (a.location.city > b.location.city ? 1 : -1));
          break;

        case 'location':
          event.order == 'ASC'
            ? this.vmsData.sort((a, b) => (a.location > b.location ? -1 : 1))
            : this.vmsData.sort((a, b) => (a.location > b.location ? 1 : -1));
          break;
      }
    }
  }

  onSearch(event) {
    this.filter.searchTerm = event;
    this.getJobList();
  }
  onJobOptionClicked(event) {
    const { key, vmsData } = event;
    switch (key) {
      case 'hold':
        this.updateJobStatus(key, vmsData);
        break;
      case 'halt-submission':
        this.updateJobStatus('halted', vmsData);
        break;
      case 'release':
        this.updateJobStatus(key, vmsData);
        break;
      case 'distribute':
        if (vmsData && vmsData?.id) {
          this.router.navigate(['/jobs/details/job-details', vmsData.id, 'distribution']);
        }
        break;
      case 'approve':
        if (vmsData && vmsData?.id) {
          this.router.navigate(['/jobs/details/job-details', vmsData.id, 'approval']);
        }
        break;
      case 'reject':
        if (vmsData && vmsData?.id) {
          this.router.navigate(['/jobs/details/job-details', vmsData.id, 'approval']);
        }
        break;
      case 'reDistribute':
        if (vmsData && vmsData?.id) {
          this.router.navigate(['/jobs/details/job-details', vmsData.id, 'distribution']);
        }
        break;
      case 'close':
        if (vmsData && vmsData?.id) {
          this.router.navigate(['/jobs/details/job-details', vmsData.id], { queryParams: { action: 'close' } });
        }
        break;
      case 'review':
        this.router.navigate(['/jobs/details/job-details', vmsData.id]);
        break;
      default:
        break;
    }
  }

  onListFilter(event) {
    if (event) {
      this.selectedTab = null;
      if (event.hasOwnProperty('status')) {
        if (event.status) {
          this.filter.status = event.status;
          this.status = 'All Jobs';
          this.selectedTab = 'All Jobs';
        }
      }
      if (event.name) {
        this.filter.searchTerm = event.name;
      }

      if (event.name && !event?.hasOwnProperty('status')) {
        this.filter.searchTerm = event.name;
      }
      this.getJobList();
    } else {
      this.filter = {};
      this.getJobList();
    }
  }

  onClickView(ev) {
    if(ev && ev?.column==="submission_count"){
      this.router.navigateByUrl(`jobs/details/job-details/${ev?.id}/submitted-candidate?templateId=${ev?.template || ''}`);
      return;
    }

    if (ev) {
      this.storageService.set('viewd_job', ev, true);
      this.router.navigate([`jobs/details/job-details/${ev?.id}`]);
    }

  }
  onTabClick(e) {
    if (typeof e === 'object') {
      return;
    } else {
      this.selectedTab=e?.toLowerCase();
      this.filter = {};
      this.status = e;
      let route = e?.toLowerCase();
      if (route === 'filled/closed') {
        route = 'filled-closed';
      }
      if (route === 'new job requests') {
        route = 'new-job-requests';
      }
      if (route === 'my pending approval') {
        route = 'my-pending-approval';
      }
      this.location.replaceState(`jobs/list/${route}`);
      this.VmsTabCountChange = true;
      this.getJobList();
    }
  }
  onOptOutClick(event) {
    this.jobId = event.id;
    if (event) {
      this.eventStream.emit(new EmitEvent(Events.OPT_OUT_REASON, { value: true, jobId: this.jobId }));
    }
  }
  onSubmittedCandidateClick(event) {
    if (event && event?.id) {
      this.router.navigate(['/jobs/details/job-details', event.id, 'available']);
    }
  }
  optJob(event,isOptIn?) {
    if (event) {
      let payload = event;
      let user = this.storageService.get('user');
      let vendor_id = user?.id;
      let url = `/job-manager/programs/${this.currentProgram?.id}/job_distribution/${vendor_id}/${this.jobId}`;
      this.jobService.put(url, payload).subscribe({
        next: (data: any) => {
          if (data) {
            this.getJobList();
            if(isOptIn) {
              this.alertService.success('Job Opted-In sucessfully.');
            } else {
              this.alertService.success('Job Opted-Out sucessfully.');
            }
            this.closeSidebar = true;
            setTimeout(() => {
              this.closeSidebar = false;
            }, 500);
          }
        },
        error: error => {
          this.alertService.error(errorHandler(error));
        },
    });
    }
  }

  onEditClick(event) {
    if(event.orgStatus.toLowerCase() === this.jobStatus.SOURCING || event.orgStatus.toLowerCase() === this.jobStatus.OPEN) {
      this.router.navigate(['/jobs/create/' + event.id + '/' + event.template + '/' + 'editApprovedJob']);
    } else {
      this.router.navigate(['/jobs/create/' + event.id + '/' + event.template + '/' + 'isedit']);
    }
  }

  onCloneJobClick(event) {
    this.loaderService.show();
    this.jobService.get(`/job-manager/programs/${this.currentProgram.id}/job-templates?id=${event.template}`).subscribe({
      next: (data: any) => {
        if (data.job_templates && data.job_templates.length > 0 && data.job_templates[0].is_enabled) {
          this.router.navigate(['/jobs/create/' + event.id + '/' + event.template + '/' + 'clonejob']);
        } else {
          this.alertService.error(
            data?.job_templates[0]?.template_name
              ? `${data?.job_templates[0]?.template_name} is In-active`
              : `The current template doesn't exist!\nPlease try cloning other jobs or contact the administrator for the same.`,
          );
          this.vmsData.find(e => e.id === event.id)['disableCloneJob'] = true;
        }
        this.loaderService.hide();
      },
      error: err => {
        this.alertService.error(errorHandler(err));
        this.loaderService.hide();
      },
  });
  }

  onOptionClicked(event) {
    if (event) {
      if (
        (this.user_type === 'VENDOR' || this.user_type === 'SUPER_ORG') &&
        (event?.option?.status === 'hold' || event?.option?.status === 'halted' || event?.option?.status === 'rejected')
      ) {
        this.alertService.error('Submissions are not allowed for the job');
        return;
      } else {
        this.router.navigate(['/candidates/create'], {
          queryParams: { job: event.option.id, submit: true, returnUrl: encodeURIComponent(this.router.url) },
        });
      }
    }
  }
  onJobListOptionClicked(event) {
    const { key, vmsData } = event;
    switch (key) {
      case 'hold':
      case 'halt':
      case 'release':
        this.updateJobStatus(key, vmsData);
        break;
      default:
        break;
    }
  }
  updateJobStatus(status, vmsData) {
    if (vmsData && vmsData?.id) {
      this.loaderService.show();
      let url = `/job-manager/programs/${this.currentProgram.id}/jobs/${vmsData?.id}`;
      this.jobService.put(url, { status: status }).subscribe({
        next: (data: any) => {
          this.loaderService.hide();
          if (data.message) {
            this.VmsTabCountChange=true;
            this.getJobList();
          }
        },
       error: error => {
          this.loaderService.hide();
          this.dataLoading = false;
        },
    });
    }
  }

  onDraftOptionClicked(event): void {
    const { key, vmsData } = event;
    this._confirmService
      .confirm('', `${key === 'remove' ? 'Remove' : 'Close'} this Job?`, 'Yes', 'No')
      .then(confirmed => {
        if (confirmed) {
          if (key === 'close') this.updateJobStatus('Closed', vmsData);
          else if (key === 'remove') {
            this.jobService.delete(`/job-manager/programs/${this.currentProgram?.id}/jobs/${vmsData?.id}`, vmsData).subscribe({
              next: (data: any) => {
                this.loaderService.hide();
                if (data?.job?.id === vmsData.id) {
                  this.alertService.success('Job deleted sucessfully.');
                  this.getJobList();
                }
              },
             error: error => {
                this.alertService.error('Unable to delete the job.');
                this.loaderService.hide();
                this.dataLoading = false;
              },
          });
          }
        }
      })
      .catch(() => {});
  }

  onOptInClick(event) {
    this.jobId = event?.id;
    this.optJob({opt_option: 'opt_in'},true)
  }

  getJobTabCount() {
    this.jobService.get(`/job-manager/programs/${this.currentProgram?.id}/jobs_all_status`).subscribe((data:any)=>{
      this.tabCount.pendingApproval = data?.status_count?.pending_approval ? data?.status_count?.pending_approval : 0;
      this.tabCount.pendingJobs = data?.status_count?.pending_jobs ? data?.status_count?.pending_jobs : 0;
      this.tabCount.all_jobs = data?.status_count?.all ? data?.status_count?.all : 0;
      this.tabCount.sourcing = data?.status_count?.sourcing ? data?.status_count?.sourcing : 0;
      this.tabCount.pendingApprovalHalted = data?.status_count?.halt ? data?.status_count?.halt : 0;
      this.tabCount.pendingApprovalHold = data?.status_count?.hold ? data?.status_count?.hold : 0;
      this.tabCount.filledOrClosed = data?.status_count?.filled_or_closed ? data?.status_count?.filled_or_closed : 0;
      this.tabCount.pendingReview = data?.status_count?.pending_review ? data?.status_count?.pending_review : 0;
      this.tabCount.pendingDistribution = data?.status_count?.pending_distribution ? data?.status_count?.pending_distribution : 0;
      this.tabCount.active_jobs = data?.status_count?.active_jobs ? data?.status_count?.active_jobs : 0;
      this.tabCount.myPendingApproval=data?.status_count?.my_pending_approval ? data?.status_count?.my_pending_approval : 0;
      this.vmsTableTabConfig();
    });
  }

}
