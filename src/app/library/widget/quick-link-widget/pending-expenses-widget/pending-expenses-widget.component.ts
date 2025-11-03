import { Component, Injector, OnInit } from '@angular/core';
import { QuickLinkWidgetComponent } from '../quick-link-widget.component';


@Component({
  selector: 'app-pending-expenses-widget',
  templateUrl: './pending-expenses-widget.component.html',
  styleUrls: ['./pending-expenses-widget.component.scss']
})

export class PendingExpensesWidgetComponent extends QuickLinkWidgetComponent implements OnInit {

  constructor(injector: Injector) {
    super(injector);
  }

  ngOnInit() {
    this.initWidget();
  }
}
