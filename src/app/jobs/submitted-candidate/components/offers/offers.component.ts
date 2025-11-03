import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { JobDetailsService } from '../../../../jobs/job-details/job-details.service';
import { errorHandler } from '../../../../shared/util/error-handler';
import { ActivatedRoute,Router } from '@angular/router';
import { CandidateService } from 'src/app/candidates/service/candidate.service';
import { EventStreamService, Events, EmitEvent } from 'src/app/core/services/event-stream.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-offers',
  templateUrl: './offers.component.html',
  styleUrls: ['./offers.component.scss']
})
export class OffersComponent implements OnInit, OnDestroy {
  private subscriptions = [];
  candidateInfo = false;
  candidateInfoEdit = {
    visibility: false,
    title: 'Edit'
  };
  jobInfo = false;
  jobInfoEdit = {
    visibility: false,
    title: 'Edit'
  };
  rateInfo = false;
  offerData;
  currentJobid;
  rateInfoEdit = {
    visibility: false,
    title: 'Edit'
  };
  offerPayRate = '';
  offerBillRate = '';
  notes = '';
  timesheetManager = '';
  jobManager = '';
  availableStartDate = '';
  noteInfo = false;
  candidateId = '';
  candidateData;
  @Input() jobData;
  submissionData;
  currentOfferId = '';
  isEditMode = false;
  updatedOfferDetails;
  isPanelUpdate = false;
  public dataLoader : any;
  constructor(
    private jobService : JobDetailsService,
    private alertService: AlertService,
    private route: ActivatedRoute,
    private candidateService : CandidateService,
    private router: Router,
    private eventStream: EventStreamService,
  ) { }

