import { Component, Injector, OnInit } from '@angular/core';
import { QuickLinkWidgetComponent } from '../quick-link-widget.component';


@Component({
  selector: 'app-resume-to-review-widget',
  templateUrl: './resume-to-review-widget.component.html',
  styleUrls: ['./resume-to-review-widget.component.scss']
})

export class ResumeToReviewWidgetComponent extends QuickLinkWidgetComponent implements OnInit {

  constructor(injector: Injector) {
    super(injector);
  }

  ngOnInit() {
    this.initWidget();
  }
}
