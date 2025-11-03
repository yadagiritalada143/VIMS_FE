import { Component, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, forkJoin } from 'rxjs';
import { debounceTime, map } from 'rxjs/operators';
import { CandidateService } from 'src/app/candidates/service/candidate.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { EmitEvent, EventStreamService, Events } from 'src/app/core/services/event-stream.service';
import { HttpService } from 'src/app/core/services/http.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { JobDetailsService } from '../../job-details.service';
@Component({
  selector: 'app-schedule-interview',
  templateUrl: './schedule-interview.component.html',
  styleUrls: ['./schedule-interview.component.scss']
})
export class ScheduleInterviewComponent implements OnInit, OnDestroy {
  scheduleInterviews = "hidden";
  profilevisible = true;
  helpVisible = true;
  virtuals = false;
  phonecall = false;
  inPerson = false;
  typeSelected = null;
  showHeader = false;
  showFooter = false;
  isLoader: boolean = false;
  recommendedDates = [{
    day: null,
    slots: null,
    slotOptions: [],
    isLoading: false
  }];
  selectedInterviewers: any = [];
  addsearch: string = '';

  public input$ = new Subject<string | null>();
  public addinput$ = new Subject<string | null>();
  // need to check , when rescheduling how it works for date which was choosen already
  dateOptions = {
    language: 'English',
    enabledDateRanges: [
      { start: new Date() },
    ]
  };
  constructor(
    private eventStream: EventStreamService,
    private httpService: HttpService,
    private fb: UntypedFormBuilder,
    private jobService: JobDetailsService,
    private candidateService: CandidateService,
    private alert: AlertService,
    private datePipe: LocalDateFormatPipe,
    private router: Router,
    private storageService: StorageService,
  ) { }

  additionalAttendiesLoading = false;
  interviewerLoading = false;
  currentCandidateId;
  jobId;
  programID;
  interviewId;
  interviewDetails;
  interviewers;
  additionalAttendeesList: any;
  timeZones;
  interviewTypes = [
    { code: "F2F", name: "In Person", icon: "people_alt" },
    { code: "PHONE", name: "Over Phone", icon: "phone_in_talk" },
    { code: "VIRTUAL", name: "Virtual", icon: "videocam" },
  ];

  locationmap = {
    "F2F": "Location",
    "PHONE": "Phone Number",
    "VIRTUAL": "Link"
  }

  durations = [
    { code: 30, name: '30 Minutes' },
    { code: 60, name: '60 Minutes' },
    { code: 90, name: '90 Minutes' },
    { code: 120, name: '120 Minutes' },
  ]

  form: UntypedFormGroup;
  pageMode;
  defaultCountryCode;

  subscriptions = [];
  detailsLoaded = false;
  ngOnInit(): void {
    this.defaultCountryCode = this.storageService.get(StorageKeys.CURRENT_PROGRAM)?.config?.default_country_code || '+91';

    this.input$.pipe(debounceTime(1000)).subscribe((newTerm) => {

      if (newTerm) {
        this.loadUsers(1, newTerm);
      }
    });

    this.addinput$.pipe(debounceTime(1000)).subscribe((newTerm,) => {

      if (newTerm) {
        this.addsearch = newTerm
        this.loadUsersExcluding(newTerm, this.selectedInterviewers);
      }
    });



    this.subscriptions.push(this.eventStream.on(Events.SCHEDULE_INTERVIEW).subscribe((event) => {
      if (event) {
        this.scheduleInterviews = "visible";
        this.currentCandidateId = event.data.id;
        this.jobId = event.jobId;
        this.pageMode = 'SCHEDULE_INTERVIEW';
        this.programID = event.programID;
        this.loadUsers();
        this.dateOptions = {
          language: 'English',
          enabledDateRanges: [
            { start: new Date() },
          ]
        };
        this.loadMasterData();
      } else {
        this.scheduleInterviews = 'hidden';
      }
    }));

    this.subscriptions.push(this.eventStream.on(Events.RE_SCHEDULE_INTERVIEW).subscribe((event) => {
      if (event) {
        this.scheduleInterviews = "visible";
        this.currentCandidateId = event.data.candidateId;
        this.jobId = event.jobId;
        this.pageMode = 'RE_SCHEDULE_INTERVIEW';
        this.programID = event.programID;
        this.interviewId = event.data.interviewId;
        this.loadMasterDataWithInterviewDetails();
      } else {
        this.scheduleInterviews = 'hidden';
      }
    }));

    this.subscriptions.push(this.eventStream.on(Events.EDIT_INTERVIEW).subscribe((event) => {
      if (event) {
        this.scheduleInterviews = "visible";
        this.currentCandidateId = event.data.candidateId;
        this.jobId = event.jobId;
        this.pageMode = 'EDIT_INTERVIEW';
        this.programID = event.programID;
        this.interviewId = event.data.interviewId;
        this.loadMasterDataWithInterviewDetails();
      } else {
        this.scheduleInterviews = 'hidden';
      }
    }));
  }

