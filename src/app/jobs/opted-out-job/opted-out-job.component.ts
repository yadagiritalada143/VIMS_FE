import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { VMSConfig } from 'src/app/library/smartTable/table/table.model';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { JobService } from '../job.service';
import { JobStatus } from 'src/app/shared/enums';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { UsersType } from 'src/app/shared/enums';
import { AccuracyPipe } from 'src/app/shared/pipe/accuracy.pipe';

@Component({
  selector: 'app-opted-out-job',
  templateUrl: './opted-out-job.component.html',
  styleUrls: ['./opted-out-job.component.scss'],
})
export class OptedOutJobComponent implements OnInit {
  public tableConfig: VMSConfig;
  currentProgram: any;
  public jobStatus: any = JobStatus;
  vmsData: any;
  itemPerPage: number = 10;
  totalRecords: any;
  userDetails: any;
  public pageNo = 1;
  searchTerm: string = '';
  dataLoading = false;
  filter: any = {};
  userType:UsersType;
  isMsp : boolean;
  isVendor : boolean;
  isClient: boolean;
  constructor(
    public jobService: JobService,
    private loaderService: LoaderService,
    private alertService: AlertService,
    private router: Router,
    private datePipe: LocalDateFormatPipe,
    public accuracyPipe: AccuracyPipe,
    private storageService: StorageService,
  ) {}

  ngOnInit(): void {
    this.currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.userDetails = this.storageService.get('user');
    this.userType=this.storageService.get(StorageKeys.USER_TYPE);
    this.isMsp = this.userType?.toUpperCase() === UsersType.MSP;
    this.isVendor = this.userType?.toUpperCase() === UsersType.VENDOR;
    this.isClient = this.userType?.toUpperCase() === UsersType.CLIENT;
    this.tableConfig = {
      title: 'Opted Out Jobs',
      columnList: [
        {
          name: 'template_name',
          title: 'Job Title',
          width: 20,
          isIcon: true,
          icon: 'expand_more',
          isImage: true,
          isContact: false,
          isNumberBadge: false,
          isOptIn: true,
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
          toolTipVisibility: false,
        },
        { name: 'id', title: `${(this.isMsp || this.isVendor) ? "Job ID" : "ID"}`, width: 7, isIcon: false, isImage: false, isContact: false, isNumberBadge: false, toolTipVisibility: true },
        {
          name: 'vendor',
          title: 'vendor',
          width: 7,
          isIcon: false,
          isImage: false,
          isContact: false,
          isNumberBadge: false,
          toolTipVisibility: true
        },
        { name: 'location', title: `${(this.isMsp || this.isVendor) ? "Work Location" : "Location"}`, width: 14, isIcon: false, isImage: false, isContact: false, isNumberBadge: false, toolTipVisibility: true },
        {
          name: 'start_date',
          title: 'Duration',
          width: 15,
          isIcon: false,
          isImage: false,
          isContact: false,
          isNumberBadge: false,
          isRange: true,
          rangeNameList: ['start_date', 'end_date'],
          toolTipVisibility: true,
        },
        { name: 'hired', title: 'Hired', width: 8, isIcon: false, isImage: false, isContact: false, isNumberBadge: true, toolTipVisibility: true },
        { name: 'submissions', title: 'Submissions', width: 8, isIcon: false, isImage: false, isContact: false, isNumberBadge: true, toolTipVisibility: true },
        { name: 'no_of_openings', title: 'No of Openings', width: 8, isIcon: false, isImage: false, isContact: false, isNumberBadge: true, toolTipVisibility: true },
        {
          name: 'budget_estimate',
          title: 'Estimated Budget',
          width: 10,
          isIcon: false,
          isImage: false,
          isContact: false,
          isNumberBadge: true,
          toolTipVisibility: true,
        },
      ],
      showTabs: true,
      isExpand: false,
      isFilter: true,
      isSearch: true,
      isSetting: true,
      isTopPagination: true,
      tableWidth: '2000px',
      density: 'COMFORTABLE',
      advanceFilter: [
        { name: 'name', title: 'Job Title', filterType: 'TEXT' },
        {
          name: 'status',
          title: 'Status',
          filterType: 'SELECT',
          multiSelectData: [
            { name: 'Open', value: 'open' },
            { name: 'Sourcing', value: 'sourcing' },
            { name: 'Halted', value: 'halt' },
            { name: 'Hold', value: 'hold' },
            { name: 'Filled', value: 'filled' },
            { name: 'Closed', value: 'closed' },
          ],
        },
      ],
    };
    if (this.isVendor || this.isClient) {
      this.tableConfig.columnList.splice(3, 1);
    }
    this.getAllOptOutJobs();
  }

