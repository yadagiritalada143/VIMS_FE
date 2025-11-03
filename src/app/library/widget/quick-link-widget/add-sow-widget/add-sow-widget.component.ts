import { Component, Injector, OnInit } from '@angular/core';
import { QuickLinkWidgetComponent } from '../quick-link-widget.component';


@Component({
  selector: 'app-add-sow-widget',
  templateUrl: './add-sow-widget.component.html',
  styleUrls: ['./add-sow-widget.component.scss']
})

export class AddSOWWidgetComponent extends QuickLinkWidgetComponent implements OnInit {

  constructor(injector: Injector) {
    super(injector);
  }

  ngOnInit() {
    this.initWidget();
  }
}
