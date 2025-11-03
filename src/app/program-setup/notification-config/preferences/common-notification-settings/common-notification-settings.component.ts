import { Component, Input, OnInit } from '@angular/core';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { NotificationConfigService } from '../../notification-config.service';
import { Location } from '@angular/common';

export enum NotificationType {
  User = 'USER',
  RoleBased = 'ROLE_BASED',
}

@Component({
  selector: 'app-common-notification-settings',
  templateUrl: './common-notification-settings.component.html',
  styleUrls: ['./common-notification-settings.component.scss']
})
export class CommonNotificationSettingsComponent implements OnInit {
  @Input() type: string;
  programId = '';
  roles = [];
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
  savedEvents = null;
  user: any;
  notificationType = NotificationType;
  accordionItem = 0;
  selectAll = false;
  constructor(
    private notificationConfigService: NotificationConfigService,
    private localStorage: StorageService,
    private _alert: AlertService,
    private loader: LoaderService,
    private location: Location
  ) { }

  ngOnInit(): void {
    this.loader.show();
    this.getRoles();
    this.getNotificationConfigs();
  }

  getRoles() {
    this.notificationSetting.userRoleLoading = true;
    this.programId = this.localStorage.get("PROGRAM_ID");
    if (this.programId) {
      this.notificationConfigService.getRoles(`/configurator/programs/${this.programId}/roles`).subscribe({
        next: (res: any) => {
          this.roles = [...(res.roles || [])];
          this.notificationSetting.userRoleLoading = false;
        },
        error: err => {
          this._alert.error(errorHandler(err));
        }
      });
    }
  }

