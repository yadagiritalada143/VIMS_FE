import { Component, Input, OnInit } from '@angular/core';
import { Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { Subscription } from 'rxjs'
import { CandidateService } from 'src/app/candidates/service/candidate.service';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { Router } from '@angular/router';


@Component({
  selector: 'app-pontential-duplicate-candidate',
  templateUrl: './pontential-duplicate-candidate.component.html',
  styleUrls: ['./pontential-duplicate-candidate.component.scss']
})
export class PontentialDuplicateCandidateComponent implements OnInit {
  public potentialDuplicateCandidate  = "hidden";
  subscriptions: Subscription[] = [];
  vendorData: any;
  @Input() jobIdd: any;
  @Input() isShowVendorColumn: boolean;
  @Input() isMasked: boolean;

  constructor(
    private eventStream: EventStreamService,
    private candidateService: CandidateService,
    private datePipe: LocalDateFormatPipe,
    private router: Router
  ) { }


  SidebarClose(){
    this.potentialDuplicateCandidate = "hidden"
  }

  handlePotentialDuplicateCandidate(data){
    if(data.value){
      this.potentialDuplicateCandidate = "visible"
    }
  }

  ngOnInit(): void {
    this.subscriptions.push(this.eventStream.on(Events.POTENTIAL_DUPLICATE).subscribe((data) => {
      if(data){
        this.potentialDuplicateCandidate = "visible"  
        this.candidateService.getPotenialDuplicateCandidate(this.jobIdd).subscribe((res)=> {
          if(res){
            this.vendorData = res;
            this.vendorData?.candidate?.forEach(element => {
              element['submitted_on'] = this.datePipe.transform(element?.submitted_on)+' '+this.datePipe.transform(element?.submitted_on,'hh:mm:ss a z');
              element['status'] = element?.status;
            });
          }
        })
      }
    }));
  }

  statusClassMap: { [status: string]: string } = {
    ...this.createStatusMapping('countered', ['offer_countered']),
    ...this.createStatusMapping('active', ['submitted']),
    ...this.createStatusMapping('released', ['offer_released']),
    ...this.createStatusMapping('offer-accepted', ['interview_accepted','offer_accepted', 'accepted']),
    ...this.createStatusMapping('rejected', ['rejected', 'offer_rejected', 'interview_cancelled', 'interview_rejected', 'deleted', 'failed', 'shortlist_review_rejected']),
    ...this.createStatusMapping('withdrawn', ['withdrawn', 'cancelled', 'countered_cancelled', 'closed']),
    ...this.createStatusMapping('pending-approval', ['pending_shortlist', 'rehire_check_pending', 'pending_approval', 'pending_shortlist_review', 'offer_pending_approval','countered_pending_review']),
    ...this.createStatusMapping('approved', ['pending_interview_acceptance']),
    ...this.createStatusMapping('completed', ['interview_completed', 'completed']),
    ...this.createStatusMapping('pending-offer-review', ['pending_offer_review']),
    ...this.createStatusMapping('pending-review', ['pending_interview_review', 'pending_review', 'reviewed', 'pending_shortlist_review']),
    ...this.createStatusMapping('open', ['interview_pending_acceptance', 'open']),
    ...this.createStatusMapping('in-progress', ['in_progress']),
    ...this.createStatusMapping('open', ['interview_pending_acceptance']),
    ...this.createStatusMapping('default', ['default', 'deferred']),
    ...this.createStatusMapping('closed', ['closed', 'filled', 'pending closed']),
    ...this.createStatusMapping('offer-withdrawn', ['offer_cancelled', 'countered_review_cancelled']),
    ...this.createStatusMapping('countered_pending_review', ['countered_offer_pending_review', 'countered_pending_review']),
  };

  createStatusMapping(classValue: string, statuses: string[]): { [status: string]: string } {
    const mapping: { [status: string]: string } = {};
    statuses.forEach((status) => {
      mapping[status] = classValue;
    });
    return mapping;
  }

  getStatusClass(status: string): string {
    const lowercaseStatus = status.toLowerCase();
    return this.statusClassMap[lowercaseStatus] || '';
  }
  openVendor(id){
    this.router.navigate([`jobs/details/job-details/${this.jobIdd}/candidate/${id}/submissions`],{
    queryParams: {
      isPotentialFlyout: 'true'
    }});
  }

}
