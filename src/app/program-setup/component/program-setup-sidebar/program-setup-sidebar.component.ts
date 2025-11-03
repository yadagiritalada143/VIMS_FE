import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChildren } from '@angular/core';
import { Router } from '@angular/router';
import { EmitEvent, Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { StorageService } from 'src/app/core/services/storage.service';
import { ThemeService } from 'src/app/core/services/theme.service';
import { ProgramConfig, UserDataObj } from 'src/app/shared/enums';
import { DataTransferService } from '../../../core/services/data-transfer.service';
import { ProgramService } from '../../../programs/program.service';
import { UserService } from './../../../core/services/user.service';
import { ProgramSetupSidebarModule, SubItemModule } from './program-setup-sidebar.module';
import { ProgramSetupSidebarService } from './program-setup-sidebar.service';
import { ConfirmationDialogService } from 'src/app/shared/components/confirmation-dialog/confirmation-dialog.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { errorHandler } from 'src/app/shared/util/error-handler';


@Component({
  selector: 'app-program-setup-sidebar',
  templateUrl: './program-setup-sidebar.component.html',
  styleUrls: ['./program-setup-sidebar.component.scss']
})
export class ProgramSetupSidebarComponent implements OnInit {

  @Output()
  buttonClicked: EventEmitter<string> = new EventEmitter<string>();
  sidebarToggle = "";
  @Input()
  addZindexClass;

  isToggled: string = '';
  isActive: string = '';
  sideBarData: ProgramSetupSidebarModule[];
  sideBar: ProgramSetupSidebarModule;
  public userAvatar: string;
  public userName: string;
  public userData = UserDataObj;
  public moduleName:string = 'Job';
  public selectedIndex:number = null;
  public selectedIndex2:number = null;
  clientData: any;
  programData: any;
  client_name: any;
  client_logo: any;
  client_status: any;
  category: any;
  labor_category: any;
  email: any;
  moduleGroup = [];
  public programId: string;
  public user: any;
  public reasonCode: boolean = false;
  public sidebarOpen = 'hidden';
  public sidebarTitle = 'Add New Reason';
  public buttonTitle = 'Save';
  public newReason = '';
  public currentReasonCodeID = '';
  public viewButton: boolean;
  public reasonCodes:Array<object> = [];
  public currentReasons:Array<object> = [];
  public currentReasonID;
  public editReason = true;
  public readonly = '';
  public selectedModule;
  public newReasonCode = '';
  selectedModuleName: any;
  eventSubscription: any;
  buttonOptions = {
    themeType: 'red',
  }
  public toggle = {
    title: 'on',
    value: true
  };

  @ViewChildren('target') target: ElementRef;
  @Output() public onClose = new EventEmitter();

  constructor(
    public themeService: ThemeService,
    private sidebarService: ProgramSetupSidebarService,
    private router: Router,
    public userService: UserService,
    private _storageService: StorageService,
    private programService: ProgramService,
    public dataTransferService: DataTransferService,
    private eventStream: EventStreamService,
    private _alertService: AlertService,
    public theme: ThemeService,
    private confirmService: ConfirmationDialogService,
  ) {
    this.viewButton = false;
  }

  ngOnInit(): void {
    this.user = this._storageService.get('user');
    let programId = this._storageService.get(ProgramConfig[0]);
    if (programId && programId != null) {
      programId = JSON.parse(programId);
      this.programId = programId?.program_req_id;
    }
    let programObj = this._storageService.get(ProgramConfig[5]);
    if(programObj && programObj != null){
      this.client_name = programObj?.name;
    }

    let sidebar = this._storageService.get(this.userData[5]);
    if (sidebar != null)
      setTimeout(() => {
        this.buttonClicked.emit(this.sidebarToggle = sidebar);
      }, 0);
    this.sideBarData = this.sidebarService.getSideMenu();
    this.userService.getAllModuleList(this.programId).subscribe((data:any) => {
      if (data && data.module_groups) {
        this.moduleGroup = data.module_groups;
        this.sideBarData.map(m => {
          // if(m.name == "Reason Code") {
          //   this.getCodeList(this._storageService.get("PROGRAM_ID"));
          // };
          if (m.name === 'Custom Fields') {
            m.sideBarSubMenu[0].subMenuItem = [];
            this.moduleGroup.forEach(e => {
              let obj: SubItemModule = {
                title: e.name,
                class: 'sidebar-icon-submenu',
                path: '/custom-fields/list',
                isNotification: false,
                queryParams: e.modules && e.modules?.length ? { entity: e.modules[0].code } : null
              }
              m.sideBarSubMenu[0].subMenuItem.push(obj);
            });
          }
        })
      }
    }, error => {
      console.error(error);
    })
    this.programData = JSON.parse(this._storageService.get(ProgramConfig[0]));
    this.fetchClientDetails();
    this.programService.shareProgramData.subscribe((data:any) => {
      if(data){
        this.fetchClientDetails();
      }
    })
  }

  getCodeList(programID) {
    this.programService.get(`/configurator/programs/${programID}/pages/reason-code-actions?limit=50`).subscribe((reason:any) => {
      this.reasonCodes = reason.reason_code_actions;
      this.getReasonCodeCount(this.moduleName, true);
      this.onModuleChange("", this.moduleName, null);
    })
  }

  getReasonsList(programID,reasonID) {
    this.programService.get(`/configurator/programs/${programID}/pages/reason-code-actions/${reasonID}/reason-codes`).subscribe((reasons:any) => {
      this.currentReasons = reasons.reason_codes;
    })
  }

  showReasons(id) {
    this.currentReasonID = id;
    this.getReasonsList(this._storageService.get("PROGRAM_ID"),id);
  }

  editClick(i, value) {
    this.target["_results"][i].nativeElement.firstChild.focus();
    this.readonly = this.target["_results"][i].nativeElement.id;
  }

  closeClick(i, value){
    const defaultValue = value;
    if(defaultValue !== this.target["_results"][i].nativeElement.firstChild.value) {
      this.target["_results"][i].nativeElement.firstChild.value = defaultValue;
    }
    this.readonly = '';
  }

  openSidebar(action='', id='') {
    this.sidebarOpen = 'visible';
    if(action == 'edit') {
      this.currentReasonCodeID = id;
      const reason =  this.currentReasons.filter(cr => cr["id"] == id)[0];
      this.newReason = reason["name"];
      this.toggle = { value: reason["is_enabled"], title: reason["is_enabled"] ? 'on' : 'off'}
      this.sidebarTitle = 'Edit Reason';
      this.buttonTitle = 'Update';
    }
  }

  confirmSave(i, value, id) {
    const defaultValue = value;
    if(defaultValue !== this.target["_results"][i].nativeElement.firstChild.value) {
      this.confirmService.confirm('', `Do you want to save the changes?`, 'Yes', 'No')
      .then((confirmed) => {
        if (confirmed) {
          const payload = {
            "name": this.target["_results"][i].nativeElement.firstChild.value,
            "is_enabled": true
          }
          this.programService.put(`/configurator/programs/${this._storageService.get("PROGRAM_ID")}/pages/reason-code-actions/${id}`, payload).subscribe((reason:any) => {
            if(reason) {
              this.getCodeList(this._storageService.get("PROGRAM_ID"));
              this.readonly = '';
            }
          })
        } else {
          this.closeClick(i, value);
        }
      }).catch(() => { });
    } else {
      this.closeClick(i, value);
    }
  }

  sidebarClose() {
    this.sidebarOpen = "hidden";
    this.onClose.emit(true);
    this.sidebarTitle = 'Add New Reason';
    this.buttonTitle = 'Save';
    this.newReason = '';
  }

  onClickToggle() {
    if (this.toggle.value) {
      this.toggle.value = false;
      this.toggle.title = 'off';
    } else {
      this.toggle.value = true;
      this.toggle.title = 'on';
    }
  }

  onSave() {
    const payload = {
      "name": this.newReason,
      "is_enabled": this.toggle.value,
    }
    if(!this.is_valid(this.newReason)) {
      if(this.buttonTitle == 'Save') {
        this.programService.post(`/configurator/programs/${this._storageService.get("PROGRAM_ID")}/pages/reason-code-actions/${this.currentReasonID}/reason-codes`, payload).subscribe((data:any) => {
        if(data) {
          this.getReasonsList(this._storageService.get("PROGRAM_ID"), this.currentReasonID);
          this._alertService.success(`Reason is added successfully.`);
          this.sidebarClose();
        }
      },
        (err) => {
          this._alertService.error(errorHandler(err));
        }
        )
      } else {
        this.programService.put(`/configurator/programs/${this._storageService.get("PROGRAM_ID")}/pages/reason-code-actions/${this.currentReasonID}/reason-codes/${this.currentReasonCodeID}`, payload).subscribe((data:any) => {
          if(data) {
            this.getReasonsList(this._storageService.get("PROGRAM_ID"), this.currentReasonID);
            this._alertService.success(`Reason updated successfully.`);
            this.sidebarClose();
          }
        },
          (err) => {
            this._alertService.error(errorHandler(err));
          }
          )
      }
    }
  }

  getReasonCodeName(name) {
    let moduleName = "";
    switch(name) {
      case "Job": moduleName = "JOBS"; break;
      case "Submissions": moduleName = "SUBMISSIONS"; break;
      case "Interview": moduleName = "INTERVIEWS"; break;
      case "Offer": moduleName = "OFFERS"; break;
      case "Onboarding": moduleName = "ONBOARDING"; break;
      case "Assignment": moduleName = "ASSIGNMENTS"; break;
      case "Timesheet": moduleName = "TIMESHEETS"; break;
      case "Expense": moduleName = "EXPENSES"; break;
      case "Invoice": moduleName = "INVOICES"; break;
    }
    return moduleName;
  }

  getReasonCodeCount(reason_code_name, list = false) {
    if(list) {
      return this.reasonCodes.filter(rc => rc["entity_ref"] == this.getReasonCodeName(reason_code_name));
    } else return this.reasonCodes.filter(rc => rc["entity_ref"] == this.getReasonCodeName(reason_code_name)).length;
  }

  addNewReasonCode() {
    const payload = {
      "name": this.newReasonCode,
      "code": this.newReasonCode.toUpperCase().replace(' ', '_'),
      "entity_ref": this.getReasonCodeName(this.moduleName),
      "is_enabled": true
    }

    if(!this.is_valid(this.newReasonCode)) {
      this.programService.post(`/configurator/programs/${this._storageService.get("PROGRAM_ID")}/pages/reason-code-actions`, payload).subscribe((data:any) => {
        if(data) {
          this.getCodeList(this._storageService.get("PROGRAM_ID"));
        }
      })
    };
  }

  is_valid(str) {
    str = str?.replace(/[^a-zA-Z0-9 ]/g, "");
    return str === null || str?.match(/^\s*$/) !== null;
  }


  fetchClientDetails() {
    //let categoryName = 'client';
    this.programService.get(`/configurator/programs/${this.programData.program_req_id}`).subscribe((data:any) => {
      this.clientData = data.program;
      this.client_name = this.clientData?.name != null ? this.clientData?.name : '';
      this.client_logo = this.clientData?.logo != null ? this.clientData?.logo : this.client_name;
      this.client_status = this.clientData?.is_enabled != null ? this.clientData?.is_enabled : '';
      //this.category = this.clientData?.category != null ? this.clientData?.category : '';
      // this.labor_category = this.clientData?.labor_categories?.name != null ? this.clientData?.labor_category?.name : '';
      // this.email = this.clientData?.created_by?.email != null ? this.clientData?.created_by?.email : '';
      // if (this.clientData) {
      //   let newClientJson = {
      //     client_name: this.clientData?.name,
      //     client_logo: this.clientData?.logo,
      //     client_status: this.clientData?.is_enabled,
      //     category: this.category,
      //     labor_category: this.labor_category,
      //     email: this.email
      //   }
      //  // this._storageService.set(ClientData[0], JSON.stringify(newClientJson), true);
      // }
    }, error => {
      if (error?.error?.message) {
        console.error(error);
      }
    });
  }


  get logoUrl() {
    switch (this.themeService.getCurrentTheme()) {
      case 'light':
        return './assets/images/logo-light.svg';
      case 'dark':
        return './assets/images/logo-dark.svg';
      default: return './assets/images/logo-light.svg';
    }
  }
  openSideMenu(name: string, open = false) {
    if (open) {
      // this.reasonCode = name === "Reason Code";
      if (this.isToggled === name) {
        this.isToggled = ''
        this.sideBar = undefined
        return
      }
      this.sideBar = this.sideBarData.find(s => s.name === name)
      this.isToggled = name
    } else {
      this.isToggled = ''
      this.sideBar = undefined
    }
  }

  closeSidebarMenu(name, title) {
    this.selectedModuleName = title;
    if(name == "Notifications") {
      this.eventStream.emit(new EmitEvent(Events.NOTIFICATION_CATEGORY, title));
    }
    this.eventStream.emit(new EmitEvent(Events.CUSTOM_FIELDS, this.selectedModuleName));
    this.isToggled = ''
    this.sideBar = undefined
    this.isActive = name
  }

  onModuleChange(name, title, index: number) {
    this.newReasonCode = '';
    this.currentReasons = [];
    this.selectedIndex = index;
    this.selectedIndex2 = null;
    this.moduleName = title;
    this.selectedModule = this.getReasonCodeCount(title, true);
  }

  reasonCodesClick(index: number) {
    this.selectedIndex2 = index;
  }

  redirectByUrl(url) {
    this.isToggled = ''
    this.sideBar = undefined
    this.router.navigateByUrl(url)
  }

  logout() {
    this.programService.userLogout();
  }
}