  ngOnInit(): void {
    this.currentJobid = this.route.snapshot.params['jobid'];	
    this.candidateId = this.route.snapshot.params['candidateId'];
    if(this.currentJobid){
      this.getJobDetails();
      this.getSubmittedCandidateDetails();
    }
    this.subscriptions.push(this.route.queryParams.subscribe(params=>{
      let action = params['action'];
      let offerId = params['offerId'];
      this.currentOfferId = offerId;
      if(action == 'Counter'){
        this.clickCounterOffer(offerId);
      }
     }));
     this.subscriptions.push(this.eventStream.on(Events.OFFER_DETAIL_PANEL).subscribe((data) => {
      if (!data.value) {
        this.updatedOfferDetails = data.data;
        this.availableStartDate = this.updatedOfferDetails['startDate'];
        this.offerBillRate = this.updatedOfferDetails['rate'];
        this.isPanelUpdate = true;
        if(data.type == 'counter' && this.currentOfferId){
          this.clickCounterOffer(this.currentOfferId);
        }
      }
    }));
  }
  toggleCandidateInfo() {
    this.candidateInfo = !this.candidateInfo;
  }
  toggleJobInfo() {
    this.jobInfo = !this.jobInfo;
  }
  toggleRateInfo() {
    this.rateInfo = !this.rateInfo;
  }
  toggleNotes() {
    this.noteInfo = !this.noteInfo;
  }
  editInformation() {
    this.candidateInfoEdit.visibility = !this.candidateInfoEdit.visibility;
    this.candidateInfoEdit.visibility ? (this.candidateInfoEdit.title = "Save") : (this.candidateInfoEdit.title = "Edit");
    this.candidateInfo = false;
  }
  jobInformation() {
    this.jobInfoEdit.visibility = !this.jobInfoEdit.visibility;
    this.jobInfoEdit.visibility ? (this.jobInfoEdit.title = "Save") : (this.jobInfoEdit.title = "Edit");
    this.jobInfo = false;
  }
  rateInformation() {
    this.rateInfoEdit.visibility = !this.rateInfoEdit.visibility;
    this.rateInfoEdit.visibility ? (this.rateInfoEdit.title = "Save") : (this.rateInfoEdit.title = "Edit");
    this.rateInfo = false;
  }
  getOfferDetails(){
    this.dataLoader = true;
    if (this.currentJobid) {
      this.subscriptions.push(this.jobService.getOfferDetails(this.currentJobid,this.candidateId,this.currentOfferId).subscribe({
        next: (data: any) => {
        if (data) {
          this.dataLoader = false;
          this.offerData = data.offer;
          this.availableStartDate= this.offerData.stages[0].available_start_date;
        }
      }, 
      error: (err) => {
        this.alertService.error(errorHandler(err));
        this.dataLoader = false;
      }}));
    }  
  }
  releaseOffer() {
    if(this.isPanelUpdate && this.availableStartDate && (this.offerBillRate || this.offerPayRate)){
      const payload = {
        available_start_date: this.availableStartDate,
        bill_rate: this.offerBillRate,
        pay_rate: this.offerPayRate,
        notes: this.notes
      }
      this.subscriptions.push(this.jobService.releaseOffer(payload, this.currentJobid, this.candidateId).subscribe({
        next: (data: any) => {
        if (data) {
          this.currentOfferId = data.offer.id;
          this.isEditMode = false;
          this.alertService.success('Offer released successfully');
          this.getOfferDetails();
        }
      }, 
      error: (err) => {
        this.alertService.error(errorHandler(err));
      }}));
    }else{
      this.alertService.warn('Please verify the details properly.');
      this.eventStream.emit(new EmitEvent(Events.OFFER_DETAIL_PANEL,{value:true}));
    }
  }
  getJobDetails(){
    this.dataLoader = true;
    this.subscriptions.push(this.jobService.getJobs(this.currentJobid).subscribe({
      next: (data: any) => {
      if (data?.data) {
        this.dataLoader = false;
        this.jobData = data.data[0];
        // candidate in job api (not correctly coming)
        // const candidate =  this.jobData.candidate.filter(can=>can.id === this.candidateId);
        // if(candidate){
        //   this.submissionData = candidate[0];
        //   this.currentOfferId = this.submissionData?.offer_id;
        //   if(this.currentOfferId){
        //     this.getOfferDetails();
        //   }
        // }
        this.jobManager = this.jobData?.job_manager?.first_name + ' ' + this.jobData?.job_manager?.last_name
      }  
    }, 
    error: (err) => {
        this.dataLoader = false;
        this.alertService.error(errorHandler(err));
    }}));
  }
  getSubmittedCandidateDetails(){
    this.dataLoader = true;
    this.subscriptions.push(this.jobService.fetchCurrentSubmitCandidate(this.candidateId,this.currentJobid).subscribe({
      next: (data: any) =>{
      if(data){
        this.dataLoader = false;
        this.submissionData = data.candidate;
        this.currentOfferId = data.candidate?.offer_id;
        if(this.currentOfferId){
          this.getOfferDetails();
        }	
      }
    },
    error: (err) => {
      this.dataLoader = false;
      this.alertService.error(errorHandler(err));
    }}));
  }
  goToSubmittedCandidate(){
      this.router.navigateByUrl(`/jobs/details/job-details/${this.currentJobid}/submitted-candidate`);
  }
  clickCounterOffer(offerId){
    this.isEditMode = true;
    this.currentOfferId = offerId; 
  }
  counterOffer(){
    const payload ={
      status: "RELEASED",
      available_start_date: this.availableStartDate,
      bill_rate: this.offerBillRate,
      pay_rate: this.offerPayRate,
      notes: this.notes
    }
    this.subscriptions.push(this.jobService.counterOffer(payload,this.currentJobid,this.candidateId,this.currentOfferId).subscribe({
      next: (data: any) =>{
      if(data){
        this.alertService.success('Offer updated successfully');
        this.isEditMode = false;
        this.router.navigate([`/jobs/submission/${this.currentJobid}/candidate/${this.candidateId}/offer`]);
      }
    },
    error: (err) => {
      this.alertService.error(errorHandler(err));
  }}));
  }
  ngOnDestroy(): void {
    this.subscriptions?.forEach(sub => sub.unsubscribe());
  }
}