  createForm(formDetails?) {
    if (formDetails) {
      let interviewer = formDetails.interviewers.filter(i => i.member_type === 'INTERVIEWER').map(u => u.user_id);
      let additionalAttendees = formDetails.interviewers.filter(i => i.member_type === 'ADDITIONAL_ATTENDEES').map(a => a.user_id);


      this.form = this.fb.group({
        name: [formDetails.name, Validators.required],
        interviewer: [interviewer ? interviewer : null, Validators.required],
        additionalAttendees: [additionalAttendees && additionalAttendees.length > 0 ? additionalAttendees : []],
        interviewType: [formDetails.interview_type, Validators.required],
        location: [formDetails.location, formDetails.interview_type === 'PHONE' ? Validators.nullValidator : Validators.required],
        location_refcode: [this.defaultCountryCode],
        interviewTimezone: [formDetails.time_zone, Validators.required],
        interviewDuration: [formDetails.duration, Validators.required],
        instructions: [formDetails.instructions],
        recommendedDates: [null],
        availableEndDate: []
      });
      this.form.controls['interviewDuration'].valueChanges.subscribe(newValue => {
        this.durationChangedHandler();
      })

      this.setRecommendedDates(formDetails);


    } else {
      this.form = this.fb.group({
        name: [null, Validators.required],
        interviewer: [null, Validators.required],
        additionalAttendees: [null],
        interviewType: [null, Validators.required],
        location: [null],
        location_refcode: [this.defaultCountryCode],
        interviewTimezone: [null, Validators.required],
        interviewDuration: [null, Validators.required],
        instructions: [null],
        recommendedDates: [null]
      });
      this.setDefaultInterviewTitle();
      this.form.controls['interviewDuration'].valueChanges.subscribe(newValue => {
        this.durationChangedHandler();
      })
    }

  }

  setDefaultInterviewTitle() {
    let interviewTitle = this.candidateObject?.first_name ? `Interview with ${this.candidateObject.first_name} ${this.candidateObject?.last_name} ` : '';
    if (interviewTitle && this.jobObject?.template_name) {
      interviewTitle += `for ${this.jobObject.template_name}`;
    }
    this.form?.controls['name']?.setValue(interviewTitle);
  }

  submitted = false;
  today = new Date();

