import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CandidateService } from 'src/app/candidates/service/candidate.service';
import { EventStreamService, Events } from 'src/app/core/services/event-stream.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { JobDetailsService } from '../../job-details.service';
import { CryptoService } from 'src/app/core/services/crypto.service';

@Component({
  selector: 'app-interview-details',
  templateUrl: './interview-details.component.html',
  styleUrls: ['./interview-details.component.scss'],
})
export class InterviewDetailsComponent implements OnInit, OnDestroy {
  private subscriptions = [];
  viewInterviewDetails = "hidden";
  candidateId: '';
  jobId: '';
  currentProgram: any;
  candidateInfo: any;
  intDetails: any;
  locationLabel = 'Interview Location';
  interviewer:'';
  additionalAttendees:any = [];
  attendeeNames: any = '';
  constructor(
    private eventStream: EventStreamService,
    private route : ActivatedRoute,
    private storageService: StorageService,
    private jobService : JobDetailsService,
    private candidateService : CandidateService,
    private alert: AlertService,
    private cryptoService: CryptoService
  ) { }

  ngOnInit(): void {
    this.candidateId = this.route.snapshot.params['candidateId'];
    this.currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.jobId = this.route.snapshot.params['jobid'];
    if(this.jobId === undefined ||this.jobId === null || this.jobId === ''){
      this.jobId = this.route.snapshot.params['id'];
    }
    this.subscriptions.push(this.eventStream.on(Events.VIEW_INTERVIEW_DETAILS).subscribe((data) => {
      if (data.value) {
        let interviewID = data.value.interviewId;
        if(data.value.candidateId){
          this.candidateId = data.value.candidateId;
        }
        this.viewInterviewDetails = 'visible';
        this.interviewDetails(this.currentProgram.id,this.jobId,interviewID);
        this.getCandidateDetails(this.candidateId);
      } else {
        this.viewInterviewDetails = 'hidden';
      }
    }));
  }

  sidebarClose(){
    this.intDetails = '';
    this.interviewer = '';
    this.additionalAttendees = [];
    this.attendeeNames = '';
    this.viewInterviewDetails = 'hidden';
  }

  interviewDetails(programId,jobId,interviewId){
    this.subscriptions.push(this.jobService.getInterviewDetails(programId,jobId,interviewId).subscribe((data: any)=>{
      if(data){
        this.intDetails = data.interview;
        if(this.intDetails?.interview_type === 'F2F'){
          this.locationLabel = 'Interview Location';
        }else if(this.intDetails?.interview_type === 'PHONE'){
          this.locationLabel = 'Contact Details';
        }else if(this.intDetails?.interview_type === 'VIRTUAL'){
          this.locationLabel = 'Interview Joining Link';
        }
        else{this.locationLabel = 'Interview Location';}
        data?.interview?.interviewers.forEach((element: any) => {
          if(element?.member_type == "INTERVIEWER"){
            this.candidateService.getuser(element.user_id).subscribe(async (data: any) =>{
              this.interviewer = data?.user?.full_name;
            })
          }else if(element?.member_type == "ADDITIONAL_ATTENDEES"){
            this.candidateService.getuser(element.user_id).subscribe(async (data: any) =>{
              this.additionalAttendees.push(data?.user?.full_name);
            })
          }
        });
      }
    }));
  }

  additionalAttendee(){
    this.attendeeNames = this.additionalAttendees.join(",");
    return this.attendeeNames;
  }

  getCandidateDetails(candidateId){
    this.subscriptions.push(this.candidateService.getCandidateDetail(candidateId).subscribe((data: any)=>{
      this.candidateInfo = data.candidate;
    }));
  }
  downloadResume(){
    if(this.candidateInfo.resume_url){
      const linkSource = this.cryptoService?.decrypt(this.candidateInfo?.resume_url);
      const downloadLink = document.createElement("a");
      const fileName = this.candidateInfo.resume;
      downloadLink.href = linkSource;
      downloadLink.download = fileName;
      downloadLink.click();
    }
    else{
      this.alert.error(`No resume found for this candidate.`);
    }
  }
  ngOnDestroy(): void {
    this.subscriptions?.forEach(sub => sub.unsubscribe());
  }
}
