import { Component, Input, OnInit, Output, EventEmitter, ViewChild, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { AbstractControl, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Subject, Subscription, combineLatest } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, tap } from 'rxjs/operators';
import { StorageService, StorageKeys } from 'src/app/core/services/storage.service';
import { ProgramService } from 'src/app/programs/program.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { SearchAddressComponent } from 'src/app/shared/components/search-address/search-address.component';
import { ResumeUploadComponent } from 'src/app/shared/components/svms-tab-components/resume-upload/resume-upload.component';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { AssignmentService } from '../assignment.service';
import { VendorService } from '../../program-setup/vendor/vendor.service';
import { Log , LOG_TYPE } from 'src/app/library/logs/logs.model'; 
import { PopupService } from 'src/app/shared/service/popup.service';
import { PhoneUtilityService } from 'src/app/shared/service/utility/phone-utility.service';
import { CandidateIDFormatOptions } from 'src/app/shared/enums';
import { Candidate, DuplicateProfile } from 'src/app/shared/components/duplicate-candidates/duplicate-candidates.model';
import { CandidateService } from 'src/app/candidates/service/candidate.service';
import moment from 'moment';
import i18next from 'i18next';
import { MasterTalentProfileService } from 'src/app/master-talent-profiles/master-talent-profile.service';
import { CredentialingService } from 'src/app/shared/service/credentialing.service';
import { ConfirmationDialogService } from 'src/app/shared/components/confirmation-dialog/confirmation-dialog.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-create-candidate1',
  templateUrl: './create-candidate.component.html',
  styleUrls: ['./create-candidate.component.scss']
})
export class CreateCandidateComponent implements OnInit, AfterViewInit {

  @Input() CreateCandidate = 'hidden';
  @Input() selectedVendorSOWAssignment = null;
  @Input() jobType;
  candidateIDFormatOptions = CandidateIDFormatOptions;
  isCustomFormValid : boolean = true;
  isValidResume: boolean = true;
  formTitle = 'Create Candidate';
  baseURL:any;
  candidateForm: UntypedFormGroup;
  addressForm: UntypedFormGroup;
  resumeForm: UntypedFormGroup;
  countryShortName = 'IN'
  public mobNumberPattern = "^((\\+1-?)|0)?[0-9]{9,10}$";
  emailvalidation = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
  selectedIndex = 0;
  vendorList: any = {};
  selectedVendor : any = null;
  currentUser: any = null;
  public candidateFieldRequired : any;
  public programId: any;
  public currentProgram: any;
  public user_type: any;
  public input$ = new Subject<string | null>();
  logs: Log= undefined;
  mtpLogs: Log = {
    type: LOG_TYPE.INFO,
    messages: [
      i18next.t("mtp_info_log_message")
    ],
    autoClose: false,
    isShown: true,
    hideClose: true,
  };
  showDuplicateCandidateLoader = false;
  duplicateCandidates: any;
  @Output() onClose = new EventEmitter();
  @Output() candidateCreated = new EventEmitter();
  @ViewChild(SearchAddressComponent) googleAddressComponent: SearchAddressComponent;

  @ViewChild('address2') address2;
  @ViewChild(ResumeUploadComponent) resumeComponent: ResumeUploadComponent;

  // countryList = [
  //   { img: '../../../assets/images/flag/English (Canada).png', code: '+1' },
  //   { img: '../../../assets/images/flag/us.png', code: '+1' },
  //   { img: '../../../assets/images/flag/हिन्दी.png', code: '+91' }
  // ]
  duplicateEmail: string;
  isDuplicate: boolean = false;
  createCandidateSubcription: Subscription;
  options: any = {
    language: 'English',
    timepicker: true,
    format12h: true,
    range: false,
  };
  allCountryList: any = [] ;
  candidate_unique_id_format: boolean = false;
  create_candidate: string = i18next.t("candidate_create_candidate_button_text")

