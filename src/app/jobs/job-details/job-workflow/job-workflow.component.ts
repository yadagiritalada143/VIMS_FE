import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { EventStreamService, Events } from 'src/app/core/services/event-stream.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { multiWorkflow } from 'src/app/shared/interfaces';
@Component({
  selector: 'app-job-workflow',
  templateUrl: './job-workflow.component.html',
  styleUrls: ['./job-workflow.component.scss']
})
export class JobWorkflowComponent implements OnInit {
  public multiApprovals: multiWorkflow[] = []
  jobId: string = "";
  jobStatus: string = "";
  versionNumber: number;
  currentProgram: any;
  isJobReview;
  jobDetails
  constructor(
    private activatedRoute: ActivatedRoute,
    private storageS: StorageService,
    private eventStream: EventStreamService,
    ) { }

  ngOnInit(): void {
    this.activatedRoute.parent?.data.subscribe((result:any) => {
      this.jobDetails = result?.jobResolvedData;
      this.currentProgram = this.storageS.get(StorageKeys.CURRENT_PROGRAM);
      this.jobId = this.activatedRoute.snapshot.parent.params.id;
      this.isJobReview = this.storageS.get(StorageKeys.CURRENT_PROGRAM)?.config?.pending_job_review;      
      this.approvalVersion({ version: this.jobDetails?.job?.version, status: this.jobDetails?.job?.status })
    });
    this.eventStream.on(Events.UPDATE_JOB_VERSION).subscribe((event)=>{
      this.approvalVersion(event)
    });
  }

  approvalVersion(event){
    if(this.versionNumber !== undefined) return;
    this.versionNumber = event?.version;
    this.jobStatus = event?.status;
    if(this.jobStatus?.toLocaleLowerCase() == 'pending_approval_sourcing') {
      this.jobStatus = 'pending_approval';//as for pending approval sourcing also we have to open approval tab
    }
    if (this.versionNumber > 0) {
      this.multiApprovals = [
        { name: 'review', api_url: `/approval/programs/${this.currentProgram?.id}/jobs/${this.jobId}/approval-instances?workflow_action=REVIEW-V-${this.versionNumber}`, status: 'pending_review', workflow_type: 'review', isReplaceMember: true },
        { name: 'approval', api_url: `/approval/programs/${this.currentProgram?.id}/jobs/${this.jobId}/approval-instances?workflow_action=APPROVAL-V-${this.versionNumber}`, status: 'pending_approval', workflow_type: 'approval', isReplaceMember: true },
      ];
    } else {
      this.multiApprovals = [
        { name: 'review', api_url: `/approval/programs/${this.currentProgram?.id}/jobs/${this.jobId}/approval-instances?workflow_action=REVIEW`, status: 'pending_review', workflow_type: 'review', isReplaceMember: true },
        { name: 'approval', api_url: `/approval/programs/${this.currentProgram?.id}/jobs/${this.jobId}/approval-instances?workflow_action=APPROVAL`, status: 'pending_approval', workflow_type: 'approval', isReplaceMember: true },
      ];
    }
    if(!this.isJobReview) {
      this.multiApprovals.shift();
    }
  }
 
}
