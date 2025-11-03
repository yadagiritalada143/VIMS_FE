import { Component, OnInit,Input, Output,EventEmitter } from '@angular/core';
import { StorageService ,StorageKeys} from 'src/app/core/services/storage.service';
import {UsersType} from 'src/app/shared/enums';

@Component({
  selector: 'app-timesheet-tab',
  templateUrl: './timesheet-tab.component.html',
  styleUrls: ['./timesheet-tab.component.scss']
})
export class TimesheetTabComponent implements OnInit {
@Input() isShowMultiApproval: any;
@Output() activeTab = new EventEmitter
timesheetTab: string = "timesheet";
UsersType = UsersType;
currentUserType: any;

  constructor(private storageService: StorageService) { }

  ngOnInit(): void {
   this.currentUserType = this.storageService.get(StorageKeys.USER_TYPE);
  }
  showTimesheetTab(value) {
    this.timesheetTab = value;
    this.activeTab.emit(this.timesheetTab);
  }
}
