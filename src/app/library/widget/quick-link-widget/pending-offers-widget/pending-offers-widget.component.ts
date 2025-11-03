import { Component, Injector, OnInit } from '@angular/core';
import { QuickLinkWidgetComponent } from '../quick-link-widget.component';

@Component({
  selector: 'app-pending-offers-widget',
  templateUrl: './pending-offers-widget.component.html',
  styleUrls: ['./pending-offers-widget.component.scss']
})
export class PendingOffersWidgetComponent extends QuickLinkWidgetComponent implements OnInit {

  constructor(injector: Injector) {
    super(injector);
  }

  ngOnInit() {
    this.initWidget();
  }
}
