import { Component, Injector, OnInit } from '@angular/core';
import { QuickLinkWidgetComponent } from '../quick-link-widget.component';


@Component({
  selector: 'app-add-job-widget',
  templateUrl: './add-job-widget.component.html',
  styleUrls: ['./add-job-widget.component.scss']
})

export class AddJobWidgetComponent extends QuickLinkWidgetComponent implements OnInit {

  constructor(injector: Injector) {
    super(injector);
  }

  ngOnInit() {
    this.initWidget();
  }
}
