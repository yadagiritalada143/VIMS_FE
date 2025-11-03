import { Component, Injector, OnInit } from '@angular/core';
import { QuickLinkWidgetComponent } from '../quick-link-widget.component';


@Component({
  selector: 'app-contact-support-widget',
  templateUrl: './contact-support-widget.component.html',
  styleUrls: ['./contact-support-widget.component.scss']
})

export class ContactSupportWidgetComponent extends QuickLinkWidgetComponent implements OnInit {

  constructor(injector: Injector) {
    super(injector);
  }

  ngOnInit() {
    this.initWidget();
  }
}
