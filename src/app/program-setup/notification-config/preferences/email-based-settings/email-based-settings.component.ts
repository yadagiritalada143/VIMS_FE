import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AlertService } from '../../../../core/components/alert/alert.service';
import { StorageKeys, StorageService } from '../../../../core/services/storage.service';
import { NotificationConfigService } from '../../notification-config.service';
import { Log, LOG_TYPE } from 'src/app/library/logs/logs.model';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { SvmsRouterService } from 'src/app/core/services/svms-router.service';

@Component({
  selector: 'app-email-based-settings',
  templateUrl: './email-based-settings.component.html',
  styleUrls: ['./email-based-settings.component.scss']
})
export class EmailBasedSettingsComponent implements OnInit {
  emailLists: any[] = [];
  title: string;
  email: string;
  inputpaceholder: string;
  addBtnCaption: string;
  tenant_id: number;
  entity_id: string;
  public user: any;
  programId: any;
  key: string;
  logs: Log = undefined;
  searchTerm: string = '';
  filteredEmailLists: any[];
  id: number;
  emailAddForm: UntypedFormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });
  constructor(
    private route: ActivatedRoute,
    private notificationConfigService: NotificationConfigService,
    private storageService: StorageService,
    public alert: AlertService,
    private router: SvmsRouterService,
    private fb: UntypedFormBuilder,
  ) { }

  ngOnInit(): void {
    this.tenant_id = this.notificationConfigService?.notificationConfig?.tenant_id;
    let programDetails = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.programId = programDetails['id'];
    this.route.url.subscribe((param) => {
      if (param.length > 1) {
        if (param[1].path === "Always CC") {
          this.key ="alwayscc-emails";
          this.title = "Always CC";
          this.inputpaceholder = "CC";
          this.addBtnCaption = "Add to CC List";
        }
        else if (param[1].path === "Blacklisted Emails") {
          this.key = "blacklisted-emails";
          this.title = "Email Blacklist";
          this.inputpaceholder = "blacklist";
          this.addBtnCaption = "Add to Blackist";
        }
        else if(param[1].path ==="Always BCC"){
          this.key ="alwaysbcc-emails";
          this.title ="Always BCC";
          this.inputpaceholder ="BCC";
          this.addBtnCaption ="Add to BCC List";
        }
      }
    });
    this.user = this.storageService.get('user');
    this.getEmailLists();
  }
  getEmailLists() {
    this.notificationConfigService.gets('/notification-config/tenant-config/search?tenantId=' + this.tenant_id + '&key=' + this.key + '&refId=' + this.programId).subscribe((response: any) => {
      if (response) {
        if (response.payload) {
          if (response.payload.value) {
            this.emailLists = response.payload.value.payload;
            this.filteredEmailLists = JSON.parse(JSON.stringify(this.emailLists));
            this.emailAddForm.get('email').setValue("");
          }
          this.id = response.payload.id;
        }
        else {
          this.emailLists = [];
          this.filteredEmailLists = [];
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
      this.filteredEmailLists = JSON.parse(JSON.stringify(this.emailLists));
      return;
    }
    else {
      this.filteredEmailLists = [];
      this.emailLists.forEach(email => {
        if (String(email?.toLowerCase()).search(this.searchTerm) !== -1) {
          this.filteredEmailLists.push(email);
        }
      });

    }
  }
  addEmailtoListAsPerType() {
    this.logs = undefined;
    if (this.emailLists.some(email=> email === this.emailAddForm.get('email').value)) {
      this.logs = { type: LOG_TYPE.ERROR, heading: "Email already added!", autoClose: true, isShown: true };
      return;
    }
    if (this.emailLists.length == 0) {
      let datapayload = [];
      datapayload = JSON.parse(JSON.stringify(this.emailLists));
      datapayload.push(this.emailAddForm.get('email').value);
      let completePayload = {
        createdBy: {
          name: this.user?.first_name + ' ' + this.user?.last_name,
          email: this.user?.email,
        },
        dataType: "map",
        key: this.key,
        refId: this.programId,
        uiType: "chips",
        updatedBy: {
          email: "",
          name: ""
        },
        value: {
          payload: datapayload
        }
      };
       this.notificationConfigService.posts('/notification-config/tenant-config/', completePayload).subscribe((data: any) => {
          this.alert.success(data?.message)
          this.getEmailLists();
        }, err => {
          this.logs = { type: LOG_TYPE.ERROR, heading: err?.error?.error?.message, messages: this.showErrorMessges(err), autoClose: true, isShown: true, showReportButton: err?.status == 500 || err?.status == 400, additionalInfo: { trace_id: err?.error?.trace_id } };
        });
    }
    else {
      this.sendUpdateRequest();
    }
  }
  sendUpdateRequest() {
    let datapayload = [];
    datapayload = JSON.parse(JSON.stringify(this.emailLists));
    if (this.emailAddForm.get('email').value !== "") {
      datapayload.push(this.emailAddForm.get('email').value);
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
        this.getEmailLists();
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
  deleteEmailFromList(email: string) {
    this.emailLists.splice(this.emailLists.indexOf(email), 1);
    if (this.emailLists.length > 0) {
      this.sendUpdateRequest();
    }
    else {
      this.notificationConfigService.delete(`/notification-config/tenant-config/${this.id}`).subscribe(
        (data: any) => {
          this.alert.success(data?.message);
          this.getEmailLists();

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
