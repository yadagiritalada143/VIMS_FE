import { Component, OnInit } from '@angular/core';
import { Events, EventStreamService } from 'src/app/core/services/event-stream.service';

@Component({
  selector: 'app-tax-history',
  templateUrl: './tax-history.component.html',
  styleUrls: ['./tax-history.component.scss']
})
export class TaxHistoryComponent implements OnInit {
  viewHistory = 'hidden';
  constructor(private eventstream : EventStreamService) { }

  ngOnInit(): void {
    this.eventstream.on(Events.TAX_CONFIGURATION_HISTORY).subscribe(data => {
      if(data) {
        this.viewHistory = "visible";
      }
      else {
        this.viewHistory = "hidden";
      }
    })
  }
  sidebarClose() {
    this.viewHistory = "hidden";
  }
}
