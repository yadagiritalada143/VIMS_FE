import { Component, Injector, OnInit } from '@angular/core';
import { IListWidget } from '../../widget.interfaces';
import { ListWidgetComponent } from '../list-widget.component';

@Component({
  selector: 'app-summary-widget',
  templateUrl: './summary-widget.component.html',
  styleUrls: ['./summary-widget.component.scss']
})
export class SummaryWidgetComponent extends ListWidgetComponent implements OnInit {
  public widget: IListWidget;
  public pending = [];

  constructor(injector: Injector) {
    super(injector);
  }

  ngOnInit(): void {
    this.initWidget();
  }
}
