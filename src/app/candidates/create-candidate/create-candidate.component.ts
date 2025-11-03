import { Component, OnInit, ViewChild, ChangeDetectorRef, ElementRef } from '@angular/core';
import { AbstractControl, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { CandidateService } from '../service/candidate.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { VendorService } from '../../program-setup/vendor/vendor.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { Subject, Subscription, combineLatest } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter } from 'rxjs/operators';
import { SearchAddressComponent } from 'src/app/shared/components/search-address/search-address.component';
import { JobsService } from 'src/app/jobs/jobs.service';
import { Router, ActivatedRoute } from '@angular/router';
import { ConfirmationDialogService } from 'src/app/shared/components/confirmation-dialog/confirmation-dialog.service';
import {
  EventStreamService,
  Events,
  EmitEvent,
} from 'src/app/core/services/event-stream.service';
import { UniqueKeyPipe } from 'src/app/shared/pipe/unique-key.pipe';
import { PhoneUtilityService } from 'src/app/shared/service/utility/phone-utility.service';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { AccessControlService } from 'src/app/core/services/access-control.service';
import { SortHelperPipe } from 'src/app/shared/pipe/sort-helper.pipe';
import { LOG_TYPE, Log } from 'src/app/shared/components/alert/alert.model';
import { Candidate, DuplicateProfile } from 'src/app/shared/components/duplicate-candidates/duplicate-candidates.model';
import moment from 'moment';
import i18next from 'i18next';
import { MasterTalentProfileService } from 'src/app/master-talent-profiles/master-talent-profile.service';
import { CustomFieldsComponent } from 'src/app/library/custom-fields/custom-fields/custom-fields.component';
import { CredentialingService } from 'src/app/shared/service/credentialing.service';

@Component({
  selector: 'app-create-candidate',
  templateUrl: './create-candidate.component.html',
  styleUrls: ['./create-candidate.component.scss']
})
export class CreateCandidateComponent implements OnInit{
  qualification = false;
  advancedProfile = false;
  buttonText = "Advanced Profile";
  saveButtonText = "Create Candidate";
  certifications = false;
  certificationDelete = false;
  credentialsDelete = false;
  specializationDelete = false;
  vaccinationDelete = false;
  skillsDelete = false;
  educationDelete = false;
  credentials = false;
  specialization = false;
  vaccination = false;
  skills = false;
  education = true;
  secondaryemail = false;
  secondaryphone = false;
  secondaryaddress = false;
  isSaveLoader: boolean = false;
  countryLoading: boolean = false;
  public jobListSubject: Subject <any> = new Subject <any> ();
  public jobTitleListSubject: Subject <any> = new Subject <any> ();
  vendorLoading: boolean = false;
  jobLoading: boolean = false;
  jobTitleLoading: boolean = false;
  editAvailabilityData: any;
  addressRespType = "fullAddress";
  emailvalidation = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
  public mobNumberPattern = "^((\\+1-?)|0)?[0-9]{9,10}$";
  public nameValidation = "^[a-zA-Z0-9\\s]+$";
  public preferredRatePattern = "^[0-9]{1,4}(\.[0-9][0-9])?$";
  public allCountryList = [];
  socialProfileArr = [{
    type: null,
    link: 'https://'
  }];
  private subscriptions: Subscription[] = [];
  public phoneFormat = [];
  createCandidates: UntypedFormGroup;
  preferredAvailability: UntypedFormGroup;
  candidatePreference: UntypedFormGroup;
  credentialsArr = [];
  credentialTypeId = '';
  certificationTypeId = '';
  vaccineTypeId = '';
  specialityTypeId = '';
  educationTypeId = '';
  skillTypeId = '';
  certificationsArr = [];
  educationArr = [];
  specialityArr = [];
  vaccinationsArr = [];
  skillsArr = [];
  viewMode = false;
  vendorList: any = {};
  searchString = '';
  public programId: any;
  public currentProgram: any;
  resumeData: { name: '', raw: null };
  candidateResumeData: any;
  candidate_id = Number;
  candidateData;
  social_links: any;
  public preferredlocationData = [];
  loadPreferredlocationData = [];
  profile_image: any;
  public street_custom = [];
  public city_custom = [];
  public state_custom = [];
  public zipcode_custom = [];
  public county_custom = [];
  public country_custom = [];
  public street_1 = [];
  public street_2 = [];
  public selected_socail_apps = [];
  public city = [];
  public state = [];
  public zipcode = [];
  public county = [];
  public country = [];
  public showDuplicateCandidateLoader = false
  public dataLoading = false;
  public totalPages = 12;
  public totalRecords = 10;
  public itemsPerPage: 25;
  public tableLoaded = false;
  public countryShortName: string='US';
  public secondaryCountryShortName: string;
  public input$ = new Subject<string | null>();
  public isSubmited: any;
  usersearchCategory = new Subject<string>();
  public jobCategoryData = [];
  public jobTitleData = [];
  public selectedCategory = '';
  public selectedPreAddress = false;
  public heading = "Create New Candidate";
  public availability_btn = "Set Availability";
  public isCandidateAddress: boolean = false;
  public defaultDateFormat: string = 'MM/DD/YYYY';
  public shortCountry;
  public editCandidateLoaded:boolean=false;
  public candidateRequired;
  public isCountryRequired;
  public isStateIdVisible;
  public jobId;
  public defaultDOBYear = (new Date()).getFullYear();
  avatar: any;
  isUpdatedProfilePic: boolean = false;
  user: any;
  isVendor = false;
  qualificationTypeName;
  returnUrl: string;
  options: any = {
    language: 'English',
    timepicker: true,
    format12h: true,
    range: false,
  };
  logs: Log = undefined;
  mtpLogs: Log = undefined;
  public resumeError:boolean=false;
  public nameError : Array <boolean> = [false,false,false];
  waitVendor=null;
  isEducationRemoved: boolean = false;
  public isDobRequired: boolean = true;
  public isPhoneNoRequired: boolean = true;
  public isResumeRequired: boolean = true;
  public isEducationRequired: boolean = true;
  public isInvalidFileSize: boolean = false;
  customFieldsFormData: any = [];
  isCustomFieldsFormValid: boolean = true;
  public pageNum = 1;
  public prevVendorListArr = [];
  public isVendorLimitExceed: boolean = false;
  public vendorFilterTerm: string = '';
  public isSuperViewUser;
  searchCategoryTerm;
  isFieldsAutoPopulate = false;
  duplicateCandidates: any;
  canViewCredentialing: boolean = false;

  constructor(
    private fb: UntypedFormBuilder,
    private candidateService: CandidateService,
    private alert: AlertService,
    private eventStream: EventStreamService,
    private storageService: StorageService,
    public vendorService: VendorService,
    private _loader: LoaderService,
    public jobService: JobsService,
    public router: Router,
    private changeDetectorRef: ChangeDetectorRef,
    private route: ActivatedRoute,
    private confirmService: ConfirmationDialogService,
    private uniqueKeyPipe: UniqueKeyPipe,
    private phoneUtilService: PhoneUtilityService,
    private datePipe: LocalDateFormatPipe,
    private accessControl: AccessControlService,
    private sortHelperPipe: SortHelperPipe,
    private mtpService: MasterTalentProfileService,
    private credentialingService: CredentialingService,
  ) {

    this.usersearchCategory.pipe(
      debounceTime(500),
      distinctUntilChanged())
      .subscribe(value => {
        if (value) {
          this.searchCategory(value);
        }
      });
  }

  @ViewChild(SearchAddressComponent) googleAddressComponent: SearchAddressComponent;
  @ViewChild('candidateAddress') candidateAddress;
  @ViewChild('preferredLocation') preferredLocation;
  @ViewChild("myInput") myInput: ElementRef;
  @ViewChild('address3') address3;
  @ViewChild('customfields') customfields: CustomFieldsComponent;

