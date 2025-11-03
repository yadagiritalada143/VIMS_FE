import { Component, Injector, OnInit } from '@angular/core';
import { QuickLinkWidgetComponent } from '../quick-link-widget.component';


@Component({
  selector: 'app-active-headcount-widget',
  templateUrl: './active-headcount-widget.component.html',
  styleUrls: ['./active-headcount-widget.component.scss']
})

export class ActiveHeadcountWidgetComponent extends QuickLinkWidgetComponent implements OnInit {

  constructor(injector: Injector) {
    super(injector);
  }

  ngOnInit() {
    this.initWidget();
  }
}
