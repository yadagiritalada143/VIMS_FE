import { Component, Injector, OnInit } from '@angular/core';
import { IListWidget } from '../../widget.interfaces';
import { ListWidgetComponent } from '../list-widget.component';

@Component({
  selector: 'app-list-timesheets',
  templateUrl: './list-timesheets.component.html',
  styleUrls: ['./list-timesheets.component.scss']
})
export class ListTimesheetsComponent extends ListWidgetComponent implements OnInit {

  public widget: IListWidget;
  public pending = [];

  constructor(injector: Injector) {
    super(injector);
  }

  ngOnInit(): void {
    this.initWidget();
  }

}
