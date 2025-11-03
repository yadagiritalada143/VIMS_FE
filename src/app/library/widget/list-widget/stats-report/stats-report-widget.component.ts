import { Component, Injector, OnInit } from '@angular/core';
import { IListWidget } from '../../widget.interfaces';
import { ListWidgetComponent } from '../list-widget.component';

@Component({
  selector: 'app-stats-report-widget',
  templateUrl: './stats-report-widget.component.html',
  styleUrls: ['./stats-report-widget.component.scss']
})
export class StatsReportWidgetComponent extends ListWidgetComponent implements OnInit {
  public widget: IListWidget;
  public pending = [];

  constructor(injector: Injector) {
    super(injector);
  }

  ngOnInit(): void {
    this.initWidget();
  }
}
