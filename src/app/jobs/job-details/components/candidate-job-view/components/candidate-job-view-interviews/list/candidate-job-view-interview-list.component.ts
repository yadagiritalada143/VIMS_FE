import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { UserType } from 'src/app/expense/enums/expense.enums';
import { UserPermissionService } from 'src/app/expense/services/user-permission.service';
import { JobDetailsService } from 'src/app/jobs/job-details/job-details.service';

@Component({
  selector: 'candidate-job-view-interview-list',
  templateUrl: './candidate-job-view-interview-list.component.html',
  styleUrls: ['./candidate-job-view-interview-list.component.scss']
})
export class CandidateJobViewInterviewListComponent implements OnInit {

  candidateId;
  interviewId;
  currentProgram;
  jobId;
  detailsLoading = false;
  schedulebutton = true;
  candidateDetails: any;
  private accountDetails = this.storageService.get('account');
  constructor(private route: ActivatedRoute, private storageService: StorageService,
    private router: Router, private jobService: JobDetailsService, private userPermissionService: UserPermissionService) {
    this.route.parent.parent.params.subscribe(params => {
      this.candidateId = params['candidateId'];
      this.interviewId = this.route.snapshot.queryParamMap.get('id');
      this.currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
      this.jobId = params['id'];

      this.jobService
        .fetchCurrentSubmitCandidate(this.candidateId, this.jobId)
        .subscribe((res: any) => {
          this.candidateDetails = res?.candidate;
        })
    })
  }
  interviews = [];
  ngOnInit(): void {
    this.loadInterviews();
  }

  loadInterviews() {
    this.detailsLoading = true;
    this.jobService
      .getInterviewList(this.jobId, null, this.candidateId).subscribe({
        next:(data: any) => {
        this.interviews = data.interviews;
        this.interviews.forEach(i => i.displayID = i.id ? i.id.substr(0, 4).toUpperCase() : '')
        if (this.interviews.length === 1) {
          this.gotoInterview(this.interviews[0]?.id);
        }
        this.detailsLoading = false;
      },
      error: (error) => {
        this.detailsLoading = false;
  }})
  }

  gotoInterview(id) {
    this.router.navigateByUrl(`jobs/details/job-details/${this.jobId}/candidate/${this?.candidateId}/interviews/details?id=${id}`);
  }
  scheduleInterview() {
    this.router.navigateByUrl(`jobs/details/job-details/${this.jobId}/candidate/${this?.candidateId}/interviews/create`);
  }



  public isUserRole(role: UserType | string) {
    const currentUserRole = this.userPermissionService.currentUserRole();
    return currentUserRole === role;
  }

  get visibleCreateButton() {
    return (!this.isUserRole(UserType.Vendor)
        && !this.isUserRole(UserType.Worker)
        && this.candidateDetails?.status?.toLowerCase() != 'pending_shortlist'
        && this.candidateDetails?.status?.toLowerCase() != 'pending_shortlist_review'
        && this.candidateDetails?.status?.toLowerCase() != 'shortlist_review_cancelled'
        && this.candidateDetails?.status?.toLowerCase() != 'rejected'
        && this.candidateDetails?.status?.toLowerCase() != 'withdrawn'
        && !(this.candidateDetails?.status?.toLowerCase() === 'offer_accepted' && this.candidateDetails.assignment_id))
        || (this.accountDetails?.organization?.category == 'SUPER_ORG'
        && this.candidateDetails?.status?.toLowerCase() != 'pending_shortlist'
        && this.candidateDetails?.status?.toLowerCase() != 'rejected'
        && this.candidateDetails?.status?.toLowerCase() != 'withdrawn'
        && !(this.candidateDetails?.status?.toLowerCase() === 'offer_accepted' && this.candidateDetails.assignment_id));
  }
}
