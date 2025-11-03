import { Component, OnDestroy, OnInit } from '@angular/core';
import { EventStreamService, Events } from 'src/app/core/services/event-stream.service';

@Component({
  selector: 'app-view-profile',
  templateUrl: './view-profile.component.html',
  styleUrls: ['./view-profile.component.scss']
})
export class ViewProfileComponent implements OnInit, OnDestroy {
  viewProfile = "hidden";
  certificationShowHide = true;
  candidateData: any;
  private subscriptions = [];

  constructor(private eventStream: EventStreamService) { }

  ngOnInit(): void {
    this.subscriptions.push(this.eventStream.on(Events.VIEW_CANDIDATE_PROFILE).subscribe((data) => {
      if (data.value) {
        this.candidateData = data?.value;
        this.viewProfile = 'visible';

      
      } else {
        this.viewProfile = 'hidden';
      }
    }));
  }

  toggleCertification() {
    this.certificationShowHide = !this.certificationShowHide; 
  }

  closeProfileView() {
    this.viewProfile = 'hidden';
  }
  ngOnDestroy(): void {
    this.subscriptions?.forEach(sub => sub.unsubscribe());
  }
}
