import { AfterViewChecked, ChangeDetectorRef, Component, ElementRef, EventEmitter, OnInit, Output, ViewChildren } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { DataTransferService } from 'src/app/core/services/data-transfer.service';
import { EventStreamService, Events } from 'src/app/core/services/event-stream.service';
import { StorageService } from 'src/app/core/services/storage.service';
import { ThemeService } from 'src/app/core/services/theme.service';
import { UserService } from 'src/app/core/services/user.service';
import { ProgramService } from 'src/app/programs/program.service';
import { ConfirmationDialogService } from 'src/app/shared/components/confirmation-dialog/confirmation-dialog.service';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { ProgramSetupSidebarService } from '../../component/program-setup-sidebar/program-setup-sidebar.service';

@Component({
  selector: 'app-reason-code-category',
  templateUrl: './reason-code-category.component.html',
  styleUrls: ['./reason-code-category.component.scss']
})
export class ReasonCodeCategoryComponent implements OnInit, AfterViewChecked {

  private subscriptions: Subscription[] = [];
  public moduleName: string;
  public selectedIndex: number = null;
  public selectedIndex2: number = null;
  public hoverItem: number;
  clientData: any;
  programData: any;
  client_name: any;
  client_logo: any;
  client_status: any;
  public showdropdown: boolean = false;
  public category = this.sidebarService.getSideMenu().filter(c => c.name == 'Reason Code');
  public subMenuItem: Array<object> = this.category[0].sideBarSubMenu[0].subMenuItem;
  industry: any;
  email: any;
  moduleGroup = [];
  public programId: string;
  public user: any;
  public sidebarOpen = 'hidden';
  public sidebarTitle = 'Add New Reason';
  public buttonTitle = 'Save';
  public newReason = '';
  public currentReasonCodeID = '';
  public viewButton: boolean = false;
  public reasonCodes: Array<object> = [];
  public currentReasons: Array<object> = [];
  public currentReasonID;
  public editReason = true;
  public readonly = '';
  public selectedModule;
  public newReasonCode = '';
  public selectedId: number = 1;
  public review: string = 'NEUTRAL';
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
  @ViewChildren('target2') target2: ElementRef;
  @Output() public onClose = new EventEmitter();

  constructor(
    public themeService: ThemeService,
    private sidebarService: ProgramSetupSidebarService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    public userService: UserService,
    private _storageService: StorageService,
    private programService: ProgramService,
    public dataTransferService: DataTransferService,
    private eventStream: EventStreamService,
    private _alertService: AlertService,
    public theme: ThemeService,
    private confirmService: ConfirmationDialogService,
  ) { }

  ngOnInit(): void {
    this.getCodeList(this._storageService.get("PROGRAM_ID"));
    this.moduleName = this.getCategory()?.title;

    this.subscriptions.push(this.eventStream.on(Events.OPTION_DROPDOWN).subscribe((data:any) => {
      if (data) {
        this.showdropdown = false;
      }
    }));
  }

  ngAfterViewChecked(): void {
    this.selectedIndex = this.subMenuItem.indexOf((this.subMenuItem).filter(ct => ct["title"] === this.moduleName)[0]);
    this.cdr.detectChanges();
  }

  getCategory() {
    return (this.category[0].sideBarSubMenu[0].subMenuItem).filter(ct => ct.path === this.router.url)[0];
  }

  getCodeList(programID) {
    this.programService.get(`/configurator/programs/${programID}/pages/reason-code-actions?limit=50`).subscribe((reason:any) => {
      this.reasonCodes = reason.reason_code_actions;
      this.getReasonCodeCount(this.moduleName, true);
      this.onModuleChange("", this.moduleName, null);
    })
  }

  getReasonsList(programID, reasonID) {
    this.programService.get(`/configurator/programs/${programID}/pages/reason-code-actions/${reasonID}/reason-codes?status=all`).subscribe((reasons: any) => {
      this.currentReasons = reasons.reason_codes;
    })
  }

  showReasons(id) {
    this.currentReasonID = id;
    this.getReasonsList(this._storageService.get("PROGRAM_ID"), id);
  }

  showOptionDropdown(elem) {
    this.selectedId = elem;
    this.showdropdown = !this.showdropdown;
  }

  editClick(i, value) {
    this.target["_results"][i].nativeElement.firstChild.focus();
    this.readonly = this.target["_results"][i].nativeElement.id;
  }

  closeClick(i, value) {
    const defaultValue = value;
    if (defaultValue !== this.target["_results"][i].nativeElement.firstChild.value) {
      this.target["_results"][i].nativeElement.firstChild.value = defaultValue;
    }
    this.readonly = '';
  }

