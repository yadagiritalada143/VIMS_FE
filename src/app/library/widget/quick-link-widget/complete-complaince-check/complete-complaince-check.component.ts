import { Component, Injector, OnInit } from '@angular/core';
import { QuickLinkWidgetComponent } from '../quick-link-widget.component';

@Component({
  selector: 'app-complete-complaince-check',
  templateUrl: './complete-complaince-check.component.html',
  styleUrls: ['./complete-complaince-check.component.scss']
})
export class CompleteComplainceCheckComponent extends QuickLinkWidgetComponent implements OnInit  {

  constructor(injector: Injector) {
    super(injector);
  }

  ngOnInit() {
    this.initWidget();
  }
}
