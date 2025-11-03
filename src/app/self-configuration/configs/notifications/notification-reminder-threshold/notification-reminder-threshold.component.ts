import { Component, OnInit } from '@angular/core';
import { StorageService } from 'src/app/core/services/storage.service';
import { NotificationConfigService } from 'src/app/program-setup/notification-config/notification-config.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { Log, LOG_TYPE } from 'src/app/library/logs/logs.model';

@Component({
  selector: 'app-notification-reminder-threshold',
  templateUrl: './notification-reminder-threshold.component.html',
  styleUrls: ['./notification-reminder-threshold.component.scss']
})
export class NotificationReminderThresholdComponent implements OnInit {
  viewMode: boolean = true;
  programId = '';
  logs: Log = undefined;
  public payload: any = {
    timesheet: {
      approve: {
        options: [
          {
            type: null,
            unit: null,
            period: 1
          }
        ],
        is_allow: true
      },
      missing: {
        options: [
          {
            type: null,
            unit: null,
            period: 1
          }
        ],
        is_allow: true
      },
      missing_reminders: {
        options: [],
        is_allow: false
      }
    },
    assignment: {
      end_assignment: {
        options: [
          {
            type: null,
            period: 0
          }
        ],
        is_allow: true
      },
      budget_notification: {
        options: [
          {
            type: null,
            consumed_budget: 0
          }
        ],
        is_allow: true
      }
    },
    entity_code: "reminder"
  };
  public payloadType: any = {
    timesheet_approve: {
      type: null,
      unit: null,
      period: 0
    },
    timesheet_missing: {
      type: null,
      unit: null,
      period: 0
    },
    assignment_end_assignment: {
      type: null,
      period: 0
    },
    budget_notification: {
      type: null,
      consumed_budget: 0
    },
    timesheet_missing_options : {
     first_type_option : [{key : 'After' , value : 'after'},{key : 'Before' , value : 'before'}],
     secound_type_option : [{key : 'Days' , value : 'day'},{key : 'Weeks' , value : 'week'}],
    },
    timesheet_approve_options : {
      first_type_option : [{key : 'Submit Date' , value : 'submitted_at'},{key : 'End Date' , value : 'end_date'}],
      secound_type_option : [{key : 'Days' , value : 'day'},{key : 'Weeks' , value : 'week'}],
     },
     assignment_end_assignment_option : {
      secound_type_option : [{key : 'Days' , value : 'day'},{key : 'Weeks' , value : 'week'} , {key : 'Month' , value : 'month'}],
     },
     budget_notification_options: {
      secound_type_option : [{key : 'Percentage' , value : 'percentage'}]
    }
  };
  disableSaveButon : any =  {
    'timesheet_missing' : false,
    'timesheet_approve' : false,
    'assignment_budget_notification' : false , 
    'assignment_end_assignment' : false
  };
  constructor(private notificationService: NotificationConfigService,
    private localStorage: StorageService,
    private loader: LoaderService,
  ) { }

  ngOnInit(): void {
    this.programId = this.localStorage.get("PROGRAM_ID");
    this.getNotificationThreshold();
  }

  getNotificationThreshold(submitted = false) {
    this.loader.show();
    let url = `/configurator/programs/${this.programId}/config?entity_code=reminder`
    this.notificationService.getConfigNotification(url).subscribe({
      next: (res: any) => {
        this.loader.hide();
        this.viewMode = true;
        if (res && res?.config) {
          if(!submitted) {
            this.payload = this.mergeDeep(this.payload , res?.config)
          } else {
            this.payload = res?.config;
          }
          this.payload.entity_code = res?.entity_code;
        }
      },
      error: err => {
        this.logs = { type: LOG_TYPE.ERROR, heading: errorHandler(err), messages: this.showErrorMessges(err), autoClose: true, isShown: true, showReportButton: err?.status == 500 || err?.status == 400, additionalInfo: { trace_id: err?.error?.error?.trace_id } };
        this.loader.hide();
      }
    });
  }
  update() {
    this.loader.show();
    const payload = {
      entity_code: "reminder",
      config: this.payload
    }
    this.notificationService.updateConfigNotification(`/configurator/programs/${this.programId}/config?entity_code=reminder`, payload).subscribe({
      next: (response: any) => {
        this.loader.hide();
        this.getNotificationThreshold(true);
      },
      error: err => {
        this.logs = { type: LOG_TYPE.ERROR, heading: errorHandler(err), messages: this.showErrorMessges(err), autoClose: true, isShown: true, showReportButton: err?.status == 500 || err?.status == 400, additionalInfo: { trace_id: err?.error?.error?.trace_id } };
        this.loader.hide();
      }
    });
  }

  showErrorMessges(err) {
    let messages = [];
    err?.error?.error?.errors?.forEach(msg => {
      if (msg?.message) {
        messages?.push(msg?.message);
      }
    });
    return messages;
  }
  updateToggleValue(event , slug? , label?) {
    if(!this.viewMode) {
      this.payload[slug][label]['is_allow'] = event;
    }
  }
  backtoView() {
    this.viewMode = true;
  }
  getDisableSaveButon() {
    for (const key in this.disableSaveButon) {
      let a = key?.split('_');
      if (this.disableSaveButon[key] && this.payload[a[0]][a[1]]?.is_allow) {
        return true;
      }
    }
    return false;
  }
  updatePeriod(value , slug? , label?) {
    let disable = false;
    value?.forEach((res) => {
      const isEmptyObj = (res) => {
        return Object.values(res)?.some(val => !val); 
      }
      disable = disable ||  isEmptyObj(res);
    });
    this.disableSaveButon[`${slug}_${label}`] = disable;
    if(slug === 'timesheet' && label === 'approve') {
      value = value?.map(res => ({...res , applicable_on: 'end_date'}));
    }
    this.payload[slug][label].options = value;
  }
  convertToLowerValue(value) {
    return value?.map(res => this.convertValuesToLowerCase(res));
  }
  convertValuesToLowerCase(obj) {
    const newObj = {};
    for (let key in obj) {
      if (typeof obj[key] === 'string') {
        newObj[key] = obj[key].toLowerCase();
      } else {
        newObj[key] = obj[key];
      }
    }
    return newObj;
  }
  mergeDeep(...objects) {
    const isObject = obj => obj && typeof obj === 'object';

    return objects.reduce((prev, obj) => {
      Object.keys(obj).forEach(key => {
        const pVal = prev[key];
        const oVal = obj[key];

        if (Array.isArray(pVal) && Array.isArray(oVal)) {
          if ((oVal?.length > 0 && oVal[0]?.hasOwnProperty('key')) || (pVal?.length > 0 && pVal[0]?.hasOwnProperty('key'))) {
            prev[key] = [...new Map([...pVal, ...oVal].map(item =>
              [item['key'], item])).values()];
          } else {
            prev[key] = [...pVal, ...oVal].filter((element, index, array) => array.indexOf(element) === index);//for unique
          }
          //
        }
        else if (isObject(pVal) && isObject(oVal)) {
          prev[key] = this.mergeDeep(pVal, oVal);
        }
        else {
          prev[key] = oVal;
        }
      });
      return prev;
    }, {});
  }
}
