import { Component, OnInit, HostBinding, EventEmitter, Output } from '@angular/core';
import { EventStreamService, Events } from 'src/app/core/services/event-stream.service';
import { Subscription } from 'rxjs';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
@Component({
  selector: 'app-candidate-score',
  templateUrl: './candidate-score.component.html',
  styleUrls: ['./candidate-score.component.scss'],
})
export class CandidateScoreComponent implements OnInit {
  private subscrptions: Subscription[] = [];
  public isSidebarVisible = 'hidden';
  activeAccordian = 0;
  scoringData = [];
  jobInfo;
  candidateInfo;
  @Output() closeSidebar = new EventEmitter<Boolean>();
  
  @HostBinding('style.--progress-val')
  public progressVal: number = 95;

  constructor(private eventStream: EventStreamService,
    private storageS: StorageService
    ) {}

  ngOnInit(): void {
    this.subscrptions.push(
      this.eventStream.on(Events.VIEW_CANDIDATE_SCORE).subscribe(data => {
        if (data) {
          this.isSidebarVisible = 'visible';
          const candidate_matching_score = data?.data?.candidate_matching_score?.individual_scores;
          this.candidateInfo = data?.data;
          for (let idx in data?.scoreFactors) {
            this.scoringData.push(
              {
                key: data?.scoreFactors[idx]?.name,
                value: {
                  ...candidate_matching_score[data?.scoreFactors[idx]?.name],
                  factor: data?.scoreFactors[idx]?.value
                }
              }
            )
          }
          this.progressVal = data?.data?.candidate_matching_score?.score;
          this.jobInfo = this.storageS.get(StorageKeys.VIEWD_JOB);
        } else {
          this.isSidebarVisible = 'hidden';
        }
      }),
    );
  }

  sidebarClose() {
    this.isSidebarVisible = 'hidden';
    this.closeSidebar.emit(true);
  }

  candidateAccordion(value){
    if(!this.activeAccordian || this.activeAccordian!=value) {
      this.activeAccordian = value;
    } else {
      this.activeAccordian = undefined;
    }
  }
}
