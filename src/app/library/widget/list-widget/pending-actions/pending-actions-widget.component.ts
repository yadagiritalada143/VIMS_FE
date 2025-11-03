import { Component, Injector, OnInit } from '@angular/core';
import { IListWidget } from '../../widget.interfaces';
import { ListWidgetComponent } from '../list-widget.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-pending-actions-widget',
  templateUrl: './pending-actions-widget.component.html',
  styleUrls: ['./pending-actions-widget.component.scss']
})

export class PendingActionsWidgetComponent extends ListWidgetComponent implements OnInit {
  public widget: IListWidget;
  public pending = [];

  constructor(injector: Injector,
    private router: Router,
    ) {
    super(injector);
  }

  ngOnInit(): void {
    this.initWidget();
  }
  routeLink(item,editMode){

    if(!editMode){
      this.router.navigateByUrl(item?.link);
    }
  }
}
