import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { EmitEvent, Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { StorageService, StorageKeys } from 'src/app/core/services/storage.service';
import { JobService } from 'src/app/jobs/job.service';
import { ApprovalStatus } from 'src/app/shared/enums';

@Component({
  selector: 'app-candidate-job-submission-rehire-approval',
  templateUrl: './candidate-job-submission-rehire-approval.component.html',
  styleUrls: ['./candidate-job-submission-rehire-approval.component.scss']
})
export class CandidateJobSubmissionRehireApprovalComponent implements OnInit {
@Output() hideApprovalRequest = new EventEmitter();
@Input() submissionId:any;
@Input() submissionData:any;
@Output() loadCandidateData = new EventEmitter();
approvalList:any;
rehireStatus:any;
currentProgram:any;
programId:any;
hasOwnApprovalPending:any;
approvalStatus = ApprovalStatus;
offerStatus:any;
candidateId:any;
jobId:any;
dataLoader: boolean = true;
  constructor(
    public jobService : JobService,
    private storage: StorageService,
    private _eventStrem: EventStreamService,
    private route: ActivatedRoute,

  ) { }

  ngOnInit(): void {
    this.currentProgram =this.storage.get(StorageKeys.CURRENT_PROGRAM);
    this.programId = this.currentProgram?.id;
    this.getApproversList();
    this.route.parent?.params.subscribe(params => {
      this.candidateId = params['candidateId'];
      this.jobId = params['id'];

    });
  }
  plusFive = 5;
  moreRecords(){
    this.plusFive += 5;
  }

  goToDetailsPage(){
    this.hideApprovalRequest.emit(true)
  }

  getCandidateData(){
    this.loadCandidateData.emit(true);
  }

  showCandidateSubmission(event){
    if(event){
      this.getCandidateData();
      this.goToDetailsPage();
    }
  }


  getStatusStyleClass(status) {
    status = status.toLowerCase();
    let className = '';
    switch (status) {
      case this.approvalStatus.pending:
        className = 'no-approved-panel';
        break;
      case this.approvalStatus.approved:
        className = 'approved-panel';
        break;
      case this.approvalStatus.rejected:
        className = 'rejected';
        break;
      default:
        break;
    }
    return className;
  }


  reverseSnakeCase(value) {
    value = value?.toLowerCase();
    if(value){
      value = value.split("_").join(" ");
      value = this.toTitleCase(value);
    }
    return value
  }

  toTitleCase(str) {
    return str.replace(
      /\w\S*/g,
      function (txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
      }
    );
  }

  getApproversList() {
    let url=`/approval/programs/${this.currentProgram.id}/SUBMISSIONS/${this.submissionId}/approval-instances`;
    this.jobService.get(url)
      .subscribe((res: any) => {
        this.approvalList = res.approvers;
        let members = this.approvalList[0].members;
        members = members.sort((a,b) =>{
          if(a.is_approval_allowed){
            return -1
          }
          if(b.is_approval_allowed){
            return 1;
          }
          return a.is_approval_allowed < b.is_approval_allowed ? -1 : 1;
        });
        this.rehireStatus = res.status;
        this.hasOwnApprovalPending = Boolean(res.pending_approvals);
        this.dataLoader = false;
      },(err:any) => {
        this.dataLoader = false;
      })
  }

  Rehire_reject(chainId)
  {

    this._eventStrem.emit(
      new EmitEvent(Events.REHIRE_REJECT, {
        value: true,
        candidateId: this.candidateId,
        jobId: this.jobId,
        progId:this.currentProgram?.id,
        subId:this.submissionId,
        approval_chain_id : chainId
      })
    );

  }
  Rehire_approve(chainId)
  {
    this._eventStrem.emit(
      new EmitEvent(Events.REHIRE_APPROVE, {
        value: true,
        candidateId: this.candidateId,
        jobId: this.jobId,
        progId:this.currentProgram?.id,
        subId:this.submissionId,
        approval_chain_id : chainId
      })
    );

  }
}