  ngOnInit(): void {
    this.router.routeReuseStrategy.shouldReuseRoute=()=>false;
    this.isCandidateAddress = this.storageService.get("CurrentProgram").config?.is_candidate_address;
    this.currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.candidateRequired=this.storageService.get("CurrentProgram").config?.candidate;
    this.defaultDateFormat = this.currentProgram?.defaultDateFormat;
    if(!this.defaultDateFormat)
      this.defaultDateFormat = 'MM/DD/YYYY';
    else
      this.defaultDateFormat = this.defaultDateFormat.toLowerCase();

    this.programId = this.currentProgram?.id;
    this.jobId=this.route?.snapshot?.queryParams['job'];
    if(this.jobId) {
      this.getVendorAssociatedJob();
    }
    else {
      this.getVendorListItems();
    }
    this.isSuperViewUser = !this.accessControl.accessControl();
    if (this.route.snapshot.queryParams['returnUrl']) {
      this.returnUrl = decodeURIComponent(this.route.snapshot.queryParams['returnUrl']);
    }

    this.input$.pipe(debounceTime(600)).subscribe((newTerm) => {
      this.vendorFilterTerm=newTerm;
      if (!this.jobId) {
        this.getVendorListItems(1, newTerm);
      }
    });
    this.candidate_id = this.route.snapshot.params.id;
    this.getAllCountry(true);
    this.showInfo()

    this.isDobRequired = this.candidateRequired?.hasOwnProperty('is_candidate_dob_required') ?  this.candidateRequired?.is_candidate_dob_required : true;
    this.isPhoneNoRequired = this.candidateRequired?.hasOwnProperty('is_candidate_phone_required') ? this.candidateRequired?.is_candidate_phone_required : true;
    this.isResumeRequired = this.storageService.get(StorageKeys.CURRENT_PROGRAM)?.config?.candidate?.is_resume_mandatory;
    this.isEducationRequired = this.candidateRequired?.hasOwnProperty('is_candidate_education_required') ? this.candidateRequired?.is_candidate_education_required : true;
    this.createCandidates = this.fb.group({
      firstname: [null, [Validators.required, Validators.pattern(this.nameValidation), Validators.minLength(1)]],
      middlename: [null, [Validators.pattern(this.nameValidation)]],
      lastname: [null, [Validators.required, Validators.pattern(this.nameValidation), Validators.minLength(1)]],
      prefix: [null, ''],
      suffix: [null, ''],
      title: [null, ''],
      email: [null, [Validators.required, Validators.pattern(this.emailvalidation)]],
      secondaryemail: [null, [Validators.pattern(this.emailvalidation)]],
      phoneFormat: ['US', ''],
      secondary_phoneFormat: ['US', ''],
      phone: [null, this.isPhoneNoRequired ? [Validators.required, Validators.pattern(this.mobNumberPattern)] : [Validators.pattern(this.mobNumberPattern)]],
      phonesecondary: [null, [Validators.pattern(this.mobNumberPattern)]],
      stateid: ['', [Validators.maxLength(3), Validators.minLength(3), Validators.pattern("^[0-9]*$")]],
      country: ['USA'],
      address: [],
      addresssecondary: [],
      vendor_id: [null],
      currency: ['$', ''],
      rate: [null, Validators.pattern(this.preferredRatePattern)],
      preferredlocation: [null, ''],
      temppreferredlocation: [null, ''],
      availability_date: [null],
      period: ['HOURLY', ''],
      category: [],
      categoryobj: [],
      level: [],
      dob: [null, this.isDobRequired ? [Validators.required] : []],
      city_name_primary: [null, this.isCandidateAddress ? [Validators.required] : []],
      county_name_primary: [],
      state_name_primary: [null, this.isCandidateAddress ? [Validators.required] : []],
      country_name_primary: [],
      pinCode_primary: [null, this.isCandidateAddress ? [Validators.required] : []],
      city_name_secondary: [],
      county_name_secondary: [],
      state_name_secondary: [],
      country_name_secondary: [],
      pinCode_secondary: []
    });
    const isVendor = this.storageService.get('user_type') === 'VENDOR';
    if (isVendor) {
      this.isVendor = true;
    } else {
      this.createCandidates.get('vendor_id').setValidators(Validators.required)
    }

    this.isCountryRequired = this.candidateRequired?.is_country_mandatory;
    this.isStateIdVisible = this.currentProgram?.config?.candidate_unique_id_format?.toUpperCase() == 'FF-MM-DD-XXX' || this.currentProgram?.config?.candidate_unique_id_format?.toUpperCase() == 'LL-MM-DD-XXX';
    if(this.isCountryRequired){
      this.createCandidates.get('country').setValidators(Validators.required);
    }
    if(this.isStateIdVisible){
      this.createCandidates.get('stateid').setValidators([Validators.required,Validators.maxLength(3), Validators.minLength(3), Validators.pattern("^[0-9]*$")]);
    }

    this.candidatePreference = this.fb.group({
      'preferred_availability': this.preferredAvailability,
    });
    this.getQualifications();

    const data = { term: '' }
    // this.searchCategory(data);
    this.searchJobTitle(data);
    if (this.candidate_id) {
      this.getCandidateDetails(this.candidate_id);
      this.saveButtonText = 'Update Candidate';
      this.heading = "Update Candidate";
    }
    this.social_links = [
      { "type": "linkedin", "title": "Linked In", "image_path": "/assets/images/linkedin.svg", "disabled": false },
      { "type": "git", "title": "GitHub", "image_path": "/assets/images/github.svg", "disabled": false },
      { "type": "skype", "title": "Skype", "image_path": "/assets/images/skype.svg", "disabled": false },
      { "type": "instagram", "title": "Instagram", "image_path": "/assets/images/instagram.svg", "disabled": false },
      { "type": "facebook", "title": "Facebook", "image_path": "/assets/images/facebook.svg", "disabled": false },
    ];

    if(this.isCandidateAddress) {
      this.createCandidates.get('address').setValidators(Validators.required);
    } else {
      this.createCandidates.clearAsyncValidators();
    }

    if (this.mtpEnabled) this.setUpDuplicateProfileCheck()

    this.subscriptions.push(
      this.jobListSubject
        .asObservable()
        .pipe(debounceTime(800))
        .subscribe(res => {
          this.searchCategory(res);
        })
    )

    this.subscriptions.push(
      this.jobTitleListSubject
        .asObservable()
        .pipe(debounceTime(800))
        .subscribe(res => {
          this.searchJobTitle(res);
        })
    )
    if (this.credentialingService.canViewCredentialing()) this.saveButtonText = i18next.t("candidate_save_n_continue_button_text")
  }

  get mtpEnabled(){
    return this.mtpService.moduleAndFeatureEnabled() && !this.candidate_id
  }


  private setupFormControl(control: AbstractControl) {
    return control.valueChanges.pipe(filter(value=>!!value), filter(value=>control.valid), debounceTime(1000), distinctUntilChanged())
  }

  viewProfile(candidate: Candidate) {
    let vendorId = this.isVendor ? this.storageService.get('ORG_ID'): candidate?.vendor.id;
    this.eventStream.emit(
      new EmitEvent(Events.JOB_DETAIL_SIDEBAR_VIEW, {
        selectedIndex: 0,
        candidateId: candidate.id,
        showOnlyCandidateProfile: true,
        showUseThisProfile: this.shouldGoToSubmissionPage(vendorId),
        job_id: this.route.snapshot.queryParams['job'],
      })
    );
  }
  
  setUpDuplicateProfileCheck(): void {
    const fieldControls = [
      this.setupFormControl(this.createCandidates.get("firstname")),
      this.setupFormControl(this.createCandidates.get("lastname")),
      this.setupFormControl(this.createCandidates.get("email")),
      this.setupFormControl(this.createCandidates.get("phone")),
      this.setupFormControl(this.createCandidates.get("dob")),
    ];
    if (this.isVendor){
      const vendor_id = this.storageService.get('ORG_ID');
      combineLatest(fieldControls).subscribe(([ firstname, lastname, email, phone, dob ]) => (this.duplicateProfileCheck( firstname, lastname, email, phone, dob, vendor_id )))
    }
    else {
      fieldControls.push(this.setupFormControl(this.createCandidates.get("vendor_id")),)
      combineLatest(fieldControls).subscribe(([ firstname, lastname, email, phone, dob, vendor_id ]) => (this.duplicateProfileCheck( firstname, lastname, email, phone, dob, vendor_id )))
    }
    
  }

  duplicateProfileCheck(firstname, lastname, email, phone, dob, vendor_id): void {
    this.showDuplicateCandidateLoader = true
    if (firstname && lastname && email && phone && vendor_id && dob){
      this.duplicateCandidates = []
      const middlename = this.createCandidates.get("middlename").value
      let dobMoment = moment(dob, "MM/DD")
      if (!dobMoment.isValid()){
        const leapYear = moment().isLeapYear();
        dobMoment = moment(`${dob}/${leapYear}`, "MM/DD/YYYY")
      }
      const dateOfBirth = dobMoment.toDate()
      this.candidateService.getDuplicateCandidateProfile(vendor_id, firstname, lastname, middlename, email, dateOfBirth, phone).subscribe({
        next: (data: {duplicate_profiles: DuplicateProfile[];}) => {
          this.showDuplicateCandidateLoader = false
          const profiles = data.duplicate_profiles
          const candidates = profiles.map((profile)=>{
            const candidate = profile.basic_info
            candidate.id = profile.candidate
            return candidate
          })
          this.duplicateCandidates = candidates
        },
        error: (error) => {
          this.showError(error);
        }
      })
    }
  }

  ngOnDestroy(): void {
    this.subscriptions?.forEach(sub => sub.unsubscribe());
  }

