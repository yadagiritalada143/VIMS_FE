import { Component, OnInit } from '@angular/core';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { StorageService, StorageKeys } from 'src/app/core/services/storage.service';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { NotificationConfigService } from '../../notification-config.service';
import { Location } from '@angular/common';
@Component({
  selector: 'app-user-based-settings',
  templateUrl: './user-based-settings.component.html',
  styleUrls: ['./user-based-settings.component.scss']
})
export class UserBasedSettingsComponent implements OnInit {
  programId = '';
  roles = [];
  account: any;
  public notificationSetting = {
    userRole: null,
    userRoleLoading: false,
  };
  filterOptions = [
    {
      name: 'Information',
      active: false
    },
    {
      name: 'Action',
      active: false
    },
    {
      name: 'Reminder',
      active: false
    },
  ];
  notificationconfigs:any = {};
  savedEventsId = null;
  user: any;
  accordionItem = 0;
  selectAll = false;
  hasUserSavedPreferences: boolean;
  constructor(
    private notificationConfigService: NotificationConfigService,
    private localStorage: StorageService,
    private _alert: AlertService,
    private loader: LoaderService,
    private location: Location
  ) { }

  ngOnInit(): void {
    this.programId=this.localStorage.get(StorageKeys.PROGRAM_ID);
    this.user = this.localStorage.get(StorageKeys.CURRENT_USER);
    this.account = this.localStorage.get(StorageKeys.CURRENT_ACCOUNT);
    this.notificationSetting.userRole={
      ...this.user
    }
    this.getNotificationConfigs();
  }

  updateFilter(index: number) {
    if (!this.notificationSetting.userRole) {
      return;
    }
    for (const [key, value] of Object.entries(this.notificationconfigs)) {
      const events: any = value['eventList'];
      for (let i = 0; i < (events || []).length; i++) {
        this.notificationconfigs[key]['eventList'][i].isNotShow = false;
      }
    }
    this.filterOptions[index].active = !this.filterOptions[index].active;
    if (!this.filterOptions?.filter(opt => opt.active).length) {
      this.notificationconfigs = JSON.parse(JSON.stringify(this.notificationconfigs));
      this.selectChildEvent(null, null, null);
      return;
    }
    for (const [key, value] of Object.entries(this.notificationconfigs)) {
      const events: any = value['eventList'];
      for (let i = 0; i < (events || []).length; i++) {
        let event = events[i];
        this.notificationconfigs[key]['eventList'][i].isNotShow = !this.filterOptions.find(opt => (opt.active && opt?.name?.toLowerCase() === event?.event_type?.toLowerCase()));
      }
      this.notificationconfigs[key]['isNotShow'] = true;
    }
    this.selectChildEvent(null, null, null);
  }

  getNotificationConfigs(){
    this.notificationConfigService.gets(`/notification-config/programs/${this.programId}/user-role-events?user_id=${this.user?.id}&role=${this.account?.role?.name}`).subscribe({
      next: (response: any)=>{
        if(response){
          const notificationconfigs = this.groupBy(response?.role_based_events, (event)=>event?.module);
          for (const [key, value] of Object.entries(notificationconfigs)) {
            this.notificationconfigs[key] = {
              is_checked: false,
              eventList: value,
            }
          }
          this.savedEventsId=response?.id;
          this.hasUserSavedPreferences=response?.hasUserSavedPreferences;
          //Select all events if user hasn't saved any preferences
          if(!this.savedEventsId){
            this.selectAll=true;
            this.selectAllEvent();
            if (this.hasUserSavedPreferences) {
              response?.role_based_events?.filter(item => item?.is_root_level).map(item => {
                const index = this.notificationconfigs?.[item.module]?.['eventList']?.findIndex(i => i?.id === item?.id);
                this.selectChildEvent({ key: item?.module }, index,item?.is_checked);
              });
            }
          }
          else{
            //Marking module as checked if all events in it are checked
            this.selectChildEvent(null, null, null);
          }
          this.loader.hide();
        }
      },
      error: (err) => {
        this.loader.hide();
        this._alert.error(errorHandler(err));
      }
    });
  }

  groupBy(xs, f) {
    return xs.reduce((r, v, i, a, k = f(v)) => ((r[k] || (r[k] = [])).push(v), r), {});
  }

  selectParentEvent(notification, is_checked) {
    const { key, value } =  notification;
    this.notificationconfigs[key]['eventList'] = value.eventList.map(notify => ({
      ...notify,
      is_checked,
    }));
    this.notificationconfigs[key]['is_checked'] = is_checked;
    this.selectAll = Object.keys(this.notificationconfigs).every(key => this.notificationconfigs[key]['is_checked']);
  }

  selectChildEvent(notification, index, is_checked) {
    if (notification && index >=0) {
      const { key } =  notification;
      this.notificationconfigs[key]['eventList'][index]['is_checked'] = is_checked;
    }
    for (const [key, value] of Object.entries(this.notificationconfigs)) {
      this.notificationconfigs[key]['is_checked'] = value['eventList']?.filter(e => !e.isNotShow).length ? value['eventList']?.filter(e => !e.isNotShow).every(event => event.is_checked) : false;
    }
    this.selectAll = Object.keys(this.notificationconfigs).every(key => this.notificationconfigs[key]['is_checked']);
  }

  checkIsDisabled(eventList): boolean {
    if (!this.notificationSetting?.userRole ) {
      return true;
    }
    return !eventList?.length || eventList.every(event => event?.isNotShow);
  }

  save() {
    const selectedEventList = [];
    const selectedRootEventList = [];
    for (const [key, value] of Object.entries(this.notificationconfigs)) {
      for (let event of value['eventList']) {
        if (event?.is_checked) {
          if(event?.role==='SYSTEM' ){
            selectedRootEventList.push({
              event_name: event?.event_name,
              event_code: event?.event_code,
            });
          }else{
            selectedEventList.push({
              event_name: event?.event_name,
              event_code: event?.event_code,
            });
          }

        }
      }
    }
    const { id} = this.notificationSetting?.userRole || {};
    const requestData: any = {
      is_enabled: true,
      program_events: selectedEventList,
      root_events : selectedRootEventList
    }
    requestData.user_id = id;
    
    this.loader.show();
    if (this.savedEventsId) {
      this.notificationConfigService.updateConfigNotification(`/notification-config/programs/${this.programId}/event-user-configs/${this.savedEventsId}`, requestData).subscribe({
        next: ()=>{
          this._alert.success('Notification setting updated successfully');
          this.getNotificationConfigs();
          this.loader.hide();
        },
        error: err => {
          this.loader.hide();
          this._alert.error(errorHandler(err));
        }
      });
    } else {
      this.notificationConfigService.createConfigNotification(`/notification-config/programs/${this.programId}/event-user-configs`, requestData).subscribe({
        next: (response: any)=>{
          this._alert.success('Notification setting created successfully');
          this.getNotificationConfigs()
          this.loader.hide();
        },
        error: err => {
          this.loader.hide();
          this._alert.error(errorHandler(err));
        }
      });
    }
  }

  showAccordion(i) {
    this.accordionItem = i;
  }

  navigateBack() {
    this.location.back();
  }

  selectAllEvent() {
    for (const [key, value] of Object.entries(this.notificationconfigs)) {
      this.notificationconfigs[key]['is_checked'] = this.selectAll;
      this.notificationconfigs[key]['eventList'] = value['eventList'].map(event => ({...event, is_checked: this.selectAll}));
    }
  }
}
