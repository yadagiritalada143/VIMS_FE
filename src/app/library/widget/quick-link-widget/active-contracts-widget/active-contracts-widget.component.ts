import { Component, Injector, OnInit } from '@angular/core';
import { QuickLinkWidgetComponent } from '../quick-link-widget.component';

@Component({
  selector: 'app-active-contracts-widget',
  templateUrl: './active-contracts-widget.component.html',
  styleUrls: ['./active-contracts-widget.component.scss']
})
export class ActiveContractsWidgetComponent extends QuickLinkWidgetComponent implements OnInit {

  constructor(injector: Injector) {
    super(injector);
  }

  ngOnInit() {
    this.initWidget();
  }
}
