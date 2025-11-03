import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AlertService } from '../../../../core/components/alert/alert.service';
import { StorageKeys, StorageService } from '../../../../core/services/storage.service';
import { NotificationConfigService } from '../../notification-config.service';
import { Log, LOG_TYPE } from 'src/app/library/logs/logs.model';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { SvmsRouterService } from 'src/app/core/services/svms-router.service';

export enum DomainType{
  Blacklist = "blacklist",
  Whitelist = "whitelist"
}
@Component({
  selector: 'app-domain-based-settings',
  templateUrl: './domain-based-settings.component.html',
  styleUrls: ['./domain-based-settings.component.scss'],
})
export class DomainBasedSettingsComponent implements OnInit {
  domainType: string;
  domainLists: any[] = [];
  domainname: string;
  tenant_id: number;
  entity_id: string;
  public user: any;
  programId: any;
  key: string = "whitelisted-domains";
  logs: Log = undefined;
  searchTerm: string = '';
  filteredDomainLists: any[];
  id: number;
  domainAddForm: UntypedFormGroup = this.fb.group({
    domainName: ['', [Validators.required, Validators.pattern('(((?!-)[A-Za-z0-9-]{3,63}(?<!-)[.]))+[A-Za-z0-9-]{2,6}')]],
  });
  constructor(
    private route: ActivatedRoute,
    private notificationConfigService: NotificationConfigService,
    private storageService: StorageService,
    public alert: AlertService,
    private router: SvmsRouterService,
    private fb: UntypedFormBuilder,
  ) {}

  ngOnInit(): void {
    this.tenant_id = this.notificationConfigService?.notificationConfig?.tenant_id;
    let programDetails = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.programId = programDetails['id'];
    this.route.url.subscribe(param => {
      if (param.length > 1) {
        this.domainType = param[1].path;
      }
    });
    if (this.domainType?.toLowerCase() === DomainType.Blacklist) {
      this.key = 'blacklisted-domains';
    }
    if (this.domainType?.toLowerCase() === DomainType.Whitelist) {
      this.key = 'whitelisted-domains';
    }
    this.user = this.storageService.get('user');
    this.getDomainLists();
  }

  getDomainLists() {
    this.notificationConfigService
      .gets('/notification-config/tenant-config/search?tenantId=' + this.tenant_id + '&key=' + this.key + '&refId=' + this.programId)
      .subscribe((response: any) => {
        if (response) {
          if (response.payload) {
            if (response.payload.value) {
              this.domainLists = response.payload.value.payload;
              this.filteredDomainLists = JSON.parse(JSON.stringify(this.domainLists));
              this.domainAddForm.get('domainName').setValue("");
            }
            this.id = response.payload.id;
          }
          else {
            this.domainLists = [];
            this.filteredDomainLists = [];
          }
        }
      });
  }

  setSearchParam(data: string) {
    this.searchTerm = data.toLowerCase();
    this.updateFilteredData();
  }

  updateFilteredData(): void {
    if (this.searchTerm === '') {
      this.filteredDomainLists = JSON.parse(JSON.stringify(this.domainLists));
      return;
    } else {
      this.filteredDomainLists = [];
      this.domainLists.forEach(domain => {
        // let found: boolean = false;
        if (String(domain?.toLowerCase()).search(this.searchTerm) !== -1) {
          this.filteredDomainLists.push(domain);
        }
      });
    }
  }

  addDomaintoListAsPerType() {
    this.logs = undefined;
    if (this.domainLists.some(domainname => domainname === this.domainAddForm.get('domainName').value)) {
      this.logs = { type: LOG_TYPE.ERROR, heading: "Domain already added!", autoClose: true, isShown: true };
      return;
    }
    if (this.domainLists.length == 0) {
      let datapayload = [];
      datapayload.push(this.domainAddForm.get('domainName').value);
      let completePayload = {
        createdBy: {
          name: this.user?.first_name + ' ' + this.user?.last_name,
          email: this.user?.email,
        },
        dataType: "map",
        key: this.key,
        refId: this.programId,
        tenantId: this.tenant_id,
        entityId: 0,
        uiType: "chips",
        updatedBy: {
          email: "",
          name: ""
        },
        value: {
          payload: datapayload
        }
      };
      this.notificationConfigService.posts('/notification-config/tenant-config/', completePayload).subscribe(
        (data: any) => {
            this.alert.success(data?.message);
            this.getDomainLists();
        },
        err => {
          this.logs = {
            type: LOG_TYPE.ERROR,
            heading: err?.error?.error?.message,
            messages: this.showErrorMessges(err),
            autoClose: true,
            isShown: true,
            showReportButton: err?.status == 500 || err?.status == 400,
            additionalInfo: { trace_id: err?.error?.trace_id },
          };
        },
      );
    }
    else {
      this.sendUpdateRequest();
    }
  }
  sendUpdateRequest() {
    let datapayload = [];
    datapayload = JSON.parse(JSON.stringify(this.domainLists));
    if (this.domainAddForm.get('domainName').value !== "") {
      datapayload.push(this.domainAddForm.get('domainName').value);
    }
    let completePayload = {
      createdBy: {
        name: this.user?.first_name + ' ' + this.user?.last_name,
        email: this.user?.email,
      },
      dataType: "map",
      key: this.key,
      refID: this.programId,
      id: this.id,
      tenantId: this.tenant_id,
      entityId: 0,
      uiType: "chips",
      updatedBy: {
        email: "",
        name: ""
      },
      value: {
        payload: datapayload
      }
    };
    this.notificationConfigService.puts('/notification-config/tenant-config/', completePayload).subscribe(
      (data: any) => {
        this.alert.success(data?.message);
        this.getDomainLists();
      },
      err => {
        this.logs = {
          type: LOG_TYPE.ERROR,
          heading: err?.error?.error?.message,
          messages: this.showErrorMessges(err),
          autoClose: true,
          isShown: true,
          showReportButton: err?.status == 500 || err?.status == 400,
          additionalInfo: { trace_id: err?.error?.trace_id },
        };
      },
    );


  }
  navigateback() {
    this.router.navigate(['notification', 'config', 'preferences']);
  }
  deleteDomainNameFromList(domain: string) {
    this.domainLists.splice(this.domainLists.indexOf(domain), 1);
    if (this.domainLists.length > 0) {
      this.sendUpdateRequest();
    }
    else {
      this.notificationConfigService.delete(`/notification-config/tenant-config/${this.id}`).subscribe(
        (data: any) => {
          this.alert.success(data?.message);
          this.getDomainLists();

        },
        err => {
          this.logs = {
            type: LOG_TYPE.ERROR,
            heading: err?.error?.error?.message,
            messages: this.showErrorMessges(err),
            autoClose: true,
            isShown: true,
            showReportButton: err?.status == 500 || err?.status == 400,
            additionalInfo: { trace_id: err?.error?.trace_id },
          };
        },
      );
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
}