  async getAllCountry(isCreate?){
    this._loader.show();
    const url = `/configurator/resources/countries?limit=300`;
    await this.jobService.get(url).toPromise().then(
       (data) => {
         this.allCountryList = data?.countries?.sort((c1, c2) => c1?.name?.localeCompare(c2?.name));
         const account = this.storageService.get(StorageKeys.CURRENT_ACCOUNT);
         if(isCreate && account?.country && Object.keys(account?.country)?.length && !this.candidate_id) {
          this.createCandidates.get('country').setValue(account?.country?.name ?? 'USA');
          this.createCandidates.get('phoneFormat').setValue(account?.country?.iso_code_2 ?? 'US');
          this.countryShortName = account?.country?.iso_code_2 ?? 'US';
         }
         this.phoneLengthValidation();
         this._loader.hide();
       }
     );

   }

  backToPage() {
    if (this.returnUrl) {
      this.router.navigateByUrl(this.returnUrl);
    } else {
      this.router.navigate(['/candidates/list']);
    }
  }

  // selectJobTitles(event) {
  //   this.selectedCategory = event;
  //   let ser = { term: '' }
  //   this.searchJobTitle(ser);
  //   this.createCandidates.patchValue({ title: '' });
  // }

  get isDisabled() {
    if (this.isEducationRequired) {
      return ((this.createCandidates && !this.createCandidates.valid) || (this.createCandidates.valid && !this.resumeData && this.resumeData?.name) || !this.educationArr.length || !this.isCustomFieldsFormValid);
    }
    else {
      return ((this.createCandidates && !this.createCandidates.valid) || (this.createCandidates.valid && !this.resumeData && this.resumeData?.name) || !this.isCustomFieldsFormValid);
    }
  }

  openFile(data) {
    if (data?.url) {
      window.open(data?.url);
    }
  }

  // ToFloat() {
  //   const createcan = this.createCandidates.value;
  //   if (createcan.rate && typeof (createcan.rate === 'number')) {
  //     let rate = createcan?.rate?.toFixed(2);
  //     this.createCandidates.patchValue({ rate: rate })
  //   }
  // }

  // focusMonth() {
  //   if (this.createCandidates.controls.bod.value > 10 && this.createCandidates.get('bod').value < 31) {
  //     this.myInput.nativeElement.focus();
  //   }
  // }

  getCandidateDetails(id) {
    this._loader.show();
    this.candidateService.getCandidateDetail(id).subscribe({
     next: (data: any) => {
        if (data) {
          const candidate = data.candidate;
          this.candidateData = data.candidate;
          let address: any;
          let address_secondary: any;
          candidate.addresses.forEach(element => {
            if (element.type === 'PRIMARY') {
              address = element;
              this.street_1[0] = address['street_1'];
              this.city[0] = address['city'];
              this.zipcode[0] = address['zipcode'];
              this.state[0] = address['state'];
              this.country[0] = address['country'];
              this.county[0] = address['county'];
              this.createCandidates.patchValue({
                'address': this.street_1[0],
                'city_name_primary': this.city[0],
                'county_name_primary': this.county[0],
                'state_name_primary': this.state[0],
                'country_name_primary': this.country[0],
                'pinCode_primary': this.zipcode[0]
              })

            } else if (element.type === 'SECONDARY') {
              address_secondary = element;
              this.street_1[1] = address_secondary['street_1'];
              this.city[1] = address_secondary['city'];
              this.zipcode[1] = address_secondary['zipcode'];
              this.state[1] = address_secondary['state'];
              this.country[1] = address_secondary['country'];
              this.county[1] = address_secondary['county'];
              this.createCandidates.patchValue({
                'addresssecondary': this.street_1[1],
                'city_name_secondary': this.city[1],
                'county_name_secondary': this.county[1],
                'state_name_secondary': this.state[1],
                'country_name_secondary': this.country[1],
                'pinCode_secondary': this.zipcode[1]
              })
            }
          });
          this.createCandidates.patchValue({
            firstname: candidate.first_name,
            middlename: candidate.middle_name,
            lastname: candidate.last_name,
            suffix: candidate.name_suffix,
            prefix: candidate.name_prefix,
            dob: candidate.dob ? this.datePipe.transform(candidate.dob, 'MM/DD', null, null, true ) : null,
            title: candidate?.title,
            email: candidate?.email,
            secondaryemail: candidate?.email_secondary,
            country: address?.country,
            stateid: address?.state_id,
            phone: candidate?.phone_number,
            phonesecondary: candidate?.phone_number_secondary,
            phoneFormat: candidate?.iso2_code ? candidate?.iso2_code : 'US',
            // phoneFormatSecondary: candidate?.phone_isdcode_secondary,
            secondary_phoneFormat: candidate?.iso2_code_secondary ? candidate?.iso2_code_secondary : 'US',
            temppreferredlocation: this.preferredlocationString(candidate.preferences.locations),
            period: candidate.preferences.rate.period,
            currency: candidate.preferences.rate.currency,
            rate: candidate.preferences.rate.amount,
            level: candidate.job_level,
            category: candidate?.job_category?.id,
            availability_date: candidate.preferences.availability_date
          });
          if (this.datePipe.transform(candidate.dob, 'MM/DD') === '02/29') {
            this.defaultDOBYear = this.getLeapYear();
          }
          if (this.vendorList?.vendors?.length > 0) {
            this.createCandidates.patchValue({
              vendor_id: candidate?.vendor?.id,
            });
          }
          else {
            this.waitVendor = candidate?.vendor;
          }
          if (candidate.social_profiles) {
            this.socialProfileArr = candidate.social_profiles;
          }
          if (candidate.preferences.preferred_availability_slots) {
            this.editAvailabilityData = candidate.preferences.preferred_availability_slots;
            if (candidate.preferences.preferred_availability_slots.length > 0)
              this.availability_btn = "Edit Availability";
          }
          const val = address?.country;
          if (this.allCountryList?.length === 0) {
            this.getAllCountry().then(() => {
              for (let i = 0; i < this.allCountryList?.length; i++) {
                if (val === this.allCountryList[i].name) {
                  this.shortCountry = this.allCountryList[i].iso_code_2;
                }
              }
              this.countryShortName = this.shortCountry ? this.shortCountry : 'all';
            })
          }
          else {
            for (let i = 0; i < this.allCountryList?.length; i++) {
              if (val === this.allCountryList[i].name) {
                this.shortCountry = this.allCountryList[i].iso_code_2;
              }
            }
            this.countryShortName = this.shortCountry ? this.shortCountry : 'all';
            this.phoneLengthValidation();
          }
          // this.setCountry();
          // this.createCandidates.patchValue({

          //   address: this.loadAddress(address),
          //   addresssecondary: this.loadAddress(address_secondary)
          // })

          if (candidate?.email_secondary) {
            this.secondaryemail = true;
          }

          if (candidate?.phone_number_secondary) {
            this.secondaryphone = true;
          }

          if (address_secondary?.country) {
            this.secondaryaddress = true;
          }

          this.resumeData = { name: candidate?.resume, raw: null };
          this.avatar = candidate?.avatar;
          if (candidate?.job_category?.id) {
            let jobCatIndex = this.jobCategoryData.findIndex(jbcat => jbcat.uid == candidate?.job_category?.id);
            this.selectedCategory = candidate?.job_category?.id;
            if (jobCatIndex === -1) {
              const _jcurl = `/job-manager/job-catalog/category/${candidate.job_category?.id}`;
              this.jobService.get(_jcurl).subscribe(
                data => {
                  this.jobCategoryData.push(data)
                })
            }
          }
          let ser = { term: '' }
          this.searchJobTitle(ser)
          this.candidateResumeData = { name: candidate?.resume, raw: null, ext: '', resume_url: candidate?.resume_url, time: candidate?.resume_upload_date, size: candidate?.resume_filesize };
          Promise.resolve(true).then(() => {
            if (this.vendorList.vendors && this.vendorList.vendors.length > 0 && (candidate.vendor && candidate.vendor?.id)) {
              let indx = this.vendorList.vendors.findIndex(ven => ven.id === candidate?.vendor.id);
              if (indx === -1) {
                this.vendorList.vendors.push(candidate.vendor);
              }
            }
          }
          );

          if (candidate?.qualifications?.length) {
            candidate.qualifications.filter((can) => {
              if (can.qualification_type) {
                this.getTypeName(can);
                if(this.skillsArr?.length>0) {
                  this.skillsArr = this.sortHelperPipe.transform(this.skillsArr, 'qualification_name');
                }
              }
            })
          }

          if(!candidate?.resume && this.isResumeRequired) {
            this.resumeError = true;
          }

          this.preferredlocationData = candidate?.preferences?.locations;
          this.loadPreferredLocation(this.preferredlocationData);
          this.isSubmited = true;
          this.advancedProfile = !this.advancedProfile;
          if (this.buttonText == 'Advanced Profile') {
            this.buttonText = "Change to Basic Profile";
          } else if (this.buttonText == 'Change to Basic Profile') {
            this.buttonText = 'Advanced Profile'
          }
          if (this.credentialingService.isEnable() && !candidate?.linked_cred_candidate_id)
            this.credentialingService.syncCandidate(candidate?.id).subscribe({
              error: (error: any) => {
                if (this.credentialingService.canViewCredentialing())
                  this.showError(error);
              }
            })
        }
        this.editCandidateLoaded=true;
      },
      error: (error) => {
        this.showError(error);
      }
    });
    this._loader.hide();
  }

