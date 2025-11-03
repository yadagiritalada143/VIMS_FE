import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { JobDetailsService } from '../../job-details.service';
import { AlertService } from '../../../../core/components/alert/alert.service';
import { Events, EventStreamService, } from 'src/app/core/services/event-stream.service';
import { JobService } from 'src/app/jobs/job.service';
import { StatusMessageTypes } from 'src/app/shared/enums';
@Component({
  selector: 'app-candidate-job-view',
  templateUrl: './candidate-job-view.component.html',
  styleUrls: ['./candidate-job-view.component.scss'],
})
export class CandidateJobViewComponent implements OnInit, OnDestroy {
  previousUrl: string;
  tabName;
  subscriptions = [];
  candidateId;
  jobId;
  jobData:any;
  submitedCandidateDetail;
  currentProgram;
  isPotentialFlyout: any;
  isUserJobManager: boolean = false;
  backTabRoutemap = {
    "interviews": "interviews",
    'submissions': "submitted-candidate",
    'offers': 'offers',
    'profile': 'available'
  };
  userDetails: any;
  programId: any;
  userType: any;
  isDsaasVendor: any;
  statusMessageData: any;
  public readonly StatusMessageTypes = StatusMessageTypes;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    public jobService: JobService,
    private jobDetailService: JobDetailsService,
    private storageService: StorageService,
    public alert: AlertService,
    private eventStream: EventStreamService
    ) {
      this.route.queryParamMap.subscribe((params)=> {
        this.isPotentialFlyout = params['params']?.isPotentialFlyout;
      })
     }


  ngOnInit(): void {
    this.userDetails = this.storageService.get(StorageKeys.CURRENT_USER);
    this.userType = this.storageService.get('user_type');
    this.programId = this.storageService.get('PROGRAM_ID');
    this.tabName = this.router.url.split("?")[0].substring(this.router.url.split("?")[0].lastIndexOf('/') + 1);
    this.subscriptions.push(
      this.route.paramMap.subscribe((param) => {
        this.currentProgram = this.storageService.get('CurrentProgram');
        this.candidateId = param.get('candidateId');
        this.jobId = param.get('id');
        if(this.jobId){
          this.getSubmitCandidate();
          this.getJobDetails();
        }
      })
    );
    this.subscriptions.push(this.eventStream.on(Events.RELOAD_SUBMISSION_DETAIL).subscribe((data) => {
      if (data) {
        this.getSubmitCandidate();
      }
    }));
  }
  checkIsDsaasVendor($event){
    this.isDsaasVendor = $event;
  }

  showMessage(detail){
    this.statusMessageData = detail;
  }


  getSubmitCandidate() {
    this.submitedCandidateDetail = null;
    this.jobDetailService.getSubmissionDetails(this.currentProgram?.id, this.jobId, this.candidateId).subscribe({
      next:(data: any) => {
      this.submitedCandidateDetail = {...data.candidate};
      if (this.userType == 'CLIENT') {
        if ( this.jobData?.job_manager_id == this.userDetails?.id ) {
        this.isUserJobManager = false;
      } else {
        this.jobService.get(`/approval/programs/${this.programId}/jobs/${this.jobId}/approval-instances`).subscribe((res: any) => {
          res?.approvers?.forEach(approver => {
            if (approver?.members.find(member => member.id == this.userDetails?.id)) {
              this.isUserJobManager = false;
            } else {
              this.isUserJobManager = true;
            }
          });
        })
      }
    }

    },
    error: err => { }
  });
  }

  getJobDetails(burstCache?) {
    this.subscriptions.push(this.jobDetailService.getJobs(`${this.jobId}`, burstCache).subscribe({
     next: (data: any) => {
        if (data?.job) {
          this.jobData = data?.job;
          this.storageService.set('viewd_job', this.jobData, true);
        }
      },
      error: (err) => {
        this.alert.error(err);
      }
  }));
  }
  ngOnDestroy() {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  back() {
    let jobId = this.route.snapshot.params['id'];
    const is_submission: string = this.route.snapshot.queryParamMap.get('is_submission');
    if(is_submission) {
      this.router.navigateByUrl(`jobs/submissions`)
    }
    else if(this.isPotentialFlyout == 'true'){
      this.router.navigateByUrl(`jobs/details/job-details/${jobId}/submitted-candidate`)
    }
    else if(!this.jobId && this.candidateId ){
      this.router.navigateByUrl(`candidates/list`)
    }
    else {
      jobId && jobId !== ''
                ? this.router.navigateByUrl(`jobs/details/job-details/${jobId}`)  // this.router.navigateByUrl(`jobs/details/job-details/${jobId}/${redirectTo}`)
                  : this.router.navigateByUrl('/jobs/list')
    }

  }
}