  getRoleBasedEvents () {
    this.user = this.localStorage.get(StorageKeys.CURRENT_USER);
    const account = this.localStorage.get(StorageKeys.CURRENT_ACCOUNT);
    this.notificationConfigService.getRoles(`/notification-config/programs/${this.programId}/role-based-events?role=${account.role?.name}&limit=1000`).subscribe({
      next: (res: any) => {
        const role_based_events = res?.role_based_events || [];
        if (role_based_events?.length) {
          const tempNotificationconfigs = {...this.notificationconfigs};
          for (const key of Object.keys(this.notificationconfigs)) {
            tempNotificationconfigs[key].eventList = this.notificationconfigs[key].eventList.filter((event) => !!role_based_events.find(e => e.event_code === event.code))
            if (!tempNotificationconfigs[key].eventList?.length) {
              delete tempNotificationconfigs[key];
            }
          }
          this.notificationconfigs = {...tempNotificationconfigs};
        }
        this.loader.hide();
        this.roleSelected({});
      },
      error: err => {
        this._alert.error(errorHandler(err));
      }}
    )
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
        this.notificationconfigs[key]['eventList'][i].isNotShow = !this.filterOptions.find(opt => (opt.active && opt?.name?.toLowerCase() === event?.type?.toLowerCase()));
      }
      this.notificationconfigs[key]['isNotShow'] = true;
    }
    this.selectChildEvent(null, null, null);
  }

  getNotificationConfigs(){
    this.notificationConfigService.gets('/notification-config/event/all?page=0&size=1000&tenantId=1').subscribe({
      next: (response: any)=>{
        if(response){
          const notificationconfigs = this.groupBy(response.payload.content, (event)=>event?.group);
          for (const [key, value] of Object.entries(notificationconfigs)) {
            this.notificationconfigs[key] = {
              checked: false,
              eventList: value,
            }
          }
          if (this.type === NotificationType.User) {
            this.getRoleBasedEvents();
          } else {
            this.loader.hide();
          }
        } else {
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

  selectParentEvent(notification, checked) {
    const { key, value } =  notification;
    this.notificationconfigs[key]['eventList'] = value.eventList.map(notify => ({
      ...notify,
      checked,
    }));
    this.notificationconfigs[key]['checked'] = checked;
    this.selectAll = Object.keys(this.notificationconfigs).every(key => this.notificationconfigs[key]['checked']);
  }

  selectChildEvent(notification, index, checked) {
    if (notification && index >=0) {
      const { key } =  notification;
      this.notificationconfigs[key]['eventList'][index]['checked'] = checked;
    }
    for (const [key, value] of Object.entries(this.notificationconfigs)) {
      this.notificationconfigs[key]['checked'] = value['eventList']?.filter(e => !e.isNotShow).length ? value['eventList']?.filter(e => !e.isNotShow).every(event => event.checked) : false;
    }
    this.selectAll = Object.keys(this.notificationconfigs).every(key => this.notificationconfigs[key]['checked']);
  }

  roleSelected(role) {
    let getSavedEventsUrl = '';
    if (this.type === NotificationType.User) {
      if (!this.user?.id) {
        return;
      }
      this.notificationSetting.userRole = {
        ...this.user,
      }
      getSavedEventsUrl = `/notification-config/programs/${this.programId}/event-user-configs?user_id=${this.user.id}`;
    } else {
      if (!role?.id) {
        return;
      }
      getSavedEventsUrl = `/notification-config/programs/${this.programId}/event-role-configs?role_id=${role.id}`;
    }
    this.loader.show();
    this.notificationConfigService.getConfigNotification(getSavedEventsUrl).subscribe({
      next: (response: any)=>{
        if(response?.event_role_configs?.length) {
          this.savedEvents = response?.event_role_configs[0];
        } else if(response?.event_user_configs?.length){
          this.savedEvents = {
            ...response?.event_user_configs[0],
            events : [...response?.event_user_configs[0]?.program_events, ...response?.event_user_configs[0]?.root_events,]
          }
          console.log(this.savedEvents,"****");
        }
        else {
          this.savedEvents = null;
        }

        if (!this.savedEvents || this.savedEvents.events === null) {
          for (const [key, value] of Object.entries(this.notificationconfigs)) {
            const events: any = value['eventList'];
            for (let i = 0; i < (events || []).length; i++) {
              this.notificationconfigs[key]['eventList'][i].checked = true;
            }
          }
        } else {
          const { events: event_list } = this.savedEvents || { events: [] };
          for (const [key, value] of Object.entries(this.notificationconfigs)) {
            const events: any = value['eventList'];
            for (let i = 0; i < (events || []).length; i++) {
              let event = events[i];
              this.notificationconfigs[key]['eventList'][i].checked = !!event_list.find(e => e.event_id === event.id);
            }
          }
        }

        this.selectChildEvent(null, null, null);
        this.loader.hide();
      },
      error: (err) => {
        this.loader.hide();
        this._alert.error(errorHandler(err));
      }
    });
  }

  checkIsDisabled(eventList): boolean {
    if (!this.notificationSetting.userRole ) {
      return true;
    }
    return !eventList?.length || eventList.every(event => event.isNotShow);
  }

  save() {
    const selectedEventList = [];
    const selectedRootEventList = [];
    if(this.type === NotificationType.User){
    for (const [key, value] of Object.entries(this.notificationconfigs)) {
      for (let event of value['eventList']) {
        if (event.checked) {
          if(event.allowOnlyRootLevelTemplates ){
            selectedRootEventList.push({
              event_id: event.id,
              event_name: event.name,
              event_code: event.code,
            });
          }else{
            selectedEventList.push({
              event_id: event.id,
              event_name: event.name,
              event_code: event.code,
            });
          }

        }
      }
    }
    }else{
      for (const [key, value] of Object.entries(this.notificationconfigs)) {
        for (let event of value['eventList']) {
          if (event.checked) {
            selectedEventList.push({
              event_id: event.id,
              event_name: event.name,
              event_code: event.code,
            });
          }
        }
      }
    }
    const { id, name } = this.notificationSetting.userRole || {};
    const requestData: any = {
      is_enabled: true,
      program_events: selectedEventList,
      root_events : selectedRootEventList
    }
    if (this.type === NotificationType.User) {
      requestData.user_id = id;
    } else {
      requestData.role_id = id;
      requestData.role_name = name;
    }
    this.loader.show();
    if (this.savedEvents?.id) {
      this.notificationConfigService.updateConfigNotification(`/notification-config/programs/${this.programId}/event-${this.type === NotificationType.User ? 'user' : 'role'}-configs/${this.savedEvents?.id}`, requestData).subscribe({
        next: ()=>{
          this._alert.success('Notification setting updated successfully');
          this.loader.hide();
        },
        error: err => {
          this.loader.hide();
          this._alert.error(errorHandler(err));
        }
      });
    } else {
      this.notificationConfigService.createConfigNotification(`/notification-config/programs/${this.programId}/event-${this.type === NotificationType.User ? 'user' : 'role'}-configs`, requestData).subscribe({
        next: (response: any)=>{
          this.savedEvents = response;
          this._alert.success('Notification setting created successfully');
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
      this.notificationconfigs[key]['checked'] = this.selectAll;
      this.notificationconfigs[key]['eventList'] = value['eventList'].map(event => ({...event, checked: this.selectAll}));
    }
  }
}
