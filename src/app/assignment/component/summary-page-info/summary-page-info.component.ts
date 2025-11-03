import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { EventStreamService, Events } from 'src/app/core/services/event-stream.service';
import { ConfirmationDialogService } from 'src/app/shared/components/confirmation-dialog/confirmation-dialog.service';
@Component({
  selector: 'app-summary-page-info',
  templateUrl: './summary-page-info.component.html',
  styleUrls: ['./summary-page-info.component.scss']
})
export class SummaryPageInfoComponent implements OnInit, OnDestroy {
  summaryPageInfo = "hidden";
  private subscrptions: Subscription[] = [];
  constructor(private eventStream: EventStreamService, private confirmService: ConfirmationDialogService) { }

  ngOnInit(): void {
    this.subscrptions.push(this.eventStream.on(Events.SUMMARY_PAGE_INFO).subscribe((data) => {
      if (data) {
        this.summaryPageInfo = "visible";
      }
      else {
        this.summaryPageInfo = "hidden"
      }
    }));
  }
  sidebarClose() {
    this.summaryPageInfo = "hidden";
  }

  update() {
    this.confirmService.confirm('', `Are You Sure You Want To Mass Update ?`,
      'Yes', 'No')
      .then((confirmed) => {
        if (confirmed) {

        }
      })
      .catch(() => {

      });
  }
  ngOnDestroy(): void {
    this.subscrptions?.forEach(sub => sub.unsubscribe());
  }
}
