import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { StorageService, StorageKeys } from 'src/app/core/services/storage.service';
import { AssignmentConfigurationService } from 'src/app/program-setup/assignment-configuration/assignment-configuration.service';
import { assignmentStatus } from '../../../shared/enums';
import { Log } from 'src/app/library/logs/logs.model';
import { forkJoin } from 'rxjs';
import * as _ from 'lodash';

@Component({
  selector: 'app-special-temporary-access',
  templateUrl: './special-temporary-access.component.html',
  styleUrls: ['./special-temporary-access.component.scss']
})

export class SpecialTemporaryAccessComponent implements OnInit , OnChanges{
  @Output() submit = new EventEmitter();
  @Input() assignmentId;
  logs: Log= undefined;
  status: any;
  assignmentStatus = assignmentStatus;
  specialAccess = "hidden";
  supportingDialougVisible =  true;
  _assignmentData;
  _assignmentConfig;
  @Input('assignmentData') set assignmentData(value: any) {
    this._assignmentData = value;
  }
  get assignmentData() {
    return this._assignmentData;
  }
  @Input('assignmentConfig') set assignmentConfig(value:any){
    this._assignmentConfig = value;
  }
  get assignmentConfig() {
    return this._assignmentConfig;
  }
  public support_text: any = {
    icon: 'info',
    icon_color: 'blue',
    label: 'Information',
    support_text: 'Please enter a value less than or equal to the maximum allowable value',
    close_icon: true
  };
  temporaryForm:any = {
    "module_type": "timesheet",
    "module_action": {
      "submit": {
        "is_allow": false,
        "option": {
          "user_type": "vendor",
          "type": "",
          "period": null,
          "is_allow": true
        }
      },
      "past_period":{
        "option": {
              "type":"",
              "period":"",
              "is_allow":true,
              "user_type":""
           },
        "is_allow":false
     },
      "modify": {
        "is_allow": false,
        "option": {
          "user_type": "vendor",
          "type": "day",
          "period": null,
          "is_allow": true
        }
      }
    }
  }
  temporaryAccess: any = {};
  maxValueTimesheetModify;
  maxValueTimesheetSubmit;
  maxValueTimesheetPastPeriod;
  constructor(private eventStream: EventStreamService,
      private storageService: StorageService,
      private assignmentConfigService: AssignmentConfigurationService,
    ) { }

  ngOnInit(): void {
    this.getAssignmentValues();
    this.eventStream.on(Events.TEMPORARY_ACCESS).subscribe((data) => {
      this.status = data?.status;
      if (data?.access) {
        this.specialAccess = "visible";
      } else {
        this.specialAccess = "hidden";
      }
    });
    this.eventStream.on(Events.SHOW_SPECIAL_TEMPRORY_ACCESS_LOGS).subscribe((data) => {
      this.logs = data;
      if(!this.logs){
        this.sidebarClose();
      }
    });
  }
  ngOnChanges(changes: SimpleChanges) {
    if (Object.keys(changes)?.length) {
      this.getAssignmentValues();
    }
  }
  getAssignmentValues() {
    if (this.assignmentConfig && this.assignmentData) {
      if (this.assignmentData?.assignment?.temporary_access) {
        const { module_action } = this.assignmentData?.assignment?.temporary_access.find(act => act.module_type == 'timesheet');
        if (module_action) {
          this.setData(this.assignmentData?.assignment?.temporary_access, true);
          const { module_action: module_action1 } = this.assignmentConfig?.temporary_access.find(action => action.module_type = 'timesheet');
          this.maxValueTimesheetSubmit = module_action1?.['submit']?.option[0];
          this.maxValueTimesheetModify = module_action1?.['modify']?.option[0];
          this.maxValueTimesheetPastPeriod = module_action1?.['past_period']?.option[0];
        }
      } else {
        this.setData(this.assignmentConfig?.temporary_access, true);
        const { module_action: module_action1 } = this.assignmentConfig?.temporary_access.find(action => action.module_type = 'timesheet');
        this.maxValueTimesheetSubmit = module_action1?.['submit']?.option;
        this.maxValueTimesheetModify = module_action1?.['modify']?.option;
        this.maxValueTimesheetPastPeriod = module_action1?.['past_period']?.option;
      }
    }
  }

  defaultValue = {};
  setData(data, setAsDefault =  false) { 
    data?.forEach(a => {
      if(a?.module_type?.toLowerCase() === 'timesheet') {
        if(a?.module_action?.past_period?.option && a?.module_action?.past_period?.option?.length > 0){
        a.module_action.past_period.option = a?.module_action?.past_period?.option[0];
        }
        if(a?.module_action?.modify?.option && a?.module_action?.modify?.option?.length > 0){
        a.module_action.modify.option = a?.module_action?.modify?.option[0];
        }
        if(a?.module_action?.submit?.option && a?.module_action?.submit?.option?.length > 0){
        a.module_action.submit.option = a?.module_action?.submit?.option[0];
        }
        this.temporaryForm = _.cloneDeep(a);
        if (setAsDefault) {
          this.defaultValue = _.cloneDeep(a);
        }
      }
    });
  }

  sidebarClose() {
    if(Object.keys(this.defaultValue).length !== 0) {
      this.temporaryForm =  {...this.defaultValue};
    }
   
    this.getAssignmentValues();

    this.logs = undefined;
    this.supportingDialougVisible = true;
    this.specialAccess = "hidden";
  }

  closeDialog(event:any) {
    this.supportingDialougVisible = false;
  }
  onSubmit() {
    const data = JSON.parse(JSON.stringify(this.temporaryForm))
    let payload: any =  Object.assign({}, data);
    if(this.status?.toLowerCase() === this.assignmentStatus?.OPEN){
      payload.module_action.submit.is_allow = false;
      payload.module_action.modify.is_allow = false;
    }
    payload.module_action.submit.option = [payload?.module_action?.submit?.option];
    payload.module_action.modify.option = [payload?.module_action?.modify?.option];
    payload.module_action.past_period.option = [payload?.module_action?.past_period?.option];
    this.submit.emit(payload);
  }
  get disableSubmit() {
    if ((this.status?.toLowerCase() == assignmentStatus?.CLOSED || this.status?.toLowerCase() == 'assignment closed')) {
      return ((!this.temporaryForm?.module_action?.submit?.is_allow || !this.temporaryForm?.module_action?.submit?.option?.period))
    } else {
      return (!this.temporaryForm?.module_action?.past_period?.is_allow || (this.temporaryForm?.module_action?.past_period?.is_allow && !this.temporaryForm?.module_action?.past_period?.option?.period))
    }
  }
}
