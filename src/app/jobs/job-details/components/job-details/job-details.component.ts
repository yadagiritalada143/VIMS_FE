import { AccountCodeData } from './../../../../library/account-code-generate/models/account-code-data';
import { Component, OnInit, Input } from '@angular/core';
import { JobDetailsService } from '../../job-details.service';
import { errorHandler } from '../../../../shared/util/error-handler';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { ActivatedRoute, Router } from '@angular/router';
import { EmitEvent, Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { ApprovalStatus, JobStatus, UsersType } from './../../../../shared/enums';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { AwsS3FileUploadService } from 'src/app/shared/service/utility/aws.s3.upload.service';
import { LowerCasePipe, TitleCasePipe } from '@angular/common';
import { AuthorizationService } from 'src/app/core/services/authorize.service';
import { SortHelperPipe } from 'src/app/shared/pipe/sort-helper.pipe';
import * as _ from 'lodash';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { UserPermissionService } from 'src/app/expense/services/user-permission.service';
import { ReducePositionModel } from 'src/app/jobs/interface/job.model';
export enum RATE_MODEL_ENUM {
  BILL_RATE = 'bill_rate',
  PAY_RATE = 'pay_rate',
  MARKUP = 'markup'
}
@Component({
  selector: 'job-details',
  templateUrl: './job-details.component.html',
  styleUrls: ['./job-details.component.scss'],
})
export class JobDetailComponent implements OnInit {
  @Input() maxContentLength: number = 1000;
  public toggleDescription = false;
  public jobDetails: any;
  public param = '';
  private jobId = '';
  public user: any;
  public foundationCustomFieldsList: Array<any>;
  public isShowStatus: boolean = false;
  public ApprovalStatus: any = ApprovalStatus;
  public jobStatus;
  public dataLoader = true;
  public user_type: any;
  public allow_expense: any;
  public approval_id: any;
  public customFields: any = [];
  public ratemodel = this.localStorage.get(StorageKeys.CURRENT_PROGRAM)?.config?.program_model;
  public loadCustomDetails = false;
  public theme1: any = {
    width: '80%',
    height: '16px',
    'border-radius': '15px',
    'margin-bottom': '0',
    'background-color': '#e9e6ef',
    'border-top': '0',
  };

  qualificationType = [];
  preCandidates = [];
  isCreateCandidate = 'hidden';
  modalVisibility: boolean = false;
  editCandidateData = {};
  accountCode: AccountCodeData;
  accountCodeCreationActive: boolean;
  fdData: any;
  showAccountCode = 'hidden';
  showTemplateCode = false;
  hasReducePermission: boolean = false;
  showReduceFlyout: boolean = false;
  baseUrl: any;
  isCreateEstimate = 'hidden';
  isMaxBudgetCalculation: boolean;
  hideMasterDataTypeName: boolean = false;
  hide_ot_exempt: boolean = false;
  public UserTypeEnum = UsersType;
  public RATE_MODEL_ENUM = RATE_MODEL_ENUM;
  public work_location = {
    is_data_present : null,
    address_line_1: null,
    address_line_2: null,
    city_state_zipcode: null,
    country_name: null
  }
  detailedValue: string = "basicInfo" ;
  Allow_vendor_to_enter_client_bill_rate: boolean = false;
  showAllowedExpense = false;
  public support_text: any = { };
  programDetails;
  timeSheetType;
  allow_pre_identified_candidates: boolean = false;
  showJobType: boolean = false;
  jobType: any;
  reduceData: ReducePositionModel;
  jobResolverData: any;
  isVendorNeutral: boolean = false;
  constructor(
    private jobService: JobDetailsService,
    private localStorage: StorageService,
    private alertService: AlertService,
    private route: ActivatedRoute,
    private router: Router,
    private _eventStrem: EventStreamService,
    private datePipe: LocalDateFormatPipe,
    private _storageService: StorageService,
    private s3UploadService: AwsS3FileUploadService,
    private lowerCase: LowerCasePipe,
    private jobDetailsService: JobDetailsService,
    private authService: AuthorizationService,
    private sortHelper: SortHelperPipe,
    private loaderService: LoaderService,
    private titlecase: TitleCasePipe,
    private userPermissionService: UserPermissionService
  ) {}

  ngOnInit() {
    this.route.parent?.data.subscribe((result:any) => {
      const data = _.cloneDeep(result);
      this.jobResolverData = result?.jobResolvedData;
      if(data?.jobResolvedData){
        this.user = JSON.parse(localStorage.getItem('user'));
        this.jobId = this.route.snapshot.params['id'];
        this.user_type = this._storageService.get('user_type');
        this.baseUrl = '/submission-manager';
        this.programDetails = this._storageService.get(StorageKeys.CURRENT_PROGRAM);
        this.showTemplateCode = this.programDetails?.config?.template_code ?? false;
        this.showJobType = this.programDetails?.config?.job_type ?? false;
        this.hideMasterDataTypeName = this.programDetails?.config?.show_only_master_codes ?? false;
        this.allow_pre_identified_candidates = this.programDetails?.config?.job?.allow_pre_identified_candidates ?? false;
        this.hide_ot_exempt = this.authService.authorize('hide_ot_exempt');
        this.Allow_vendor_to_enter_client_bill_rate = this.programDetails?.config?.is_allow_vendor_to_enter_client_bill_rate  ?? false;
        this.isVendorNeutral = this.programDetails?.config?.is_vendor_neutral;
        this.hasReducePermission = this.userPermissionService.hasPermission('edit_approved_job');
        this.getJobDetails(null, data?.jobResolvedData);
        this.getSupportingText();
      }
    });

    this.jobDetailsService.masterDataProgressiveLoader().then(res => {
      this.fdData = res;
      this.masterDataSort();
    });

    this._eventStrem.on(Events.RELOAD_JOB_PRE_IDENTIFIED_TABLE).subscribe((res)=>{
      this.getJobDetails(this.jobId);
    })
  }

  getSupportingText() {
    const performedBy =
      this.user_type?.toUpperCase() !== UsersType.SUPER_ORG ? this.user_type?.toUpperCase() : `${UsersType.CLIENT},${UsersType.MSP}`;
    this.jobService
      .get(
        `/configurator/programs/${
          this._storageService.get(StorageKeys.CURRENT_PROGRAM)?.id
        }/support/support_text?event_slug=view_job&performed_by=${performedBy}`,
      )
      .subscribe({
        next: (data: any) => {
          data.support_text_data
            .find(support => support.event.slug === 'view_job')
            ?.supp_text_actions?.forEach(support => {
              if (support?.description && support?.is_enabled) {
                const slug = support.default_support_text.default_actions.slug;
                this.support_text[slug] = {
                  id: slug,
                  support_text: support?.description,
                  button_text: support?.label,
                  link: support?.url,
                };
              }
            });
        },
        error: err => {
          this.alertService.error(errorHandler(err));
        },
      });
  }

  copyToClipboard() {
    const work_location_str = `${this.work_location?.address_line_1 ? this.work_location?.address_line_1 + "\n" : ""}${this.work_location?.address_line_2 ? this.work_location?.address_line_2 + "\n" : ""}${this.work_location?.city_state_zipcode ? this.work_location?.city_state_zipcode + "\n" : ""}${this.work_location?.country_name ? this.work_location?.country_name + "\n" : ""}`
    document.addEventListener('copy', (e: ClipboardEvent) => {
      e.clipboardData.setData('text/plain', (work_location_str));
      e.preventDefault();
      document.removeEventListener('copy', null);
    });
    document.execCommand('copy');
  }

  reloadDetailsPage(e) {
    this.isShowStatus = false;
    this.jobId = this.route.snapshot.params['id'];
    this.getJobDetails(this.jobId);
  }

  check_SA_User() {
    return this.user_type == 'SUPER_ORG';
  }

  checkVendorUser() {
    return this.user_type == 'SUPER_ORG' || this.user_type == 'VENDOR';
  }

  checkMSPUser() {
    return this.user_type == 'SUPER_ORG' || this.user_type == 'MSP';
  }

  checkrate() {
    return this.ratemodel != null && this.ratemodel != 'BILL_RATE';
  }

  checkMSP1User() {
    return this.user_type == 'SUPER_ORG' || this.user_type == 'MSP' || this.user_type == 'CLIENT';
  }

  get checkClientUser() {
    return this.user_type == 'SUPER_ORG' || this.user_type == 'CLIENT';
  }

  contentViewToggle() {
    this.toggleDescription = !this.toggleDescription;
  }

  openCreateEstimateOpen(isReduceIcon) {
    this.isCreateEstimate = 'visible';
    isReduceIcon ? this.showReduceFlyout = true : this.showReduceFlyout = false;
  }


  closePopup(event) {
    this.isCreateEstimate = 'hidden';
  }

  onCloseSideBar = (value: string) => {
    this.showAccountCode = 'hidden';
  };

  masterDataSort(){
    if(this.fdData && this.jobDetails){
      this.jobDetails?.foundational_data?.forEach(fd => {
        const fd_type = this.fdData?.fd_types.find(x => x.id == fd.id);
        fd.configuration = fd_type?.configuration ?? {};
        fd.ref_order = fd_type?.ref_order ?? 1;
      });
      this.jobDetails.foundational_data = this.sortHelper.transform(this.jobDetails?.foundational_data, 'ref_order');
    }
  }

  findEmptyQualificationColumns(){
    this.qualificationType = this.jobDetails?.qualification_types.map(qual=>{
      const q = qual?.qualifications;
      if(!q)
        return;
      let temp1 = true;
      let temp2 = true;
      for (let i = 0; i < q.length; i++) {
        const element = q?.[i]?.is_required;
        temp1 = temp1 && element;
        temp2 = temp2 && !element;
      }
      return {"required": temp2, "optional": temp1};
    })
  }

  getJobDetails(jobid?: string, jobData?: any) {
    if(jobData) {
      this.patchJobData(jobData);
    } else {
      this.jobService.getJobs(`${jobid}`).subscribe({
        next:(data)=>{
          if(data?.job) {
            if(this.jobResolverData?.job) {
              const { job } = this.jobResolverData;
              job.positions = data?.job?.positions;
              job.min_budget = data?.job?.min_budget;
              job.max_budget = data?.job?.max_budget;
              job.budget_estimate = data?.job?.budget_estimate;
              job.status = data?.job?.status;
            }
            this.patchJobData(data);
          }
        },
        error:(err)=>{
          this.alertService.error(errorHandler(err));
        }
      })
    }
  }

  onUpdateReduceData(data){
    this.modalVisibility = true;
    this.reduceData = data;
    this.onPositionUpdate();
  }

  onPositionUpdate(isPositionUpdate?:boolean){
    if(isPositionUpdate){
      this.loaderService.show();
      this.modalVisibility = false;
      let url = `/job-manager/programs/${this.programDetails?.id}/jobs/${this.jobId}`;
      this.jobService.put(url, this.reduceData).subscribe({
        next: (data: any) => {
          if(data){
            this.getJobDetails(this.jobId);
            this.loaderService.hide();
            this.alertService.success("Positions updated successfully.")
          }
        },
        error: (err) => {
          this.loaderService.hide();
          this.alertService.error(err)
        }
      })
    }
  }
  onCloseModal(){
    this.modalVisibility = false;
  }


  patchJobData(jobData?: any) {
    if (jobData) {
      this.jobDetails = jobData?.job || {};
      this.fetchTimesheetTypes();
      this.masterDataSort();
      this.accountCode = this.jobDetails.account_code_data;
      if (this.accountCode && this.accountCode.fields?.length > 0 && this.accountCode.account_code) {
        this.accountCodeCreationActive = true;
      }
      this.preCandidates = this.jobDetails?.pre_candidates?.map((res)=>{
        return {
          candidate_id: res?.candidate_id,
          pre_id: res?.id,
          id: res?.id,
          vendorName: {
            name: res?.data?.vendor_name,
            id: res?.data?.vendor_id
          },
          ...res.data,
        }
      });
      this.isMaxBudgetCalculation = this.jobDetails?.estimate_budget_type?.toLowerCase() === "max_budget";
      this.ratemodel = this.jobDetails?.rate_model ?? this.ratemodel;
      this.setFoundationCustomFieldsDetails();
      if (this.jobDetails && this.jobDetails?.custom_fields) {
        this.convertCustomFieldToArray();
        this.getCustomFields();
      }
      this.showAllowedExpense = this.jobDetails?.is_expense_allowed_display;
      this.jobStatus = this.jobDetails?.status;
      if(this.jobStatus?.toLowerCase() != JobStatus.SOURCING){
        this.hasReducePermission = false;
      }
      if (!this.jobDetails?.pre_candidates?.length) {
      }
      this.dataLoader = false;//change
      this.jobDetails.description = this.jobDetails?.description;
      const location_data = this.jobDetails?.location;
      const city_name = location_data?.city?.name?.length > 0 ? location_data?.city?.name : location_data?.city_name;
      const state_name = location_data?.state?.name?.length > 0 ? location_data?.state?.name : location_data?.state_name;
      this.work_location.is_data_present = Object.keys(location_data)?.length > 0;
      this.work_location.address_line_1 = location_data?.address_line_1?.length > 0 ? location_data?.address_line_1 : location_data?.address,
      this.work_location.address_line_2 = location_data?.address_line_2,
      this.work_location.city_state_zipcode = `${city_name ? city_name+", " : ""}${state_name ? state_name+" " : ""}${location_data?.zipcode ? location_data?.zipcode : ""}`
      this.work_location.country_name = location_data?.country?.name?.length > 0 ? location_data?.country?.name : location_data?.country_name
        // ?.replace(/(<([^>]+)>)/gi, '') // To replace the HTML direct tags
        // ?.replace(/(&lt;([^&gt;]+)&gt;)/gi, '') // To replace the HTML tags in Entity Name form
        // ?.replace('&lt;strong&gt;', '') // extra in terms of a specific requirement
        // ?.replace('&lt;/strong&gt;', ''); // extra in terms of a specific requirement
    }
  }

  getPreIdentifiedCandidates(ids) {
    if (ids?.length) {
      this.dataLoader = true;
      const url = `${this.baseUrl}/candidates?program_id=${this.localStorage.get(StorageKeys.CURRENT_PROGRAM)?.id}&job_id=${
        this.jobId
      }&ids=${ids.join()}`;
      this.jobService.get(url).subscribe({
        next: (data: any) => {
          this.preCandidates = data.candidates.filter(e => ids.includes(e.id));
          this.dataLoader = false;
        },
        error: err => {
          this.alertService.error('Unable to load the list of pre-identified candidates');
          this.dataLoader = false;
        },
    });
    }
  }

  setFoundationCustomFieldsDetails = (): void => {
    this.foundationCustomFieldsList = [];
    if (this.jobDetails.foundational_data && this.jobDetails.foundational_data.length > 0) {
      this.jobDetails.foundational_data = this.sortHelper.transform(this.jobDetails?.foundational_data, 'ref_order');
      this.jobDetails?.foundational_data?.forEach(fdType => {
        if (fdType?.foundation_data?.length > 0) {
          const customFields = [];
          fdType?.foundation_data?.forEach(fd => {
            if (fd?.custom_fields?.length > 0) {
              customFields.push({
                label: fd?.name,
                customFields: fd.custom_fields,
              });
            }
          });
          if (customFields.length) {
            this.foundationCustomFieldsList.push({
              label: `${fdType?.name} dependent Custom Fields`,
              foundationalData: customFields,
            });
          }
        }
      });
    }
  };

  getCustomFields() {
    this.loadCustomDetails = true;
    const currentProgram = this._storageService.get(StorageKeys.CURRENT_PROGRAM);
    const hierarchyIds = this.jobDetails.hierarchy.map(h => h.id).join(',');
    const url = `/configurator/programs/${currentProgram?.id}/custom-fields?entity_ref=JOBS&active=1&order_by=asc&key=ref_order${
      hierarchyIds ? `&hierarchy_ids=${hierarchyIds}` : ``
    }`;
    this.jobService.get(url).subscribe({
      next: (data: any) => {
        if (data && data.custom_fields.length > 0) {
          this.customFields = data.custom_fields;
          this.updateCustomFieldName();
        }
        this.loadCustomDetails = false;
      },
      error: error => {
        this.loadCustomDetails = false;
      },
    });
  }

  openApprovalModal() {
    this._eventStrem.emit(new EmitEvent(Events.PENDING_APPROVAL_REQUEST, { value: true, data: this.jobDetails }));
  }

  downloadS3Attachment(file: any) {
    if (file && file.name && file.key) {
      this.s3UploadService.downloadS3Attachment(file);
    }
  }

  getFormattedDate(date) {
    return date ? this.datePipe.transform(date || new Date(), '', null, null, true) : date;
  }

  isObject(value) {
    if (value && Object.keys(value?.value)?.length > 0) {
      if (value?.value?.name) {
        return value?.value?.name;
      } else {
        return value?.value;
      }
    } else {
      return value?.value;
    }
  }

  convertCustomFieldToArray() {
    const customFields = Object.entries(this.jobDetails.custom_fields)?.map(e => ({ slug: e[0], value: e[1] }));
    this.jobDetails.custom_fields = customFields;
    this.updateCustomFieldName();
  }

  updateCustomFieldName() {
    if (this.customFields && this.customFields.length > 0 && this.jobDetails?.custom_fields && this.jobDetails?.custom_fields?.length > 0) {
      const custom = [];
      this.customFields?.forEach(c => {
        this.jobDetails?.custom_fields.forEach(jc => {
          if (typeof jc.value === 'object' && Object.keys(jc.value).length === 0) return;
          if (c?.slug === jc?.slug) {
            jc.name = c?.name;
            jc.type = c?.type;
            jc.label = c?.label;
            if(c?.meta_data?.currency) {
              jc.currency = c?.meta_data?.currency;
            }
            if(jc?.type == 'NUMBERS' && c?.meta_data?.show_in_thousands) {
              jc.value = jc.value.toLocaleString('en-US', {minimumFractionDigits: c?.meta_data?.decimal})
            }
            if(jc?.type == 'NUMBERS' && !c?.meta_data?.show_in_thousands && c?.meta_data?.decimal) {
              jc.value = jc.value.toFixed(c?.meta_data?.decimal)
            }
            if (c?.meta_data?.datasource?.options?.length) {
              if (Array.isArray(jc?.value)) {
                const val = [];
                jc?.value?.forEach((res) => {
                  c?.meta_data?.datasource?.options?.forEach(custom_field_data => {
                    if (res === custom_field_data?.value || res === custom_field_data?.label) {
                      val.push(custom_field_data?.label);
                    }
                  });
                });
                jc.value = val;
              } else if (typeof jc?.value === 'string') {
                jc.value = c?.meta_data?.datasource?.options?.find(x => x.value == jc.value)?.label;
              }
            }

            // V2M-9453
            if(c?.type == 'SOURCE' && jc.value) {
              this.loadCustomDetails = true;
              let url = c.api_url
              url = url.includes('?') ? url += `&user_ids=${jc.value}` : url += `&user_ids=${jc.value}`
              this.jobService.get(url).subscribe({
                next: (data: any) => {
                  jc.value = data?.members[0]?.full_name
                  this.loadCustomDetails = false;
                }, error: (error) => {
                  this.loadCustomDetails = false;
                },
              });
            }

            if(c?.type == "PICKLIST") {
              jc.value = c?.pick_list?.picklist_item?.find((res)=>res?.value == jc?.value)?.label;
            }
            custom.push(jc);
          }
        });
      });
      this.jobDetails.custom_fields = custom;
    }
  }

  isObjectArray(obj : any) {
    return Array.isArray(obj)
  }

  submitCandidate(event): void {
    if (
      !(this.jobStatus === JobStatus.HALTED) ||
      this.jobStatus === JobStatus.HOLD ||
      this.jobStatus === JobStatus.FILLED ||
      this.jobStatus === JobStatus.CLOSED
    ) {
      window.scrollTo(0, 0);
      this.router.navigate([`/candidates/edit/${event.id}`], {
        queryParams: { job: this.jobId, submit: true, returnUrl: encodeURIComponent(this.router.url) },
      });
    } else {
      this.alertService.warn(`Submissions are not allowed for the job!`);
    }
  }

  openPreCandidate(candidate, actionType): void {
    this.isCreateCandidate = 'visible';
    this.editCandidateData = {
      id: candidate?.id,
      email: candidate?.email,
      first_name: candidate?.first_name,
      last_name: candidate?.last_name,
      phone_number: candidate?.phone_number,
      vendorName: candidate?.vendor,
      actionType: actionType,
      iso2_code: candidate?.iso2_code
    };
  }

  openPreDropdown(candidate): void {
    candidate.showPreCanDropdown = !candidate.showPreCanDropdown;
  }

  editCandidate(event) {
    this.getPreIdentifiedCandidates(this.jobDetails.pre_candidates);
  }

  onCreateClose() {
    this.isCreateCandidate = 'hidden';
    this.editCandidateData = {};
  }

  onAccountCodeSideBarClose = (value: AccountCodeData) => {
    this.showAccountCode = 'hidden';
  };

  isSubmitCandidateDisabled() {
    return (
      this.lowerCase.transform(this.jobStatus) === JobStatus.HALTED ||
      this.lowerCase.transform(this.jobStatus) == JobStatus.HOLD ||
      this.lowerCase.transform(this.jobStatus) === JobStatus.FILLED ||
      this.lowerCase.transform(this.jobStatus) === JobStatus.CLOSED
    );
  }

  get hideRateAuthority() {
    return this.jobService.rateAuthority();
  }

  showRatesPerRateModel(key) {
    if (this.user_type?.toUpperCase() != UsersType.VENDOR) return true;
    if (key == 'bill') return false;
    else if (key == 'pay') return true;
  }

  detailCollapse(value){
    this.detailedValue = value;
  }

  fetchTimesheetTypes() {
    this.jobDetailsService
      .getTimeSheetTypes(this.programDetails?.id, this.jobDetails?.hierarchy?.[0]?.id, this.jobDetails?.location?.id, this.jobDetailsService.getUOMType(this.jobDetails?.unit_of_measure))
      .subscribe({
        next: (response: any) => {
          this.timeSheetType = response?.data?.config?.filter(res => res?.value == this.jobDetails?.timesheet_type)?.[0]?.label;
        },
      });
  }
    getJobTypePicklist(){
      let url=`/configurator/programs/${this.programDetails?.id}/picklists/*/items?picklist_slug=job_type&is_enabled=true&order_by=asc`
      this.jobDetailsService.get(url).subscribe({
        next:(data:any)=>this.jobType= data?.picklist_items?.filter((val)=>val?.value=== this.jobDetails?.job_type?.[0])?.[0]?.label,
        error:(err:any)=>this.jobType= this.titlecase.transform(this.jobDetails?.job_type?.[0]),
      })
    }
}
