import { Component, OnInit, Output, EventEmitter, Input, Renderer2 } from '@angular/core';
import { PerfectScrollbarConfigInterface } from 'ngx-perfect-scrollbar';
import { JobDetailsService } from '../../job-details.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { Router, ActivatedRoute } from '@angular/router';
import { EventStreamService, EmitEvent, Events, } from 'src/app/core/services/event-stream.service';
import { StorageService, StorageKeys } from 'src/app/core/services/storage.service';
import { CandidateService } from 'src/app/candidates/service/candidate.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { AuthorizationService } from 'src/app/core/services/authorize.service';

@Component({
  selector: 'app-candidate-comparison',
  templateUrl: './candidate-comparison.component.html',
  styleUrls: ['./candidate-comparison.component.scss']
})
export class CandidateComparisonComponent implements OnInit {
  dropdowntoggle: number;
  candidatesInfo:any;
  candidateComparisonData;
  jobId;
  userType;
  currentProgram;
  userRole;
  currentUserId;
  noActionMessages = false;
  private subscriptions = [];
  isScoringEnabled: boolean = false;
  @Input() set compareCandidatesInfo(data){
    this.candidatesInfo = data
  };
  @Input() jobStatus:any;
  @Output() backToSubmittedCandidates: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() ShortlistCandidate: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() rejectCandidate: EventEmitter<boolean> = new EventEmitter<boolean>();
  public scrollConfig: PerfectScrollbarConfigInterface = { suppressScrollX: false, suppressScrollY: true };
  constructor(
    private jobService: JobDetailsService,
    private loaderService: LoaderService,
    private router: Router,
    private route: ActivatedRoute,
    private _eventStrem: EventStreamService,
    private localStorage: StorageService,
    private candidateService: CandidateService,
    private alert: AlertService,
    private render: Renderer2,
    private authorizationService: AuthorizationService,
  ) {
      this.render.listen('window', 'click', (e: Event) => {
        const dropdownUnorderList  = document.getElementById('dropdownUnorderList');
        const pElements = dropdownUnorderList?.querySelectorAll("p");
        if (pElements && pElements.length === 0) {
          this.noActionMessages = true;
        }
        else{
          this.noActionMessages = false;
        }
      });
    }
  ngOnInit(): void {
    this.getCandidateScoring();
    this.jobId = this.route.snapshot.params['id'];
    this.userType = this.localStorage.get('user_type');
    this.currentProgram = this.localStorage.get(StorageKeys.CURRENT_PROGRAM);
    this.isScoringEnabled =
      (this.currentProgram?.config?.candidate_matching_score?.is_enabled &&
        this.authorizationService.authorize('view_submitted_candidate_matching_score')) ??
      false;
    const u = JSON.parse(localStorage.getItem('account'));
    this.userRole = u?.role?.organization_category?.toLowerCase();
    this.currentUserId = u?.role?.id;
  }

  getCandidateScoring(){
    this.loaderService.show();
    this.jobService.getCandidateComparison(this.candidatesInfo).subscribe(data=>{
      this.loaderService.hide();
      this.candidateComparisonData = data;
    })
  }

  joinData(data: string[]): string {
    return data.join(', ');
  }

  isInterviewHidden(item: any, userType: string): boolean {
    const status = this.snakeCaseToTitle(item?.candidate_info?.status).toLowerCase();
    const candidateStatus = item?.candidate_info?.candidate_submission_status?.toLowerCase();
    return (
      (!['offer released',
        'submitted'].includes(status))
      || (status === 'completed' && userType === 'VENDOR')
      || status === 're-hire rejected'
      || (candidateStatus === 'rejected')
    );
  }

  isRejectCandidateHidden(item: any, userType: string): boolean {
    const status = this.snakeCaseToTitle(item?.candidate_info?.status).toLowerCase();
    const candidateStatus = item?.candidate_info?.candidate_submission_status?.toLowerCase();
    return (
      (!['offer released', 'offer rejected', 'pending shortlist', 'submitted', 're-hire rejected','rehire check pending',
        'pending shortlist review',].includes(status))
      || (status === 'completed' && userType === 'VENDOR')
      || (candidateStatus === 'rejected')
    );
  }

  clickToCreateOffer(event) {
    this.router.navigateByUrl(`jobs/details/job-details/${this.jobId}/candidate/${event?.id}/offers?createOffer=true`);
  }

