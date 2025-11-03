import { Component, Injector, OnInit } from '@angular/core';
import { QuickLinkWidgetComponent } from '../quick-link-widget.component';


@Component({
  selector: 'app-current-openings-widget',
  templateUrl: './current-openings-widget.component.html',
  styleUrls: ['./current-openings-widget.component.scss']
})

export class CurrentOpeningsWidgetComponent extends QuickLinkWidgetComponent implements OnInit {

  constructor(injector: Injector) {
    super(injector);
  }

  ngOnInit() {
    this.initWidget();
  }
}
