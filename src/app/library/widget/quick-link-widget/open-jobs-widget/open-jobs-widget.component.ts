import { Component, Injector, OnInit } from '@angular/core';
import { QuickLinkWidgetComponent } from '../quick-link-widget.component';

@Component({
  selector: 'app-open-jobs-widget',
  templateUrl: './open-jobs-widget.component.html',
  styleUrls: ['./open-jobs-widget.component.scss']
})
export class OpenJobsWidgetComponent extends QuickLinkWidgetComponent implements OnInit {

  constructor(injector: Injector) {
    super(injector);
  }

  ngOnInit() {
    this.initWidget();
  }
}
