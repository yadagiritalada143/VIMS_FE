import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AbstractControl, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { debounceTime, distinctUntilChanged, filter } from 'rxjs/operators';
import { Subject, combineLatest } from 'rxjs';
import { JobService } from 'src/app/jobs/job.service';
import { VendorService } from 'src/app/program-setup/vendor/vendor.service';
import { errorHandler } from '../../util/error-handler';
import { PhoneUtilityService } from '../../service/utility/phone-utility.service';
import { EmitEvent, EventStreamService, Events } from 'src/app/core/services/event-stream.service';
import i18next from 'i18next';
import { LOG_TYPE, Log } from '../alert/alert.model';
import moment from 'moment';
import { CandidateService } from 'src/app/candidates/service/candidate.service';
import { DuplicateProfile } from '../duplicate-candidates/duplicate-candidates.model';
import { MasterTalentProfileService } from 'src/app/master-talent-profiles/master-talent-profile.service';
import { ConfirmationDialogService } from '../confirmation-dialog/confirmation-dialog.service';
import { Router } from '@angular/router';
import { CredentialingService } from '../../service/credentialing.service';


@Component({
  selector: 'app-create-pre-identified-candidate',
  templateUrl: './create-pre-identified-candidate.component.html',
  styleUrls: ['./create-pre-identified-candidate.component.scss'],
})
export class CreatePreIdentifiedCandidateComponent implements OnInit {
  createCandidateForm: UntypedFormGroup;
  submitted = false;
  public dataLoading = false;
  public totalPages = 12;
  public totalRecords = 10;
  public itemsPerPage: 25;
  public tableLoaded = false;
  vendorList: any = {};
  public programId: any;
  public currentProgram: any;
  public formTitle: any;
  public btnText = 'Add';
  public searchTerm: any;
  vendorsearch = new Subject<string>();
  emailvalidation = /^[A-Za-z0-9._%+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;
  vendorLoading = false;
  emailExists = false;
  isViewOnly: boolean;
  jobId: string;
  currentEmail: string;
  editUserEmail: string;
  isEditPage;
  candidateData;
  public allCountryList = [];
  logs: Log= undefined;
  mtpLogs: Log = {
    type: LOG_TYPE.INFO,
    messages: [
      i18next.t("mtp_info_log_message")
    ],
    autoClose: false,
    isShown: true,
  };
  showDuplicateCandidateLoader = false;
  duplicateCandidates: any;
  baseUrl: any;
  prefferedfDateFormat;
  countryShortName = 'US';
  nameError : Array <boolean> = [false,false,false];
  nameValidation = "^[a-zA-Z0-9\\s]+$";
  disableFields = false;
  isPreIdCandidateCreation: boolean;
  saveButtonText: string = i18next.t("candidate_save_button_text")
  @Input() isCreateCandidate = 'visible';
  @Input() set isEdit(data) {
    this.initForm();
    if (!data || Object.keys(data).length === 0) {
      this.btnText = 'Add';
      this.formTitle = "Pre-Identified Candidate Info";
      this.createCandidateForm?.patchValue({
        iso2_code: 'US',
        phone_isdcode: '1',
      });
      this.isPreIdCandidateCreation = true;
    } else {
      this.candidateData = data;
      this.isEditPage = true;
      this.btnText = 'Update';
      this.isPreIdCandidateCreation = !data?.is_create_candidate;
      if(this.isPreIdCandidateCreation) {
        this.formTitle = "Pre-Identified Candidate Info";
        if(data?.disableFields) {
          this.disableFields = true;
          this.createCandidateForm?.disable();
        }
      } else {
        this.createCandidateForm.controls['first_name'].disable();
        this.candidateData?.middle_name && this.createCandidateForm.controls['middle_name'].disable();
        this.createCandidateForm.controls['last_name'].disable();
        this.createCandidateForm.get('address').setValidators([Validators.required]);
        this.createCandidateForm.get('country_name').setValidators([Validators.required]);
        this.createCandidateForm.updateValueAndValidity();
        if(this.mtpEnabled) this.setUpDuplicateProfileCheck();
        this.formTitle = "Create Candidate";
      }
      this.editCandidate(data);
    }
  }

  // decorators
  @Input() candidates: any = [];
  @Output() onCreateClose = new EventEmitter();
  @Output() createdCandidate = new EventEmitter();


  constructor(
    private formBuilder: UntypedFormBuilder,
    public jobService: JobService,
    private _loader: LoaderService,
    private _alert: AlertService,
    private candidateService: CandidateService,
    private storageService: StorageService,
    public vendorService: VendorService,
    private phoneUtilService: PhoneUtilityService,
    private eventStream: EventStreamService,
    private mtpService: MasterTalentProfileService,
    private credentialingService: CredentialingService,
    private confirmService: ConfirmationDialogService,
    public router: Router,
  ) { }
  
  get mtpEnabled(){
    return this.mtpService.moduleAndFeatureEnabled() && !this.isViewOnly && !this.isPreIdCandidateCreation
  }

  get f() {
    return this.createCandidateForm.controls;
  }

  ngOnInit(): void {
    this.vendorsearch.pipe(debounceTime(300), distinctUntilChanged()).subscribe((value: any) => {
      this.searchTerm = value?.term;
      this.getVendorListItems();
    });
    this.currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.prefferedfDateFormat = this.currentProgram?.defaultDateFormat?.toUpperCase();
    const account = this.storageService.get(StorageKeys.CURRENT_ACCOUNT);
    if (!this.isEditPage) {
      if (account?.country) {
        this.createCandidateForm.patchValue({
          iso2_code: account?.country?.iso_code_2,
          phone_isdcode: account?.country?.isd_code,
        })
      }
      this.phoneLengthValidation();
    }
    this.jobId = this.storageService.get('viewd_job')?.id;
    this.programId = this.currentProgram?.id;
    this.baseUrl = '/submission-manager';
    this.btnText = 'Add';
    this.getAllCountry();
    this.getVendorListItems();
    if (this.credentialingService.canViewCredentialing() && !this.isPreIdCandidateCreation) this.saveButtonText = i18next.t("candidate_save_n_continue_button_text")
  }
  
  editCandidate(data) {
    this._loader.show();
    // setTimeout(() => {
      this.createCandidateForm.patchValue(data);
      if(this.mtpEnabled) this.runDuplicateCheck()
      this.countryShortName = data?.iso2_code ?? 'US';
      this.phoneLengthValidation();
      this.currentEmail = this.editUserEmail = data?.email;
      // if (this.editFromJob)
      //   if (document.getElementsByClassName('ng-value-label') && document.getElementsByClassName('ng-value-label').length) {
      //     const tempLen = document.getElementsByClassName('ng-value-label').length - 1;
      //     document.getElementsByClassName('ng-value-label')[tempLen]['innerText'] = data.vendorName.name;
      //   }
      this._loader.hide();
    // }, 100);
  }

  saveCandidate(type) {
    this.submitted = true;
    if (this.nameError[0] || this.nameError[1] || this.nameError[2]) {
      return;
    }
    if(!this.isPreIdCandidateCreation) {
      const candidateForm = this.createCandidateForm?.value;
      if(!candidateForm.country_name || !candidateForm.address) {
        return;
      }
    }
    if (this.createCandidateForm.invalid || this.emailExists) {
      return;
    } else if (!this.isPreIdCandidateCreation) {
      this._loader.show();
      const url = `/job-manager/programs/${this.currentProgram?.id}/create-candidate/${this.candidateData?.pre_id}`;
      const payload = {
        data: {
          first_name: this.createCandidateForm.get('first_name').value,
          middle_name: this.createCandidateForm.get('middle_name').value,
          last_name: this.createCandidateForm.get('last_name').value,
          addresses: [
            {
              type: "PRIMARY",
              state_id: this.createCandidateForm.get('state_ID').value,
              country: this.createCandidateForm.get('country_name').value,
              street_1: this.createCandidateForm.get('address').value ? this.createCandidateForm.get('address').value : null,
            }
          ],
          email: this.createCandidateForm.get('email').value,
          phone_number: this.createCandidateForm.get('phone_number').value ? this.createCandidateForm.get('phone_number').value : null,
          iso2_code: this.createCandidateForm.get('iso2_code').value,
          phone_isdcode: this.createCandidateForm.get('phone_isdcode').value,
          vendor_id: this.createCandidateForm.get('vendor_id').value ?? this.createCandidateForm.get('vendorName').value?.id,
          vendor_name: this.createCandidateForm.get('vendorName').value?.name,
          notes: this.candidateData?.notes
        }
      };
      if (this.createCandidateForm.get('date_of_birth')?.value) {
        payload['data']['dob'] = this.createCandidateForm.get('date_of_birth')?.value+"/1904";
      }
      this.jobService.put(url, payload).subscribe({
        next: data => {
          if(this.credentialingService.isEnable()) this.syncAndAskIfAddCredentialing({id: this.candidateData?.pre_id})
          this.eventStream.emit(new EmitEvent(Events.RELOAD_JOB_PRE_IDENTIFIED_TABLE, true));
          this.sidebarClose();
          this._loader.hide();
        },
        error: err => {
          this._alert.error('Unable to update the candidate data');
          this._loader.hide();
        },
      });
    } else {
      this.emitData(type);
    }
  }

  setPreIndentifiedCandidate(candidate){
      const candidate_id = candidate.id
      const url = `/job-manager/programs/${this.currentProgram?.id}/create-candidate/${this.candidateData?.pre_id}`;
      const payload = {
        candidate_id,
        first_name: candidate.first_name,
        middle_name: candidate.middle_name,
        last_name: candidate.last_name,
        addresses: candidate.addresses,
        email: candidate.email,
        phone_number: candidate.phone_number,
        phone_isdcode: candidate.phone_isdcode,
        vendor_id: candidate?.vendor?.id,
        vendor_name: candidate?.vendor?.name,
      };
      this.jobService.put(url, {data: payload}).subscribe({
        next: _ => {
          this.eventStream.emit(new EmitEvent(Events.RELOAD_JOB_PRE_IDENTIFIED_TABLE, true));
          this.sidebarClose();
          this._loader.hide();
        },
        error: err => {
          this._alert.error('Unable to update the candidate data');
        },
      })
  }

  private setupFormControl(control: AbstractControl) {
    return control.valueChanges.pipe(filter(value=>!!value), filter(value=>control.valid), debounceTime(1000), distinctUntilChanged())
  }

  runDuplicateCheck(){
    const firstname = this.createCandidateForm.get("first_name").value
    const lastname = this.createCandidateForm.get("last_name").value
    const vendor_id = this.createCandidateForm.get("vendor_id").value
    const email =  this.createCandidateForm.get("email").value
    const phone =  this.createCandidateForm.get("phone_number").value
    this.duplicateProfileCheck(firstname, lastname, email, phone, vendor_id)
  }

  setUpDuplicateProfileCheck(): void {
    combineLatest([
      // this.setupFormControl(this.createCandidateForm.get("first_name")),
      // this.setupFormControl(this.createCandidateForm.get("last_name")),
      this.setupFormControl(this.createCandidateForm.get("email")),
      this.setupFormControl(this.createCandidateForm.get("phone_number")),
      // this.setupFormControl(this.createCandidateForm.get("vendor_id")),
      this.setupFormControl(this.createCandidateForm.get("date_of_birth")),
    ]).subscribe(([ email, phone, dob ]) => {
      const firstname = this.createCandidateForm.get("first_name").value
      const lastname = this.createCandidateForm.get("last_name").value
      const vendor_id = this.createCandidateForm.get("vendor_id").value
      this.duplicateProfileCheck(firstname, lastname, email, phone, vendor_id, dob)
    })
  }

  duplicateProfileCheck(firstname, lastname, email, phone, vendor_id, dob?): void {
    this.showDuplicateCandidateLoader = true
    if (firstname && lastname && email && phone && vendor_id){
      this.duplicateCandidates = []
      const middlename = this.createCandidateForm.get("middle_name").value
      let dobMoment = undefined
      if(dob){
        dobMoment = moment(dob, "MM/DD")
        if (!dobMoment.isValid()){
          const leapYear = moment().isLeapYear();
          dobMoment = moment(`${dob}/${leapYear}`, "MM/DD/YYYY")
        }
      }
      const dateOfBirth = dobMoment?.toDate()
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
          this._alert.error(error);
        }
      })
    }
  }

  useThisProfile(candidate) {
    this.setPreIndentifiedCandidate(candidate)
    if (!this.isPreIdCandidateCreation) {
      this.emitData('save', candidate);
      this.sidebarClose();
    }
   }

  emitData(type, candidate=undefined) {
    this.createdCandidate.emit(candidate || this.createCandidateForm.value);
    if (type == 'saveAndNew') {
    } else if (type == 'save') {
      this.sidebarClose();
      this.btnText = 'Add';
      this.formTitle = 'Add Candidate';
    }
    this.submitted = false;
    this.createCandidateForm.reset();
  }

  sidebarClose() {
    this.onCreateClose.emit((this.isCreateCandidate = 'hidden'));
    this.createCandidateForm.reset();
    this.submitted = false;
    this.currentEmail = this.editUserEmail = null;
    this.emailExists = false;
    this.isEditPage = false;
  }

  updateVendorId(event) {
    const v = this.vendorList.vendors.filter(vendor => vendor.name === event);
    if (v && v.length > 0) {
      this.createCandidateForm.patchValue({
        vendor_id: v[0]?.program_vendor,
      });
    }
  }

  getVendorListItems(pageNo = 1) {
    this.vendorLoading = true;
    let qry;
    if (this.searchTerm) {
      qry = `/configurator/programs/${this.programId}/vendors?vendor_type=PAYROLLED&limit=10&page=${pageNo}` + '&name=' + this.searchTerm;
    } else {
      qry = `/configurator/programs/${this.programId}/vendors?vendor_type=PAYROLLED&limit=10&page=${pageNo}`;
    }
    this.vendorService.get(qry).subscribe({
      next: (data: any) => {
        if (data) {
          this.vendorList = data;
          this.vendorList.vendors = new Array();
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
          this.vendorList.vendors.sort((v1, v2) => v1?.name?.localeCompare(v2.name));
          const totalPages = Math.ceil(data.total_records / data.items_per_page);
          this.totalPages = totalPages;
          this.totalRecords = data.total_records;
          this.tableLoaded = true;
          this.vendorLoading = false;
          this._loader.hide();
          if (this.isEditPage) {
            let vendor = this.vendorList?.vendors?.find((res) => res?.id == this.candidateData?.vendorName?.id);
            if (!vendor) {
              vendor = this.candidateData?.vendorName;
              this.vendorList?.vendors?.push(vendor);
            }
            this.createCandidateForm.patchValue({
              vendorName: vendor
            })
          }
        }
      },
      error: err => {
        this._loader.hide();
        this._alert.error(errorHandler(err));
      },
    });
  }

  checkIfEmailExists(event): void {
    this.emailExists = false;
    if (this.currentEmail !== event?.target?.value) {
      if (event?.target?.value && this.createCandidateForm?.controls?.email?.status?.toLowerCase() === 'valid') {
        if (this.btnText?.toLowerCase() === 'update' && this.editUserEmail === this.createCandidateForm.get('email').value) {
          this.emailExists = false;
          return;
        } else if (this.candidates?.length) {
          this.emailExists =
            this.candidates?.length > 0 && this.candidates.map(a => a.email).includes(this.createCandidateForm.get('email').value);
          this.currentEmail = this.emailExists ? null : event?.target?.value;
          if (this.emailExists) return;
        }
        this.vendorService.get(`${this.baseUrl}/candidates?email=${event?.target?.value}`).subscribe({
          next: (data: any) => {
            this.emailExists =
              data?.candidates?.length > 0 && data.candidates.map(a => a.email).includes(this.createCandidateForm.get('email').value);
            this.currentEmail = this.emailExists ? null : event?.target?.value;
          },
          error: err => {
            this._alert.error('Unable to verify the the email existance in our database.');
          },
        });
      }
    }
  }

  async getAllCountry() {
    await this.jobService
      .get(`/configurator/resources/countries?limit=300`)
      .toPromise()
      .then((data: any) => {
        this.allCountryList = data?.countries?.sort((c1, c2) => c1?.name?.localeCompare(c2?.name));
        this._loader.hide();
      });
  }

  setISDcode(event) {
    this.createCandidateForm.patchValue({
      phone_isdcode: this.allCountryList?.filter(t => t.iso_code_2 == event)[0]?.isd_code,
    });
    this.phoneLengthValidation();
  }

  phoneLengthValidation() {
    const mobNumberPattern = this.phoneUtilService.phoneLengthValidation(this.createCandidateForm?.value?.iso2_code, this.allCountryList);
    this.createCandidateForm?.get('phone_number')?.clearValidators();
    this.createCandidateForm?.get('phone_number')?.setValidators([Validators.pattern(mobNumberPattern)])
    this.createCandidateForm?.get('phone_number')?.updateValueAndValidity();
    this.createCandidateForm?.get('phone_number')?.markAllAsTouched();
  }

  initForm() {
    this.createCandidateForm = this.formBuilder.group({
      id: [null],
      vendorName: [null, Validators.required],
      first_name: [null, [Validators.required, Validators.pattern(this.nameValidation)]],
      middle_name: [null, [Validators.pattern(this.nameValidation)]],
      last_name: [null, [Validators.required, Validators.pattern(this.nameValidation)]],
      state_ID: [null],
      email: [null, [Validators.pattern(this.emailvalidation), Validators.required]],
      phone_number: [null], // Part of SO-264
      iso2_code: ['US'],
      country_name: [null],
      phone_isdcode: [1],
      vendor_id: [null],
      retiree: [null],
      date_of_birth: [null],
      address: [null],
      notes: [null]
    });
  }

  
  changeCountry(event) {
    if(!event) return;
    let short: any;
    for (let i = 0; i < this.allCountryList.length; i++) {
      if (event?.toUpperCase() === this.allCountryList[i].name?.toUpperCase()) {
        short = this.allCountryList[i].iso_code_2;
      }
    }
    this.createCandidateForm.get('iso2_code').setValue(short);
    this.setISDcode(short);
    this.countryShortName = short;
    this.phoneLengthValidation();
  }

  nameValidater(pos) {
    let name: any;
    if (pos === 0) {
      name = this.createCandidateForm.get('first_name').value;
    } else if (pos === 1) {
      name = this.createCandidateForm.get('middle_name').value;
    } else if (pos === 2) {
      name = this.createCandidateForm.get('last_name').value;
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
        this._loader.hide()
      }
      })
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
}
