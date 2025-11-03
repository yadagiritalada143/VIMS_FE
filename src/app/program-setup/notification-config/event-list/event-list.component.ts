import { Component, OnInit } from '@angular/core';
import { AccessControlService } from 'src/app/core/services/access-control.service';
import { SvmsRouterService } from 'src/app/core/services/svms-router.service';
import { AlertService } from '../../../core/components/alert/alert.service';
import { StorageKeys, StorageService } from '../../../core/services/storage.service';
import { LOG_TYPE, Log } from '../../../library/logs/logs.model';
import { NotificationConfigService } from '../notification-config.service';

@Component({
  selector: 'app-event-list',
  templateUrl: './event-list.component.html',
  styleUrls: ['./event-list.component.scss']
})
export class EventListComponent implements OnInit {

  notificationconfigs: any = {};
  productionToggle: boolean = false;
  tenant_id: number;
  programId: string;
  eventListArr: any = [];
  searchTerm: string = '';
  id: number;
  logs: Log = undefined;
  isViewSuperAdmin = !this.accessControlService.accessControl();
  accessControl: boolean = true;

  constructor(
    private notificationConfigService: NotificationConfigService,
    private storageService: StorageService,
    public alert: AlertService,
    private router: SvmsRouterService,
    private accessControlService: AccessControlService
  ) { }

  ngOnInit(): void {
    this.accessControl = this.accessControlService.accessControl();
    this.tenant_id = this.notificationConfigService?.notificationConfig?.tenant_id;
    let programDetails = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.programId = programDetails?.['id'];
    this.getTenantsConfig();
    this.getNotificationConfigs();
  }
  getTenantsConfig() {
    this.notificationConfigService.get(`/tenant-config/search?key=is-production&tenantId=${this.tenant_id}&refId=simplifyvms`).subscribe((response: any) => {
      if (response) {
        if (response.payload) {
          if (response.payload.value) {
            this.productionToggle = response.payload.value.payload;
          }
          this.id = response.payload.id;
        }
      }
      else {
        this.productionToggle = false;
      }
    })
  }


  getNotificationConfigs() {
    this.notificationConfigService.get(`/event/all?page=0&size=1000&tenantId=1`).subscribe((response:any)=>{
      if (response) {
        this.eventListArr = JSON.parse(JSON.stringify(response?.payload?.content));
        this.notificationconfigs =this.groupBy(response?.payload?.content, (event)=>event?.group)
      }
    })
  }
  setSearchParam(data: string, isFilter:boolean = false) {
    this.searchTerm = data.toLowerCase();
    this.updateFilteredData(isFilter);
  }
  updateFilteredData(isFilter:boolean = false): void {
    let filteredNotificationconfig = [];
    if (this.searchTerm === '') {
      filteredNotificationconfig = JSON.parse(JSON.stringify(this.eventListArr));
    }
    else {
      for (var i = 0; i < this.eventListArr.length; i++) {
        if (isFilter) {
          if (String(this.eventListArr[i].type?.toLowerCase()).search(this.searchTerm) !== -1) {
            filteredNotificationconfig.push(this.eventListArr[i]);
          }
        }
        else if ((String(this.eventListArr[i].name?.toLowerCase()).search(this.searchTerm) !== -1) ||
          (String(this.eventListArr[i].code?.toLowerCase()).search(this.searchTerm) !== -1) ||
          (String(this.eventListArr[i].description?.toLowerCase()).search(this.searchTerm) !== -1) ||
          (String(this.eventListArr[i].type?.toLowerCase()).search(this.searchTerm) !== -1) ||
          (String(this.eventListArr[i].group?.toLowerCase()).search(this.searchTerm) !== -1)) {
          filteredNotificationconfig.push(this.eventListArr[i]);
        }
      }
    }
    this.notificationconfigs = this.groupBy(filteredNotificationconfig, (event) => event?.group)
  }
  groupBy(xs, f) {
    return xs.reduce((r, v, i, a, k = f(v)) => ((r[k] || (r[k] = [])).push(v), r), {});
  }
  ToggleProductionFlag() {
    this.logs = undefined;
    let completePayload;
    if(this.id){
       completePayload = {
        id: this.id,
        tenantId: this.tenant_id,
        key: "is-production",
        value: {
          payload: !this.productionToggle
        },
        dataType: "boolean",
        uiType: "string",
        entityId: 0,
        createdBy: {
          name: "",
          email: ""
        },
        updatedBy: {
          name: "",
          email: ""
        }
      };
      this.notificationConfigService.put('/tenant-config/', completePayload).subscribe({
        next: (data: any) => {
          this.alert.success(data?.message);
        },
        error: err => {
          this.logs = {
            type: LOG_TYPE.ERROR,
            heading: err?.error?.error?.message,
            messages: this.showErrorMessges(err),
            autoClose: true,
            isShown: true,
            showReportButton: err?.status == 500 || err?.status == 400,
            additionalInfo: { trace_id: err?.error?.trace_id },
          };
        }
      });
    }
    else{
      completePayload = {
        tenantId: this.tenant_id,
        key: "is-production",
        value: {
          payload: false
        },
        dataType: "boolean",
        uiType: "string",
        entityId: 0,
        createdBy: {
          name: "",
          email: ""
        },
        updatedBy: {
          name: "",
          email: ""
        }
      };
      this.notificationConfigService.post('/tenant-config/', completePayload).subscribe({
        next: (data: any) => {
          this.getTenantsConfig();
          this.alert.success(data?.message);
        },
        error: err => {
          this.logs = {
            type: LOG_TYPE.ERROR,
            heading: err?.error?.error?.message,
            messages: this.showErrorMessges(err),
            autoClose: true,
            isShown: true,
            showReportButton: err?.status == 500 || err?.status == 400,
            additionalInfo: { trace_id: err?.error?.trace_id },
          };
        }
      });
    }

  }
  showErrorMessges(err) {
    let messages = [];
    err?.error?.error?.errors?.forEach(msg => {
      if (msg?.message) {
        messages.push(msg?.message);
      }
    });
    return messages;
  }

  navigateToLink(url: string, event?) {
    if(event) {
      event={
        ...event,
        eventCode: event?.code,
        eventName: event?.name,
        module: event?.group
      }
      localStorage.setItem('eventData', JSON.stringify(event));
    }
    if(url) {
      this.router.navigate((url?.split('/')?.filter((fragment: string) => fragment) || []));
    }
  }

  updateStatus(event) {
    event.active = !event.active;
    this.notificationConfigService.put('/event/', event).subscribe({
      next: (data: any) => {
        this.alert.success(data?.message);
      },
      error: err => { }
    });
  }
  // eventData(event) {
  //   localStorage.setItem('eventData', JSON.stringify(event));
  // }
}