  setRecommendedDates(formDetails) {
    this.recommendedDates = [];
    const keyMap = {}
    let dateObservables = [];
    formDetails.schedules.forEach(element => {
      const formatDate = element.date.split('/');
      let day = `${formatDate[2]}-${formatDate[0]}-${formatDate[1]}`
      if (!keyMap[day]) {
        keyMap[day] = true;
        dateObservables.push(
          {
            onservable: this.loadInterviewSchedules(day).pipe(map(res => {
              return { key: element.date, response: res };
            })),
            day: element.date
          }
        );
      }
    });

    dateObservables.forEach(dateObservable => {
      dateObservable.onservable.subscribe((res: any) => {
        // res.key
        const slots = formDetails.schedules.filter(s => s.date === res.key)?.map((s: any) => (
          {
            "label": s.start_time.substr(0, 5) + '-' + s.end_time.substr(0, 5),
            slots: {
              start_time: s.start_time,
              end_time: s.end_time
            }
          }));

        let slotOptions = [];
        res.response.schedules[0].time_slots.forEach(element => {
          slotOptions.push({
            "label": element.start_time.substr(0, 5) + '-' + element.end_time.substr(0, 5),
            "slots": {
              "start_time": element.start_time.substr(0, 5),
              "end_time": element.end_time.substr(0, 5),
              "is_available": element?.is_available,
              "members": element?.members,
            }
          }
          );

        });

        slotOptions = slotOptions.concat(slots);

        this.recommendedDates.push({
          day: new Date(res.key),
          slots: slots,
          slotOptions: slotOptions,
          isLoading: false
        })
      }, (resp) => {
        const slots = formDetails.schedules.filter(s => s.date === dateObservable.day)?.map((s: any) => ({

          "label": s.start_time.substr(0, 5) + '-' + s.end_time.substr(0, 5),
          "slots": {
            "start_time": s.start_time.substr(0, 5),
            "end_time": s.end_time.substr(0, 5),
            "is_available": s?.is_available,
            "members": s?.members,
          }
        }));
        this.recommendedDates.push({
          day: new Date(dateObservable.day),
          slots: slots,
          slotOptions: slots,
          isLoading: false
        })

      });
    });

  }

  getAddress(event) {
  }

  jobObject;
  candidateObject;
  loadMasterData() {
    forkJoin([this.loadTimeZones(), this.JobDetails, this.CandidateDetails]).subscribe((list: any) => {
      this.detailsLoaded = true;
      this.timeZones = list[0].time_zones;
      this.jobObject = list[1]['job'];
      this.candidateObject = list[2].candidate;
      this.createForm();
    })
  }

  loadMasterDataWithInterviewDetails() {
    forkJoin([this.loadTimeZones(), this.JobDetails, this.CandidateDetails, this.InterviewDetails]).subscribe((list: any) => {
      this.detailsLoaded = true;
      this.timeZones = list[0].time_zones;
      this.jobObject = list[1]['job'];
      this.candidateObject = list[2].candidate;
      this.interviewDetails = list[3].interview;
      this.loadUsers()
      this.interviewDetails.interviewers.forEach(element => {
        if (element.member_type?.toUpperCase() == "INTERVIEWER") {
          this.selectedInterviewers.push(element.user_id);
        }
      });
      this.loadUsersExcluding('', this.selectedInterviewers);
      this.createForm(this.interviewDetails);
    })
  }

  get InterviewDetails() {
    return this.httpService.get(`/configurator/programs/${this.programID}/jobs/${this.jobId}/interviews/${this.interviewId}`);
  }

  get JobDetails() {
    return this.jobService.getJobs(this.jobId);
  }

  get CandidateDetails() {
    return this.candidateService.getCandidateDetail(this.currentCandidateId);
  }