  constructor(private fb: UntypedFormBuilder,
    private _alert: AlertService,
    private _loader: LoaderService,
    private candidateService: CandidateService,
    private _assignmentService: AssignmentService,
    private changeDetectorRef: ChangeDetectorRef,
    private _programService: ProgramService,
    private _storageService: StorageService,
    public _vendorService: VendorService,
    private popupService: PopupService,
    private phoneUtilService: PhoneUtilityService,
    private mtpService: MasterTalentProfileService,
    private credentialingService: CredentialingService,
    private confirmService: ConfirmationDialogService,
    public route: Router,
  ) { }

  ngOnInit(): void {
    this.currentProgram = this._storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.candidate_unique_id_format = this.currentProgram?.config?.candidate_unique_id_format?.toUpperCase() === CandidateIDFormatOptions?.FFMMDDXXX || this.currentProgram?.config?.candidate_unique_id_format?.toUpperCase() === CandidateIDFormatOptions?.LLMMDDXXX ? true : false ;
    this.candidateFieldRequired = this.currentProgram?.config?.candidate;
    this.programId = this.currentProgram?.id;
    this.user_type = this._storageService.get('user_type')?.toLowerCase();
    this.currentUser = this._storageService.get('account');
    this.baseURL = '/submission-manager';
    this.getVendorListItems();
    this.getAllCountry();
    this.input$.pipe(debounceTime(1000)).subscribe((newTerm) => {
      this.getVendorListItems(1, newTerm);
    });
    this.candidateForm = this.fb.group({
      first_name: [null, [Validators.required]],
      middle_name: [null],
      last_name: [null, [Validators.required]],
      name_prefix: [null,],
      name_suffix: [null],
      dob: [null, this.candidateFieldRequired?.is_candidate_dob_required && this.candidateFieldRequired?.hasOwnProperty('is_candidate_dob_required') ? [Validators.required] : ( !this.candidateFieldRequired?.hasOwnProperty('is_candidate_dob_required')? [Validators.required]:[])],
      stateid: ['', this.candidate_unique_id_format ? [Validators.required ,Validators.maxLength(3), Validators.minLength(3), Validators.pattern("^[0-9]*$")] : [Validators.maxLength(3), Validators.minLength(3), Validators.pattern("^[0-9]*$")]],
      title: [null],
      vendor_id: [null],
      custom_fields: this.fb.group({})
    })
    if(this.user_type !== 'vendor'){
      this.candidateForm?.controls?.vendor_id?.setValidators([Validators.required]);
    }
    this.addressForm = this.fb.group({
      email: [null, [Validators.required, Validators.pattern(this.emailvalidation)]],
      phone_isdcode: [null],
      phone_number: [null,this.candidateFieldRequired?.is_candidate_phone_required && this.candidateFieldRequired?.hasOwnProperty('is_candidate_phone_required') ?  [Validators.pattern(this.mobNumberPattern),Validators.required] : ( !this.candidateFieldRequired?.hasOwnProperty('is_candidate_phone_required')? [Validators.pattern(this.mobNumberPattern),Validators.required]:[Validators.pattern(this.mobNumberPattern)])],
      country: ['USA'],
      addresses: [null,this.currentProgram?.config?.is_candidate_address && this.currentProgram?.config?.hasOwnProperty('is_candidate_address')? [Validators.required] : (!this.currentProgram?.config?.hasOwnProperty('is_candidate_address') ? [Validators.required] : [])],
      city_name_primary: [null, this.currentProgram?.config?.is_candidate_address ? [Validators.required] : []],
      county_name_primary: [null],
      state_name_primary: [null, this.currentProgram?.config?.is_candidate_address ? [Validators.required] : []],
      country_name_primary: [null],
      pinCode_primary: [null, this.currentProgram?.config?.is_candidate_address ? [Validators.required] : []],
    })

    this.resumeForm = this.fb.group({
      raw: [null],
      filename: [null],
    })

    this.addressForm.get('email').valueChanges.pipe(debounceTime(400),
      distinctUntilChanged(),
      tap((text) => {
        let pattern = /^[A-Za-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/;
        let emailpttern;
        emailpttern = pattern.test(text);
        if (emailpttern) {
          this.checkEmail(text.replace('+', '%2B'));
        }
        else { //same email ID do not exists.
        }
      })
    ).subscribe();

    if (this.mtpEnabled) this.setUpDuplicateProfileCheck()
    if (this.credentialingService.canViewCredentialing()) this.create_candidate = i18next.t("candidate_save_n_continue_button_text")
  }


  get mtpEnabled(){
    return this.mtpService.moduleAndFeatureEnabled()
  }

  private setupFormControl(control: AbstractControl) {
    return control.valueChanges.pipe(filter(value=>!!value), filter(value=>control.valid), debounceTime(1000), distinctUntilChanged())
  }
  
  setUpDuplicateProfileCheck(): void {
    const fieldControls = [
      this.setupFormControl(this.candidateForm.get('first_name')),
      this.setupFormControl(this.candidateForm.get('last_name')),
      this.setupFormControl(this.addressForm.get('email')),
      this.setupFormControl(this.addressForm.get('phone_number')),
      this.setupFormControl(this.candidateForm.get('dob')),
    ];
    if (this.user_type !== 'vendor') {
      fieldControls.push(this.setupFormControl(this.candidateForm.get('vendor_id')));
      combineLatest(fieldControls).subscribe(([firstname, lastname, email, phone, dob, vendor_id]) =>
        this.duplicateProfileCheck(firstname, lastname, email, phone, dob, vendor_id),
      );
    } else {
      combineLatest(fieldControls).subscribe(([firstname, lastname, email, phone, dob]) => {
        const vendor_id = this._storageService.get('ORG_ID');
        this.duplicateProfileCheck(firstname, lastname, email, phone, dob, vendor_id);
      });
    }
  }

  duplicateProfileCheck(firstname, lastname, email, phone, dob, vendor_id): void {
    this.showDuplicateCandidateLoader = true;
    if (firstname && lastname && email && phone && vendor_id && dob) {
      this.duplicateCandidates = [];
      const middlename = this.candidateForm.get('middle_name')?.value;
      let dobMoment = moment(dob, 'MM/DD');
      if (!dobMoment.isValid()) {
        const leapYear = moment().isLeapYear();
        dobMoment = moment(`${dob}/${leapYear}`, 'MM/DD/YYYY');
      }
      const dateOfBirth = dobMoment.toDate();
      this.candidateService.getDuplicateCandidateProfile(vendor_id, firstname, lastname, middlename, email, dateOfBirth, phone).subscribe({
        next: (data: { duplicate_profiles: DuplicateProfile[] }) => {
          this.showDuplicateCandidateLoader = false;
          const profiles = data?.duplicate_profiles;
          const candidates = profiles?.map(profile => {
            const candidate = profile?.basic_info;
            candidate.id = profile?.candidate;
            return candidate;
          });
          this.duplicateCandidates = candidates;
        },
        error: error => {
          this.showError(error);
        },
      });
    }
  }

  userThisProfile(candidate: Candidate){
    this.CreateCandidate = 'hidden'
    this.sidebarClose(true);
    this.candidateCreated.emit({ id: candidate?.id, vendor: candidate?.vendor, is_enabled: true, ...candidate })
  }

  checkEmail(value) {
    this._programService.get(`${this.baseURL}/candidates?email=${value}`).subscribe((data: any) => {
      if (data) {
        if (data?.total_records > 0) {
          this._alert.error("Email already in use", {});
          // this.showError("Email already in use");
          this.duplicateEmail = "Email already in use";
          this.isDuplicate = true;
        } else {
          this.duplicateEmail = "";
          this.isDuplicate = false;
          this.popupService.closeAlert('close');
        }
      }
    })
  }

  ngAfterViewInit() {
    this.setCountry()
  }

  sidebarClose(status = false) {
    this.CreateCandidate = 'hidden';
    this.addressForm?.reset();
    // this.addressForm.patchValue({
    //   country: 'USA'
    // })
    // this.setCountry();
    this.resumeForm?.reset();
    this.candidateForm?.reset();
    if (this.selectedVendorSOWAssignment) {
      this.candidateForm?.get('vendor_id')?.setValue(this.selectedVendorSOWAssignment?.vendor?.id);
    }
    if (!status) {
      this.resumeComponent.deleteResume();
    }
    this.resumeComponent.clearExistingResume();
    this.logs = undefined;
    this.onClose.emit(status);
  }

  onTabChnge(event) {
    this.selectedIndex = event
  }

  onContinue() {
    if (this.selectedIndex === 2) {
      return;
    }
    this.selectedIndex = this.selectedIndex + 1
  }

  uploadFiles(event) {
    if (event) {
      this.resumeForm.patchValue({
        filename: event?.name,
        raw: event?.raw
      })
    } else {
      this.resumeForm?.reset();
    }

  }

  setCountry() {
    let val = this.addressForm?.get('country')?.value;
    let short:any;
    for(let i=0;i<this.allCountryList?.length; i++){
      if(val === this.allCountryList[i]?.name){
        short = this.allCountryList[i]?.iso_code_2;
      }
    }
    let pres=this.getCountryShorNameAndCode(val,false);

    if(pres){
      this.countryShortName = short;
      this.addressForm?.get('phone_isdcode')?.setValue(short);
      this.phoneLengthValidation();
    }
    // switch (val) {
    //   case 'CAN':
    //     this.countryShortName = "CA";
    //     this.addressForm.get('phone_isdcode').setValue("+1-c");
    //     break;
    //   case 'USA':
    //     this.countryShortName = "US";
    //     this.addressForm.get('phone_isdcode').setValue("+1-u");
    //     break;
    //   case 'IND':
    //     this.countryShortName = "IN";
    //     this.addressForm.get('phone_isdcode').setValue("+91");
    //     break;
    //   case 'KSA':
    //     this.countryShortName = "SA";
    //     this.addressForm.get('phone_isdcode').setValue("+966");
    //     break;
    //   case 'UAE':
    //     this.countryShortName = "AE";
    //     this.addressForm.get('phone_isdcode').setValue("+971");
    //     break;
    //   case 'QAT':
    //     this.countryShortName = "QA";
    //     this.addressForm.get('phone_isdcode').setValue("+974");
    //     break;
    //   case 'TUR':
    //     this.countryShortName = "TR";
    //     this.addressForm.get('phone_isdcode').setValue("+90");
    //     break;
    //   case 'CHN':
    //     this.countryShortName = "CN";
    //     this.addressForm.get('phone_isdcode').setValue("+86");
    //     break;
    //   case 'DEU':
    //     this.countryShortName = "DE";
    //     this.addressForm.get('phone_isdcode').setValue("+49");
    //     break;
    // }
    // this.address2._value = '';
    this.googleAddressComponent?.getPlaceAutocomplete(this.countryShortName);
    this.changeDetectorRef.detectChanges()
  }

  getCountryShorNameAndCode(country,withflag? :boolean){
    let result:any={};
    let phoneFormat='';
    switch (country) {
    case 'Canada':
      phoneFormat="+12";
      if(withflag){
        phoneFormat="<img src='../../../assets/images/flag/English (Canada).png' width='20px' /> +12";
      }
      result={short_name:"CA",phoneFormat:phoneFormat,country:country}
      break;
    case 'United States':
      phoneFormat="+1";
      if(withflag){
        phoneFormat="<img src='../../../assets/images/flag/us.png' width='20px' /> +1";
      }
      result={short_name:"US",phoneFormat:phoneFormat,country:country}
      break;
    case 'USA':
        phoneFormat="+1";
        if(withflag){
          phoneFormat="<img src='../../../assets/images/flag/us.png' width='20px' /> +1";
        }
        result={short_name:"US",phoneFormat:phoneFormat,country:country}
        break;

    case 'India':
      phoneFormat="+91";
      if(withflag){
        phoneFormat="<img src='../../../assets/images/flag/हिन्दी.png' width='20px' /> +91";
      }
      result={short_name:"IN",phoneFormat:phoneFormat,country:country}
      break;
    }
    return result;
  }

  private markFormGroupTouched(formGroup: UntypedFormGroup) {
    (<any>Object).values(formGroup?.controls).forEach(control => {
      control.markAsTouched();

      if (control.controls) {
        this.markFormGroupTouched(control);
      }
    });
  }
  onSubmit() {
    this.logs = undefined;
    if (!this.candidateForm?.valid || !this.addressForm?.valid || !this.resumeForm?.valid) {
      this.markFormGroupTouched(this.candidateForm)
      // this._alert.error("There is one or more issues on the page. Please review and correct errors prior to resubmitting.");
      this.showError("There is one or more issues on the page. Please review and correct errors prior to resubmitting.");
      return;
    }
    let mobNum = null;
    if( this.user_type === 'vendor')
      this.selectedVendor = {id: this.currentUser?.organization?.id, name: this.currentUser?.full_name, logo_url: null, industries: this.currentUser?.organization?.industries};
    else
      this.selectedVendor = this.vendorList?.vendors?.find(f=>f.id == this.candidateForm.get('vendor_id').value);

    this._loader.show();
    if (this.addressForm.get('phone_number').value !== null && this.addressForm.get('phone_number').value !== undefined && this.addressForm.get('phone_number').value !== '') {
      mobNum = (this.addressForm.get('phone_number').value).toString();
    }
    const temp = {
      first_name: this.candidateForm?.get('first_name')?.value,
      middle_name: this.candidateForm?.get('middle_name')?.value,
      last_name: this.candidateForm?.get('last_name')?.value,
      name_prefix: this.candidateForm?.get('name_prefix')?.value,
      name_suffix: this.candidateForm?.get('name_suffix')?.value,
      dob: this.candidateForm?.get('dob')?.value ? this.candidateForm?.get('dob')?.value + "/1904" : null,
      title: !isNaN(Number(this.candidateForm?.get('title')?.value)) && this.candidateForm?.get('title')?.value ? Number(this.candidateForm?.get('title')?.value): this.candidateForm?.get('title')?.value,
      email: this.addressForm.get('email').value,
      // phone_isdcode: '+' +this.addressForm.get('phone_isdcode').value?.split('-')[0],
      phone_isdcode: '+' +this.allCountryList?.filter(t => t.iso_code_2 == this.addressForm?.get('phone_isdcode')?.value)[0]?.isd_code,
      phone_number: mobNum,
      vendor_id: this.candidateForm.get('vendor_id')?.value ?? this.currentUser?.organization?.id,
      resume: {
        filename: this.resumeForm.get('filename')?.value,
        raw: this.resumeForm.get('raw')?.value,
      },
      addresses: [
        {
          type: "PRIMARY",
          state_id: this.candidateForm.get('stateid')?.value,
          country: this.addressForm.get('country')?.value,
          street_1: this.addressForm.get('addresses')?.value? this.addressForm.get('addresses')?.value : null,
          city : this.addressForm.get('city_name_primary')?.value? this.addressForm.get('city_name_primary')?.value : null,
          county : this.addressForm.get('county_name_primary')?.value? this.addressForm.get('county_name_primary')?.value : null,
          state : this.addressForm.get('state_name_primary')?.value? this.addressForm.get('state_name_primary')?.value : null,
          zipcode : this.addressForm.get('pinCode_primary')?.value? this.addressForm.get('pinCode_primary')?.value : null,
        }
      ],
      program_id: this.programId,
      custom_fields: Object.values(this.candidateForm.get('custom_fields')?.value)
    }
    let customData = [];
    temp?.custom_fields?.forEach(res => {
      if(typeof(res) === 'object' &&  Object.values(Object.values(Object.values(res))[0])[0]) {
        customData.push(Object.values(res)[0]);
      }
    });
    temp.custom_fields = customData;
    if (this.createCandidateSubcription) {
      this.createCandidateSubcription.unsubscribe();
    }

    if(temp?.dob === null && !this.candidateFieldRequired?.is_candidate_dob_required) {
      delete temp.dob;
    }

    this.createCandidateSubcription = this._assignmentService.createCandidate(this.baseURL, temp).subscribe({
      next: (data: any) => {
        let temmpCandidateData = this._storageService.get('candidate_uuid')
        if (temmpCandidateData) {
          temmpCandidateData.push({ id: data.id, ...temp })
        } else {
          temmpCandidateData = [{ id: data.id, ...temp }]
        }
        this._storageService.set('candidate_uuid', temmpCandidateData)
        this._alert.success('Candidate created successfully.')
        this.CreateCandidate = 'hidden'
        this.sidebarClose(data.id);
        this.candidateCreated.emit({ id: data.id, vendor:this.selectedVendor, is_enabled: true, ...temp })
        if (this.credentialingService.isEnable()) this.syncAndAskIfAddCredentialing(data)
        this._loader.hide()
      },
      error: err => {
        this.showError(err);
        this._loader.hide()
      }
    })
  }

  public syncAndAskIfAddCredentialing(data){
        this.credentialingService.syncCandidate(data.id).subscribe({
        next: (_: any) => {
          if (this.credentialingService.canViewCredentialing())
            this.confirmService.confirm(
              i18next.t("credentialing_confirmation_title"), 
              i18next.t("credentialing_confirmation_content"),
              i18next.t("credentialing_confirmation_yes"),
              i18next.t("credentialing_confirmation_no"),
            )
            ?.then((confirmed)=>{
                if (!confirmed) return
                this.route.navigate([`/candidates/candidate/${data?.id}/credentials`])
            })
        },
        error: (error: any) => {
          this.showError(error);
        }
        })
  }
  keyPressNumbers(event) {
    var charCode = (event.which) ? event?.which : event?.keyCode;
    // Only Numbers 0-9
    if ((charCode < 48 || charCode > 57)) {
      event.preventDefault();
      return false;
    } else {
      return true;
    }
  }

  phoneLengthValidation() {
    const mobNumberPattern = this.phoneUtilService?.phoneLengthValidation(this.addressForm?.get('phone_isdcode')?.value, this.allCountryList);
    this.addressForm?.get('phone_number')?.clearValidators();
    this.addressForm?.get('phone_number')?.setValidators([Validators.required, Validators.pattern(mobNumberPattern)])
    this.addressForm?.get('phone_number')?.updateValueAndValidity();
  }

  getVendorListItems(pageNo = 1, name = '') {
    if (name === null)
      return;
    let url = `/configurator/programs/${this.programId}/vendors?limit=25&page=${pageNo}&ordering=organization__name&active=true&exclude_dsaas_vendor=true`;
    if (name) {
      url += `&name=${name}`
    }
    if(this.jobType && this.jobType?.length > 0) {
      url+= `&job_type=${this.jobType?.join(',')}`
    }

    this._vendorService.get(url).subscribe({
      next: data => {
        if (data) {
          if (this.selectedVendorSOWAssignment) {
            if (!this.vendorList.vendors) {
              this.vendorList.vendors = new Array();
            }
            this.vendorList.vendors.push(this.selectedVendorSOWAssignment.vendor);
            this.candidateForm.get('vendor_id').setValue(this.selectedVendorSOWAssignment.vendor.id);
          }
          else {
            this.vendorList = data;
            if (this.vendorList?.program_vendors && this.vendorList?.program_vendors.length > 0) {
              this.vendorList?.program_vendors.forEach(programList => {
                if (programList && programList.vendor) {
                  if (!this.vendorList.vendors) {
                    this.vendorList.vendors = new Array();
                  }
                  if (programList.is_enabled) {
                    programList.vendor.is_enabled = true;
                  } else {
                    programList.vendor.is_enabled = false;
                  }
                  programList.vendor.program_vendor = programList.id;
                  this.vendorList.vendors.push(programList.vendor);
                }
              });
            }
          }
          this._loader.hide();
        }
      },
      error: (err) => {
        this._loader.hide();
        this.showError(errorHandler(err));
      }
    });
  }

  getPrefixSuffixFlag(){
    return this._storageService.get('CurrentProgram')?.config?.hide_suffix_prefix;
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
  async getAllCountry(){
    this._loader.show();
    const url = `/configurator/resources/countries?limit=300`;
    await this._vendorService.get(url).toPromise().then(
      (data: any) => {
        this.allCountryList = data?.countries?.sort((c1, c2) => c1?.name?.localeCompare(c2?.name));
        let countryData = this?._storageService?.get('account')?.country;
        if(countryData) {
          this.setDefaultCountry(countryData);
        }
        this.setCountry()
        this._loader.hide();
      }
    );
  }
  isRequiredField(field: string, isAddreesForm?: boolean) {
    const form_field = isAddreesForm ? this.addressForm?.get(field) : this.candidateForm?.get(field);
    if (!form_field?.validator) {
      return false;
    }
    const validator = form_field?.validator({} as AbstractControl);
    return (validator && validator?.required);
  }

  customFieldUpdated(customForms) {
    if (customForms?.length) {
      for (const customForm of customForms) {
        const { is_required, values, custom_field_slug, custom_field_type , ref_column } = customForm;
        if (!this.candidateForm?.get('custom_fields')?.value?.hasOwnProperty(custom_field_slug)) {
          (<UntypedFormGroup>this.candidateForm?.get('custom_fields'))?.addControl(custom_field_slug, this.fb.control('', is_required ? [Validators.required] : []));
        } else {
          let customDataObject = {};
          customDataObject[ref_column] = values ? values : '';
          customDataObject['type'] = custom_field_type;
          (<UntypedFormGroup>this.candidateForm?.get('custom_fields'))?.get(custom_field_slug)?.setValue(values ? {customDataObject} : '');
        }
      }
    }
  }

  updateToggle($event)  {
    this.isValidResume = $event;
  }
  getFormValidation(value) {
    this.isCustomFormValid = value;
  }

  setDefaultCountry(value){
    if(value) {
     let country = this?.allCountryList?.find((country)=>value?.name?.toLowerCase() === country?.name?.toLowerCase());
     if(country){
      this.addressForm.get('country').setValue(country?.name);
      }
    }
  }

  getAddress(data) {
    this.addressForm.patchValue({
      'city_name_primary': this.getCity(data.place),
      'county_name_primary': this.getCounty(data.place),
      'state_name_primary': this.getState(data.place),
      'country_name_primary': this.getCountry(data.place),
      'pinCode_primary': this.getPostCode(data.place)
    })
  }

  getCity(place) {
    const COMPONENT_TEMPLATE = { locality: 'long_name' };
    const city = this.getAddrComponent(place, COMPONENT_TEMPLATE);
    return city;
  }

  getStreet(place) {
    const COMPONENT_TEMPLATE = { route: 'long_name' };
    const street = this.getAddrComponent(place, COMPONENT_TEMPLATE);
    return street;
  }

  getPostCode(place) {
    const COMPONENT_TEMPLATE = { postal_code: 'long_name' };
    const postCode = this.getAddrComponent(place, COMPONENT_TEMPLATE);
    return postCode;
  }

  getState(place) {
    const COMPONENT_TEMPLATE = { administrative_area_level_1: 'short_name' };
    const state = this.getAddrComponent(place, COMPONENT_TEMPLATE);
    return state;
  }

  getCountry(place) {
    const COMPONENT_TEMPLATE = { country: 'long_name' };
    const country = this.getAddrComponent(place, COMPONENT_TEMPLATE);
    return country;
  }

  getCounty(place) {
    const COMPONENT_TEMPLATE = { administrative_area_level_2: 'long_name'};
    const county = this.getAddrComponent(place, COMPONENT_TEMPLATE);
    return county;
  }

  getAddrComponent(place, componentTemplate) {
    let result;
    for (let i = 0; i < place.address_components.length; i++) {
      const addressType = place.address_components[i].types[0];
      if (componentTemplate[addressType]) {
        result = place.address_components[i][componentTemplate[addressType]];
        return result;
      }
    }
    return;
  }

}
