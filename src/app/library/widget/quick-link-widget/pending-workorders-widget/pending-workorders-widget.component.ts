import { Component, Injector, OnInit } from '@angular/core';
import { QuickLinkWidgetComponent } from '../quick-link-widget.component';

@Component({
  selector: 'app-pending-workorders-widget',
  templateUrl: './pending-workorders-widget.component.html',
  styleUrls: ['./pending-workorders-widget.component.scss']
})
export class PendingWorkordersWidgetComponent extends QuickLinkWidgetComponent implements OnInit {

  constructor(injector: Injector) {
    super(injector);
  }

  ngOnInit() {
    this.initWidget();
  }
}
