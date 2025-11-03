import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  EmitEvent,
  Events,
  EventStreamService,
} from 'src/app/core/services/event-stream.service';
import { JobDetailsService } from '../job-details.service';

@Component({
  selector: 'job-details-sidebar-counter-offer',
  templateUrl: './job-details-sidebar-counter-offer.component.html',
  styleUrls: ['./job-details-sidebar-counter-offer.component.scss'],
})
export class JobDetailsSidebarCounterOfferComponent implements OnInit, OnDestroy {
  private subscriptions = [];
  public isSidebarVisible = 'hidden';
  public profilevisible = true;
  public selectedMenu = '';
  candidateDetails: any;
  candidateAddress: any;
  isopen: boolean = false;
  candidateId: any;
  jobId: any;
  offerId: any;
  candidateName: string = undefined;

  constructor(
    private eventStream: EventStreamService,
    private jobdetailService: JobDetailsService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.jobId = this.route.snapshot.params['id'];
    this.subscriptions.push(this.eventStream.on(Events.JOB_DETAIL_SIDEBAR_COUNTER_OFFER).subscribe( (data) => {
      if (data['isopen']) {
        this.isSidebarVisible = 'visible';
        this.isopen = true;
        this.candidateId = data['candidateInfo'].id;
        this.offerId = data['id'];
        this.fetchCandidateDetails();
      } else {
        this.isopen = false;
        this.isSidebarVisible = 'hidden';
      }
    }));
  }

  //getJobManagers

  fetchCandidateDetails() {
    this.subscriptions.push(this.jobdetailService
      .fetchCurrentSubmitCandidate(this.candidateId, this.jobId)
      .subscribe((res) => {
        this.candidateDetails = res;
        const candidate = this.candidateDetails?.candidate || {};
        this.candidateName = candidate?.first_name + ' ' + candidate?.last_name;
        this.candidateAddress = candidate?.addresses?.filter(
          (item) => item.type === 'PRIMARY'
        )[0];
      }));
  }

  sidebarClose() {
    this.isSidebarVisible = 'hidden';
    this.isopen = false;
    this.eventStream.emit(
      new EmitEvent(Events.JOB_DETAIL_SIDEBAR_COUNTER_OFFER, {
        isopen: false,
      })
    );
  }

  getCandidateAddress() {
    let address = '';
    if (this.candidateAddress?.street_1) {
      address += this.candidateAddress?.street_1 + ', ';
    }
    if (this.candidateAddress?.street_2) {
      address += this.candidateAddress?.street_2 + ', ';
    }
    if (this.candidateAddress?.city) {
      address += this.candidateAddress?.city + ', ';
    }
    if (this.candidateAddress?.state) {
      address += this.candidateAddress?.state + ', ';
    }
    if (this.candidateAddress?.country) {
      address += this.candidateAddress?.country + ' ';
    }
    if (this.candidateAddress?.zipcode) {
      address += this.candidateAddress?.zipcode;
    }
    if (!address) {
      address = '--';
    }
    return address;
  }
  ngOnDestroy(): void {
    this.subscriptions?.forEach(sub => sub.unsubscribe());
  }
}
