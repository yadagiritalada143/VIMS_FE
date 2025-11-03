import { Component, Injector, OnInit } from '@angular/core';
import { QuickLinkWidgetComponent } from '../quick-link-widget.component';


@Component({
  selector: 'app-pending-timesheets-widget',
  templateUrl: './pending-timesheets-widget.component.html',
  styleUrls: ['./pending-timesheets-widget.component.scss']
})

export class PendingTimesheetsWidgetComponent extends QuickLinkWidgetComponent implements OnInit {

  constructor(injector: Injector) {
    super(injector);
  }

  ngOnInit() {
    this.initWidget();
  }
}