  getAllOptOutJobs(pageNo = 1) {
    let url = `/job-manager/programs/${this.currentProgram?.id}/job_distribution?opt_option=opt_out&size=${this.itemPerPage}&page=${pageNo}`;
    if (this.filter.hasOwnProperty('name')) {
      url = url + '&search=' + this.filter.name;
    }
    if (this.filter.hasOwnProperty('status')) {
      url = url + '&job__status=' + this.filter.status;
    }
    this.dataLoading = true;
    this.jobService.get(url).subscribe({
      next: (data: any) => {
        if (data) {
          let alljob = [];
          let _this = this;
          data?.results.forEach(job => {
            job.orgStatus = job?.job?.status;
            let jobDetails = job?.job;
            if (jobDetails?.status?.toLowerCase() === this.jobStatus?.PENDING_APPROVAL?.toLowerCase()) {
              jobDetails.status = 'Pending approval';
            } else if (jobDetails?.status?.toLowerCase() === this.jobStatus?.RELEASE_JOB?.toLowerCase()) {
              jobDetails.status = 'Release job';
            } else if (jobDetails?.status?.toLowerCase() === this.jobStatus?.PENDING_APPROVAL_SOURCING?.toLowerCase()) {
              jobDetails.status = 'Pending approval sourcing';
            } else if (jobDetails?.status?.toLowerCase() === this.jobStatus?.PENDING_APPROVAL_HALTED?.toLowerCase()) {
              jobDetails.status = 'Halted';
            } else if (jobDetails?.status?.toLowerCase() === this.jobStatus?.PENDING_APPROVAL_HOLD?.toLowerCase()) {
              jobDetails.status = 'Hold';
            } else if (jobDetails?.status?.toLowerCase() === this.jobStatus?.FILLED_OR_CLOSED?.toLowerCase()) {
              jobDetails.status = 'Filled/Closed';
            } else if (jobDetails?.status?.toLowerCase() === this.jobStatus?.PENDING_REVIEW?.toLowerCase()) {
              jobDetails.status = 'Pending Review';
            } else if (jobDetails?.status?.toLowerCase() === this.jobStatus?.PENDING_DISTRIBUTION?.toLowerCase()) {
              jobDetails.status = 'Pending Distribution';
            }
            jobDetails.start_date = this.getFormattedDate(jobDetails?.start_date);
            jobDetails.end_date = this.getFormattedDate(jobDetails?.end_date);
            if (jobDetails.budget_estimate) {
              jobDetails.budget_estimate = jobDetails?.budget_estimate
                ? _this?.accuracyPipe?.transform(jobDetails?.budget_estimate, 'amount', { currencyCode: jobDetails?.currency })
                : '-';
            }
            let jobData = {
              orgStatus: jobDetails?.status,
              template_name: jobDetails?.template_name,
              status: jobDetails?.status,
              id: jobDetails?.job_id,
              location: jobDetails?.location?.name,
              start_date: jobDetails?.start_date,
              end_date: jobDetails?.end_date,
              hired: jobDetails?.hire_type,
              submissions: job?.submissions,
              no_of_openings: jobDetails?.positions,
              budget_estimate: jobDetails?.budget_estimate,
              job_uuid: jobDetails?.id,
              vendor: job?.vendor?.name
            };
            alljob.push(jobData);
          });
          this.vmsData = alljob;
          this.totalRecords = data?.count;
          this.dataLoading = false;
        }
      },
      error: (error) => {
        this.dataLoading = false;
        this.alertService.error(errorHandler(error));
      },
  });
  }

