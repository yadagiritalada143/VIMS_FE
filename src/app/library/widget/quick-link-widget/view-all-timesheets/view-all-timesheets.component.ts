import { Component, Injector, OnInit } from '@angular/core';
import { QuickLinkWidgetComponent } from '../quick-link-widget.component';

@Component({
  selector: 'app-view-all-timesheets',
  templateUrl: './view-all-timesheets.component.html',
  styleUrls: ['./view-all-timesheets.component.scss']
})
export class ViewAllTimesheetsComponent extends QuickLinkWidgetComponent implements OnInit {

  constructor(injector: Injector) {
    super(injector);
  }

  ngOnInit() {
    this.initWidget();
  }

}
