import { Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { map,switchMap } from 'rxjs/operators';
import { CandidateService } from 'src/app/candidates/service/candidate.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { EmitEvent, Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { HttpService } from 'src/app/core/services/http.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { JobDetailsService } from 'src/app/jobs/job-details/job-details.service';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { Log, LOG_TYPE } from 'src/app/library/logs/logs.model';
import { PhoneUtilityService } from 'src/app/shared/service/utility/phone-utility.service';
import { ConfirmationDialogService } from 'src/app/shared/components/confirmation-dialog/confirmation-dialog.service';
import { CalculateDurationService } from 'src/app/core/services/calculate-duration.service';
import { DATE_FORMAT } from 'src/app/library/date-format/date-format.model';
import { UniqueKeyPipe } from 'src/app/shared/pipe/unique-key.pipe';
import { SortHelperPipe } from 'src/app/shared/pipe/sort-helper.pipe';

enum InterviewTypes {
  PHONE = 'PHONE',
  VIRTUAL = 'VIRTUAL',
  F2F = 'F2F'
}

@Component({
  selector: 'candidate-job-view-interview-create',
  templateUrl: './candidate-job-view-interview-create.component.html',
  styleUrls: ['./candidate-job-view-interview-create.component.scss']
})
export class CandidateJobViewInterviewCreateComponent implements OnInit {
  scheduleInterviews = "hidden";
  profilevisible = true;
  helpVisible = true;
  virtuals = false;
  phonecall = false;
  inPerson = false;
  typeSelected = null;
  showHeader = false;
  showFooter = false;
  confirmationForDeleteAll = false;
  prefferedfDateFormate:string;
  isLoader: boolean = false;
  recommendedDates = [{
    day: null,
    slots: null,
    slotOptions: [],
    isLoading: false
  }];
  public input$ = new Subject<string | null>();
  public addinput$ = new Subject<string | null>();
  public inputLocation$ = new Subject<string | null>();
  public isAdditionalAttendeesFromOutOrganization: boolean = false;
  emailvalidation = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
  interviewersLoading = false;
  additionalAttendiesLoading = false;
  interviewerLoading = false;
  selectedInterviewers = [];
  clientInterviewer;
  addsearch = '';
  submitted = false;
  today = new Date();
  timezoneId : string = null;
  interviewFormDetails: any;
  editDuration: any = 0;
  // need to check , when rescheduling how it works for date which was choosen already
  dateOptions = {
    language: 'English',
    enabledDateRanges: [
      { start: this.today.setDate(this.today.getDate() - 1) },
    ]
  };

  public workLocationSubject: Subject <string> = new Subject <string> ();
  public workLocationLoading: boolean = false;
  logs: Log= undefined;
  isPendingInterviewReview: any;
  userType: any;
  countryList: any;
  dateTimePickerModal: boolean = false;
  isReshudleInterview: boolean = false;
  interviewersList: any;
  dateAndTimeDetails: any = [];
  editDateTime: any;
  interviewerListDetails: any = [];
  InterviewTypeEnum = InterviewTypes;
  jobHierarchy: string;
  showAllWorklocations: boolean = true;
  constructor(
    private eventStream: EventStreamService,
    private httpService: HttpService,
    private fb: UntypedFormBuilder,
    private jobService: JobDetailsService,
    private candidateService: CandidateService,
    private alert: AlertService,
    private router: Router,
    private route: ActivatedRoute,
    private storageService: StorageService,
    public location: Location,
    private datePipe: LocalDateFormatPipe,
    private phoneUtilService: PhoneUtilityService,
    private confirmService: ConfirmationDialogService,
    private calculate: CalculateDurationService,
    private uniqueKeyPipe: UniqueKeyPipe,
    private sortPipe: SortHelperPipe
  ) { }

  currentCandidateId;
  jobId;
  programID;
  interviewId;
  interviewDetails;
  interviewers;
  additionalAttendeesList;
  timeZones;
  userDetails;
  autoSelectedInterviewer;
  isActiveWork: boolean = true;
  isActiveOther: boolean = false;
  workLocations = [];
  workLocationsData = [];
  isWorkLocationMaster: boolean = true;
  isInterviewVirtualLink: boolean;
  isInterviewPhoneNumber: boolean;
  workLocationTextField: boolean = false;
  programDetails: any;
  additionalAttendeesEmails: any = [];
  submissionManager;
  editSlotValue: boolean;
  customFieldsFormData: any;
  isCustomFieldsFormValid: boolean = true;
  interviewersSelected:any[] = [];
  mobNumberPattern = "^((\\+91-?)|0)?[0-9]{9,10}$";
  interviewsCompareFn = this.compareInterviews.bind(this);

  interviewTypes = [
    { code: "F2F", name: "In Person", icon: "people_alt" },
    { code: "PHONE", name: "Phone", icon: "phone_in_talk" },
    { code: "VIRTUAL", name: "Virtual", icon: "videocam" },
  ];

  locationmap = {
    "F2F": "Location",
    "PHONE": "Phone Number",
    "VIRTUAL": "Link"
  }

  durations = [
    { code: 15, name: '15 Minutes' },
    { code: 30, name: '30 Minutes' },
    { code: 45, name: '45 Minutes' },
    { code: 60, name: '60 Minutes' },
    { code: 75, name: '75 Minutes' },
    { code: 90, name: '90 Minutes' },
    { code: 105, name: '105 Minutes' },
    { code: 120, name: '120 Minutes' },
  ];


  form: UntypedFormGroup;
  pageMode;
  account:any;
  iserror: boolean = false

  subscriptions = [];
  detailsLoaded = false;
  ngOnInit(): void {
    this.submissionManager = '/submission-manager';
    this.programDetails = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.account = this.storageService.get(StorageKeys.CURRENT_ACCOUNT);
    this.isPendingInterviewReview = this.programDetails.config?.interview?.pending_interview_review;
    this.userType = this.storageService.get('user_type');
    this.isInterviewPhoneNumber = this.storageService.get("CurrentProgram").config?.interview.is_interview_phone_number;
    this.isInterviewVirtualLink = this.storageService.get("CurrentProgram").config?.interview.is_interview_virtual_link;
    this.isAdditionalAttendeesFromOutOrganization = this.storageService.get("CurrentProgram").config?.interview?.is_additional_attendees_from_out_organization;
    this.route.parent.parent.params.subscribe(params => {
      if(this.route.snapshot.data.isReSchedule) {
        this.pageMode = "RE_SCHEDULE_INTERVIEW"
      } else if (this.route.snapshot.data.isEditInterview) {
        this.pageMode = "EDIT_INTERVIEW"
      } else  {
        this.pageMode = "SCHEDULE_INTERVIEW"
      }
      this.currentCandidateId = params['candidateId'];
      this.interviewId = this.route.snapshot.params.interviewId;
      this.programID = this.storageService.get(StorageKeys.CURRENT_PROGRAM).id;
      this.jobId = params['id'];
      // this will be dynamic
      this.pageMode === 'SCHEDULE_INTERVIEW' ? this.loadMasterData() : this.loadMasterDataWithInterviewDetails();
    });
    this.getAllCountry();
    this.isWorkLocationMaster = this.storageService.get('CurrentProgram').config?.interview?.is_work_location_master_enabled;

    this.loadWorkLocation();
    this.prefferedfDateFormate = this.programDetails?.defaultDateFormat ?? 'mm/dd/yyyy';

    this.inputLocation$.pipe(debounceTime(1000)).subscribe((newTerm) => {
      if(newTerm) {
        let searchString = newTerm.toLowerCase();
        this.workLocations = this.workLocations.filter(location => {
          return String(location.name + location.code + location.address).toLowerCase().includes(searchString);
        })
      } else {
        this.loadWorkLocation();
      }
    })

    this.input$.pipe(debounceTime(1000)).subscribe((newTerm) => {
        this.loadUsers(newTerm, false);
    });

    this.addinput$.pipe(debounceTime(1000)).subscribe((newTerm,) => {
      if (newTerm) {
        this.addsearch = newTerm
        this.loadUsersExcluding(newTerm, this.selectedInterviewers);
      }
    });

    this.workLocationSubject
      .pipe(
        debounceTime(400),
        switchMap((term: string) => {

          this.workLocationLoading = true;
          let url = `/configurator/programs/${this.programID}/work-locations`;
          if (term) {
            url += `?k=${term}`
          }

          return this.jobService.get(url);
        })).subscribe({
          next: (res: any) => {
          this.workLocationLoading = false;
          if (this.isWorkLocationMaster) {
            this.workLocations = res?.work_locations;
          }
        }, 
        error: (err) => {
          this.showError(err);
          this.workLocationLoading = false;
        }});
  }

  setCustomFieldsForm(isCustomFieldsFormValid) {
    this.isCustomFieldsFormValid = isCustomFieldsFormValid;
  }
  
  updateCustomFields(event) {
    if (event) {
      this.customFieldsFormData = event;
    }
  }

  workLocation() {
    this.form.controls["location"].reset();
    this.workLocationTextField = false;
    this.isActiveWork = true;
    this.isActiveOther =false;
    this.updateWorkLocation();
  }

  otherLocation() {
    this.form.controls["location"].reset();
    this.workLocationTextField = true;
    this.isActiveWork = false;
    this.isActiveOther =true;
  }

  createForm(formDetails?,candidateDetails?) {
    if (formDetails) {
      this.submitted = true;
      this.interviewFormDetails = formDetails;
      let interviewer = formDetails?.interviewers.filter(i => i.member_type === 'INTERVIEWER').map(u => u.user_id);
      let additionalAttendees = formDetails?.interviewers.filter(i => i.member_type === 'ADDITIONAL_ATTENDEES').map(a => a.user_id);
      this.interviewerListDetails = formDetails?.interviewers;
      this.interviewersList = interviewer;
      const candidateEmail = candidateDetails ?   (this.isReshudleInterview ? candidateDetails?.candidate_email : candidateDetails?.email) : null;
      const isoCode = candidateDetails  ? (this.isReshudleInterview ? candidateDetails?.phone_number?.iso_code?.toUpperCase() : (candidateDetails?.iso2_code?.toUpperCase() ?? 'US')): 'US';
      const phoneNumber = candidateDetails  ? (this.isReshudleInterview ? candidateDetails?.phone_number?.number : candidateDetails?.phone_number): null;
      this.form = this.fb.group({
        name: [formDetails?.name, Validators.required],
        interviewer: [interviewer ? interviewer : null, Validators.required],
        additionalAttendees: [additionalAttendees && additionalAttendees.length > 0 ? additionalAttendees : []],
        interviewType: [formDetails?.interview_type, Validators.required],
        location: [formDetails?.location, (formDetails?.interview_type === 'PHONE'|| (formDetails?.interview_type === 'VIRTUAL' && !this.isInterviewVirtualLink) ) ? Validators.nullValidator : Validators.required],
        location_refcode: [formDetails?.location_refcode],
        interviewTimezone: [formDetails?.time_zone, Validators.required],
        instructions: [formDetails?.instructions],
        dateAndTimeDetails: [null],
        availableEndDate: [],
        candidate_email:[candidateEmail,[Validators.required, Validators.email]],
        phone_isdcode:[isoCode,Validators.required],
        phone_number:[phoneNumber,[Validators.required, Validators.pattern(this.mobNumberPattern)]],
        additional_attendees: ['', [Validators.email, Validators.pattern(this.emailvalidation)]],
      });
      this.additionalAttendeesEmails = additionalAttendees;
      if (this.form.get('interviewType').value == 'PHONE') {
        this.form.get('location_refcode').setValue(formDetails?.iso_code ? formDetails?.iso_code : 'US');
        this.phoneLengthValidation();
      }
      formDetails?.schedules.forEach((schedule, index) => {
        this.onDateChange(schedule.date, index, true);
      });
      formDetails.schedules.forEach(dateAndTimeSlot => {
        dateAndTimeSlot.duration = this.calculate.calculateDuration(dateAndTimeSlot.start_time, dateAndTimeSlot.end_time);
        this.editDuration = dateAndTimeSlot.duration;
        this.formatSlotDurationList(dateAndTimeSlot);
      });
      this.recommendedDates = this.recommendedDates.filter(dateList => dateList.day !== null);
      // if (!this.isInterviewVirtualLink) {
      //   this.form.controls['location'].setValue(null);
      //   this.form.controls['location'].setValidators(Validators.nullValidator);
      // }
      if (formDetails?.location_refcode == 'other_location') {
        this.isActiveWork = false;
        this.isActiveOther = true;
      }
      this.timezoneId = formDetails.time_zone_id;
    } else {
      const candidateEmail = candidateDetails ? candidateDetails?.email: null;
      const isoCode = candidateDetails ? (candidateDetails?.iso2_code?.toUpperCase() ?? 'US'): 'US';
      const phoneNumber = candidateDetails ? candidateDetails?.phone_number: null;
      this.form = this.fb.group({
        name: [null, Validators.required],
        interviewer: [null, Validators.required],
        additionalAttendees: [null],
        interviewType: [null, Validators.required],
        location: [null],
        location_refcode: ['US'],
        interviewTimezone: [null, Validators.required],
        // interviewDuration: [null, Validators.required],
        instructions: [null],
        candidate_email:[candidateEmail ?? null,[Validators.required, Validators.pattern(this.emailvalidation)]],
        phone_isdcode:[isoCode ?? null,Validators.required],
        phone_number:[phoneNumber ?? null,[Validators.required, Validators.pattern(this.mobNumberPattern)]],
        // recommendedDates: [null],
        additional_attendees: ['', [Validators.email, Validators.pattern(this.emailvalidation)]],
      });
      this.setDefaultInterviewTitle();
    }
    this.phoneLengthValidation()
  }

  addAdditionalAttendees(event?) {
      if(!this.form.controls['additional_attendees'].valid) {
        this.form.controls['additional_attendees'].markAsTouched();
        return;
      }
      const attendees = event.target.value.trim().replace(/,/g,'');
      if (attendees) {
        const isAlreadyExist = this.additionalAttendeesEmails?.findIndex(entity => entity === attendees);
        if(isAlreadyExist === -1){
          this.additionalAttendeesEmails.push(attendees);
        }
      }
      event.target.value = '';
  }

  setDefaultInterviewTitle() {
    let interviewTitle = this.candidateObject?.first_name ? `Interview with ${this.candidateObject.first_name} ${this.candidateObject?.last_name} ` : '';
    if (interviewTitle && this.jobObject?.template_name) {
      interviewTitle += `for ${this.jobObject.template_name}`;
    }
    this.form?.controls['name']?.setValue(interviewTitle);
  }

  setRecommendedDates(formDetails) {
    const keyMap = {}
    let dateObservables = [];
    formDetails?.schedules.forEach(element => {
      const formatDate = element.date.split('/');
      let day = `${formatDate[2]}-${formatDate[0]}-${formatDate[1]}`
      if (!keyMap[day]) {
        keyMap[day] = true;
        dateObservables.push(
          {
            onservable: this.loadInterviewSchedules(day).pipe(map(res => {
              return { key: null, response: res };
            })),
            day: element.date
          }
        );
      }
    });

    dateObservables.forEach(dateObservable => {
      dateObservable.onservable.subscribe((res: any) => {
        const slots = formDetails.schedules.filter(s => s.date === res.key)?.map((s: any) => (

          {
            "label": s.start_time.trim() + '-' + s.end_time.trim(),
            slots: {
              start_time: s.start_time,
              end_time: s.end_time
            }
          }));
        let slotOptions = [];
        res.response.schedules[0].time_slots.forEach(element => {
          slotOptions.push({
            "label": element.start_time.trim() + '-' + element.end_time.trim(),
            "is_time_passed": element?.is_time_passed,
            "slots": {
              "start_time": element.start_time.trim(),
              "end_time": element.end_time.trim(),
              "is_available": element?.is_available,
              "members": element?.members,
            }
          }
          );

        });

        slots.forEach(_obj => {
          let _isDuplicate = false;
          slotOptions.forEach(sop=> {
            if(sop.label == _obj.label) {
              _isDuplicate = true;
            }
          })

          if(_isDuplicate == false) {
            slotOptions.push(_obj);
          }
        });

        this.recommendedDates.push({
          day: res.key,
          slots: slots,
          slotOptions: slotOptions,
          isLoading: false
        })
      }, (resp) => {
        const slots = formDetails.schedules.filter(s => s.date === dateObservable.day)?.map((s: any) => ({

          "label": s.start_time.trim() + '-' + s.end_time.trim(),
          "slots": {
            "start_time": s.start_time.trim(),
            "end_time": s.end_time.trim(),
            "is_available": s?.is_available,
            "members": s?.members,
          }
        }));
        this.recommendedDates.push({
          day: dateObservable.day,
          slots: slots,
          slotOptions: slots,
          isLoading: false
        })
      });
    });
  }

  jobObject;
  candidateObject;

  loadMasterData() {
    forkJoin([this.loadTimeZones(), this.JobDetails, this.CandidateDetails]).subscribe((list: any) => {
      this.detailsLoaded = true;
      this.timeZones = list[0].time_zones;
      this.jobObject = list[1]['job'];
      this.candidateObject = list[2].candidate;
      this.jobHierarchy = this.jobObject?.hierarchy[0]?.id;
      this.loadUsers();
      this.createForm(null,this.candidateObject);
    })
  }
   
  loadMasterDataWithInterviewDetails() {
    forkJoin([this.loadTimeZones(), this.JobDetails, this.CandidateDetails, this.InterviewDetails]).subscribe((list: any) => {
      this.detailsLoaded = true;
      this.timeZones = list[0].time_zones;
      this.jobObject = list[1]['job'];
      this.candidateObject = list[2].candidate;
      this.interviewDetails = list[3].interview;
      this.jobHierarchy = this.jobObject?.hierarchy[0]?.id;
      //this.prefferedfDateFormate = this.jobObject?.hierarchy[0]?.preferred_date_format ||  this.programDetails?.defaultDateFormat ;
      this.prefferedfDateFormate =  this.programDetails?.defaultDateFormat ;
      this.interviewDetails.interviewers.forEach(element => {
        if (element.member_type?.toUpperCase() == "INTERVIEWER") {
          this.selectedInterviewers.push(element.user_id);
          // this.interviewersSelected.push(element);
        }
      });
      this.loadUsers();
      this.loadUsersExcluding('', this.selectedInterviewers);
      this.isReshudleInterview = true;

      this.createForm(this.interviewDetails,this.interviewDetails);
    })
  }

  get InterviewDetails() {
    return this.httpService.get(`${this.submissionManager}/programs/${this.programID}/jobs/${this.jobId}/interviews/${this.interviewId}`);
  }

  get JobDetails() {
    return this.jobService.getJobs(this.jobId);
  }

  get CandidateDetails() {
    return this.candidateService.getCandidateDetail(this.currentCandidateId);
  }

  updateWorkLocation(isEdit?) {
    if(this.form.value.interviewType == this.InterviewTypeEnum.F2F && !this.isActiveOther){ 
      const selectedInterviewers = (typeof this.interviewersList?.[0] === 'string' ? this.interviewersSelected : this.interviewersList) ?? [];
      if (selectedInterviewers?.length == 0) {
        this.form.controls['location'].reset();
        this.showAllWorklocations = false;
        this.loadWorkLocation();
      } else {
        this.workLocations = [];
        this.showAllWorklocations = false;
        selectedInterviewers?.forEach((interviewer, index) => {
          if (!this.showAllWorklocations && interviewer?.work_locations?.length) {
            this.workLocations = this.sortPipe.transform(
              this.uniqueKeyPipe.transform(
                interviewer?.work_locations?.length ? [...this.workLocations, ...interviewer.work_locations] : [...this.workLocations],
                'id',
              ),
              'name',
            );
          } else {
            this.showAllWorklocations = true;
            this.loadWorkLocation();
          }
          const workLocId = interviewer?.defaults?.find(a => a.entity_type == 'WORK_LOCATION')?.entity_id;
          if (index === 0 && workLocId && !isEdit && this.isWorkLocationMaster) {
            let location = this.workLocations.find(x => workLocId === x.id);
            if (location) {
              this.form.patchValue({
                location: `${location?.address_line_1 || location?.address || location?.name}${
                  location?.city_name ? ' - ' + location?.city_name : ''
                }${location?.code ? ' - ' + location?.code : ''}`,
              });
            } else {
              this.httpService
                .get(`/configurator/programs/${this.programID}/work-locations?location_ids=${workLocId}`)
                .subscribe((res: any) => {
                  location = res?.work_locations?.[0];
                  this.form.patchValue({
                    location: `${location?.address_line_1 || location?.address || location?.name}${
                      location?.city_name ? ' - ' + location?.city_name : ''
                    }${location?.code ? ' - ' + location?.code : ''}`,
                  });
                });
            }
          }
        });
      }
    } 
  }

  interviewerSelected(interviwers) {
    this.interviewersList = interviwers;
    if (this.form.value.interviewType == this.InterviewTypeEnum.F2F && !this.isActiveOther)
      this.updateWorkLocation();
    if (!this.dateAndTimeDetails?.length) {
      this.form.patchValue({
        interviewTimezone: interviwers?.[0]?.['preferred_time_zone']?.['name'] ?? null,
      });
    }
    if (this.interviewDetails) {
      this.interviewDetails.interviewers = this.form.value.interviewer;
    }
    this.timezoneId = interviwers?.[0]?.['preferred_time_zone']?.['id'] ?? null;
    if (!this.isAdditionalAttendeesFromOutOrganization) {
      this.selectedInterviewers = interviwers?.map(interviwer => interviwer?.id);
      this.loadUsersExcluding(this.addsearch, this.selectedInterviewers);
      this.resetTimeSlots();
    } else {
      interviwers.forEach(interviewer => {
        let indx = this.interviewDetails?.interviewers.findIndex(data => data.id === interviewer.id);
        if (indx == -1) {
          this.interviewDetails?.interviewers.push(interviewer);
        }
      });
    }
    if (this.form.value.interviewType == this.InterviewTypeEnum.PHONE) {
      const interviewer_iso_code_2 = this.form.value?.interviewer?.[0]?.country?.iso_code_2 ?? this.account?.country?.iso_code_2 ?? 'US';
      this.form.controls['location_refcode'].setValue(interviewer_iso_code_2);
      this.phoneLengthValidation();
    }
  }

  durationChangedHandler() {
    this.resetTimeSlots();
  }

  resetTimeSlots() {
    this.recommendedDates = [{
      day: null,
      slots: null,
      slotOptions: [],
      isLoading: false
    }];
  }

  loadTimeslots(e){
    this.timezoneId = e;
    this.durationChangedHandler();
    this.setRecommendedDates(this.interviewFormDetails);
  }

  loadInterviewSchedules(date) {
    let interviwer = this.form.controls['interviewer'].value;
    if (!interviwer) {
      return;
    }
    let url = `${this.submissionManager}/programs/${this.programID}/jobs/${this.jobId}/interviews/booked-schedules?member_ids=${interviwer}`;
    // let duration = this.form.controls['interviewDuration'].value;
    // if (duration) url = url + '&duration=' + duration;
    if (date) url = url + '&scheduled_on=' + date;
    if (this.timezoneId && this.timezoneId !== '') url = url + '&timezone_id=' + this.timezoneId;
    return this.httpService.get(url);
  }

  addSlot() {
    this.recommendedDates.push({ day: null, slots: null, slotOptions: [], isLoading: false });
  }

  loadTimeZones() {
    // Removing Program Id frpm query params to load all the timezones for Interview Selection. V2M-10084
    // return this.httpService.get(`/configurator/resources/time_zones?program_id=${this.programID}`);
    return this.httpService.get(`/configurator/resources/time_zones`);
  }

  loadUsersDetails(memberID) {
    return this.httpService.get(`/configurator/programs/${this.programID}/members/${memberID}`);
  }

  loadWorkLocation(name?) {
    if(this.isWorkLocationMaster) {
      this.workLocationLoading = true;
      return this.httpService.get(`/configurator/programs/${this.programID}/work-locations`).subscribe((res: any) => {
        this.workLocations = res.work_locations;
        this.workLocationLoading = false;
      });
    }
  }

  loadUsers(name = '', initLoad = true) {
    this.interviewerLoading = true;
    let excludeCandidate = true;
    return this.httpService
      .get(`/configurator/programs/${this.programID}/interviewers?name=${name}&exclude_candidate=${excludeCandidate}`)
      .subscribe(
        (res: any) => {
          this.interviewerLoading = false;
          this.interviewers = res.members;
          if(this.selectedInterviewers){
            this.selectedInterviewers.forEach(element => {
            this.interviewersSelected.push(this.interviewers.find(interviewer => interviewer.id == element))
          })
        }
          this.userDetails = this.storageService.get('account');
          if (this.interviewDetails) {
            // this.interviewers = this.interviewers.concat(this.interviewDetails.interviewers);
            this.interviewDetails?.interviewers?.forEach((element, idx) => {
              if (element.member_type?.toUpperCase() == 'INTERVIEWER') {
                let indx = this.interviewers.findIndex(interviewer => interviewer.id === element?.user_id);
                if (indx === -1) {
                  this.loadUsersDetails(element?.user_id).subscribe({
                    next: (res: any) => {
                      this.interviewers.push(res.member);
                      const pos = this.interviewDetails.interviewers.findIndex(data => data.user_id === res.member.id);
                      this.interviewDetails.interviewers[pos] = res.member;
                      this.form.patchValue({
                        interviewer: this.interviewDetails?.interviewers?.filter(
                          data => data?.member_type?.toLowerCase() !== 'additional_attendees',
                        ),
                      });
                      this.sortInterviewersList();
                    }
                });
                } else {
                  this.interviewDetails.interviewers[idx] = this.interviewers[indx];
                }
              }
            });
            if(this.interviewDetails?.interviewers?.length > 0) {
              this.form.patchValue({
                interviewer: this.interviewDetails.interviewers.filter(data => data?.member_type?.toLowerCase() !== 'additional_attendees'),
              });
            }
          }
          this.sortInterviewersList();
          
          if (!this.route.snapshot.data.isReSchedule && initLoad && this.userType === 'CLIENT') {
            let indx = this.interviewers.findIndex(interviewer => interviewer.id === this.userDetails?.id);
            if (indx === -1) {
              this.interviewers = [...this.interviewers, this.userDetails];
            }
            this.form?.controls['interviewer']?.patchValue([this.userDetails]);
            this.selectedInterviewers = [...this.selectedInterviewers, this.userDetails];
            this.interviewersList = [this.userDetails];
            this.form.patchValue({
              interviewTimezone: this.userDetails?.preferred_time_zone?.id ?? null
            });
          }
          this.updateWorkLocation(true);
        },
      );
  }

  clearInteviewers() {
    if(this.interviewDetails && this.route.params?.['_value']?.['interviewId']) {
      this.interviewDetails.interviewers = [];
    } 
  }

  loadUsersExcluding(name = '', userIds = []) {
    const userIdsstr = userIds.join(',');
    this.additionalAttendiesLoading = true;
    return this.httpService
      .get(`/configurator/programs/${this.programID}/interviewers?exclude_user_ids=${userIdsstr}&name=${name}`)
      .subscribe({
        next: (res: any) => {
          this.additionalAttendiesLoading = false;
          this.additionalAttendeesList = res.members;
          if (this.interviewDetails) {
            this.interviewDetails?.interviewers?.forEach(element => {
              if (element.member_type?.toUpperCase() == 'ADDITIONAL_ATTENDEES') {
                let indx = this.additionalAttendeesList.findIndex(interviewer => interviewer.id === element?.user_id);
                if (indx === -1 && element?.name !== element?.user_id) {
                  this.loadUsersDetails(element?.user_id).subscribe((res: any) => {
                    this.additionalAttendeesList.push(res.member);
                  });
                }
              }
            });
          }
          this.sortadditionalAttendeesList();
        },
      });
  }

  onDateChange(date, index, init=false) {
    if(init) this.recommendedDates.push({
      day: null,
      slots: null,
      slotOptions: [],
      isLoading: false
    });
    let dateFormatted = this.datePipe.transform(date, DATE_FORMAT.FORMATMDY, null, null, true); //this.getFormattedDate(date);
    this.recommendedDates[index].day = dateFormatted;
    this.recommendedDates[index].isLoading = true;
    this.loadInterviewSchedules(dateFormatted).subscribe((data: any) => {
      this.recommendedDates[index].isLoading = false;
      let recommended_time_slots = [];
      data?.schedules?.[0]?.time_slots.forEach(element => {
        recommended_time_slots.push({
          label: element.start_time + '-' + element.end_time,
          is_time_passed: element?.is_time_passed,
          slots: {
            start_time: element.start_time,
            end_time: element.end_time,
            is_available: element?.is_available,
            members: element?.members,
          },
        });
      });
      this.recommendedDates[index].slotOptions = recommended_time_slots;
    });
  }
  // private mobNumberPattern(control) {
  //   let MOBILE_REGEXP = /^((\\+91-?)|0)?[0-9]{10}$/;
  //   return MOBILE_REGEXP.test(control.value) ? null : { pattern: true };
  // }

  interviewTypeChanged(value) {
    this.form.controls['location'].setValue(null);
    let interviewer_iso_code_2 = "";
    if(value == "PHONE") {
      interviewer_iso_code_2 = this.form.value.interviewer?.[0]?.country?.iso_code_2 ?? this.account?.country?.iso_code_2 ?? 'US';
    }
    if(value === this.InterviewTypeEnum.PHONE && this.isInterviewPhoneNumber) {
      this.form.controls['location_refcode'].setValue(interviewer_iso_code_2);
      this.form.controls['location'].setValue('12345678');

      this.phoneLengthValidation();
    } else if(value === this.InterviewTypeEnum.PHONE && !this.isInterviewPhoneNumber) {
      this.form.controls['location'].setValidators(Validators.nullValidator)
      this.form.controls['location'].setValue('123456789');

      this.form.controls['location_refcode'].setValue(interviewer_iso_code_2);
      this.phoneLengthValidation();
    } else if(value === this.InterviewTypeEnum.VIRTUAL && !this.isInterviewVirtualLink) {
      this.form.controls['location'].setValidators(Validators.nullValidator)
    } else {
      this.form.controls['location'].setValidators(Validators.required)
    }
    this.form?.get('location')?.updateValueAndValidity();
    if (value === 'F2F') {
      this.workLocation();
      this.updateWorkLocation();
    } 
  }

  /*UAT to development merge: Need to revisit*/

   // validatorCheck(event) {
  //   event.target.value != null ? this.form.controls['location'].setValidators([Validators.pattern(this.mobNumberPattern)])
  //     : this.form.controls['location'].setValidators(Validators.nullValidator)
  // }


  getFormattedDate(date) {
    if (date) {
      return this.datePipe.transform(date, 'MM/DD/YYYY');
    }
  }

  addTagFn = (term) => {
    const email_regexp = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,6})+$/;
    if (!email_regexp.test(term)) {
      return null;
    }
    return term;
  }

  scheduleInterView() {
    // this.additionalAttendeesEmails = this.form.value?.additional_attendees?.split(',');
    this.submitted = true;
    if (this.form.invalid) {
      this.showError('Please fill all mandatory fields and fix incorrect values');
      return;
    }
    const formValue = this.form.getRawValue();
    const schedules = [];
    this.dateAndTimeDetails.forEach(dateTimeSlot => {
      let date = dateTimeSlot.date;
      dateTimeSlot.slotAndDuration.forEach(slot => {
        schedules.push({
          "date": date,
          "start_time": slot.startTime,
          "end_time": slot.endTime,
          "is_prefered": false
        })
      })
    });

    if (schedules.length === 0) {
      this.showError('Please select one slot');
      return;
    }
    let interviewersList = [];
    if (formValue.interviewer && formValue.interviewer.length > 0) {
      formValue.interviewer.forEach(a => {
        if (this.isAdditionalAttendeesFromOutOrganization) {
          interviewersList.push(a.id);
        } else {
          interviewersList.push({ user_id: a.id, is_interviewer: true });
        }
      });
    }

    if (formValue.additionalAttendees && formValue.additionalAttendees.length > 0) {
      formValue.additionalAttendees.forEach(a => {
        if (!this.isAdditionalAttendeesFromOutOrganization) {
          interviewersList.push({ user_id: a, is_interviewer: false });
        }
      });
    }

    this.isLoader = true;
    let request = {
      "name": formValue.name,
      "interview_type": formValue.interviewType,
      "location": formValue.location && formValue.location != '' ? formValue.location : null,
      "location_refcode": formValue.location_refcode,
      "instructions": formValue.instructions,
      "time_zone_id": this.timezoneId ? this.timezoneId : formValue.interviewTimezone,
      "duration": 15,
      "interviewers": interviewersList,
      "schedules": schedules,
      "additional_attendees": this.additionalAttendeesEmails,
      "phone_number":{
        "number":formValue?.phone_number,
        "phone_isdcode":"+" + this.countryList?.find((country) => country?.iso_code_2 == formValue?.phone_isdcode)?.isd_code,
        "iso_code":formValue?.phone_isdcode
      },
      "candidate_email": formValue?.candidate_email
    };
    if (formValue.interviewType == "F2F") {
      request['location_refcode'] = this.isActiveWork ? 'work_location' : 'other_location';
      let LocationText = formValue.location;
      let locationTextArray = LocationText.split(' ');
      let index = locationTextArray.findIndex(val => val == 'null');
      if (index != 0) {
        locationTextArray[index] = "--";
        request['location'] = locationTextArray.join(" ")
      }
    }
    if (formValue.interviewType == "PHONE") {
      request['location_refcode'] = "+" + this.countryList?.find((country) => country?.iso_code_2 == formValue?.phone_isdcode)?.isd_code;
      request['iso_code'] = formValue.phone_isdcode,
      request['location'] = formValue?.phone_number
    }
    if (this.pageMode !== "SCHEDULE_INTERVIEW") {
      request['status'] = 'PENDING_ACCEPTANCE';
    }
    if(this.isPendingInterviewReview && this.userType == 'CLIENT') {
      request['status'] = 'PENDING_INTERVIEW_REVIEW';
    }
    else {
      request['status'] = 'PENDING_ACCEPTANCE';
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
      request['custom_fields'] = custom_value;
    }
    this.logs= undefined;
    this.pageMode === "SCHEDULE_INTERVIEW" ? this.httpService.post(`${this.submissionManager}/programs/${this.programID}/jobs/${this.jobId}/interviews/candidates/${this.currentCandidateId}`, request)
      .subscribe({
        next: (resp: any) => {
        this.isLoader = false;
        this.alert.success('Interview Scheduled Successfully');
        this.eventStream.emit(new EmitEvent(Events.RELOAD_CANDIDATE_DETAIL, true));
        this.jobService.loadJob(`${this.jobId}`).subscribe(data => {
          setTimeout(() => this.router.navigateByUrl(`jobs/details/job-details/${this.jobId}/candidate/${this?.currentCandidateId}/interviews/list`));
        }, () => {
          setTimeout(() => this.router.navigateByUrl(`jobs/details/job-details/${this.jobId}/candidate/${this?.currentCandidateId}/interviews/list`));
        })
      }, 
      error: (error) => {
        this.showError(error);
        this.isLoader = false;
      }}) :

      this.httpService.put(`${this.submissionManager}/programs/${this.programID}/jobs/${this.jobId}/interviews/${this.interviewId}`, request)
        .subscribe({
          next: (resp: any) => {
          this.isLoader = false;
          this.alert.success('Interview Re Scheduled Successfully');
          setTimeout(() =>this.router
          .navigateByUrl('/', { skipLocationChange: true })
          .then(() => this.router.navigateByUrl(`jobs/details/job-details/${this.jobId}/candidate/${this?.currentCandidateId}/interviews/list`)));
          // this.eventStream.emit(new EmitEvent(Events.RELOAD_JOB_DETAILS, null));
          // route back or close the side bar
        }, 
        error: (error) => {
          this.showError(error);
          this.isLoader = false;
        }});
  }

  searchWorkLocation({term}) {
    if (this.showAllWorklocations)
      this.workLocationSubject.next(term);
  }

  ngOnDestroy() {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  showError(err) {
    window.scrollTo(0, 0);
    this.logs = {
      type: LOG_TYPE.ERROR,
      heading: err?.error?.error?.message ? err?.error?.error?.message : typeof err == 'string' ? err : '',
      messages: [],
      autoClose: true,
      isShown: true,
      showReportButton: err?.status == 500 || err?.status == 400,
      additionalInfo: { trace_id: err?.error?.trace_id },
    };

    if (err?.error?.error?.do_not_report && err?.error?.error?.do_not_report == true) {
      this.logs.showReportButton = false;
    }

    err?.error?.error?.errors?.forEach(msg => {
      if (msg?.message) {
        this.logs.messages.push(msg?.message);
      }
    });
  }

  sortInterviewersList(): void {
    this.interviewers?.sort((mem1, mem2) => (mem1.first_name + ' ' + mem1.middle_name + ' ' + mem1.last_name).localeCompare(mem2.first_name + ' ' + mem2.middle_name + ' ' + mem2.last_name));
  }

  sortadditionalAttendeesList(): void {
    this.additionalAttendeesList?.sort((mem1, mem2) => (mem1.first_name + ' ' + mem1.middle_name + ' ' + mem1.last_name).localeCompare(mem2.first_name + ' ' + mem2.middle_name + ' ' + mem2.last_name));
  }

  compareInterviews(interview1: any, interview2: any) {
    return interview1 && interview2 && interview1.id === interview2.id;
  }

  phoneLengthValidation() { 
    const mobNumberPattern = this.phoneUtilService.phoneLengthValidation(this.form?.value?.phone_isdcode,this.countryList);
    this.form?.get('phone_number').clearValidators();
    this.form?.get('phone_number').setValidators([Validators.required, Validators.pattern(mobNumberPattern)])
    this.form?.get('phone_number').updateValueAndValidity();
  }

  getAllCountry() {
    this.jobService.getAllCountries().subscribe((res: any) => {
      this.countryList = res?.countries;
    })
  }

  addNewSlot() {
    // this.interviewerListDetails.push(this.userDetails)
    this.editSlotValue = false;
    this.showDateTimeModal();
  }

  editSlot(i, j){
    this.editSlotValue = true;
    let editSlotInfo:any = {};
    editSlotInfo.date = this.dateAndTimeDetails[i].date;
    editSlotInfo.startTime = this.dateAndTimeDetails[i].slotAndDuration[j].startTime;
    editSlotInfo.endTime = this.dateAndTimeDetails[i].slotAndDuration[j].endTime;
    editSlotInfo.duration = this.dateAndTimeDetails[i].slotAndDuration[j].duration;
    editSlotInfo.i = i;
    editSlotInfo.j = j;
    this.editDateTime = editSlotInfo;
    this.showDateTimeModal();
  }

  deleteSlot(i, j) {
    this.dateAndTimeDetails[i].slotAndDuration.splice(j, 1);
    if(this.dateAndTimeDetails[i].slotAndDuration.length <= 0) {
      this.dateAndTimeDetails.splice(i, 1);
    }
  }

  showDateTimeModal() {
    this.dateTimePickerModal = true;
  }

  closeDateTimePicker() {
    this.dateTimePickerModal = false;
  }

  clearAll() {
    // this.confirmationForDeleteAll = true;
    this.confirmService.confirm('', `Are you sure you want to delete all slots?`,
      'Yes', 'No')
      .then((confirmed) => {
        if (confirmed) {
          this.dateAndTimeDetails = [];
        }
      }).catch(() => {

      })
  }

  
  formatSlotDurationList(slotValue: any) {
    let sTime = slotValue.startTime || slotValue.start_time;
    let eTime = slotValue.endTime || slotValue.end_time;
    let slotDetails = 
      {
        date: slotValue.date,
        slotAndDuration: [
          {
          startTime: sTime,
          endTime: eTime,
          duration: slotValue.duration
          }
        ]
      }
      const isAlreadyExist = this.dateAndTimeDetails?.findIndex(entity => entity.date === slotDetails.date);
      
        if(isAlreadyExist == -1){
          this.dateAndTimeDetails.push(slotDetails);
          this.dateAndTimeDetails[slotValue.i]?.slotAndDuration.splice(slotValue.j, 1);
          if (this.dateAndTimeDetails[slotValue.i]?.slotAndDuration.length == 0){
            this.dateAndTimeDetails.splice([slotValue.i], 1);
          }
        } else {
          if((slotValue.i && slotValue.j) != undefined) {
            this.dateAndTimeDetails[isAlreadyExist].slotAndDuration.push({
              startTime: slotValue.startTime,
              endTime: slotValue.endTime,
              duration: slotValue.duration
            })
            this.dateAndTimeDetails[slotValue.i]?.slotAndDuration.splice(slotValue.j, 1);
            if (this.dateAndTimeDetails[slotValue.i]?.slotAndDuration.length == 0){
            this.dateAndTimeDetails.splice([slotValue.i], 1);
            }
          } else {
            const isAlreadyExistSlot = this.dateAndTimeDetails[isAlreadyExist].slotAndDuration.findIndex(value => {
              return ((this.calculate.parseFromAmPmToTwentyFour(value.startTime) == this.calculate.parseFromAmPmToTwentyFour(sTime)) && (this.calculate.parseFromAmPmToTwentyFour(value.endTime) == this.calculate.parseFromAmPmToTwentyFour(eTime)))
            })
            if (isAlreadyExistSlot == -1) {
              this.dateAndTimeDetails[isAlreadyExist].slotAndDuration.push({
              startTime: sTime,
              endTime: eTime,
              duration: slotValue.duration
              })
            }
          }
        }

        return this.dateAndTimeDetails;
  }

  onSaveDetails(value: any) {
    this.formatSlotDurationList(value);
  }

}