  openSidebar(action = '', id = '') {
    if(!this.currentReasonID) {
      this._alertService.error('Please select atleast one reason code');
      return;
    }

    this.showdropdown = false;
    this.sidebarOpen = 'visible';
    if (action == 'edit') {
      this.currentReasonCodeID = id;
      const reason = this.currentReasons.filter(cr => cr["id"] == id)[0];
      this.review = this.getReasonCode(reason["category"]);
      this.newReason = reason["name"];
      this.toggle = { value: reason["is_enabled"], title: reason["is_enabled"] ? 'on' : 'off' }
      this.sidebarTitle = 'Edit Reason';
      this.buttonTitle = 'Update';
    }
  }



  onMouseOver(index = undefined) {
    this.hoverItem = index;
  }

  confirmSave(i, value, id) {
    const defaultValue = value;
    if (defaultValue !== this.target["_results"][i].nativeElement.firstChild.value) {
      this.confirmService.confirm('', `Do you want to save the changes?`, 'Yes', 'No')
        .then((confirmed) => {
          if (confirmed) {
            const payload = {
              "name": this.target["_results"][i].nativeElement.firstChild.value,
              "is_enabled": true
            }
            this.programService.put(`/configurator/programs/${this._storageService.get("PROGRAM_ID")}/pages/reason-code-actions/${id}`, payload).subscribe((reason:any) => {
              if (reason) {
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
      "category": this.review
    }
    if (this.is_valid(this.newReason)) {
      if (this.buttonTitle == 'Save') {
        this.programService.post(`/configurator/programs/${this._storageService.get("PROGRAM_ID")}/pages/reason-code-actions/${this.currentReasonID}/reason-codes`, payload).subscribe((data:any) => {
          if (data) {
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
          if (data) {
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
    switch (name) {
      case "Job": moduleName = "JOBS"; break;
      case "Submissions": moduleName = "SUBMISSIONS"; break;
      case "Interview": moduleName = "INTERVIEWS"; break;
      case "Offer": moduleName = "OFFERS"; break;
      case "Onboarding": moduleName = "ONBOARDING"; break;
      case "Assignment": moduleName = "ASSIGNMENTS"; break;
      case "Timesheet": moduleName = "TIMESHEETS"; break;
      case "Expense": moduleName = "EXPENSES"; break;
      case "Invoice": moduleName = "INVOICES"; break;
      case "SOW": moduleName = 'SOW'; break;
    }
    return moduleName;
  }

  getReasonCodeCount(reason_code_name, list = false) {
    if (list) {
      return this.reasonCodes.filter(rc => rc["entity_ref"] == this.getReasonCodeName(reason_code_name));
    } else return this.reasonCodes.filter(rc => rc["entity_ref"] == this.getReasonCodeName(reason_code_name)).length;
  }

  addNewReasonCode() {

    let reason_code = this.newReasonCode.toUpperCase();
    while (reason_code.search(' ') !== -1)
      reason_code = reason_code.replace(' ', '_');

    const payload = {
      "name": this.newReasonCode,
      "code": reason_code,
      "entity_ref": this.getReasonCodeName(this.moduleName),
      "is_enabled": true
    }

    if (this.is_valid(this.newReasonCode)) {
      this.programService.post(`/configurator/programs/${this._storageService.get("PROGRAM_ID")}/pages/reason-code-actions`, payload)
        .subscribe((data:any) => {
          if (data) {
            this._alertService.success('Reason code added successfully!');
            this.getCodeList(this._storageService.get("PROGRAM_ID"));
          }
        },
          err => {
            this._alertService.error(err?.error?.error?.message);
          })
    }
  }

  is_valid(str) {

    if (!str || str?.trim()?.length == 0) {
      this._alertService.error('Cannot be an empty/whitespace string');
      return false;
    }
    if (str?.trim()?.length < 3) {
      this._alertService.error('Minimum 3 characters required');
      return false;
    }
    if (!(/^[A-Za-z][A-Za-z0-9\s!@$_\-^/&()]*$/.test(str))) {
      this._alertService.error('Please provide valid reason name');
      return false;
    }

    return true;
  }

  onModuleChange(name, title, index: number) {
    this.newReasonCode = '';
    this.currentReasons = [];
    this.selectedIndex = index;
    this.selectedIndex2 = null;
    this.moduleName = title;
    this.selectedModule = this.getReasonCodeCount(title, true);
    this.currentReasonID = null;
  }

  reasonCodesClick(index: number) {
    this.selectedIndex2 = index;
  }

  getReview(val: string) {
    let result = 'Neutral';
    switch(val) {
      case 'POSITIVE':
      case 'FAVORABLE':
        result = 'Positive';
        break;
      case 'NEGATIVE':
      case 'UNFAVORABLE':
        result = 'Negative';
        break;
    }

    return result;
  }
  getReasonCode(value : any)
  {
    if(value?.toUpperCase() === 'UNFAVORABLE')
    return 'NEGATIVE';
    else if (value?.toUpperCase() === 'FAVORABLE')
    return 'POSITIVE';
    else
    return 'NEUTRAL';
  }

}
