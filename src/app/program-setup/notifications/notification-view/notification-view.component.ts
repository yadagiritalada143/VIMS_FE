import {Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild} from '@angular/core';
import {LoaderService} from 'src/app/core/components/loader/loader.service';
import {ProgramService} from '../../../programs/program.service';
import {StorageService} from '../../../core/services/storage.service';
import { UntypedFormControl, UntypedFormGroup} from '@angular/forms';
import {AlertService} from 'src/app/core/components/alert/alert.service';
import {EmitEvent, Events, EventStreamService} from 'src/app/core/services/event-stream.service';
import {UserService} from 'src/app/core/services/user.service';
import {VMSConfig} from '../../../library/table/table/table.model';
import {AddressContactDetailsComponent} from 'src/app/shared/components/svms-tab-components/address-contact-details/address-contact-details.component';
import {Subscription} from 'rxjs';
import {errorHandler} from 'src/app/shared/util/error-handler';

@Component({
  selector: 'app-notification-view',
  templateUrl: './notification-view.component.html',
  styleUrls: ['./notification-view.component.scss']
})
export class NotificationViewComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];

  public users: any;
  public orgId: string;
  public languages: [];
  public roles: any;
  public userRoles: any;
  public selectedEvent;
  public template;
  public tableConfig: VMSConfig;
  public changedRoles: Array<any> = [];
  public status;
  public toggle = {
    title: 'Active',
    value: true
  };
  public toggleReminder = {
    title: 'Enable Reminders',
    value: true
  };
  public toggleMessage = {
    title: 'Enable Message',
    value: true
  };
  public modules: any;
  public isViewMode = false;
  public showSelectMembers = false;
  public showSelectUserRoles = false;
  public tabIndex: number = 0;
  public messageData: any;
  public clickOutside: boolean;
  @ViewChild(AddressContactDetailsComponent) AddressContactDetailsComponent: AddressContactDetailsComponent;
  public isEdit = false;
  public label: any;
  public formTitle = 'View';
  public selectedUser: any;
  public programId;
  public members: Array<any> = [];
  public messageForm: UntypedFormGroup;
  public canRestore: boolean = false;

  @Output() onClose = new EventEmitter();
  @Input() viewEventVisibility = 'hidden';
  @Input() isViewClicked;
  @Input() viewData;
  @Input() isEditClicked;

  @Input()
  public set title(title: string) {
    this.label = title;
  };

  constructor(
    private eventStream: EventStreamService,
    private alert: AlertService,
    private loader: LoaderService,
    private programService: ProgramService,
    private storageService: StorageService,
    public userService: UserService,
    private localStorage: StorageService,
  ) {
    this.modules = {
      toolbar: [
        ['bold', 'italic', 'underline'],
        [{list: 'ordered'}, {list: 'bullet'}],
        ['blockquote'],
        [{header: [1, 2, 3, 4, 5, 6, false]}],
      ]
    };
  }

  ngOnInit(): void {
    const programDetails = JSON.parse(this.storageService.get('NewProgramData'));
    this.programId = programDetails.program_req_id;
    this.orgId = this.localStorage.get('ORG_ID');
    this.getUserRoleList();
    this.tableConfig = {
      columnList: [
        {
          name: 'role_type',
          title: 'User Role',
          width: 35,
          isIcon: true,
          isImage: false,
          isContact: false,
          isNumberBadge: false,
          enableClick: true
        },
        {
          name: 'recipient_type',
          title: 'Type',
          width: 35,
          isIcon: true,
          isImage: false,
          isContact: false,
          isNumberBadge: false,
          enableClick: true
        },
        {
          name: 'status',
          title: 'Status',
          width: 30,
          isShowCheckBox: true,
          isCheckBoxReadonly: false,
          isIcon: true,
          isImage: false,
          isContact: false,
          isNumberBadge: false,
          enableClick: true,
        }
      ],
      showTabs: false,
      isExpand: false,
      isFilter: false,
      isSearch: false,
      isSetting: false,
      isTopPagination: false,
      hideBottomPagination: true,
      isCreate: false,
      hideResultCount: true,
      hideHeader: true,
      density: 'COMPACT',
    };
    this.getAllProgramMembers();
    this.subscriptions.push(this.eventStream.on(Events.VIEW_EVENT).subscribe((data:any) => {
      this.toggle = data.status.status ? {title: 'Active', value: true} : {title: 'Inactive', value: false};
      this.isViewMode = true;
      this.tableConfig.columnList[2].isCheckBoxReadonly = true;
      this.getTemplateContent(data.id);
      this.getRoleList(data.id, data.category, data.role_engine[0]['actor']['id'], data.role_engine[0]['recipient']['id']);
      if (data) {
        this.selectedEvent = data;
        this.formTitle = 'View ' + data.name;
      }
    }));

    this.subscriptions.push(this.eventStream.on(Events.EDIT_EVENT).subscribe((data:any) => {
      this.isViewMode = false;
      this.getTemplateContent(data.id);
      this.getRoleList(data.id, data.category, data.role_engine[0]['actor']['id'], data.role_engine[0]['recipient']['id']);
      if (data) {
        this.selectedEvent = data;
        this.toggle = data.status.status ? {title: 'Active', value: true} : {title: 'Inactive', value: false};
        this.formTitle = 'Edit ' + data.name;
      }
    }));

    this.messageForm = new UntypedFormGroup({
      subject: new UntypedFormControl(null, []),
      content: new UntypedFormControl(null, []),
      language: new UntypedFormControl(''),
      start_before: new UntypedFormControl(null, []),
      name: new UntypedFormControl(null, []),
      members: new UntypedFormControl(null, []),
      user_roles: new UntypedFormControl(null, []),
    });
    this.getLanguages();

  }

  public onIndexChange(event: any): void {
    this.tabIndex = event;
    if (this.tabIndex !== 0) {
      this.tableConfig.hideHeader = true;
    } else {
      this.tableConfig.hideHeader = false;
    }
  }

  getMessageData() {
    const programObj = this.localStorage.get("ProgramObj");
    this.subscriptions.push(this.userService.get(`/notification/api/notification/${programObj.id}/template-content/1?language=English`).subscribe((data:any) => {
      this.messageData = data?.results[0]?.content;
    }));
  }

  getAllProgramMembers(pageNo = 1) {
    this.subscriptions.push(this.userService.get(`/configurator/programs/${this.programId}/members?page=${pageNo}`).subscribe((data:any) => {
      this.members = data?.members;
    }));
  }

  getRoleList(id, catID, actID, recID) {
    this.loader.show();
    this.subscriptions.push(this.userService.get(`/notification/api/role-engine/${this.programId}?category_id=${catID}&event_id=${id}&actor=${actID}&recipient=${recID}`).subscribe((data: any) => {
      this.roles = data?.results[0].recipient_role;
    }));
  }

  getUserRoleList() {
    this.subscriptions.push(this.userService.get(`/configurator/programs/${this.programId}/roles`).subscribe((data:any) => {
      this.userRoles = data.roles;
    }));
  }


  sidebarClose() {
    this.tabIndex = 0;
    this.isViewMode = false;
    this.canRestore = false;
    this.isEdit = false;
    this.messageForm.reset();
    this.onClose.emit(true);
  }

  getLanguages() {
    this.subscriptions.push(this.programService.get(`/notification/api/notification/language`).subscribe((data:any) => {
      this.languages = data.results;
    }));
  }

  getTemplateContent(id) {
    this.loader.show();
    this.subscriptions.push(this.programService.get(`/notification/api/notification/${this.programId}/template-content/${id}?language=English`).subscribe((data:any) => {
      this.template = data.results[0];
      if (this.template.message_type == 2) {
        this.canRestore = true;
      }
      ;
      const templateLanguage = this.languages.filter(lang => lang['id'] == this.template.language)[0];
      this.messageForm.patchValue({
        content: this.template.content,
        subject: this.template.subject,
        language: templateLanguage['name'],
      });
      this.loader.hide();
    }, (error) => {
      this.loader.hide();
    }));
  }

  onClickToggle() {
    if (this.toggle.value) {
      this.toggle.value = false;
      this.toggle.title = 'inactive';
    } else {
      this.toggle.value = true;
      this.toggle.title = 'active';
    }
  }

  get formValue() {
    return this.messageForm.controls;
  }

  restore() {
    if (this.tabIndex === 0) {
      this.restoreDefaultTemplateContent();
    } else if (this.tabIndex === 1) {
      this.restoreDefaultRecipientRoles();
    }
  }

  update() {
    if (this.tabIndex === 0) {
      this.updateDefaultTemplateContent();
    } else if (this.tabIndex === 1) {
      this.updateRecipientRoles();
    }
    this.sidebarClose();
  }

  restoreDefaultTemplateContent() {
    this.subscriptions.push(this.programService.delete(`/notification/api/notification/${this.programId}/template-content/${this.selectedEvent.id}/${this.template.id}?language=English`).subscribe((data:any) => {
      if (data) {
        this.sidebarClose();
        this.alert.success(`Restored to default`, {});
        this.eventStream.emit(new EmitEvent(Events.EVENT_UPDATED, this.selectedEvent));
      }
    }));
  }

  updateDefaultTemplateContent() {
    const formValues = this.messageForm.value;
    const payload = {
      'id': this.selectedEvent.status.id,
      'status': {
        'id': this.selectedEvent.status.id,
        'status': this.toggle.value,
        'program_id': this.programId,
        'event': this.selectedEvent.id
      },
      'program_id': this.programId,
      'content': formValues.content,
      'subject': formValues.subject,
      'image': null,
      'message_type': 1,
      'language': 1,
      'template': this.selectedEvent.id
    };
    this.loader.show();
    this.subscriptions.push(this.programService.put(`/notification/api/notification/${this.programId}/template-content/${this.selectedEvent.id}/${this.template.id}?language=English`, payload).subscribe((data:any) => {
        this.eventStream.emit(new EmitEvent(Events.EVENT_UPDATED, this.selectedEvent));
        if (data) {
          // this.sidebarClose();
          this.alert.success(`Changes updated successfully`, {});
          this.loader.hide();
        }
      },
      (err) => {
        this.alert.error(errorHandler(err));
        this.loader.hide();
        this.sidebarClose();
      }));
  }

  updateRecipientRoles() {
    this.subscriptions.push(this.programService.put(`/notification/api/role-engine/${this.programId}`, this.changedRoles).subscribe((data:any) => {
      console.log(data);
    }));
  }

  restoreDefaultRecipientRoles() {
    this.subscriptions.push(this.programService.delete(`/notification/api/role-engine/${this.programId}`).subscribe((data:any) => {
      console.log(data);
    }));
  }

  updateLanguage() {
    this.programService.put(`/notification/api/notification/language/${this.formValue.language.value}`,
      {name: this.formValue.language.value});
  }

  changeRoleStatus(event) {
    event.vmsData.status = !event.vmsData.status;
    const data = {
      id: event.vmsData.id,
      status: event.vmsData.status,
    };

    if (!this.changedRoles.length) {
      this.changedRoles.push(data);
    } else {
      this.changedRoles.map(role => {
        if (role.id === data.id) {
          this.changedRoles.splice(this.changedRoles.indexOf(data), 1);
        } else {
          this.changedRoles.push(data);
        }
      });
    }
  }

  ngOnDestroy(): void {
    this.subscriptions?.forEach(sub => sub.unsubscribe());
  }

  onEditClick(data) {
    this.tabIndex = 0;
    this.viewEventVisibility = 'visible';
    this.eventStream.emit(new EmitEvent(Events.EDIT_EVENT, this.selectedEvent));
  }
}