  interviewerSelected(interviwer) {
    this.selectedInterviewers = interviwer;
    this.loadUsersExcluding(this.addsearch, this.selectedInterviewers);
    this.resetTimeSlots();
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

  loadInterviewSchedules(date) {
    let interviwer = this.form.controls['interviewer'].value;
    if (!interviwer) {
      return;
    }
    let url = `/configurator/programs/${this.programID}/jobs/${this.jobId}/interviews/available-schedules?member_ids=${interviwer}`
    let duration = this.form.controls['interviewDuration'].value;
    if (duration) {
      url = url + '&duration=' + duration;
    }
    if (date) {
      url = url + '&scheduled_on=' + date;
    }
    return this.httpService.get(url);
  }

  sidebarClose() {
    this.scheduleInterviews = 'hidden';
    this.form = null;
    this.candidateObject = null;
    this.jobObject = null;
  }

  addSlot() {
    this.recommendedDates.push({ day: null, slots: null, slotOptions: [], isLoading: false });
  }

  loadTimeZones() {
    return this.httpService.get(`/configurator/resources/time_zones?program_id=${this.programID}`);
  }

  loadUsers(pageNo = 1, name = '') {
    this.interviewerLoading = true;
    return this.httpService.get(`/configurator/programs/${this.programID}/members?name=${name}`).subscribe({
      next: (res: any) => {
      this.interviewers = res.members;
      if (this.interviewDetails) {
        this.interviewDetails.interviewers.forEach(element => {
          if (element.member_type?.toUpperCase() == "INTERVIEWER") {
            let indx = this.interviewers.findIndex(interviewer => interviewer.id === element?.user_id);
            if (indx === -1) {
              this.loadUsersDetails(element?.user_id).subscribe({
                next: (res: any) => {
                this.interviewers.push(res.member);
              },
              error: (err) => {

            }});
            }
          }
        });
      }

      this.interviewerLoading = false
    },
    error: (err) => {

    }});
  }

  loadUsersDetails(memberID) {
    return this.httpService.get(`/configurator/programs/${this.programID}/members/${memberID}`);
  }

  loadUsersExcluding(name = '', userIds = []) {
    let userIdsstr

    userIdsstr = userIds.join(",")
    this.additionalAttendiesLoading = true;
    return this.httpService.get(`/configurator/programs/${this.programID}/members?exclude_user_ids=${userIdsstr}&name=${name}`).subscribe({
      next: (res: any) => {
      this.additionalAttendiesLoading = false;
      this.additionalAttendeesList = res.members;
      if (this.interviewDetails) {
        this.interviewDetails.interviewers.forEach(element => {

          if (element.member_type?.toUpperCase() == "ADDITIONAL_ATTENDEES") {
            let indx = this.additionalAttendeesList.findIndex(interviewer => interviewer.id === element?.user_id);

            if (indx === -1) {
              this.loadUsersDetails(element?.user_id).subscribe({
                next: (res: any) => {
                this.additionalAttendeesList.push(res.member);
              },
              error: (err) => {

              }});
            }
          }
        });
      }
    },
    error: (err) => {

    }});
  }

  deleteSlot(i) {
    this.recommendedDates.splice(i, 1);
  }


  onDateChange(date, index) {
    if (this.recommendedDates.filter(d => d.day !== null && d.day !== undefined).some(d => d.day.getTime() === date.getTime())) {
      this.alert.error('this date is already choosen.');
      setTimeout(() => {
        this.recommendedDates[index].day = this.recommendedDates[index].day;
        this.recommendedDates[index] = { ...this.recommendedDates[index] };
        this.recommendedDates = [...this.recommendedDates];
      }
        //this.recommendedDates[index] = { day: null, slots: null, slotOptions: [], isLoading: false
        //}

      );
      return;
    }
    this.recommendedDates[index].day = date;
    this.recommendedDates[index].isLoading = true;
    let dateFormatted = this.datePipe.transform(date,"yyyy-MM-dd"); //this.getFormattedDate(date);
    this.loadInterviewSchedules(dateFormatted).subscribe((data: any) => {
      this.recommendedDates[index].isLoading = false;
      let recommended_time_slots = [];
      data?.schedules[0]?.time_slots.forEach(element => {
        recommended_time_slots.push({
          "label": element.start_time.substr(0, 5) + '-' + element.end_time.substr(0, 5),
          "slots": {
            "start_time": element.start_time.substr(0, 5),
            "end_time": element.end_time.substr(0, 5),
            "is_available": element?.is_available,
            "members": element?.members,
          }
        }
        );

      });
      this.recommendedDates[index].slotOptions = recommended_time_slots
    });
  }
  private mobNumberPattern(control) {
    let MOBILE_REGEXP = /^((\\+91-?)|0)?[0-9]{10}$/;

    return MOBILE_REGEXP.test(control.value) ? null : { pattern: true };
  }
  interviewTypeChanged(value) {
    this.form.controls['location'].setValue(null)
    value === 'PHONE' ? this.form.controls['location'].setValidators([this.mobNumberPattern])
      : this.form.controls['location'].setValidators(Validators.required)
  }

  getFormattedDate(date) {
    if (date) {
      return this.datePipe.transform(date);
    }
  }
  addTagFn = (term) => {
    const email_regexp = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,6})+$/;
    if (!email_regexp.test(term)) {
      return null;
    }
    return term;
  }

  // getFormattedDateForShedules(date) {
  //   if (date) {
  //     var year = date.getFullYear();
  //     var month = 1 + date.getMonth();
  //     month = month.length > 1 ? month : '0' + month;
  //     var day = date.getDate();
  //     day = String(day).padStart(2, '0')
  //     return year + '-' + month + '-' + day;
  //   } else {
  //     return date
  //   }
  // }

  scheduleInterView() {
    this.isLoader = true;
    this.submitted = true;
    if (this.form.invalid) {
      this.alert.error('Please fill all manadatory fileds');
      return;
    }

    const formValue = this.form.getRawValue();

    const schedules = [];

    this.recommendedDates.forEach(recommendedDate => {
      if (recommendedDate.day && recommendedDate.slots && recommendedDate.slots.length > 0) {
        recommendedDate.slots.forEach(slot => {
          schedules.push({
            "date": this.getFormattedDate(recommendedDate.day),
            "start_time": slot.start_time,
            "end_time": slot.end_time,
            "is_prefered": false,
          })
        });
      }
    });

    if (schedules.length === 0) {
      this.alert.error('Please select one slot');
      return;
    }
    let interviewersList = []

    if (formValue.interviewer && formValue.interviewer.length > 0) {
      formValue.interviewer.forEach(a => {
        interviewersList.push({ "user_id": a, "is_interviewer": true });
      });
    }


    if (formValue.additionalAttendees && formValue.additionalAttendees.length > 0) {
      formValue.additionalAttendees.forEach(a => {
        interviewersList.push({ "user_id": a, "is_interviewer": false });
      });
    }

    const request = {
      "name": formValue.name,
      "interview_type": formValue.interviewType,
      "location": formValue.location,
      "location_refcode": formValue.location_refcode,
      "instructions": formValue.instructions,
      "time_zone": formValue.interviewTimezone,
      "duration": formValue.interviewDuration,
      "interviewers": interviewersList,
      "schedules": schedules
    };

    if (this.pageMode === "SCHEDULE_INTERVIEW") {
      this.httpService.post(`/configurator/programs/${this.programID}/jobs/${this.jobId}/interviews/candidates/${this.currentCandidateId}`, request)
        .subscribe({
          next: (resp: any) => {
          this.isLoader = false;
          this.alert.success('Interview Scheduled Successfully');
          this.sidebarClose();
          this.jobService.loadJob(`${this.jobId}`).subscribe({
            next: (data) => {
            setTimeout(() => this.router.navigateByUrl(`jobs/details/job-details/${this.jobId}/interviews`));
          },
          error: (err) => {
            setTimeout(() => this.router.navigateByUrl(`jobs/details/job-details/${this.jobId}/interviews`));
          }})
        },
        error: (error) => {
          this.alert.error(error?.error?.error?.message);
          this.isLoader = false;
        }})
    } else {
      this.httpService.put(`/configurator/programs/${this.programID}/jobs/${this.jobId}/interviews/${this.interviewId}`, request)
        .subscribe({
          next: (resp: any) => {
          this.isLoader = false;
          this.alert.success('Interview Re Scheduled Successfully');
          this.sidebarClose();
          this.eventStream.emit(new EmitEvent(Events.RELOAD_JOB_DETAILS, null));
          // route back or close the side bar
        },
        error: (error) => {
          this.alert.error(error?.error?.error?.message);
          this.isLoader = false;
        }});
    }
  }

  ngOnDestroy() {
    this.subscriptions.forEach(s => s.unsubscribe());
  }
}
