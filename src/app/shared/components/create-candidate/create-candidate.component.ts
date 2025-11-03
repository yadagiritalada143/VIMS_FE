import { Component, OnInit } from '@angular/core';
import {  Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { JobService } from 'src/app/jobs/job.service';

@Component({
  selector: 'app-create-candidate',
  templateUrl: './create-candidate.component.html',
  styleUrls: ['./create-candidate.component.scss']
})
export class CreateCandidateComponent implements OnInit {
  isCreateCandidate: string = "hidden";
  subscriptions = [];
  public allCountryList = [];
  constructor(private eventstream : EventStreamService,  public jobService: JobService) { }

  ngOnInit(): void {
    this.subscriptions.push(this.eventstream.on(Events.SHOW_CANDIDATE_CREATE_SIDEBAR).subscribe((data) => {
      if (data) {
        this.isCreateCandidate = 'visible';
        } else {
          this.isCreateCandidate = 'hidden';
        }
      })
    );
  }

  async getAllCountry() {
    await this.jobService
      .get(`/configurator/resources/countries?limit=300`)
      .toPromise()
      .then((data: any) => {
        this.allCountryList = data?.countries?.sort((c1, c2) => c1?.name?.localeCompare(c2?.name));
      });
  }

  sidebarClose() {
    this.isCreateCandidate = "hidden";
  }
}
