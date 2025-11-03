import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CandidateService } from 'src/app/candidates/service/candidate.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { JobDetailsService } from '../../job-details.service';
import { forkJoin, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { CalculateDurationService } from 'src/app/core/services/calculate-duration.service';
import { DATE_FORMAT } from 'src/app/library/date-format/date-format.model';

@Component({
  selector: 'app-interview-details-sidebar',
  templateUrl: './interview-details-sidebar.component.html',
  styleUrls: ['./interview-details-sidebar.component.scss']
})
export class InterviewDetailsSidebarComponent implements OnInit {
  showInstruction = false;
  @Input() data;

  @Input() set InterviewId(value) {
    if (!!!value || !!!this.currentProgram) {
      return;
    }
    this.interviewDetails(this.data.programId, this.jobId, value);
  };

  viewInterviewDetails = "hidden";
  candidateId: '';
  jobId: '';
  currentProgram: any;
  candidateInfo: any;
  intDetails: any;
  phoneLocation: any;
  locationLabel = 'Interview Location';
  interviewer = [];
  additionalAttendees: any = [];
  attendeeNames: any = '';
  detailsLoaded = false;
  jobDetailsData;

  popoverActive = false;
  isAlertError: boolean = false;
  candidateStatus: string;
  candidateStatusReason: any;
  candidateStatusNote: any;

  public showadditionalemail:boolean;
  constructor(
    private route: ActivatedRoute,
    private jobService: JobDetailsService,
    private candidateService: CandidateService,
    private alert: AlertService,
    private datePipe: LocalDateFormatPipe,
    private calculate: CalculateDurationService
  ) { }

  ngOnInit(): void {
    this.jobId = this.route.snapshot.params['jobid'];
    if (this.jobId === undefined || this.jobId === null || this.jobId === '') {
      this.jobId = this.route.snapshot.params['id'];
    }
  }

  sidebarClose() {
    this.intDetails = '';
    this.interviewer = [];
    this.additionalAttendees = [];
    this.attendeeNames = '';
    this.viewInterviewDetails = 'hidden';
  }

  getJobDetails(id) {
    this.jobService.loadJob(id).subscribe((res) => {
      let jobdetails = res['job'] || { job_manager: {} };
      this.jobDetailsData = jobdetails;
    });
  }

  getDate(d) {
    return this.datePipe.transform(
      d,
      DATE_FORMAT.FORMATMDY,
      null,
      null,
      true,
      this.jobDetailsData?.hierarchy[0]?.preferred_date_format || this.currentProgram?.defaultDateFormat,
    );
  }

  interviewDetails(programId, jobId, interviewId) {
    this.detailsLoaded = true
    this.jobService.getInterviewDetails(programId, jobId, interviewId).subscribe((data: any) => {
      this.getJobDetails(jobId);
      if (data && data.interview) {
        this.detailsLoaded = false
        this.intDetails = data.interview;
        this.intDetails.schedules.forEach(schedule => {
          schedule.duration = this.calculate.calculateDuration(schedule.start_time, schedule.end_time);
        })
        this.alertHandler(this.intDetails);
        this.intDetails.name = this.jobService.toTitleCase(this.intDetails.name)
        this.phoneLocation = `${this.intDetails?.location_refcode} ${this.intDetails?.location}`;
        this.intDetails.id = this.intDetails.id ? this.intDetails.id.substr(0, 4).toUpperCase() : '';
        if (this.intDetails?.interview_type === 'F2F') {
          this.locationLabel = 'Interview Location';
        } else if (this.intDetails?.interview_type === 'PHONE') {
          this.locationLabel = 'Contact Details';
        } else if (this.intDetails?.interview_type === 'VIRTUAL') {
          this.locationLabel = 'Interview Joining Link';
        }
        else { this.locationLabel = 'Interview Location'; }
        const interviewersObservables:Array<Observable<any>> = [];
        this.additionalAttendees = [];
        const additionalAttendeesObservables:Array<Observable<any>> = [];
        data?.interview?.interviewers.forEach((element) => {
          if (element?.member_type == 'INTERVIEWER') {
            interviewersObservables.push(this.candidateService
              .getuser(element.user_id)
              .pipe(
                tap((data: any) => {
                  this.interviewer.push(data?.user);
                })
              )
            );
          } else if (element?.member_type == 'ADDITIONAL_ATTENDEES') {
            if (this.checkadditonal(element?.user_id)) {
              this.showadditionalemail=false;
              additionalAttendeesObservables.push(
                this.candidateService
                  .getuser(element.user_id)
                  .pipe(
                    tap((data: any) => {
                      this.additionalAttendees.push(data?.user);
                    })
                  ));
            }
            else {
              this.showadditionalemail=true;
              this.additionalAttendees.push(element.user_id)
            }
          }
        });

        if (interviewersObservables.length > 0) {
          forkJoin(interviewersObservables).subscribe(_ => {
            this.displayInterviewers = this.interviewer.splice(0, 2);
            this.displayInterviewersNames =
              this.displayInterviewers && this.displayInterviewers.length > 0
                ? this.displayInterviewers.map((u) => u.full_name).join(',')
                : '';
            this.AddDisplayInterviewrs = this.interviewer;
          });
        }
        if (additionalAttendeesObservables.length > 0) {
          forkJoin(additionalAttendeesObservables).subscribe(_ => {
            this.displayAddAttendees = this.additionalAttendees.splice(0, 2);
            this.displayAddAttendeesNames =
              this.displayAddAttendees && this.displayAddAttendees.length > 0
                ? this.displayAddAttendees.map((u) => u.full_name).join(',')
                : '';

            this.AddDisplayAddAttendees = this.additionalAttendees;
          });
        }
      } else {
        this.intDetails = null;
      }

    })
  }
  displayInterviewers;
  displayInterviewersNames;
  AddDisplayInterviewrs;

  displayAddAttendees;
  displayAddAttendeesNames;
  AddDisplayAddAttendees

  
  downloadResume() {
    if (this.candidateInfo.resume_url) {
      const linkSource = this.candidateInfo.resume_url;
      const downloadLink = document.createElement("a");
      const fileName = this.candidateInfo.resume;
      downloadLink.href = linkSource;
      downloadLink.download = fileName;
      downloadLink.click();
    }
    else {
      this.alert.error(`No resume found for this candidate.`);
    }
  }

  showHideInstruction() {
    this.showInstruction = !this.showInstruction;
  }

  checkadditonal(id) {
    let a = id;
    if (a.includes('-')) {
      return true;
    }
    else {
      return false;
    }

  }


  showPopover() {
    this.popoverActive = true;
  }

  hidePopOver() {
    this.popoverActive = false;
  }

  alertHandler(data) {
    const candidateStatus = data?.status;
    switch(candidateStatus) {
      case 'REJECTED':
        this.isAlertError = true;
        this.candidateStatus = "Candidate Rejected";
        break;
    }
    if(this.isAlertError) {
      this.candidateStatusReason = data?.status_reason;
      this.candidateStatusNote = data?.status_note;
    }
    this.isAlertError = this.isAlertError && (!!this.candidateStatusReason || !!this.candidateStatusNote);
  }

}
