import { Component, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { EmitEvent, Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { VMSConfig } from 'src/app/library/smartTable/table/table.model';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { StorageKeys, StorageService } from '../../../../core/services/storage.service';
import { JobService } from '../../../job.service';
import { JobDetailsService } from '../../job-details.service';
import { JobStatus } from 'src/app/shared/enums';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { AccessControlService } from 'src/app/core/services/access-control.service';

@Component({
  selector: 'app-distribution',
  templateUrl: './distribution.component.html',
  styleUrls: ['./distribution.component.scss'],
})
export class DistributionComponent implements OnInit, OnDestroy {
  private subscriptions = [];
  public vmsData: any;
  public tableConfig: VMSConfig;
  public jobDestributionForm = this.fb.group({
    job_distribution_method: ['distriubte_immedietaley'],
    tiered_distribution_schedule: [],
    submission_limit: [100,[Validators.min(0)]],
  });
  public toggle = {
    title: 'active',
    value: true,
  };
  public jobStatus: any = JobStatus;
  // has_submission_limit = true; // Commented as part of AMFMI-2126
  public isExpand = false;
  public totalPages = 0;
  public totalRecords = 0;
  gridContentType = 'candidate';
  tableLoaded = false;
  dataLoading = true;
  public viewGrid: boolean = true;
  public gridVewJson: any = {};
  itemsPerPage: any = 10;
  searchTerm: any;
  jobId = '';
  filterDataPage: number;
  isAdvanceSearch = false;
  filterpayLoad: any;
  currentProgram: any;
  client: any;
  distributionSchedules: any[] = [];
  vendorsList: any[] = [];
  laborCategories: any[] = [];
  jobDetails: any;
  public duration: any = [
    { name: 'Hour(s)', value: 'HOURS', bValue: 'HOURS' },
    { name: 'Day(s) ', value: 'DAYS', bValue: 'DAYS' },
    { name: 'Week(s)', value: 'WEEKS', bValue: 'WEEKS' },
  ];
  laborCategoriesList: any[] = [];
  jobDistributionList: any[] = [];
  pageNo = 1;
  loader = false;
  public isValidStatus: boolean = true;
  public vendorFilterInput$ = new Subject<string | null>();
  public memberInput$ = new Subject<string | null>();
  editSubmissionLimit = false;
  editSubmissionData: any = {};
  vendorLoader = false;
  showNoVendorMessage = false;
  hide_tiered_distribution_option = false;
  subscription: any;
  userBelongToJobModule: boolean = false;
  showJobType: boolean = false;
  jobTypes: any = null;
  jobTypeLoading: boolean = false;
  constructor(
    private fb: UntypedFormBuilder,
    private _eventStrem: EventStreamService,
    private router: Router,
    private storageService: StorageService,
    private _jobsService: JobService,
    private route: ActivatedRoute,
    private alertService: AlertService,
    private datePipe: LocalDateFormatPipe,
    private jobDetailService: JobDetailsService,
    private loaderServicer: LoaderService,
    private accessControlService: AccessControlService
  ) {
    this.vmsData = {
      candidate: [],
    };
    this.resetVendorList();
  }

  ngOnInit(): void {


    this.jobId = this.route?.parent?.snapshot?.params['id'];
    if (
      !this.storageService.get(StorageKeys.USER_PERMISSION)?.find(val => val === 'distribute_job') &&
      !this.storageService.get(StorageKeys.CURRENT_USER)?.is_superuser
    ) {
      if(this.accessControlService.accessControl()) {
        this.router?.navigate([`/jobs/details/job-details/${this.jobId}`]);
      }
    }
    this.currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.showJobType = this.currentProgram?.config?.job_type ?? false;
    const { client } = this.currentProgram;
    this.client = client;
    this.hide_tiered_distribution_option = this.currentProgram?.config?.job?.hide_tiered_distribution_option;
    this.tableConfig = {
      title: 'Distribution List',
      columnList: [
        {
          name: 'vendor.name',
          title: 'VENDORS / JOB BOARDS',
          width: 20,
          isIcon: false,
          isImage: true,
          isContact: false,
          isNumberBadge: false,
          isApprove: true,
        },
        { name: 'distribution_status', title: 'STATUS', width: 15, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
        {
          name: 'distributed_by',
          title: 'DISTRIBUTED BY',
          width: 10,
          isIcon: false,
          isImage: false,
          isContact: false,
          isNumberBadge: true,
        },
        {
          name: 'distribution_date',
          title: 'DISTRIBUTION DATE',
          width: 15,
          isIcon: false,
          isImage: false,
          isContact: false,
          isNumberBadge: false,
        },
        {
          name: 'opt_option_reason',
          title: 'OPT STATUS & REASON',
          width: 10,
          isIcon: false,
          isImage: false,
          isContact: false,
          isNumberBadge: true,
          toolTipVisibility: true,
        },
        {
          name: 'opt_in_at',
          title: 'OPT STATUS DATE & TIME',
          width: 10,
          isIcon: false,
          isImage: false,
          isContact: false,
          isNumberBadge: true,
        },
        {
          name: 'submission_limit',
          title: 'SUBMISSIONS LIMIT',
          width: 10,
          isIcon: false,
          isImage: false,
          isContact: false,
          isNumberBadge: false,
          isCandidateStatus: false,
        },
        // { name: 'submittion', title: 'SUBMISSIONS', width: 20, isIcon: false, isImage: false, isContact: false, isVieworEdit: false, isDisableorDelete: false, isDelete: false, isViewProfile: true,   isNumberBadge: false, isNoOption: true, isViewEnabled: true },
        {
          name: 'submissions',
          title: 'SUBMISSIONS',
          width: 13,
          isIcon: false,
          isImage: false,
          isContact: false,
          isNoOption: false,
          isVieworEdit: false,
          isVieworClone: false,
          isDisableorDelete: false,
          isDelete: false,
          isNumberBadge: false,
        },
      ],
      // advanceFilter: [],
      isExpand: false,
      isFilter: true,
      isSearch: false,
      isSort: true,
      isSetting: false,
      isTopPagination: false,
      hideResultCount: true,
      isDistributionList: true,
      isCreate: false,
      hideHeader: false,
      isTopHeader: true,
      density: 'COMFORTABLE',
      advanceFilter: [
        {
          name: 'vendor_id',
          title: 'Vendors/ Job Boards',
          filterType: 'MULTISELECT',
          multiSelectData: [],
          eventEmiiter: this.vendorFilterInput$,
          changeHandler: this.searchVendorFilter,
        },
        {
          name: 'distribution_status',
          title: 'Status',
          filterType: 'MULTISELECT',
          multiSelectData: [
            { name: 'Distributed', value: 'distributed' },
            { name: 'Scheduled', value: 'scheduling' },
          ],
        },
        {
          name: 'created_on__range',
          title: 'Distributed date',
          filterType: 'DATERANGE',
        },
        {
          name: 'created_by',
          title: 'Distributed By',
          filterType: 'MULTISELECT',
          multiSelectData: [],
          eventEmiiter: this.memberInput$,
          changeHandler: this.getManagerList,
        },
        {
          name: 'opt_option',
          title: 'Opt status',
          filterType: 'MULTISELECT',
          multiSelectData: [
            { name: 'Opt In', value: 'opt_in' },
            { name: 'Opt Out', value: 'opt_out' },
          ],
        },
        {
          name: 'submission_limit',
          title: 'Submission Limit',
          filterType: 'TEXT',
        },
        {
          name: 'submission_count',
          title: 'Submissions',
          filterType: 'TEXT',
        },
      ],
    };
    if (this.jobId) {
      this.getJobDetails(this.jobId);
    }

    this.getDistributionSchedule();
    this.getOrgDetail();
    this.resetVendorList();
    this.searchVendorFilter();
    this.getManagerList();

    this.subscriptions.push(
      this._eventStrem.on(Events.ADD_VENDOR).subscribe(data => {
        if (data.value) {
          const vendorListId = this.vendorsList[this.currentVendorIndex]?.moreVendors?.map((res) => {
            return res?.vendor?.id;
          })
          if(data.value.vendors){
          data.value.vendors = data?.value?.vendors?.filter((res) => {
            return !vendorListId?.includes(res?.vendor?.id);
          })
        }
          this.vendorsList[this.currentVendorIndex].moreVendors = this.vendorsList[this.currentVendorIndex]?.moreVendors
            ? this.vendorsList[this.currentVendorIndex]?.moreVendors?.concat(data?.value?.vendors)
            : data?.value?.vendors;
          this.vendorsList[this.currentVendorIndex].vendorGroup = this.vendorsList[this.currentVendorIndex]?.vendorGroup
            ? this.vendorsList[this.currentVendorIndex]?.vendorGroup?.concat(data?.value?.vendorGroup)
            : data?.value?.vendorGroup;
        }
      }),
    );
  }

  clearSubmission() {
    this.jobDestributionForm.patchValue({
      submission_limit: 0,
    });
  }

  changeSubmissionLimit() {
    let formPayload = this.jobDestributionForm.value;
    if (formPayload?.submission_limit < 0 || !formPayload?.submission_limit) {
      return;
    }
    this.subscriptions.push(
      this._jobsService
        .put(`/job-manager/programs/${this.currentProgram?.id}/job_distribution/job_id/${this.jobId}`, {
          submission_limit: formPayload?.submission_limit,
        })
        .subscribe({
          next: (res: any) => {
            this.alertService.success('Successfully updated submission limit.');
            this.loadJobDistributionList();
            this.loaderServicer.hide();
          },
          error: (err) => {
            this.loaderServicer.hide();
            this.alertService.error(errorHandler(err));
          },
  }),
    );
  }

  changeRecords(event) {
    this.itemsPerPage = event;
    this.pageNo = 1;
    this.loadJobDistributionList();
  }

  loadJobDistributionList() {
    this.loader = true;

    let url = `/job-manager/programs/${this.currentProgram?.id}/job_distribution?job__id=${this.jobId}&size=${this.itemsPerPage}&page=${this.pageNo}`;
    let queryParam = '';
    for (const property in this.filterpayLoad) {
      let value = this.filterpayLoad[property];
      if (value) {
        if (property === 'created_on__range') {
          value = value?.map(date => this.formatDate(date));
        }
        if (Array.isArray(value) && value.length > 0) {
          queryParam += `&`;
          queryParam += `${property}=${value.join(',')}`;
        } else if (!Array.isArray(value)) {
          queryParam += `&`;
          queryParam += `${property}=${value}`;
        }
      }
    }
    url += queryParam;

    this.subscriptions.push(
      this._jobsService.get(url).subscribe({
        next: (res: any) => {
          let { results, count } = res;
          this.totalRecords = count;
          results = results.map(re => {
            re['distributed_by'] =
              re?.created_by?.first_name && re?.created_by?.last_name
                ? `${re?.created_by?.first_name} ${re?.created_by?.last_name}`
                : re?.created_by?.email ?? '--';
            re.disableClicked = true;
            re.distribution_status =
              re?.reflected_job_status?.toLowerCase() === 'hold'
                ? re?.reflected_job_status
                : re?.reflected_job_status?.toLowerCase() === 'halted'
                ? 'halted'
                : re?.scheduled_status?.toLowerCase() === 'scheduling' && re?.distribution_status?.toLowerCase() === 'not distributed'
                ? 'scheduled'
                : re?.distribution_status;
            if (re?.distribution_status?.toLowerCase() == 'scheduled') {
              if (re?.scheduled_datetime) {
                re.distribution_date = this.datePipe.transform(
                  re?.scheduled_datetime,
                  this.currentProgram?.defaultDateFormat + ' hh:mm:ss a z',
                );
              }
            } else {
              re.distribution_date = this.datePipe.transform(re?.created_on, this.currentProgram?.defaultDateFormat + ' hh:mm:ss a z');
            }
            if(re?.opt_option?.toLowerCase() == "opt_in") {
              re.opt_option_reason = "Opt In";
            } else if(re?.opt_option == "pending_opt_option") {
              re.opt_option_reason = null;
            } else if(re?.opt_option == "opt_out") {
              re.opt_in_at = re.opt_out_at;
            }
            re.opt_in_at = re?.opt_in_at ? this.datePipe.transform(re?.opt_in_at, this.currentProgram?.defaultDateFormat + ' hh:mm:ss a z') : '--';
            re.is_belongs_to_job_module = this.userBelongToJobModule;
            return re;
          });
          this.jobDistributionList = results;
          if (this.jobDistributionList?.length && this.vendorsList[0]?.vendors?.length) {
            this.vendorsList[0].vendors = this.vendorsList[0]?.vendors?.filter(
              x => !this.jobDistributionList?.map(y => y?.vendor?.id)?.includes(x?.vendor?.id),
            );
          }
          this.loader = false;
        },
        error: error => {
          this.loader = false;
        },
  }),
    );
  }

  public formatDate(dateNumber: number): string {
    let newDate = new Date(dateNumber);
    return newDate?.getFullYear() + '-' + ('0' + (newDate?.getMonth() + 1))?.slice(-2) + '-' + ('0' + newDate?.getDate())?.slice(-2);
  }

  deleteFromSD(vendorId) {
    this.loaderServicer.show();
    this.subscriptions.push(
      this._jobsService
        .put(`/job-manager/programs/${this.currentProgram?.id}/job_distribution/${vendorId}/${this.jobId}`, {
          delete_record: true,
        })
        .subscribe({
          next: (res: any) => {
            this.alertService.success('Successfully deleted.');
            this.loadJobDistributionList();
            this.loaderServicer.hide();
          },
          error: (err) => {
            this.loaderServicer.hide();
            this.alertService.error(errorHandler(err));
          },
  }),
    );
  }

  onDistributionOptionClicked(event) {
    const { key, vmsData } = event;
    switch (key) {
      case 'hold':
      case 'halt':
      case 'release':
        this.changeDistributionStatus(key, vmsData);
        break;
      case 'remove-sd':
        this.deleteFromSD(vmsData?.vendor_id);
        break;
      case 'submission_limit':
        this.editSubmissionData = vmsData;
        this.editSubmissionLimit = true;
        break;
      default:
        break;
    }
  }

  onSubmissionLimitClose(event) {
    if (event?.reload) {
      this.loadJobDistributionList();
    }
    this.editSubmissionLimit = false;
  }

  changeDistributionStatus(vendor_specific_job_status, vmsData) {
    this.loaderServicer.show();
    this.subscriptions.push(
      this._jobsService
        .put(`/job-manager/programs/${this.currentProgram?.id}/job_distribution/${vmsData?.vendor_id}/${this.jobId}`, {
          vendor_specific_job_status,
        })
        .subscribe({
          next: (res: any) => {
            this.alertService.success('Successfully updated.');
            this.loadJobDistributionList();
            this.loaderServicer.hide();
          },
          error: (err) => {
            this.loaderServicer.hide();
            this.alertService.error(errorHandler(err));
          },
  }),
    );
  }

  onClickedOutside(index) {
    this.vendorsList[index].vendorSearch = [];
  }

  distribute() {
    this.loaderServicer.show();
    let formPayload = this.jobDestributionForm?.value;
    let payload: any = {
      job_id: this.jobId,
      distribute_type: formPayload?.job_distribution_method !== 'distriubte_immedietaley' ? 'scheduled' : 'manual',
      program_id: this.currentProgram?.id,
    };

    if (formPayload?.job_distribution_method !== 'distriubte_immedietaley') {
      const schedules = this.vendorsList?.map((vendr: any) => {
        let vList = vendr?.moreVendors ? vendr?.vendors?.concat(vendr?.moreVendors) : vendr?.vendors;
        vList = vList?.map(v => v?.vendor?.id);
        const obj = {
          vendors: vList,
          schedule_unit: vendr?.schedule_unit,
          after: vendr?.schedule_value,
        };
        if (vendr?.schedule_value) {
          obj['schedule_value'] = vendr?.schedule_value;
        }
        if (vendr?.vendorGroup) {
          obj['vendor_group_id'] = vendr?.vendorGroup?.map(res=>res?.id);
        }
        if (vendr?.schedule_after) {
          obj['schedule_after'] = vendr?.schedule_after;
        }
        return obj;
      });
      schedules?.map((sch: any) => {
        if (!sch?.after) {
          delete sch?.after;
        }
        // sch.vendor_group_id = [];
        return sch;
      });
      payload.distribution_id = [
        {
          id: this.selectedSchedule?.id,
          schedules,
        },
      ];
    } else {
      let vendors = [];
      let vendorGroup = [];
      this.vendorsList?.forEach((vendr: any) => {
        let vList = vendr?.moreVendors ? vendr?.vendors?.concat(vendr?.moreVendors) : vendr?.vendors;
        vList = vList.map(v => v?.vendor?.id);
        vendors = [...vendors, ...vList];
        if (vendr?.vendorGroup) {
          vendorGroup = [...vendorGroup, ...vendr?.vendorGroup?.map(vg => vg?.id)];
        }
        return vList;
      });
      payload.vendors = vendors;
      payload.vendor_group_id = vendorGroup;
    }
    this.subscriptions.push(
      this._jobsService.post(`/job-manager/programs/${this.currentProgram.id}/job_distribution`, payload).subscribe({
        next: (data: any) => {
          this.loaderServicer.hide();
          this.alertService.success('Job Distributed Successfully.');
          this.distributionMethodChange('distriubte_immedietaley');
          this.loadJobDistributionList();
          this.jobDestributionForm.get('job_distribution_method').setValue('distriubte_immedietaley');
          this.jobDetailService.updateJobDetails$.next(true);
        },
        error: (err) => {
          this.alertService.error(err.error.error);
          this.loaderServicer.hide();
        },
  }),
    );
  }

  vendorAlreadyExist(vendor, scheduleId) {
    const indx = this.vendorsList?.findIndex(vndrList => vndrList?.id === scheduleId);
    const schedule = this.vendorsList[indx];
    return (
      schedule?.vendors?.some(v => v?.id === vendor?.id) ||
      (schedule?.moreVendors ? schedule?.moreVendors?.some(v => v?.id === vendor?.id) : false)
    );
  }

  get distributeDisabled() {
    if (this.jobDestributionForm?.get('job_distribution_method')?.value == 'distriubte_immedietaley') {
      return this.vendorsList[0]?.vendors?.length < 1 && this.vendorsList[0]?.moreVendors?.length < 1;
    } else if (this.jobDestributionForm.get('job_distribution_method')?.value == 'tiered_distribution') {
      return !this.jobDestributionForm.get('tiered_distribution_schedule')?.value;
    }
    return true;
  }

  getJobDetails(jobid) {
    if (jobid) {
      this.subscriptions.push(
        this.jobDetailService.getJobs(`${jobid}`).subscribe({
          next: (data: any) => {
            if (data?.job) {
              this.jobDestributionForm.patchValue({
                job_distribution_method: 'distriubte_immedietaley',
              });
              this.distributionMethodChange('distriubte_immedietaley');
              this.jobDetails = data?.job;
              if (
                this.jobDetails?.status?.toLowerCase() === this.jobStatus?.FILLED ||
                this.jobDetails?.status?.toLowerCase() === this.jobStatus?.CLOSED ||
                this.jobDetails?.status?.toLowerCase() === this.jobStatus?.REJECTED
              ) {
                this.isValidStatus = false;
              } else {
                this.isValidStatus = true;
              }
              if (this.jobDetails?.submission_limit_vendor) {
                this.jobDestributionForm.patchValue({
                  submission_limit: this.jobDetails?.submission_limit_vendor,
                });
              }
              this.userBelongToJobModule = data?.job?.is_belongs_to_job_module;
              if(!this.accessControlService.accessControl()) {//check for super view user
                this.userBelongToJobModule = false;
              }
              if(this.showJobType && !this.jobTypes && !this.jobTypeLoading){
                this.getJobTypePicklist();
              }
              else{
                this.getJobLaborCategoriesVendors();
              }
              this.loadJobDistributionList();
            }
          },
          error: err => {
            // this.alertService.error(errorHandler(err));
          },
    }),
      );
    }
  }

  jobLaborCategories: any[] = [];
  getJobLaborCategoriesVendors() {
    if (!this.jobDetails || (this.showJobType && !this.jobTypes)) {
      return;
    }
    let jobType = null;
    if(this.showJobType){
      jobType =  this.jobTypes?.find((jobType)=>jobType?.value=== this.jobDetails?.job_type?.[0])?.label
    }
    const laborCategoryIds = this.jobDetails?.program_industry?.map(res => res?.id).filter(id => id !== undefined && id !== null) ?? [];
    if (laborCategoryIds?.length) {
      this._jobsService.get(`/configurator/programs/${this.currentProgram?.id}/vendors?active=true&program_industries=` + laborCategoryIds + '&work_locations=' + this.jobDetails?.location?.id +(this.showJobType ? '&job_type=' + jobType : '')).subscribe({
        next: (data: any) => {
          const { program_vendors } = data;
          this.vendorsList[0].vendors = this.vendorsList[0]?.vendors?.concat(program_vendors);
          if (this.jobDistributionList?.length) {
            this.vendorsList[0].vendors = this.vendorsList[0]?.vendors?.filter(
              x => !this.jobDistributionList?.map(y => y?.vendor?.id)?.includes(x?.vendor?.id),
            );
          }
        },
        error: err => {
          this.alertService.error('Error in loading the vendors');
        },
    });
    }
  }

  resetVendorList() {
    this.vendorsList = [
      {
        id: Date.now(),
        schedule_unit: 'IMMEDIATE',
        schedule_value: null,
        vendor_groups: [],
        vendors: [],
        moreVendors: [],
      },
    ];
  }

  get hasVendors() {
    const lengthOfArray = this.vendorsList?.map(v => (v?.vendors?.length || 0) + (v?.moreVendors?.length || 0));
    if (this.vendorsList[this.currentVendorIndex]?.vendorGroup?.length) {
      const lengthOfArray1 = this.vendorsList?.map(res => {
        return res?.vendorGroup?.map(v => {
          return v?.vendors?.length || 0;
        });
      });
      const total1 = lengthOfArray1?.reduce((a, b) => a + b, 0);
      return Boolean(total1);
    }

    const total = lengthOfArray?.reduce((a, b) => a + b, 0);
    return Boolean(total);
  }

  getOrgDetail() {
    this.subscriptions.push(
      this._jobsService.get(`/configurator/organizations/${this.client?.id}`).subscribe((data: any) => {
        this.laborCategories = data?.industries || [];
      }),
    );
  }

  formateDate(d) {
    var date = new Date(d);
    var dateStr =
      ('00' + (date?.getMonth() + 1))?.slice(-2) +
      '/' +
      ('00' + date?.getDate())?.slice(-2) +
      '/' +
      date.getFullYear() +
      ' ' +
      ('00' + date?.getHours())?.slice(-2) +
      ':' +
      ('00' + date?.getMinutes())?.slice(-2) +
      ':' +
      ('00' + date?.getSeconds())?.slice(-2);
    return dateStr;
  }
   
  getDistributionSchedule() {
    const jobD = this.storageService.get(StorageKeys.VIEWD_JOB);
    this.subscriptions.push(
      this._jobsService.get(`/configurator/programs/${this.currentProgram?.id}/vendors/distribution-schedules?active=true&work_locations=` + jobD?.location?.id).subscribe((data: any) => {
        const { distribution_schedules } = data;
        this.distributionSchedules = distribution_schedules?.filter(x => x?.is_enabled);
      }),
    );
  }

  get formControl() {
    return this.jobDestributionForm?.controls;
  }
  
  selectedSchedule: any;
  distributionScheduleSelected(schedule) {
    if (schedule) {
      this.selectedSchedule = schedule;
      // const vendorsList = schedule?.schedules || [];
      const immediateSchedule = schedule?.schedules?.filter(unit => unit?.schedule_unit === 'IMMEDIATE');
      const nonImmediateSchedule = schedule?.schedules?.filter(unit => unit?.schedule_unit !== 'IMMEDIATE');
      this.vendorsList = immediateSchedule?.concat(nonImmediateSchedule);

      //adding this as in program config api vendor_groups key is there and in code vendorGroup is already being used for adding vendor groups
      //so to avoid confusion doing this
      this.vendorsList?.forEach((res)=>{
        if(res?.vendor_groups?.length > 0) {
          res.vendorGroup = res.vendor_groups;
        }
      })
    } else {
      this.vendorsList = [];
    }
  }

  addNewTier() {
    this.vendorsList.push({
      id: Date.now(),
      schedule_unit: 'WEEKS',
      schedule_value: null,
      vendor_groups: [],
      vendors: [],
      custom: true,
      moreVendors: [],
      vendorSearch: [],
    });
  }
  timeout: any = null;

  searchVendor(searchString, schedule_id) {
    this.vendorLoader = true;
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    clearTimeout(this.timeout);
    var $this = this;
    this.timeout = setTimeout(() => {
      let url = `/configurator/programs/${$this.currentProgram?.id}/vendors?active=true`;
      if (searchString) {
        url += `&name=${searchString}`;
      }
      url+='&work_locations=' + this.jobDetails?.location?.id;
      this.subscriptions.push(
        this.subscription=$this._jobsService.get(url).subscribe((data: any) => {
          let { program_vendors } = data;
          if (this.jobDistributionList?.length) {
            program_vendors = program_vendors?.filter(x => !this.jobDistributionList?.map(y => y?.vendor?.id).includes(x?.vendor?.id));
          }
          this.showNoVendorMessage = program_vendors?.length ? false : true;
          let indx;
          if (schedule_id !== 'IMMEDIATE') {
            indx = $this.vendorsList?.findIndex(vndrList => vndrList?.id === schedule_id);
          } else {
            indx = $this.vendorsList?.findIndex(vndrList => vndrList?.schedule_unit === 'IMMEDIATE');
          }
          if (indx > -1) {
            $this.vendorsList[indx].vendorSearch = program_vendors;
          }
          this.vendorLoader = false;
        }),
      );
    }, 500);
    return;
  }

  searchVendorFilter = (term = '') => {
    let url = `/configurator/programs/${this.currentProgram?.id}/vendors?active=true`;
    if (term) {
      url += `&name=${term}`;
    }
    const jobD = this.storageService.get(StorageKeys.VIEWD_JOB);
    url += '&work_locations=' + jobD?.location?.id;
    this.subscriptions.push(
      this._jobsService
        .get(url)
        .pipe(
          map((res: any) =>
            res.program_vendors.map(vendorP => {
              return { value: vendorP?.vendor?.id, name: vendorP?.vendor?.name };
            }),
          ),
        )
        .subscribe(data => {
          this.tableConfig.advanceFilter[0].multiSelectData = data;
        }),
    );
  };

  getManagerList = (term = '') => {
    let url = `/configurator/programs/${this.currentProgram.id}/members?org_category=MSP&info_level=basic`;
    if (term) {
      url += `&name=${term}`;
    }
    return this._jobsService
      .get(url)
      .pipe(
        map((res: any) => {
          const mem = res.members.map(mem => {
            return {
              value: mem?.id,
              name: mem?.first_name + ' ' + (mem?.last_name ? mem?.last_name : ''),
            };
          });
          return mem;
        }),
      )
      .subscribe(data => {
        this.tableConfig.advanceFilter[3].multiSelectData = data;
      });
  };

  addMoreVendor(vendor, schedule_id) {
    this.removeFromOtherIfAvailable(vendor);
    const indx = this.vendorsList?.findIndex(vndrList => vndrList?.id === schedule_id);
    if (indx > -1) {
      this.vendorsList[indx].searchValue = '';
      this.vendorsList[indx].searchValue = '';
      if (!Array.isArray(this.vendorsList[indx]?.moreVendors)) {
        this.vendorsList[indx].moreVendors = [];
      }
      const inIndex = this.vendorsList[indx]?.vendorSearch?.findIndex(vn => vn?.id === vendor?.id);
      if (inIndex > -1) {
        this.vendorsList[indx]?.vendorSearch?.splice(inIndex, 1);
      }
      const includeInVendor =
        this.vendorsList[indx]?.vendors.some(_vendor => _vendor?.id === vendor?.id) ||
        this.vendorsList[indx]?.moreVendors?.some(_vendor => _vendor?.id === vendor?.id);
      if (!includeInVendor) {
        this.vendorsList[indx]?.moreVendors?.push(vendor);
      }

      this.vendorsList[indx].vendorSearch = [];
    }
  }

  removeFromOtherIfAvailable(vendor) {
    for (let index = 0; index < this.vendorsList?.length; index++) {
      const schedule = this.vendorsList[index];
      let includes = schedule?.vendors?.some(v => v?.id === vendor?.id);
      let hasInMore = schedule?.moreVendors ? schedule?.moreVendors?.some(v => v?.id === vendor?.id) : false;
      if (includes) {
        schedule?.vendors?.splice(
          schedule?.vendors?.findIndex(ven => ven?.id === vendor?.id),
          1,
        );
        this.vendorsList['vendors'] = schedule?.vendors;
      }
      if (hasInMore) {
        schedule?.moreVendors?.splice(
          schedule?.moreVendors?.findIndex(ven => ven?.id === vendor?.id),
          1,
        );
        this.vendorsList['moreVendors'] = schedule?.moreVendors;
      }
    }
  }

  deleteVendor(vendorListIndex, vendorArray, vendorArrayIndex) {
    this.vendorsList[vendorListIndex][vendorArray]?.splice(vendorArrayIndex, 1);
  }

  distributionMethodChange(value) {
    this.resetVendorList();
    if (value === 'distriubte_immedietaley') {
      if(this.showJobType && !this.jobTypes && !this.jobTypeLoading){
        this.getJobTypePicklist();
      }
      else{
        this.getJobLaborCategoriesVendors();
      }
    }
  }

  removeSchedule(ind) {
    this.vendorsList?.splice(ind, 1);
  }

  withdrawalClicked($event) {}
  onClickView(e) {
    this.router?.navigate([`/jobs/submission/${this.jobId}/candidate/${e?.id}/offer`]);
  }
  onEditClick(data) {}
  cloneClicked(e) {}
  onExpandClick(e) {}

  onPaginationClick(e) {
    this.pageNo = e;
    this.loadJobDistributionList();
    // this.getSubmittedCandidateList(e);
  }

  onDeleteClick(role) {}

  disableClicked(role) {}

  onCreateClick(e) {}

  columnClicked(columnData) {}
  selectAllClicked(data) {}
  selectClicked(data) {}
  onSearch(term) {
    this.searchTerm = term;
    // this.getSubmittedCandidateList();
  }
  onListFilter(event) {
    this.isAdvanceSearch = true;
    this.filterpayLoad = event;
    this.pageNo = 1;
    this.loadJobDistributionList();
  }

  currentVenodrForAdanceSearch: any;
  currentVendorIndex;
  clickViewSubmittedCandidate(event, index = 0) {
    if (event) {
      this.currentVendorIndex = index;
      this.currentVenodrForAdanceSearch = this.vendorsList[index];
      this._eventStrem.emit(new EmitEvent(Events.SEARCH_VENDOR, { value: event }));
    }
  }
  getColorCode(index) {
    return index % 2 ? 'red' : 'blue';
  }
  get selectedVendorIds() {
    const vendors = this.currentVenodrForAdanceSearch ? this.currentVenodrForAdanceSearch?.vendors : [];
    const moreVendors =
      this.currentVenodrForAdanceSearch && this.currentVenodrForAdanceSearch?.moreVendors
        ? this.currentVenodrForAdanceSearch?.moreVendors
        : [];
    return vendors?.map(vndr => vndr?.id)?.concat(moreVendors.map(vndr => vndr?.id));
  }

  get selectedVendorGroupIds() {
    const vendorGroups = this.currentVenodrForAdanceSearch ? this.currentVenodrForAdanceSearch?.vendorGroup : [];
    const moreVendorGroups =
      this.currentVenodrForAdanceSearch && this.currentVenodrForAdanceSearch?.vendorGroup
        ? this.currentVenodrForAdanceSearch?.vendorGroup
        : [];
    return vendorGroups?.map(vndr => vndr?.id)?.concat(moreVendorGroups.map(vndr => vndr?.id));
  }
  onClickToggle() {}
  ngOnDestroy(): void {
    this.subscriptions?.forEach(sub => sub?.unsubscribe());
  }
  getJobTypePicklist(){
    this.jobTypeLoading = true;
    let url=`/configurator/programs/${this.currentProgram?.id}/picklists/*/items?picklist_slug=job_type&is_enabled=true&order_by=asc`
    this._jobsService.get(url).subscribe({
      next:(data:any)=>{
        this.jobTypes= data?.picklist_items;
        this.getJobLaborCategoriesVendors();
      },
      error:(err:any)=>this.alertService.error('An error occurred.'),
      complete:()=>this.jobTypeLoading = false
    })
  }
}
