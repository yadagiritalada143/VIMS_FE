import { Component, OnInit, Input, ViewChild, Output, EventEmitter, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CandidateService } from 'src/app/candidates/service/candidate.service';
import { EventStreamService, Events } from 'src/app/core/services/event-stream.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { SvmsDatepickerComponent } from 'src/app/shared/components/svms-datepicker/svms-datepicker.component';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { UserService } from 'src/app/core/services/user.service';
import { VendorService } from 'src/app/program-setup/vendor/vendor.service';
import { AssignmentService } from '../../assignment.service';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { Subscription } from 'rxjs';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { getDateFromString } from 'src/app/shared/util/date.util';
import { Log , LOG_TYPE } from 'src/app/library/logs/logs.model';
import { UserType } from 'src/app/expense/enums/expense.enums';
import { VendorType } from '../../enums/vendor-type';
import { CryptoService } from 'src/app/core/services/crypto.service';
@Component({
  selector: 'app-candidate-profile',
  templateUrl: './candidate-profile.component.html',
  styleUrls: ['./candidate-profile.component.scss']
})
export class CandidateProfileComponent implements OnInit, OnDestroy {
  @ViewChild('workerstartDate') workerstartDate: SvmsDatepickerComponent;

  showSkelton: boolean = false;
  public showDOB : Boolean = false;
  candidateData: any;
  candidateId: any;
  jobId: any;
  assignmentDetails: any;
  socialIcons: any = [];
  submitted: boolean = false;
  isWelcomeEmail: boolean = false;
  isVendor: boolean = false;
  isSendEmailFlag: boolean = false;
  isAccountActivated: any = undefined;
  assignmentid: any;
  programDetails: any;
  programId: any;
  candidateAddress: any;
  workerData: any;
  assignmentData: any = {};
  isUpdateAssignment = false
  workerId: any;
  workerDetailsData: any;
  dateFormat = 'dd/MM/yyyy';
  logs: Log= undefined;
  user_type: string;
  isdaas: boolean = false;
  hideEmailButton: boolean = false;
  vendor_details:any ;
  @Input() isEditDetails: boolean = false;
  @Input('vendorDetail') set vendorDetail(value:any) {
      if(value) {
        this.vendor_details = value;
      }
  }
  @Input('isClear') set isClear(value :any)
  {
    if(value)
    this.logs = undefined;
  }
  @Output() WorkerDetail = new EventEmitter();
  getDateFromString = getDateFromString;
  public workerDetailsForm: UntypedFormGroup;
  private subscrptions: Subscription[] = [];
  worker_classification_options: any=[];
  support_text:any = {};
  ssoIdDetails:any = {} ;
  socialprofile_icons = {
    "facebook": '../../../../assets/images/facebook-icon.svg',
    'linkedin': '../../../../assets/images/linkedin.svg',
    'skype': '../../../../assets/images/skype-icon.svg',
    'git': '../../../../assets/images/github-icon.svg',
    'instagram': '../../../../assets/images/instagram-icon.svg'
  }
  hideEyeIcon:boolean = true;
  customFields = [];
  workerClassificationObj:any = {};
  candidateFullname:any;

  constructor(
    private alert: AlertService,
    private candidateService: CandidateService,
    private _loader: LoaderService,
    public storageService: StorageService,
    private eventStream: EventStreamService,
    public router: Router,
    private fb: UntypedFormBuilder,
    private userService: UserService,
    public activatedRoute: ActivatedRoute,
    private vendorService: VendorService,
    private loaderService: LoaderService,
    private assignmentService: AssignmentService,
    private cryptoService: CryptoService,
    private datePipe: LocalDateFormatPipe) { }