  checkValidFileType(file) {
    return file.split('.').pop();
  }

  getTypeName(can) {
    this.qualificationTypeName = can.qualification_name;
    if (can?.qualification_type?.code == 'CERTIFICATION') {
      can['certification_name'] = this.qualificationTypeName;
      delete can.qualification_type;
      this.certifications = true;
      this.certificationsArr.push(can);
    } else if (can?.qualification_type?.code == 'VACCINATION') {
      can['vaccine_name'] = this.qualificationTypeName;
      delete can.qualification_type;
      this.vaccination = true;
      this.vaccinationsArr.push(can);
    } else if (can?.qualification_type?.code == 'CREDENTIAL') {
      can['credential_name'] = this.qualificationTypeName;
      delete can.qualification_type;
      this.credentials = true;
      this.credentialsArr.push(can);
    } else if (can?.qualification_type?.code == 'SPECIALITY') {
      can['speciality_name'] = this.qualificationTypeName;
      delete can.qualification_type;
      this.specialization = true;
      this.specialityArr.push(can);
    } else if (can?.qualification_type?.code == 'EDUCATION') {
      can['education_name'] = this.qualificationTypeName;
      delete can.qualification_type;
      this.education = true;
      this.educationArr.push(can);
    } else if (can?.qualification_type?.code == 'SKILL') {
      can['skill_name'] = this.qualificationTypeName;
      delete can.qualification_type;
      this.skills = true;
      this.skillsArr.push(can);
    }
  }

  openCertifications() {
    this.certifications = !this.certifications;
  }

  openCredentials() {
    this.credentials = !this.credentials;
  }

  openSpecialization() {
    this.specialization = !this.specialization;
  }

  openVaccination() {
    this.vaccination = !this.vaccination;
  }

  openSkills() {
    this.skills = !this.skills;
  }

  openEducation() {
    this.education = !this.education;
  }

  closeQualification(type) {
    switch (type) {
      case 'certification':
        this.certificationDelete = true;
        break;
      case 'credentials':
        this.credentialsDelete = true;
        break;
      case 'specialization':
        this.specializationDelete = true;
        break;
      case 'vaccination':
        this.vaccinationDelete = true;
        break;
      case 'skills':
        this.skillsDelete = true;
        break;
      case 'education':
        this.educationDelete = true;
        break;
    }
  }

  confirmDelete(type) {
    switch (type) {
      case 'certification':
        this.certifications = false;
        this.certificationDelete = false;
        this.certificationsArr = [];
        break;
      case 'credentials':
        this.credentials = false;
        this.credentialsDelete = false;
        this.credentialsArr = [];
        break;
      case 'specialization':
        this.specialization = false;
        this.specializationDelete = false;
        this.specialityArr = [];
        break;
      case 'vaccination':
        this.vaccination = false;
        this.vaccinationDelete = false;
        this.vaccinationsArr = [];
        break;
      case 'skills':
        this.skills = false;
        this.skillsDelete = false;
        this.skillsArr = [];
        break;
      case 'education':
        this.education = false;
        this.educationDelete = false;
        this.educationArr = [];
        break;
    }
    if(!this.educationArr?.length){
      this.isEducationRemoved=true;
    }
  }

  removeDialog(type) {
    switch (type) {
      case 'certification':
        this.certificationDelete = false;
        break;
      case 'credentials':
        this.credentialsDelete = false;
        break;
      case 'specialization':
        this.specializationDelete = false;
        break;
      case 'vaccination':
        this.vaccinationDelete = false;
        break;
      case 'skills':
        this.skillsDelete = false;
        break;
      case 'education':
        this.educationDelete = false;
        break;
    }
  }

  addSecondaryEmail() {
    this.secondaryemail = true;
  }

  deleteSecondaryEmail() {
    this.secondaryemail = false;
  }

  addSecondaryPhone() {
    this.secondaryphone = true;
  }

  deleteSecondaryPhone() {
    this.secondaryphone = false;
  }

  addSecondaryAddress() {
    this.secondaryaddress = true;
  }

  deleteSecondaryAddress() {
    this.secondaryaddress = false;
  }

  getQualifications() {
    this.candidateService.getQualifications(true).subscribe({
      next: (data: any) => {
        if (data) {
          let qualificationArr = data.qualification_types;
          qualificationArr.filter((type) => {
            if (type?.code?.toUpperCase() == 'CERTIFICATION') {
              this.certificationTypeId = type.id;
            } else if (type?.code?.toUpperCase() == 'VACCINATION') {
              this.vaccineTypeId = type.id;
            } else if (type?.code?.toUpperCase() == 'CREDENTIAL') {
              this.credentialTypeId = type.id;
            } else if (type?.code?.toUpperCase() == 'SPECIALITY') {
              this.specialityTypeId = type.id;
            } else if (type?.code?.toUpperCase() == 'EDUCATION') {
              this.educationTypeId = type.id;
            } else if (type?.code?.toUpperCase() == 'SKILL') {
              this.skillTypeId = type.id;
            }
          });
        }
      },
      error: (err) => {
        this.showError(err);
      }
    })
  }

  toggleAdvancedProfile() {
    this.advancedProfile = !this.advancedProfile;
    if (this.buttonText == 'Advanced Profile') {
      this.buttonText = "Change to Basic Profile";
    }
    else if (this.buttonText == 'Change to Basic Profile') {
      this.buttonText = 'Advanced Profile'
    }
  }

  checkSocialApp(val) {
    let socialLink = val.link
    if (socialLink.indexOf("linkedin") >= 0) {
      val.type = "linkedin"
    }
    else if (socialLink.indexOf("facebook") >= 0) {
      val.type = "facebook"
    }
    else if (socialLink.indexOf("git") >= 0) {
      val.type = "git"
    }
    else if (socialLink.indexOf("skype") >= 0) {
      val.type = "skype"
    }
    else if (socialLink.indexOf("instagram") >= 0) {
      val.type = "instagram"
    }
  }

  selectSocialApp(app) {
    let socialType = app.type;
    if (socialType.indexOf("linkedin") >= 0) {
      app.link = "https://linkedin.com/";
    }
    else if (socialType.indexOf("facebook") >= 0) {
      app.link = "https://facebook.com/"
    }
    else if (socialType.indexOf("git") >= 0) {
      app.link = "https://github.com/"
    }
    else if (socialType.indexOf("skype") >= 0) {
      app.link = "https://skype.com/"
    }
    else if (socialType.indexOf("instagram") >= 0) {
      app.link = "https://instagram.com/"
    }
    this.social_links.forEach((currentValue, index) => {
      if (currentValue.type) {
        let indx = this.socialProfileArr.findIndex(social => social.type === currentValue.type);
        if (indx === -1) {
          this.social_links[index].disabled = false;
        }
      }
    });
  }

  addSocialLink() {
    if (this.socialProfileArr && this.socialProfileArr.length > 0) {
      let last: any = this.socialProfileArr[this.socialProfileArr.length - 1];

      if (last.type != null) {
        this.socialProfileArr.push({ type: null, link: null });
      } else {
        // this._alert.error('Please select existing once');
        this.showError('Please select existing once');
      }
      this.socialProfileArr.forEach((currentValue, index) => {
        if (currentValue.type != null) {
          let index = this.social_links.findIndex(social => social.type === currentValue.type);
          if (index != -1) {
            this.social_links[index].disabled = true;
          }
        }
      });

    } else {
      this.socialProfileArr.push({ type: null, link: null });
    }
  }

  getSearchedCategory(value: any) {
    const { term } = value;
    this.jobListSubject.next({term})
  }

  searchCategory(value) {
    const _url = `/job-manager/job-catalog/category?search=` + value?.term;
    this.jobLoading = true;
    this.jobService.getCategory(_url).subscribe(
      data => {
        this.jobLoading = false;
        this.jobCategoryData = data?.results;
      })
  }

  getJobTitle(value, clearTitle?) {
    if(clearTitle) {
      value = {term:""};
      this.jobCategoryData = [];
      this.createCandidates.patchValue({
        category: null
      });
    }
    const {term} = value;
    this.jobTitleListSubject.next({term});
  }