  shortList(event) {
    //this.logs = undefined;
    this.loaderService.show();
    if (event?.status == 'PENDING_SHORTLIST' || event?.status == 'PENDING_SHORTLIST_REVIEW') {
      let payload = {
        "candidates": [
          {
            "candidate_id": event?.id
          },
        ]
      }
      if (event.status == 'PENDING_SHORTLIST') {
        this.candidateService.shortlistCandidate(payload, this.currentProgram?.id, this.jobId, true).subscribe({
          next: (data: any) => {
            if (data) {
              this.loaderService.hide();
              this.alert.success('Candidate Shortlisted successfully.');
              setTimeout(() => {
                this.ShortlistCandidate.emit(true);
              }, 1000);
            }
          },
          error: (error) => {
           this.alert.error(error);
           this.ShortlistCandidate.emit(false)
          }
        });
      }
      else{
        this.ShortlistCandidate.emit(false);
      }
    }
  }

  clickToRejectCandidate(event) {
      this._eventStrem.emit(
        new EmitEvent(Events.REJECT_CANDIDATE, {
          value: true,
          candidateId: event?.id,
          jobId: this.jobId,
        }),
      );
      this.subscriptions.push(this._eventStrem.on(Events.UPDATED_CANDIDATE_STATUS).subscribe((data) => {
        if (data) {
          this.rejectCandidate.emit(data);
        }
      }));
  }

  get shortlistActor(){
    let currentConfig = this.currentProgram?.config?.submission?.shortlist_details;
    let shortActor = false;
    let getValue;
     currentConfig?.filter(item =>{
      if(item?.short_actor === this.userType){
        shortActor = true
        getValue = item?.short_role_id?.find(x => x === this.currentUserId) ? true : false;
      }
    });
    return (
      shortActor && getValue
    )
  }

  scheduleInterview(event) {
    this.router.navigateByUrl(
      `jobs/details/job-details/${this.jobId}/candidate/${event?.id}/interviews/create`
    );
  }

  getProgressBarPercentage(score){
    if(score >= 0 && score <= 39){
      return 'low';
    }
    else if(score >= 40 && score <= 60){
      return 'average';
    }
    else{
      return 'excellent';
    }
  }

  snakeCaseToTitle(snakeCaseString) {
    if (!snakeCaseString) {
      return '';
    }
    snakeCaseString = snakeCaseString.toLowerCase().split('_');
    for (let i = 0; i < snakeCaseString.length; i++) {
      snakeCaseString[i] = snakeCaseString[i][0].toUpperCase() + snakeCaseString[i].slice(1);
    }
    return snakeCaseString.join(' ');
  }

  statusClassMap: { [status: string]: string } = {
    ...this.createStatusMapping('countered', ['offer_countered']),
    ...this.createStatusMapping('active', ['submitted']),
    ...this.createStatusMapping('released', ['offer_released']),
    ...this.createStatusMapping('offer-accepted', ['interview_accepted','offer_accepted']),
    ...this.createStatusMapping('rejected', ['rejected', 'offer_rejected']),
    ...this.createStatusMapping('withdrawn', ['withdrawn', 'cancelled', 'countered_cancelled', 'closed']),
    ...this.createStatusMapping('pending-approval', ['pending_shortlist', 'rehire_check_pending', 'pending_approval', 'pending_shortlist_review', 'offer_pending_approval','countered_pending_review']),
    ...this.createStatusMapping('approved', ['pending_interview_acceptance']),
  };

  getStatusClass(status: string): string {
    const lowercaseStatus = status.toLowerCase();
    return this.statusClassMap[lowercaseStatus] || '';
  }

  createStatusMapping(classValue: string, statuses: string[]): { [status: string]: string } {
    const mapping: { [status: string]: string } = {};
    statuses.forEach((status) => {
      mapping[status] = classValue;
    });
    return mapping;
  }

  backToSubmitted(isBack: boolean): void {
    this.backToSubmittedCandidates.emit(isBack);
  }

  openDropdown(value){
    if (this.dropdowntoggle === value) {
      this.dropdowntoggle = null;
    } else {
      this.dropdowntoggle = value;
    }
  }

  closeDropdown(event){
    if(event) {
      this.dropdowntoggle = null;
    }
  }
}
