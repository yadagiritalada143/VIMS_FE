import { Component, Injector, OnInit } from '@angular/core';
import { QuickLinkWidgetComponent } from '../quick-link-widget.component';

@Component({
  selector: 'app-pending-interviews-widget',
  templateUrl: './pending-interviews-widget.component.html',
  styleUrls: ['./pending-interviews-widget.component.scss']
})
export class PendingInterviewsWidgetComponent extends QuickLinkWidgetComponent implements OnInit {

  constructor(injector: Injector) {
    super(injector);
  }

  ngOnInit() {
    this.initWidget();
  }
}