  searchJobTitle(value, isCallFromParsing?) {
    let _url = `/job-manager/job-catalog/job_title?category__uid=${this.selectedCategory}&q=` + value?.term;
    if(isCallFromParsing) {
      _url = "/job-manager/job-catalog/job_title?title="+value?.term;
    }
    this.jobTitleLoading = true;
    this.jobService.getCategory(_url).subscribe(
      data => {
        const categoryData = data?.results;
        categoryData?.forEach(d => {
          d.bindLabel = d?.title;
        });
        this.jobTitleData = categoryData;
        this.jobTitleLoading = false;
        if (isCallFromParsing) {
          this.jobCategoryData = categoryData?.map((res) => {
            return { category_name: res?.category_name, id: res?.category_uid };
          });
          if (this.jobCategoryData?.length == 1) {
            this.createCandidates.patchValue({
              category: this.jobCategoryData[0]?.id
            })
          }
          if(this.jobCategoryData?.length == 0) {
            this.createCandidates.patchValue({
              category: null
            });
            this.searchCategory({term:''});
          }
        }
    })
  }

  deleteSocialLink(index) {
    const del_social = this.socialProfileArr[index];
    this.socialProfileArr.splice(index, 1);
    if (del_social.type) {
      let indx = this.social_links.findIndex(social => social.type === del_social.type);
      if (indx != 'undefined') {
        this.social_links[indx].disabled = false;
      }
    }
  }

  getCustomAddress(place: any){
    let addressValue = place;
    this.street_1[0] = addressValue;
  }

  getCustomSecondaryAddress(place: any) {
    let addressValue = place;
    this.street_1[1] = addressValue;
  }

  getAddress(data) {
    this.street_1[0] = data.street;
    this.city[0] = this.getCity(data.place);
    this.zipcode[0] = this.getPostCode(data.place);
    this.state[0] = this.getState(data.place);
    this.country[0] = this.getCountry(data.place);
    this.county[0] = this.getCounty(data.place);
    this.createCandidates.patchValue({
      'city_name_primary': this.city[0],
      'county_name_primary': this.county[0],
      'state_name_primary': this.state[0],
      'country_name_primary': this.country[0],
      'pinCode_primary': this.zipcode[0]
    })
  }

  getSecondaryAddress(data) {
    this.street_1[1] = data.street;
    this.city[1] = this.getCity(data.place);
    this.zipcode[1] = this.getPostCode(data.place);
    this.state[1] = this.getState(data.place);
    this.country[1] = this.getCountry(data.place);
    this.county[1] = this.getCounty(data.place);
    this.createCandidates.patchValue({
      'city_name_secondary': this.city[1],
      'county_name_secondary': this.county[1],
      'state_name_secondary': this.state[1],
      'country_name_secondary': this.country[1],
      'pinCode_secondary': this.zipcode[1]
    })
  }

  setPreferredLocation(place: object) {
    this.preferredlocationData.push({ street_1: this.getStreet(place), city: this.getCity(place), zipcode: this.getPostCode(place), state: this.getState(place), country: this.getCountry(place) });
    this.loadPreferredLocation(this.preferredlocationData);
    this.selectedPreAddress = true;
    this.changeDetectorRef.detectChanges();
  }

  preAddressUpdate(event) {
    this.selectedPreAddress = event;
    this.changeDetectorRef.detectChanges();
  }

  removePreAddress(i) {
    this.confirmService.confirm('', `Are you sure you want to delete the address?`,
      'Yes', 'No')
      .then((confirmed) => {
        if (confirmed) {
          this.preferredlocationData.splice(i, 1);
          this.loadPreferredLocation(this.preferredlocationData);
        }
      }).catch(() => { })
  }

