import { Component, OnInit } from '@angular/core';
import { CandidateService } from 'src/app/candidates/service/candidate.service';
import { JobDetailsService } from 'src/app/jobs/job-details/job-details.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { ProgramService } from 'src/app/programs/program.service';

@Component({
  selector: 'app-schedule-interview',
  templateUrl: './schedule-interview.component.html',
  styleUrls: ['./schedule-interview.component.scss']
})
export class ScheduleInterviewComponent implements OnInit {
  interviewDetails = true;
  dateAndTime = false;
  btnText = 'Continue';
  interviewTypeIndex = 0;
  currentJobid = '';
  candidateId = '';
  timezones = [];
  clients = [];
  avaliableOnly;
  public scheduleInterviewForm: UntypedFormGroup;
  programDetails = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
  public street_1 = [];
  public street_2 = [];
  public city = [];
  public state = [];
  public zipcode = [];
  options: any = {
    language: 'English',
    format12h: true,
    alwaysVisible: true
  };

  constructor(
    private candidateService: CandidateService,
    private alert: AlertService,
    private jobService: JobDetailsService,
    private fb: UntypedFormBuilder,
    private route: ActivatedRoute,
    private storageService: StorageService,
    private programService: ProgramService,

  ) { }

  ngOnInit(): void {
    this.currentJobid = this.route.snapshot.params['jobid'];
    this.candidateId = this.route.snapshot.params['candidateId'];
    this.scheduleInterviewForm = this.fb.group({
      title: [null, Validators.required],
      interviewer: [null, Validators.required],
      attendees: [null, Validators.required],
      type: [null, Validators.required],
      joinLink: [null, ''],
      location: [null, ''],
      phone: [null, ''],
      timezone: [null, Validators.required],
      instruction: [null, Validators.required],
      dates: [null, '']
    });
    this.getTimezones();
    this.getClientList();
    this.scheduleInterviewForm.get('type').valueChanges.subscribe((data) => {

    });
  }
  getCandidateDetailsById(Id) {
    this.candidateService.getCandidateDetail(Id).subscribe({
      next: (data: any) => {
    },
      error: (error) => {
        this.alert.error(errorHandler(error));
      }})
  }

  getjobDetailsById(Id) {
    this.jobService.getJobs(Id).subscribe({
      next: (data) => {
    },
      error: (err) => {
        this.alert.error(errorHandler(err));
      }})
  }
  goTointerviewDetails() {
    this.interviewDetails = true;
    this.dateAndTime = false;
    this.btnText = 'Continue';
  }
  goTodateTime() {
    this.interviewDetails = false;
    this.dateAndTime = true;
    this.btnText = 'Invite';
  }
  clickToContinue(btnText) {
    if (btnText == 'Continue') {
      this.interviewDetails = false;
      this.dateAndTime = true;
      this.btnText = 'Invite';
    } else if (btnText == 'Invite') {
      this.scheduleInterview();
    }
  }

  scheduleInterview() {
    const form = this.scheduleInterviewForm.value;
    var selectedInterviewers = [];
    for (let i = 0; i < form.interviewer.length; i++) {
      let userId = form.interviewers[i];
      selectedInterviewers.push({ user_id: userId });
    }
    const payload = {
      name: form.title,
      interview_type: form.type,
      location: form.location,
      instructions: form.instruction,
      time_zone: form.timezone,
      duration: '',
      interviewers: selectedInterviewers,
      schedules: []
    }
    this.jobService.releaseOffer(this.currentJobid, this.candidateId, payload).subscribe({
      next: (data: any) => {
      if (data) {
        this.alert.success('Interview scheduled successfully');
      }
    }, 
    error: (err) => {
      this.alert.error(errorHandler(err));
    }});
  }
  selectInterviewType(type) {
    if (type == 'virtual') {
      this.interviewTypeIndex = 0;
      this.scheduleInterviewForm.patchValue({
        type: 'VIRTUAL'
      });
    } else if (type == 'inPerson') {
      this.interviewTypeIndex = 1;
      this.scheduleInterviewForm.patchValue({
        type: 'F2F'
      });
    } else if (type == 'call') {
      this.interviewTypeIndex = 2;
      this.scheduleInterviewForm.patchValue({
        type: 'PHONE'
      });
    }
  }
  getTimezones() {
    this.jobService.getTimezones().subscribe({
      next: (data: any) => {
      if (data) {
        this.timezones = data.time_zones;
      }
    }, 
    error: (err) => {
      this.alert.error(errorHandler(err));
    }});
  }
  getClientList() {
    let currentClientId = this.programDetails['client']?.id;
    this.programService.get(`/configurator/organizations/${currentClientId}/members`).subscribe({
      next: (data: any) => {
        if (data) {
          this.clients = data.members;
        }
      },
      error: (err) => {
        this.alert.error(errorHandler(err));
      }});
  }
  getAddress(place: object) {
    this.street_1[0] = this.getStreet(place);
    this.city[0] = this.getCity(place);
    this.zipcode[0] = this.getPostCode(place);
    this.state[0] = this.getState(place);
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

  toggleAvailability() {
    this.avaliableOnly = !this.avaliableOnly;
  }
}
