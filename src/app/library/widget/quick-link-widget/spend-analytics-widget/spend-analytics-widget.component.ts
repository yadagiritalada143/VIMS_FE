import { Component, Injector, OnInit } from '@angular/core';
import { QuickLinkWidgetComponent } from '../quick-link-widget.component';


@Component({
  selector: 'app-spend-analytics-widget',
  templateUrl: './spend-analytics-widget.component.html',
  styleUrls: ['./spend-analytics-widget.component.scss']
})

export class SpendAnalyticsWidgetComponent extends QuickLinkWidgetComponent implements OnInit {

  constructor(injector: Injector) {
    super(injector);
  }

  ngOnInit() {
    this.initWidget();
  }
}
