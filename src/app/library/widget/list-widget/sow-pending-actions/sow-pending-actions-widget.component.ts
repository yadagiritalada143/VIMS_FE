import { Component, Injector, OnInit } from '@angular/core';
import { IListWidget } from '../../widget.interfaces';
import { ListWidgetComponent } from '../list-widget.component';


@Component({
  selector: 'app-sow-pending-actions-widget',
  templateUrl: './sow-pending-actions-widget.component.html',
  styleUrls: ['./sow-pending-actions-widget.component.scss']
})

export class SowPendingActionsWidgetComponent extends ListWidgetComponent implements OnInit {
  public widget: IListWidget;
  public pending = [];

  constructor(injector: Injector) {
    super(injector);
  }

  ngOnInit(): void {
    this.initWidget();
  }
}