  emailValidator(control) {
    if (control.value) {
      const matches = control.value.match(/[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/);
      return matches ? null : { 'invalidEmail': true };
    } else {
      return null;
    }
  }

  get workerDetailsFormControl() {
    return this.workerDetailsForm.controls;
  }
  ngOnInit(): void {
    this.isdaas = false;
    this.getWorkerClassificationPicklist();
    this.workerDetailsForm = this.fb.group({
      username: [''],
      source_type: ['', Validators.required],
      official_email: ['', [Validators.required, Validators.email]],
      sso_id: [''],
      source_id: [''],
      classification: [],
      original_start_date: ['', Validators.required],
      erp_external_id: ['']
    });
    this.assignmentid = this.activatedRoute.snapshot.params.id;
    this.programDetails = this.storageService.get('CurrentProgram');
    this.programId = this.programDetails['id'];
    this.dateFormat = this.assignmentService.getDefaultDateFormat();
    this.user_type = this.storageService.get(StorageKeys.USER_TYPE)?.toLowerCase();
    this.subscrptions.push(this.eventStream.on(Events.ASSIGNMENT_SIDEBAR_VIEW).subscribe((data) => {
      if (data?.value) {
        this.assignmentid = data?.assignmentId || this.assignmentid;
        this.candidateData = data?.value?.worker?.candidate;
        this.socialIcons = this.candidateData?.social_profiles;
        this.candidateAddress = this.candidateData?.addresses;
        this.assignmentDetails = data?.value;
        this.updateDsaasValue();
        const original_start_date = this.datePipe.transform(getDateFromString(data?.value?.worker?.original_start_date), this.dateFormat, undefined, undefined, true);
        const current_allocated_worker_tenure_start_date = this.datePipe.transform(getDateFromString(data?.value?.worker?.current_allocated_worker_tenure_start_date), this.dateFormat, undefined, undefined, true);
        this.workerData = {... data?.value?.worker, original_start_date:original_start_date, current_allocated_worker_tenure_start_date: current_allocated_worker_tenure_start_date };
        this.updateFormValues(this.workerData);
        this.workerId = this.workerData?.id;
        this.workerSourceTypeChanged(this.workerData?.source_type, false);
        this.changeWorkerClassificationName();
        this.assignmentData.template_name = data?.value?.assignment?.assignment_title?.name;
        this.assignmentData.job_id = data?.value?.assignment?.code;
        this.candidateFullname = (this.candidateData?.name_prefix ? this.candidateData?.name_prefix : '') +" "+(this.toTitleCase(this.candidateData?.name)) + " " +(this.candidateData?.name_suffix ? this.candidateData?.name_suffix : '');
        if (this.assignmentDetails) {
          this.checkSendEmail(this.assignmentDetails?.worker?.user?.id);
        }
        if (this.workerData?.candidate?.custom_fields) {
          this.getAllCustomFields();
        }
      } else if (data?.candidateId) {
        this.candidateId = data.candidateId;
        this.checkSendEmail(this.assignmentDetails?.worker?.user?.id);
        this.init();
      }
    }));
    const user_permission = this.storageService.get(StorageKeys.USER_PERMISSION);
    if (user_permission?.includes('hide_pii_flag')) {
      this.hideEyeIcon = false;
    }
  }

  updateFormValues(workerData : any) {
    if (workerData?.user && workerData?.user?.first_name && workerData?.user?.last_name) {
    this.workerDetailsForm.addControl('member_first_name' , new UntypedFormControl('' , Validators.required));
    this.workerDetailsForm.addControl('member_last_name' , new UntypedFormControl('' , Validators.required));
    }
  }
  updateDsaasValue() {
    // this.isdaas = this.assignmentDetails?.assignment?.is_dsaas? this.assignmentDetails?.assignment?.is_dsaas && this.user_type?.toLowerCase() === UserType.Vendor?.toLowerCase(): false
    if(this.vendor_details && (this.vendor_details?.vendor_type?.toLowerCase() === VendorType.Payrolled ||  this.vendor_details?.vendor_type?.toLowerCase() === VendorType.Both)&& this.assignmentDetails?.assignment?.is_dsaas &&  this.user_type?.toLowerCase() === UserType.Vendor?.toLowerCase()) {
      this.isdaas = true;
     }
     if(this.vendor_details && (this.vendor_details?.vendor_type?.toLowerCase() === VendorType.DirectSourcing )&& this.assignmentDetails?.assignment?.is_dsaas &&  this.user_type?.toLowerCase() === UserType.Vendor?.toLowerCase()) {
      this.hideEmailButton = true;
     }
  }

  toTitleCase(str) {
    if (!str) {
      return;
    }
    return str.replace(
      /\w\S*/g,
      function (txt) {
        return txt?.charAt(0)?.toUpperCase() + txt?.substr(1)?.toLowerCase();
      }
    );
  }

  getAllCustomFields() {
    this.customFields = [];
    const customFieldHttp = this.assignmentService.get(`/configurator/programs/${this.programId}/custom-fields?entity_ref=CANDIDATES`);
    customFieldHttp.subscribe((res:any) => {
      if (res?.custom_fields?.length) {
        /** Commenting as part of BugFix V2M-6541 */
        // for (const [key, value] of Object.entries(this.workerData?.candidate?.custom_fields)) {
        //   const getField = res?.custom_fields?.find(customField => customField?.slug?.toLowerCase() === key?.toLowerCase());
        //   if (getField) {
        //     this.customFields?.push({...getField, value});
        //   }
        // }

        /** Adding as part of BugFix V2M-6541 */
        res?.custom_fields?.forEach(cf => {
          if (Object.keys(this.workerData?.candidate?.custom_fields)?.includes(cf?.slug)) {
            this.customFields?.push({...cf, value: this.workerData?.candidate?.custom_fields?.[cf?.slug]});
          }
        });

        // V2M-6679
        this.customFields?.sort(function (a, b) {
          return ('' + a?.label).localeCompare(b?.label);
        })
      }
    });
  }

  init() {
    if (this.assignmentid && this.programId) {
      this.getAssignmentDetails();
    }
    this.getCandidateDetails(this.candidateId)
  }

  get address() {
    return this.candidateAddress ? this.candidateAddress.find(add => add.type === 'PRIMARY') : null;
  }

  workerSourceTypeChanged = (data, resetValue = true) => {
    if (data === 'migrated_worker_data') {
      this.workerDetailsForm.get('source_id').setValidators([Validators.required]);
    } else {
      this.workerDetailsForm.get('source_id').clearValidators();
    }
    if (resetValue) {
      this.workerDetailsForm.get('source_id').setValue('');
    }
    this.workerDetailsForm.get('source_id').updateValueAndValidity();
  }

  getCandidateDetails(id) {
    id = id ? id : this.candidateData?.id;
    this.subscrptions.push(this.candidateService.getCandidateDetail(id).subscribe({
      next: (data: any) => {
        if (data) {
          this.candidateData = data.candidate;
          this.candidateAddress = this.candidateData?.addresses;
          this.socialIcons = this.candidateData?.social_profiles;
          this.showSkelton = false;
        }
      },
      error: (error) => {
        this.alert.error(error);
        this._loader.hide();
      }
    }));
  }

  getAssignmentDetails() {
    this.loaderService.show();
    let url = `/assignment/programs/${this.programId}/assignment/${this.assignmentid}`;
    this.subscrptions.push(this.vendorService.get(url).subscribe({
      next: (data: any) => {
        if (data?.data) {
          data.data.assignments.worker['worker_original_start_date'] = this.datePipe.transform(getDateFromString(data?.data?.assignments?.worker?.original_start_date), this.dateFormat, undefined, undefined, true);
          this.assignmentDetails = data?.data?.assignments;
          const original_start_date = this.datePipe.transform(getDateFromString(data?.data?.assignments?.worker?.original_start_date), this.dateFormat, undefined, undefined, true);
          const current_allocated_worker_tenure_start_date = this.datePipe.transform(getDateFromString(data?.data?.assignments?.worker?.current_allocated_worker_tenure_start_date), this.dateFormat, undefined, undefined, true);
          this.workerData = { ...data?.data?.assignments?.worker,original_start_date: original_start_date, current_allocated_worker_tenure_start_date: current_allocated_worker_tenure_start_date };
          this.workerId = this.workerData?.id;
          this.workerSourceTypeChanged(this.workerData?.source_type, false);
          this.changeWorkerClassificationName();
          this.assignmentData.template_name = this.assignmentDetails?.assignment?.assignment_title?.name;
          this.assignmentData.job_id = this.assignmentDetails?.assignment?.code || this.assignmentDetails?.assignment?.job_id;
          if (this.assignmentDetails) {
            this.checkSendEmail(this.assignmentDetails?.worker?.user?.id);
          }
        }
        this.loaderService.hide();
      },
      error: () => {
        this.loaderService.hide();
      }
    }));
  }

  getWorkerClassificationPicklist(){
    let programDetails = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    if (programDetails) {
      this.programId = programDetails['id'];
    }
    const url = `/configurator/programs/${this.programId}/picklists/*/items?picklist_slug=worker_classification`;
    this.subscrptions.push(this.userService.get(url).subscribe({
      next: (res: any) => {
        if (res) {
          this.worker_classification_options= res?.picklist_items;
        }
      },
      error: (err) => {}
    }));
  }

  changeWorkerClassificationName() {
    if(this.worker_classification_options && this.worker_classification_options?.length > 0) {
      this.worker_classification_options?.forEach(element => {
        this.workerClassificationObj[element?.value?.toLowerCase()] = element?.label;
      });
    }
  }

  changeDate(date) {
    if (date) {
      let [mm, dd,] = date?.split("-");
      let revdate = `${mm}/${dd}`;
      return revdate
    }
  }
  checkSendEmail(userid) {
    if (!userid) return;
    if(this.assignmentDetails?.assignment?.sourcing_model?.toLowerCase() === 'headcount tracking' ||
    this.assignmentDetails?.assignment?.sourcing_model === 'headcount_track' ) {
      return
    }
    this.subscrptions.push(this.userService.sendWelcomeEmailCheck(userid).subscribe(res => {
      let data: any = res;
      this.getSsoIdConfig(data?.user?.organization_id);
      this.isAccountActivated = data?.user?.is_activated;
    }));
  }

  sendWelcomeEmail() {
    let userid = this.assignmentDetails?.worker?.user?.id;
    this.isWelcomeEmail = true;
    this.subscrptions.push(this.userService.sendWelcomeEmail(userid, this.programId).subscribe({
      next: res => {
        if (res) {
          this.isWelcomeEmail = false;
          this.alert.success("Welcome email successfully sent");
        }
      },
      error: (err) => {
        this.showError(err?.error?.error?.message);
        this.isWelcomeEmail = false;
      }
    }));
  }

  onSubmit() {
    this.loaderService.show();
    this.logs = undefined;
    this.submitted = true;
    if (this.workerDetailsForm.invalid) {
      this.loaderService.hide();
      return;
    } else {
      this.onSave();
    }
  }

  cancelWorkerDetails() {
    this.init();
    this.WorkerDetail.emit(true);
    this.isEditDetails = false;

  }

  convertDateFormat(dateString: string) {
    if (!dateString) {
      return;
    }
    let date, month, year, dateArray, formatArray;
    if (dateString.includes('-')) {
      dateArray = dateString.split('-');
      formatArray = this.dateFormat.split('-');

    } else if (dateString.includes('/')) {
      dateArray = dateString.split('/');
      formatArray = this.dateFormat.split('/');
    }

    if (this.dateFormat.includes('-')) {
      formatArray = this.dateFormat.split('-');

    } else if (this.dateFormat.includes('/')) {
      formatArray = this.dateFormat.split('/');
    }

    for (let index = 0; index < formatArray.length; index++) {
      const abb = formatArray[index];
      if (abb.toLowerCase().includes('mm')) {
        month = dateArray[index];
      } else if (abb.toLowerCase().includes('yy')) {
        year = dateArray[index];
      } else if (abb.toLowerCase().includes('dd')) {
        date = dateArray[index];
      }
    }
    return `${year}-${month}-${date}`
  }

  onSave() {
    this.workerDetailsData = this.workerDetailsForm.value;
    if (this.workerDetailsData?.original_start_date) {
      this.workerDetailsData.original_start_date = this.convertDateFormat(this.workerDetailsForm.get('original_start_date').value);
    }
    if( this.workerData?.user && `${this.workerDetailsData?.member_first_name} ${this.workerDetailsData?.member_last_name}`.toLowerCase() !== this.workerData?.user?.name?.toLowerCase() ) {
      this.workerDetailsData.member_name_change = true ;
    }
    this.workerDetailsData.assignment_uuid = this.assignmentid;
    if (this.programId && this.workerId && this.workerDetailsData) {
      this.subscrptions.push(this.assignmentService.updateWorkerDetails(this.programId, this.workerId, this.workerDetailsData).subscribe({
        next: (data: any) => {
          if (data?.code === 200) {
            this.getAssignmentDetails();
            this.alert.success('Worker data updated successfully!');
            this.isUpdateAssignment = false;
            this.WorkerDetail.emit(true);
            this.isEditDetails = false;
          }
        },
        error: err => {
          this.loaderService.hide()
          if (err?.error?.error?.errors?.length > 0 && err?.error?.error?.errors[0]?.message) {
            this.showError(err);
          } else {
            this.showError(errorHandler(err));
          }
        }
      }));
    }
  }

  snakeCaseToTitle(snakeCaseString) {
    if (!snakeCaseString) {
      return '';
    }

    snakeCaseString = snakeCaseString.toLowerCase().split('_');
    for (let i = 0; i < snakeCaseString.length; i++) {
      snakeCaseString[i] = snakeCaseString[i][0].toUpperCase() + snakeCaseString[i].slice(1);
    }

    return snakeCaseString.join(' ');
  }

  editProfileButton() {
    this.candidateId = this.candidateData?.id;
    if (this.candidateId && 'assignment') {
      this.router.navigate([`candidate-worker/edit/${this.candidateId}`], {
        queryParams: { assignmentId: this.assignmentDetails?.assignment_uuid, reference_page: 'assignment' },
      });
    } else {
      this.router.navigate([`candidate-worker/edit/${this.candidateId}`]);
    }
  }


  downloadAttachment(data) {
    data = this.cryptoService?.decrypt(data);
    var link = document.createElement('a');
    if (data) {
      link.href = data;
    }
    else {
      this.alert.error('Resume Not Found.', {});
    }
    link.dispatchEvent(new MouseEvent('click'));
  }
  ngOnDestroy(): void {
    this.subscrptions?.forEach(sub => sub.unsubscribe());
  }
  showError(err){
    this.logs = {
      type: LOG_TYPE.ERROR, heading: err?.error?.error?.message ? err?.error?.error?.message : (typeof err == 'string' ? err : ''), messages: [], autoClose: true, isShown: true, showReportButton: (err?.status == 500 || err?.status == 400), additionalInfo:{trace_id: err?.error?.trace_id }
    };
      err?.error?.error?.errors?.forEach(msg => {
        if (msg?.message) {
          this.logs.messages.push(msg?.message);
        }
      });
  }
  getSsoIdConfig(worker_org) {
    this.assignmentService.getSsoIdConfig(worker_org).subscribe({next : (res:any) => {
      if(res) {
        this.ssoIdDetails['show_ssoId']= res?.worker_sso_update_allowed;
      }
    } , error : (err) => {
    }})
  }
  checkSsoIdValid(event) {
    this.assignmentService.checkSsoIdValid(event?.target?.value).subscribe({next : (res:any) => {
      if(res) {
        this.ssoIdDetails['is_ssoId_exist']= res?.is_sso_exists;
        if(res.is_sso_exists) {
          this.alert.info('Entered SSO ID has been associated already to other user(s)');
          this.support_text =  {
            support_text: 'Entered SSO ID has been associated already to other user(s)',
            icon: 'info',
            icon_color: 'blue',
            label: 'Information',
            close_icon: true
          };
        } else {
          this.support_text = {}
        }
      }
    } , error : (err) => {
      this.support_text = {}
    }})
  }
  closeSupportText(event) {
    if(event) {
      this.ssoIdDetails['is_ssoId_exist'] = false;
      this.support_text = {};
    }
  }
}
