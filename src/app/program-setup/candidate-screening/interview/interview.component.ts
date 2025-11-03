import { Component, OnInit } from '@angular/core';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { HttpService } from 'src/app/core/services/http.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';

@Component({
  selector: 'app-interview',
  templateUrl: './interview.component.html',
  styleUrls: ['./interview.component.scss'],
})
export class InterviewComponent implements OnInit {
  isPendingInterviewReview: any;
  isShortlisting: any;
  isAllowAdditionalAttendees: any;
  programID: any;
  payload: any = [];
  currentProgram: any;

  constructor(
    private alert: AlertService,
    private httpService: HttpService,
    private storageService: StorageService
  ) {}

  ngOnInit(): void {
    this.currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.programID = this.currentProgram?.id;
    this.isPendingInterviewReview = this.currentProgram.config?.interview?.pending_interview_review;
    this.isShortlisting = this.currentProgram.config?.interview?.is_work_location_master_enabled;
    this.isAllowAdditionalAttendees = this.currentProgram.config?.interview?.is_additional_attendees_from_out_organization;
  }

  pendingInterviewReview(event) {
    let dataPayload = [];
    let payload = {};
    let interview = {};
    if (!Object.keys(interview).length) {
      Object.assign(interview, { pending_interview_review: event });
    }
    payload = { interview: interview };
    dataPayload.push(payload);
    this.httpService.put(`/configurator/programs/${this.programID}/update_config`, dataPayload).subscribe((res: any) => {
      if (res) {
        this.currentProgram.config.interview.pending_interview_review = event;
        this.storageService.set('CurrentProgram', this.currentProgram, true);
        this.alert.success('Settings updated successfully.');
      }
    });
  }

  workLocationMaster(event) {
    let dataPayload = [];
    let payload = {};
    let interview = {};
    if (!Object.keys(interview).length) {
      Object.assign(interview, { is_work_location_master_enabled: event });
    }
    payload = { interview: interview };
    dataPayload.push(payload);
    this.httpService.put(`/configurator/programs/${this.programID}/update_config`, dataPayload).subscribe((res: any) => {
      if (res) {
        this.currentProgram.config.interview.is_work_location_master_enabled = event;
        this.storageService.set('CurrentProgram', this.currentProgram, true);
      }
    });
  }

  allowAdditionalAttendees(event) {
    let dataPayload = [];
    let payload = {};
    let interview = {};
    if (!Object.keys(interview).length) {
      Object.assign(interview, { is_additional_attendees_from_out_organization: event });
    }
    payload = { interview: interview };
    dataPayload.push(payload);
    this.httpService.put(`/configurator/programs/${this.programID}/update_config`, dataPayload).subscribe((res: any) => {
      if (res) {
        this.currentProgram.config.interview.is_additional_attendees_from_out_organization = event;
        this.storageService.set('CurrentProgram', this.currentProgram, true);
      }
    });
  }
}