  loadPreferredLocation(address) {
    let loadaddress = [];
    if (address) {
      address.forEach(element => {
        loadaddress.push(this.loadAddress(element));
      }); 3
    }

    this.loadPreferredlocationData = loadaddress;
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

  getArea(place) {
    const COMPONENT_TEMPLATE = { colloquial_area: 'long_name' };
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

  loadAddress(data) {
    let street1 = (data?.address_line1?.trim() != '' && data?.address_line1 != undefined && data?.address_line1 != null) ? (data?.address_line1 + ' ,') : "";
    const city = (data?.city?.trim() !== '' && data?.city != undefined && data?.city != null) ? (data?.city + ' ,') : "";
    let country = (data?.country?.trim() !== '' && data?.country != undefined && data?.country != null) ? (data?.country + ' ,') : "";
    const zip = (data?.zipcode?.trim() !== '' && data?.zipcode != undefined && data?.zipcode != null) ? data?.zipcode : "";
    const state = (data?.state?.trim() !== '' && data?.state != undefined && data?.state != null) ? (data?.state + ' ,') : "";

    if (country && zip == '') {
      country = country.slice(0, -1);
    }

    if (state == '' && street1 == '' && city == '' && zip == '' && country != '') {
      return '';
    }

    return street1 + city + state + country + zip;
  }

  clearCountry() {
    this.countryShortName = null;
  }

  setCountry(type) {
    let val = (type === 'primary') ? this.createCandidates.get('country').value : this.createCandidates.get('secondarycountry').value;
    let short: any;
    for (let i = 0; i < this.allCountryList.length; i++) {
      if (val === this.allCountryList[i].name) {
        short = this.allCountryList[i].iso_code_2;
      }
    }
    if (val) {
      if (type === 'primary') {
        const pres = this.candidateService.getCountryShorNameAndCode(val, false);
        if (pres) {
          this.countryShortName = short;
          this.createCandidates.get('phoneFormat').setValue(short);
          this.createCandidates.get('secondary_phoneFormat').setValue(short);
          // this.googleAddressComponent?.getPlaceAutocomplete(short); commeting to avoid multiple http calls
          this.phoneLengthValidation();
        }
      } else {
        const res = this.candidateService.getCountryShorNameAndCode(val, false);
        if (res) {
          this.secondaryCountryShortName = short;
          this.createCandidates.get('secondary_phoneFormat').setValue(short);
          this.googleAddressComponent?.getPlaceAutocomplete(this.secondaryCountryShortName);
        }
      }
    }
  }

  editPanel(type, data, index) {

    data['clickedIndex'] = index;
    if (type == 'CERTIFICATION') {
      this.eventStream.emit(new EmitEvent(Events.ADD_CANDIDATE_CERTIFICATION, { obj: data, value: true }));
    } else if (type == 'VACCINATION') {
      this.eventStream.emit(new EmitEvent(Events.ADD_CANDIDATE_VACCINATOIN, { obj: data, value: true }));
    } else if (type == 'CREDENTIAL') {
      this.eventStream.emit(new EmitEvent(Events.ADD_CANDIDATE_CREDENTIAL, { obj: data, value: true }));
    } else if (type == 'SPECIALITY') {
      this.eventStream.emit(new EmitEvent(Events.ADD_CANDIDATE_SPECIALIZATION, { obj: data, value: true }));
    } else if (type == 'EDUCATION') {
      this.eventStream.emit(new EmitEvent(Events.ADD_CANDIDATE_EDUCATION, { obj: data, value: true }));
    } else if (type == 'SKILL') {
      this.eventStream.emit(new EmitEvent(Events.ADD_CANDIDATE_SKILLS, { obj: data, value: true }));
    }
  }

  getCredentialData(data) {
    if (data.isEdit) {
      this.credentialsArr[data.clickedIndex] = data.payload;
    } else {
      this.credentialsArr.push(data.payload);
    }
  }

  getCertificateData(data) {
    if (data.isEdit) {
      this.certificationsArr[data.clickedIndex] = data.payload;
    } else {
      this.certificationsArr.push(data.payload);
    }
  }

  getSpecialityData(data) {
    if (data.isEdit) {
      this.specialityArr[data.clickedIndex] = data.payload;
    } else {
      this.specialityArr.push(data.payload);
    }
  }

  getVaccineData(data) {
    if (data.isEdit) {
      this.vaccinationsArr[data.clickedIndex] = data.payload;
    } else {
      this.vaccinationsArr.push(data.payload);
    }
  }

  getEditAvailability(data) {
    this.editAvailabilityData = data;
  }

  getSkillData(data) {
    if (data.isEdit) {
      this.skillsArr[data.clickedIndex] = data.payload;
    } else {
      this.skillsArr.push(data.payload);
    }
  }

  getEducationData(data) {
    if (data.isEdit) {
      this.educationArr[data.clickedIndex] = data.payload;
      this.isEducationRemoved = false;
    } else {
      this.educationArr.push(data.payload);
      this.isEducationRemoved = false;
    }
  }

  addCredentials(event) {
    if (event) {
      this.eventStream.emit(new EmitEvent(Events.ADD_CANDIDATE_CREDENTIAL, { obj: null, value: true }));
    }
  }

  addCertificate(event) {
    if (event) {
      this.eventStream.emit(new EmitEvent(Events.ADD_CANDIDATE_CERTIFICATION, { obj: null, value: true }))
    }
  }

  addSpecialization(event) {
    if (event) {
      this.eventStream.emit(new EmitEvent(Events.ADD_CANDIDATE_SPECIALIZATION, { obj: null, value: true }))
    }
  }

  addVaccination(event) {
    if (event) {
      this.eventStream.emit(new EmitEvent(Events.ADD_CANDIDATE_VACCINATOIN, { obj: null, value: true }))
    }
  }

  addSkills(event) {
    if (event) {
      this.eventStream.emit(new EmitEvent(Events.ADD_CANDIDATE_SKILLS, { obj: null, value: true }))
    }
  }

  addEducation(event) {
    if (event) {
      this.eventStream.emit(new EmitEvent(Events.ADD_CANDIDATE_EDUCATION, { obj: null, value: true }))
    }
  }

  editAvailabilityBtn(event) {
    if (event) {
      this.eventStream.emit(new EmitEvent(Events.EDIT_AVAILABILITY, { obj: this.editAvailabilityData, value: true }))
    }
  }

  getResumeData(data) {
    this.resumeData = data;
    if (data) {
      if(data?.raw) {
        this.autoFillData(data);
        this.isInvalidFileSize = false;
      } else {
        this.isInvalidFileSize = true;
      }
      this.resumeError = false;
    }
    else{
      if(this.isFieldsAutoPopulate) {
        this.resetFields();
      }
      this.resumeError = true;
    }
  }

  autoFillData(data) {
    this.confirmService.confirm('', 'Do you want to Auto-Fill the Candidate Details from the Resume?',
      'Yes', 'No')
      .then((confirmed) => {
        this.isFieldsAutoPopulate = confirmed;
        if (confirmed) {
          this._loader.show('Extracting Resume Data...');
          let PayLoad;
          PayLoad = {
            file_name: data?.name,
            raw: data?.raw_without_base64,
          }
          this.candidateService.parseCandidateResume(PayLoad, this.programId).subscribe({
            next: (data: any) => {
            if (data) {
              this._loader.show('Re-setting Current Data...');
              this.resetFields();
              this._loader.show('Patching Extracted Resume Data...');
              const candidate = data?.candidate;
              if (candidate.first_name) {
                this.createCandidates.patchValue({ firstname: candidate.first_name });
                this.createCandidates.get('firstname').markAsTouched();
              }
              if (candidate.middle_name) {
                this.createCandidates.patchValue({ middlename: candidate.middle_name });
                this.createCandidates.get('middlename').markAsTouched();
              }
              if (candidate.last_name) {
                this.createCandidates.patchValue({ lastname: candidate.last_name });
                this.createCandidates.get('lastname').markAsTouched();
              }

              if (candidate.email) {
                this.createCandidates.patchValue({ email: candidate.email });
                this.createCandidates.get('email').markAsTouched();
              }

              // need to discuss
              // if(candidate.country) {
              //   this.createCandidates.patchValue({ country: candidate?.country });
              //   this.allCountryList?.forEach((res)=>{
              //     if(res?.name?.toLowerCase() == candidate?.country?.toLowerCase()) {
              //       this.createCandidates.patchValue({
              //       phoneFormat: res?.iso_code_2,
              //       country: res?.name
              //     });
              //     }
              //   })
              // }

              if(candidate.contact_no) {
                candidate.contact_no = candidate?.contact_no?.replace(/\D/g,'');
                this.createCandidates.patchValue({ phone: Number(candidate.contact_no) });
                this.phoneLengthValidation();
                this.createCandidates.get('phone').markAsTouched();
              }

              if(candidate.address) {
                this.createCandidates.patchValue({ address: candidate.address });
                this.createCandidates.get('address').markAsTouched();
              }

              if(candidate.city) {
                this.createCandidates.patchValue({ city_name_primary: candidate.city });
                this.createCandidates.get('city_name_primary').markAsTouched();
              }

              if(candidate.state) {
                this.createCandidates.patchValue({ state_name_primary: candidate.state });
                this.createCandidates.get('state_name_primary').markAsTouched();
              }

              if(candidate.country) {
                this.createCandidates.patchValue({ country_name_primary: candidate.country });
                this.createCandidates.get('country_name_primary').markAsTouched();
              }

              if(candidate.zipcode) {
                this.createCandidates.patchValue({ pinCode_primary: candidate.zipcode });
                this.createCandidates.get('pinCode_primary').markAsTouched();
              }

              if(Array.isArray(candidate?.social_link) && candidate.social_link?.length > 0) {
                this.advancedProfile = true;
                const social_link = [];
                this.socialProfileArr = candidate?.social_link?.map((res)=>{
                  const link_type = res?.name == "github" ? 'git' : res?.name;
                  social_link.push(link_type)
                  return {type:link_type, link: res?.link}
                });
                this.social_links?.forEach((res)=>{
                  if(social_link?.includes(res?.type)) {
                    res.disabled = true;
                  }
                })
              }

              if (candidate.qualifications) {
                candidate.qualifications.forEach(qualification => {
                  if (qualification.qualification_type?.code == "SKILL") {
                    this.skills = true;
                    delete qualification.qualification_type
                    const skill = {
                      qualification_id: qualification.qualification_id,
                      experience_level: '',
                      description: qualification?.description,
                      notes: qualification.notes,
                      files: qualification.files,
                      skill_name: qualification?.name
                    }
                    this.skillsArr.push(skill);
                    this.skillsArr = this.sortHelperPipe.transform(this.skillsArr, 'skill_name');
                  } else if (qualification.qualification_type?.code == "EDUCATION") {
                    this.education = true;
                    delete qualification.qualification_type
                    if(qualification.degree!=''){
                      this.educationArr.push(qualification);
                    }
                  }
                })
              }

              if(candidate.title) {
                this.advancedProfile = true;
                this.createCandidates.patchValue({ title: candidate.title });
                this.searchJobTitle({term: candidate.title}, true);
              }
            }
            const countryShortName = this.countryShortName;
            this.countryShortName = null;
            this.countryShortName = countryShortName;
            this._loader.hide();
          },
          error: (error) => {
            this.showError(error);
            this.isSaveLoader = false;
            this._loader.hide();
          }
        });
        }
      })
  }

  resetFields = () => {
      const candidateValue = this.createCandidates?.value;
      const account = this.storageService.get(StorageKeys.CURRENT_ACCOUNT);
      this.createCandidates.reset();
      this.createCandidates.patchValue({
        secondary_phoneFormat: 'US',
        period: 'HOURLY',
        vendor_id: candidateValue?.vendor_id,
        currency: '$',
        country: account?.country?.name ?? 'USA',
        phoneFormat: account?.country?.iso_code_2 ?? 'US'
      });
      this.socialProfileArr = [{
        type: null,
        link: 'https://'
      }];
      this.social_links?.forEach((res)=> res.disabled = false);
      this.getJobTitle(null,true);
      this.candidateAddress._value = null;
      if(this.preferredLocation) {
        this.preferredLocation._value = null;
      }
      this.skillsArr = [];
      this.educationArr = [];
      this.vaccinationsArr = [];
      this.credentialsArr = [];
      this.certificationsArr = [];
      this.specialityArr = [];
      this.jobCategoryData = [];
      this.editAvailabilityData = [];
      this.certifications = null;
      this.credentials = null;
      this.specialization = null;
      this.vaccination = null;
      this.skills = null;
  }

  getVendorAssociatedJob(){
    if(!this.jobId || this.isVendorLimitExceed){
      return;
    }
    let url=`/job-manager/programs/${this.programId}/job_distribution?job__id=${this.jobId}&page=${this.pageNum}&is_submission_allowed=${true}`;
    this.vendorLoading = true;
    this.jobService.get(url).subscribe({
      next: (data: any) =>{
        this.vendorLoading = false;
        if (data) {
          this.vendorList = data;
          if (this.vendorList?.results && this.vendorList?.results?.length > 0) {
            this.vendorList?.results.forEach(programList => {
              if (programList && programList.vendor) {
                if (!this.vendorList.vendors) {
                  this.vendorList.vendors = new Array();
                }
                programList.vendor.program_vendor = programList.id;
                this.vendorList.vendors.push(programList.vendor);
              }
            });
            this.vendorList.vendors=this.uniqueKeyPipe.transform([...this.prevVendorListArr,...this.vendorList.vendors],'id');
            this.vendorList.vendors?.sort((v1, v2) => v1?.name?.localeCompare(v2?.name));
            this.prevVendorListArr=[...this.vendorList.vendors];
            if(this.vendorList.vendors.length>=data.count){
              this.isVendorLimitExceed=true;
            }
          }
          this.pageNum+=1;
          this.tableLoaded = true;
          this._loader.hide();
        }
      },
      error: (err)=>{
        this.vendorLoading = false;
        this._loader.hide();
        this.showError(err);
      }
    })
  }

  getVendorOptStatus(vendorId){
    let optStatus = null
    this.vendorList?.results?.forEach(res =>{
     if(res?.vendor?.id === vendorId) optStatus =  res?.opt_option;
    })
    return optStatus
  }

  getVendorListItems(pageNo = 1, name = '') {
    let url = `/configurator/programs/${this.programId}/vendors?limit=25&page=${pageNo}`;
    if (name) {
      url += `&name=${name}`
    }
    this.vendorLoading = true;
    this.vendorService.get(url).subscribe({
      next :(data: any) => {
        this.vendorLoading = false;
        if (data) {
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
            if (this.waitVendor) {
              if (!this.vendorList?.vendors?.find((res) => res?.id === this.waitVendor?.id)) {
                this.vendorList.vendors.push(this.waitVendor);
              }
              this.createCandidates.patchValue({
                vendor_id: this.waitVendor?.id
              });
              this.waitVendor = null;
            }
            this.vendorList.vendors?.sort((v1, v2) => v1?.name?.localeCompare(v2?.name));
          }
          const totalPages = Math.ceil(data.total_records / data.items_per_page);
          this.totalPages = totalPages;
          this.totalRecords = data.total_records;
          this.tableLoaded = true;
          this._loader.hide();
        }
      },
      error: (err) => {
        this.vendorLoading = false;
        this._loader.hide();
        this.showError(err);
      }});
  }

  getProfileImage(data) {
    if (data) {
      this.profile_image = data.raw;
    } else {
      this.profile_image = '';
    }
    this.isUpdatedProfilePic = true
  }

  preferredlocationArray(preferredlocation) {
    let preferredlocationArray: any = []
    if (preferredlocation) {
      preferredlocationArray = preferredlocation.split(',');
      return preferredlocationArray;
    } else {
      return preferredlocationArray;
    }
  }

  preferredlocationString(preferredlocationArray) {
    let preferredlocation = ''
    if (preferredlocationArray && preferredlocationArray.length > 0) {
      preferredlocation = preferredlocationArray.join(',');
      return preferredlocation;
    } else {
      return preferredlocation;
    }
  }

  saveCandidate() {
    this.street_custom[0] = this.createCandidates.value.address;
    this.city_custom[0] = this.createCandidates.value.city_name_primary;
    this.zipcode_custom[0] = this.createCandidates.value.pinCode_primary;
    this.state_custom[0] = this.createCandidates.value.state_name_primary;
    this.country_custom[0] = this.createCandidates.value.country_name_primary;
    this.county_custom[0] = this.createCandidates.value.county_name_primary;
    this.street_custom[1] = this.createCandidates.value.addresssecondary;
    this.city_custom[1] = this.createCandidates.value.city_name_secondary;
    this.zipcode_custom[1] = this.createCandidates.value.pinCode_secondary;
    this.state_custom[1] = this.createCandidates.value.state_name_secondary;
    this.country_custom[1] = this.createCandidates.value.country_name_secondary;
    this.county_custom[1] = this.createCandidates.value.county_name_secondary;
    this.isSubmited = true;
    this.isSaveLoader = true;
    this.logs=undefined;
    if(!this.resumeData || !(this.resumeData?.name)){
      this.resumeError = true;
    }
    if (this.isDisabled || this.nameError[0] || this.nameError[1] || this.nameError[2] || this.isInvalidFileSize || !this.isCustomFieldsFormValid) {
      this.showError('Please fill the mandatory field(s).');
      this.isSaveLoader = false;
      return;
    }
    let PayLoad: any;
    const candidateDetails = this.createCandidates.value;
    let vendor_id = '';
    if (this.isVendor) {
      this.user = this.storageService.get('user');
      vendor_id = this.storageService.get('ORG_ID');
    } else {
      vendor_id = candidateDetails?.vendor_id;
    }
    let filterEditAvailabilityData = [];

    if (this.editAvailabilityData && this.editAvailabilityData.length > 0) {
      this.editAvailabilityData?.forEach((currentValue) => {
        // if(currentValue?.schedules?.length>0){
        filterEditAvailabilityData.push(currentValue);
        //}
      });
    }
    if (this.createCandidates.valid) {
          let dob = candidateDetails.dob;
          PayLoad = {
          name_prefix: candidateDetails?.prefix,
          first_name: candidateDetails?.firstname,
          middle_name: candidateDetails?.middlename,
          last_name: candidateDetails?.lastname,
          name_suffix: candidateDetails?.suffix,
          email: candidateDetails?.email,
          email_secondary: candidateDetails?.secondaryemail ? candidateDetails?.secondaryemail : null,
          phone_isdcode: this.allCountryList?.filter(t => t.iso_code_2 == candidateDetails?.phoneFormat)[0]?.isd_code,
          phone_number: candidateDetails?.phone?.toString(),
          iso2_code:candidateDetails?.phoneFormat,
          phone_isdcode_secondary: candidateDetails?.phonesecondary == undefined ? "1" : this.allCountryList?.filter(t => t.iso_code_2 == candidateDetails?.secondary_phoneFormat)[0]?.isd_code,
          iso2_code_secondary:candidateDetails?.phonesecondary ? candidateDetails?.secondary_phoneFormat : null,
          phone_number_secondary: candidateDetails?.phonesecondary?.toString(),
          title: candidateDetails?.title,
          vendor_id: vendor_id,
          program_id: this.programId,
          dob: dob + '/2024',
          job_level: candidateDetails?.level,
          job_category_id: candidateDetails?.category,
          is_enabled: true,
          visa_info: {},
          preferences: {
            rate: {
              currency: candidateDetails.currency,
              amount: Number(candidateDetails.rate),
              period: candidateDetails.period,
            },
            availability_date: candidateDetails?.availability_date,
            availability_slots: (filterEditAvailabilityData.length > 0) ? filterEditAvailabilityData : null,
            locations: this.preferredlocationData ? this.preferredlocationData : []
          },
        };

      if(this.candidate_id) {
        PayLoad.addresses = [
          {
            type: "PRIMARY",
            street_1: this.street_1.length > 0 ? this.street_1[0] : this.street_custom[0],
            city: this.city_custom[0],
            state: this.state_custom[0],
            zipcode: this.zipcode_custom[0],
            country: (this.country && this.country[0]) ? this.country[0] : candidateDetails?.country,
            state_id: candidateDetails?.stateid,
            county: this.county_custom[0]
          },
          {
            type: "SECONDARY",
            street_1: this.street_1.length > 0 ? this.street_1[1] : this.street_custom[1],
            city: this.city_custom[1],
            state: this.state_custom[1],
            zipcode: this.zipcode_custom[1],
            country: this.country_custom[1],
            county: this.county_custom[1]
          }
        ]
      } else {
          PayLoad.addresses = [
          {
            type: "PRIMARY",
            street_1: this.street_1.length > 0 ? this.street_1[0] : this.street_custom[0],
            city: this.city.length > 0 ? this.city[0] : this.city_custom[0],
            state: this.state.length > 0 ? this.state[0] : this.state_custom[0],
            zipcode: (this.zipcode?.length > 0 && this.zipcode?.[0]!=null) ? this.zipcode[0] : this.zipcode_custom[0],
            country: (this.country && this.country[0]) ? this.country[0] : candidateDetails?.country,
            state_id: candidateDetails?.stateid,
            county: this.county.length > 0 ? this.county[0] : this.county_custom[0]
          },
          {
            type: "SECONDARY",
            street_1: this.street_1.length > 0 ? this.street_1[1] : this.street_custom[1],
            city: this.city.length > 0 ? this.city[1] : this.city_custom[1],
            state: this.state.length > 0 ? this.state[1] : this.state_custom[1],
            zipcode: this.zipcode.length > 0 ? this.zipcode[1] : this.zipcode_custom[1],
            country: this.country.length > 0 ? this.country[1] : this.country_custom[1],
            county: this.county.length > 0 ? this.county[1] : this.county_custom[1]
          }
        ]
      }
      if (this.customFieldsFormData && this.customFieldsFormData?.length > 0) {
        let custom_value = [];
        this.customFieldsFormData?.forEach(field => {
          if (field?.values != undefined && field?.values != null) {
            let custom_obj = {};
            custom_obj[field?.ref_column] = field?.values;
            custom_obj['type'] = field?.custom_field_type;
            custom_value.push(custom_obj);
          }
        });
        PayLoad.custom_fields = custom_value;
      }

      PayLoad.qualifications = [...this.certificationsArr, ...this.educationArr, ...this.skillsArr, ...this.credentialsArr, ...this.vaccinationsArr];
      if (this.isUpdatedProfilePic) {
        if (this.profile_image) {
          PayLoad.avatar = this.profile_image;
        } else if (!this.profile_image && this.avatar != '') {
          PayLoad.avatar = null;
        }
      }

      PayLoad.resume = {
        filename: null,
        raw: null
      };

      if (this.resumeData) {
        PayLoad.resume = {
          filename: this.resumeData?.name ? this.resumeData?.name : null,
          raw: this.resumeData?.raw ? this.resumeData?.raw : null,
        };
      }

      if((!this.resumeData || !this.resumeData?.name) && this.isResumeRequired){
        this.showError("Please fill the mandatory field(s).");
        this.isSaveLoader=false;
        return;
      }

      if(PayLoad.resume.raw === null){
        delete PayLoad.resume;
      }

      if (!this.isDobRequired && PayLoad.dob == null) {
        delete PayLoad.dob;
      }

      if (this.socialProfileArr?.length > 0) {
        let socialProfiles = [];
        this.socialProfileArr.forEach(socialProfile => {
          if (socialProfile?.type) {
            socialProfiles.push(socialProfile);
          }
        })
        if (socialProfiles?.length > 0) {
          PayLoad.social_profiles = this.socialProfileArr;
        }
      }

      if (this.candidate_id) {
        this.candidateService.updateCandidate(this.candidate_id, PayLoad).subscribe({
          next: (data: any) => {
          if (data) {
            this.isSaveLoader = false;
            this.alert.success('Candidate Updated successfully.');
            if (this.shouldGoToSubmissionPage(vendor_id)) {
              this.router.navigate(['/candidates/submit-candidate'],
                { queryParams: { jobId: this.route.snapshot.queryParams['job'], type: 'submit', candidateId: data?.id } });
              return;
            } if ((this.route.snapshot.queryParams['reference_page'] == 'available-candidate') && this.route.snapshot.queryParams['job_id']) {
              this.router.navigate([`/jobs/details/job-details/${this.route.snapshot.queryParams['job_id']}/available`]);
              return;
            } if ((this.route.snapshot.queryParams['reference_page'] == 'assignment')) {
              this.router.navigate([`assignment/all-list/all`]);
            } else {
              this.router.navigate(['/candidates/list']);
            }
          }
        },
        error: (error) => {
          this.showError(error);
          this.isSaveLoader = false;
        }});
      } else {
        this.candidateService.saveCandidate(PayLoad).subscribe({
          next: (data: any) => {
          if (data) {
            this.alert.success('Candidate Created successfully.');
            if (this.credentialingService.isEnable()) this.syncAndAskIfAddCredentialing(data)
            if (this.shouldGoToSubmissionPage(vendor_id)) {
              this.router.navigate(['/candidates/submit-candidate'],
                { queryParams: { jobId: this.route.snapshot.queryParams['job'], type: 'submit', candidateId: data?.id } });
            }
            else if((this.route.snapshot.queryParams['submit'] == 'true') && this.route.snapshot.queryParams['job'] && this.getVendorOptStatus(vendor_id) == 'opt_out') {
              this.router.navigate([`/jobs/details/job-details/${this.jobId}/available`]);
              return;
            }
            else {
              this.router.navigate(['/candidates/list']);
            }
          }
        },
        error: (error) => {
          this.showError(error);
          this.isSaveLoader = false;
        }});
      }
    } else {
      this.showError("Please fill the required details properly.");
      this.isSaveLoader = false;
    }
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
            .then((confirmed)=>{
                if (!confirmed) return
                this.router.navigate([`/candidates/candidate/${data?.id}/credentials`])
            })
        },
        error: (error: any) => {
          this.showError(error);
          this.isSaveLoader = false;
        }
        })
  }

  public shouldGoToSubmissionPage(vendorId){
    return (this.route.snapshot.queryParams['submit'] == 'true') && this.route.snapshot.queryParams['job'] && this.getVendorOptStatus(vendorId) === 'opt_in'
  }

  getPrefixSuffixFlag(){
    return this.storageService.get('CurrentProgram')?.config?.hide_suffix_prefix
  }

  showInfo(){
    this.mtpLogs = {
      type: LOG_TYPE.INFO,
      messages: [i18next.t('mtp_info_log_message')],
      autoClose: false,
      isShown: true,
    };
  }

  updatedDate(event){
    this.createCandidates.get("dob").patchValue(event)
  }

  showError(err){
    window.scrollTo(0,0);
    const hideReportButton = err?.error?.error?.do_not_report ? true : false;
    this.logs = {
      type: LOG_TYPE.ERROR,
      heading: err?.error?.error?.message ? err?.error?.error?.message : typeof err == 'string' ? err : '',
      messages: [],
      autoClose: true,
      isShown: true,
      showReportButton: (err?.status == 500 || err?.status == 400) && !hideReportButton,
      additionalInfo:{trace_id: err?.error?.trace_id }
    };
      err?.error?.error?.errors?.forEach(msg => {
        if (msg?.message) {
          this.logs.messages.push(msg?.message);
        }
      });
  }

  nameValidater(pos) {
    let name: any;
    if (pos === 0) {
      name = this.createCandidates.get('firstname').value;
    }
    else if (pos === 1) {
      name = this.createCandidates.get('middlename').value;
    }
    else if (pos === 2) {
      name = this.createCandidates.get('lastname').value;
    }
    if (!name?.length) {
      this.nameError[pos] = false;
      return;
    }
    if (!isNaN(name)) {
      this.nameError[pos] = true;
    }
    else {
      this.nameError[pos] = false;
    }
  }

  deleteSingleQualification(type, index) {
    type = type?.toLowerCase();
    switch (type) {
      case 'certification':
        this.certificationsArr?.splice(index, 1);
        break;
      case 'credentials':
        this.credentialsArr?.splice(index, 1);
        break;
      case 'specialization':
        this.specialityArr?.splice(index, 1);
        break;
      case 'vaccination':
        this.vaccinationsArr?.splice(index, 1);
        break;
      case 'skills':
        this.skillsArr?.splice(index, 1);
        break;
      case 'education':
        this.educationArr?.splice(index, 1);
        break;
    }
  }

  setCustomFieldsFormValue(isCustomFieldsFormValid) {
    this.isCustomFieldsFormValid = isCustomFieldsFormValid;
  }

  customFieldUpdated(event) {
    this.customFieldsFormData = event;
  }

  get vendorListFilter(){
    if(!this.vendorList?.vendors) {
      return [];
    }
    if(!this.jobId || !this.vendorFilterTerm){
      return this.vendorList?.vendors;
    }
    return this.vendorList?.vendors?.filter((res)=>{
      return res?.name?.toLowerCase()?.includes(this.vendorFilterTerm?.toLowerCase());
    });
  }

  phoneLengthValidation() {
    const mobNumberPattern = this.phoneUtilService.phoneLengthValidation(this.createCandidates?.value?.phoneFormat, this.allCountryList);
    this.createCandidates?.get('phone')?.clearValidators();
    this.createCandidates?.get('phone')?.setValidators(this.isPhoneNoRequired ? [Validators.required, Validators.pattern(mobNumberPattern)] : [Validators.pattern(mobNumberPattern)])
    this.createCandidates?.get('phone')?.updateValueAndValidity();
  }

  keyPressNumbers(event) {
    const charCode = (event.which) ? event.which : event.keyCode;
    if ((charCode < 48 || charCode > 57)) {
      event.preventDefault();
      return false;
    } else {
      return true;
    }
  }

  getLeapYear(): number {
    let year = new Date().getFullYear();
    for (var i = 0; i < 4; i++) {
      if ((year - i) % 4 === 0) year -= i;
    }
    return year;
  }

  mapCategoryWithTitle(event) {
    if(event) {
      const isPresent = this.jobCategoryData.find((res) => res?.id == event?.category_uid);
      if (!isPresent) {
        this.jobCategoryData = [{ id: event?.category_uid, category_name: event?.category_name }];
      }
      this.createCandidates.patchValue({
        category: event?.category_uid
      });
    }
  }

  clearJobCategory() {
    this.searchCategoryTerm = "";
  }

  searchCategoryFromTitleDropdown(event) {
    this.searchCategoryTerm = event?.term;
    if(this.jobTitleData?.length == 0) {
      this.searchCategory(event?.term);
    }
  }

  get filterCategory() {
    if(!this.searchCategoryTerm) {
      return this.jobCategoryData;
    }
    const filteredArr = this.jobCategoryData?.filter((res)=>{
      return res?.category_name?.toLowerCase()?.includes(this.searchCategoryTerm);
    });
    return filteredArr;
  }
}
