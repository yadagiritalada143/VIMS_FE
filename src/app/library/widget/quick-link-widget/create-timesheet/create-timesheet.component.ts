import { Component, Injector, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { QuickLinkWidgetComponent } from '../quick-link-widget.component';

@Component({
  selector: 'app-create-timesheet',
  templateUrl: './create-timesheet.component.html',
  styleUrls: ['./create-timesheet.component.scss']
})
export class CreateTimesheetComponent extends QuickLinkWidgetComponent implements OnInit {

  constructor(
    injector: Injector,
    private router: Router
    ) {
    super(injector);
  }

  ngOnInit() {
    this.initWidget();
  }

  openCreationBar() {
    if (!this.editMode) {
      this.router.navigate([this.widget?.link, {isCreation: true}]);
    }
  }
}
