import { Component, OnInit, ViewChild, Renderer2, ElementRef, OnDestroy } from '@angular/core';
import { JobDetailsService } from '../job-details/job-details.service';
import { ActivatedRoute,Router } from '@angular/router';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { errorHandler } from '../../shared/util/error-handler';
import { EmitEvent, Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { Subscription } from 'rxjs';
import { StorageService } from 'src/app/core/services/storage.service';
@Component({
  selector: 'app-submitted-candidate',
  templateUrl: './submitted-candidate.component.html',
  styleUrls: ['./submitted-candidate.component.scss']
})
export class SubmittedCandidateComponent implements OnInit, OnDestroy {
  private subscriptions = [];
  toggleContent = false;
  actionVisibility = false;
  fixedHeader = false;
  candidateId = '';
  currentJobid;
  submissionData;
  jobData;
  offerId;
  public userType = this.storageService.get('user_type');
  @ViewChild('actionButton', { read: ElementRef, static: false }) actionButton: ElementRef;
  @ViewChild('actionDropdown', { read: ElementRef, static: false }) actionDropdown: ElementRef;
  constructor(
    private jobService : JobDetailsService,
    private route: ActivatedRoute,
    private router: Router,
    public storageService: StorageService,
    private alertService: AlertService,
    private _eventStrem: EventStreamService,
    private render: Renderer2) {
      this.render.listen('window', 'click', (e: Event) => {
        if ((this.actionButton && this.actionButton.nativeElement.contains(e.target) && !this.actionVisibility) ||
          (this.actionDropdown && this.actionDropdown.nativeElement.contains(e.target))) {
          this.actionVisibility = true;
        } else {
          this.actionVisibility = false;
        }
      });
     }

  ngOnInit(): void {
    this.currentJobid = this.route.snapshot.params['jobid'];	
    this.candidateId = this.route.snapshot.params['candidateId'];
    this.getSubmittedCandidateDetails();
    this.getJobDetails();
    this.subscriptions.push(this._eventStrem.on(Events.UPDATED_CANDIDATE_STATUS).subscribe((data)=>{
      if(data){
        this.getSubmittedCandidateDetails();
      }
    }));
  }
  toggleSection() {
    this.toggleContent = !this.toggleContent;
  }
  getSubmittedCandidateDetails(){
    this.subscriptions.push(this.jobService.fetchCurrentSubmitCandidate(this.candidateId,this.currentJobid).subscribe((data: any) =>{
      if(data){
        this.submissionData = data.candidate;
        this.offerId = data.candidate?.offer_id;
      }
    }, err => {
      this.alertService.error(errorHandler(err));
    }));
  }
  getJobDetails(){
    this.subscriptions.push(this.jobService.getJobs(this.currentJobid).subscribe({
      next: (data: any) => {
      if (data.data) {
        this.jobData = data.data[0];
      }  
    }, 
    error: (err) => {
        this.alertService.error(errorHandler(err));
    }}));
  }
  counterOffer(ev){
    if(ev){
      this.actionVisibility = false;
      this.router.navigate([`/jobs/submission/${this.currentJobid}/candidate/${this.candidateId}/offer`],{ queryParams: { offerId: this.offerId, action:'Counter'}});
    }
  }
  withdrawCandidate(){
      this._eventStrem.emit(new EmitEvent(Events.WITHDRAW_CANDIDATE, { value: true, candidateId: this.candidateId, jobId:  this.currentJobid }));
  }
  rejectCandidate(){
    this._eventStrem.emit(new EmitEvent(Events.REJECT_CANDIDATE, { value: true, candidateId: this.candidateId, jobId:  this.currentJobid }));
  }
  scheduleInterview(){
    this.router.navigateByUrl(`/jobs/submission/${​​this.currentJobid}​​/candidate/${​​this.candidateId}​​/schedule-interview`);
  }
  openOfferDetailPanel(eve){
    let data = {
      startDate: this.jobData?.start_date,
      endDate: this.jobData?.end_date,
      jobId:this.currentJobid,
      candidateId: this.candidateId,
      offerId:this.offerId
    }
    if(eve){
      if(this.offerId){
        this._eventStrem.emit(new EmitEvent(Events.OFFER_DETAIL_PANEL,{value:true, data:data, type:'counter'}));
      }else{
        this._eventStrem.emit(new EmitEvent(Events.OFFER_DETAIL_PANEL,{value:true, data:data, type:'release'}));
      }
    }
  }
  ngOnDestroy(): void {
    this.subscriptions?.forEach(sub => sub.unsubscribe());
  }
}