  getFormattedDate(date) {
    if (date) {
      return this.datePipe.transform(date);
    }
  }

  getlocation(location_id) {
    let url = `/configurator/programs/${this.currentProgram?.id}/work-locations/${location_id}`;
    this.jobService.get(url).subscribe((data: any) => {
      return data.work_location.city;
    });
  }

  onPaginationClick(event) {
    this.getAllOptOutJobs(event);
  }

  onClickRecords(event) {
    this.itemPerPage = event;
    this.getAllOptOutJobs();
  }

  onSortClick(event) {}

  onSearch(event) {
    if (event) {
      this.filter.name = event;
      this.getAllOptOutJobs();
    } else {
      this.filter = {};
      this.getAllOptOutJobs();
    }
  }

  onListFilter(event) {
    if (event) {
      this.filter = event;
      this.getAllOptOutJobs();
    } else {
      this.filter = {};
      this.getAllOptOutJobs();
    }
  }

  onClickView(ev) {
    if (ev) {
      this.router.navigate([`jobs/details/job-details/${ev.job_uuid}`]);
    }
  }

  onOptInClick(event) {
    let user = this.storageService.get('user');
    let vendor_id = user?.organization_id;
    let url = `/job-manager/programs/${this.currentProgram?.id}/job_distribution/${vendor_id}/${event.job_uuid}`;
    let payload = {
      opt_option: 'opt_in',
    };
    this.jobService.put(url, payload).subscribe({
      next: (data: any) => {
        if (data) {
          this.alertService.success('Job Opted-In sucessfully');
          this.getAllOptOutJobs();
        }
      },
      error: (error) => {
        this.alertService.error(errorHandler(error));
      },
  });
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
        if (vmsData && vmsData?.job_uuid) {
          this.router.navigate(['/jobs/details/job-details', vmsData?.job_uuid, 'distribution']);
        }
        break;
      case 'approve':
        if (vmsData && vmsData?.job_uuid) {
          this.router.navigate(['/jobs/details/job-details', vmsData?.job_uuid, 'approval']);
        }
        break;
      case 'reject':
        if (vmsData && vmsData?.job_uuid) {
          this.router.navigate(['/jobs/details/job-details', vmsData?.job_uuid, 'approval']);
        }
        break;
      case 'reDistribute':
        if (vmsData && vmsData?.job_uuid) {
          this.router.navigate(['/jobs/details/job-details', vmsData?.job_uuid, 'distribution']);
        }
        break;
      case 'close':
        if (vmsData && vmsData?.job_uuid) {
          this.router.navigate(['/jobs/details/job-details', vmsData?.job_uuid], { queryParams: { action: 'close' } });
        }
        break;
      case 'review':
        this.router.navigate(['/jobs/details/job-details', vmsData?.job_uuid]);
        break;
      default:
        break;
    }
  }

  updateJobStatus(status, vmsData) {
    if (vmsData && vmsData?.job_uuid) {
      this.loaderService.show();
      let url = `/job-manager/programs/${this.currentProgram.id}/jobs/${vmsData?.job_uuid}`;
      this.jobService.put(url, { status: status }).subscribe({
        next: (data: any) => {
          this.loaderService.hide();
          if (data.message) {
            this.getAllOptOutJobs();
          }
        },
        error: (error) => {
          this.alertService.error(errorHandler(error));
          this.loaderService.hide();
          this.dataLoading = false;
        },
    });
    }
  }
}
