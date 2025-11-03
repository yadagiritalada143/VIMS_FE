import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  EmitEvent,
  Events,
  EventStreamService,
} from 'src/app/core/services/event-stream.service';
import { JobDetailsService } from '../job-details.service';

@Component({
  selector: 'app-job-details-sidebar-create',
  templateUrl: './job-details-sidebar-create.component.html',
  styleUrls: ['./job-details-sidebar-create.component.scss'],
})
export class JobDetailsSidebarCreateComponent implements OnInit, OnDestroy {
  private subscriptions = [];
  public isSidebarVisible = 'hidden';
  public profilevisible = true;
  public selectedMenu = '';
  candidateDetails: any;
  candidateAddress: any;
  isopen: boolean = false;
  candidateId: any;
  jobId: any;
  jobName: any;
  candidateName: any = {};

  constructor(
    private eventStream: EventStreamService,
    private jobdetailService: JobDetailsService,
    private route: ActivatedRoute,
    private changeDetection: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.jobId =
      this.route.snapshot.params['id'] ||
      this.route.parent?.snapshot.params['id'];
      this.subscriptions.push(this.eventStream.on(Events.JOB_DETAIL_SIDEBAR_CREATE_OFFER).subscribe((data) => {
      if (data.isopen) {
        this.isSidebarVisible = 'visible';
        this.isopen = true;
        this.candidateId = data.id;
        this.jobId = data['jobId'] || this.jobId;
        this.jobName = data.job ?? '';
        this.fetchCandidateDetails();
      } else {
        this.isopen = false;
        this.isSidebarVisible = 'hidden';
      }
      this.changeDetection.detectChanges();
    }));
  }

  //getJobManagers

  fetchCandidateDetails() {
    this.subscriptions.push(this.jobdetailService
      .fetchCurrentSubmitCandidate(this.candidateId, this.jobId)
      .subscribe((res) => {
        this.candidateDetails = {...res, jobId: this.jobId, candidateId: this.candidateId};
        const candidate = this.candidateDetails.candidate || {};
        this.candidateName = candidate?.first_name + ' ' + candidate?.last_name;
        this.candidateAddress = candidate?.addresses?.filter(
          (item) => item.type === 'PRIMARY'
        )[0];
      }));
  }

  sidebarClose() {
    this.isopen = false;
    this.isSidebarVisible = 'hidden';
    this.eventStream.emit(
      new EmitEvent(Events.JOB_DETAIL_SIDEBAR_CREATE_OFFER, {
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
