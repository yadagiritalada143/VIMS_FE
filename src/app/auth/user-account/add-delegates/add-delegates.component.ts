import { Component, OnInit, Output, EventEmitter, OnDestroy, Input } from '@angular/core';
import { Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { ProgramService } from 'src/app/programs/program.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { AbstractControl, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Log, LOG_TYPE } from 'src/app/library/logs/logs.model';
import { AuthorizationService } from 'src/app/core/services/authorize.service';
import { UniqueKeyPipe } from 'src/app/shared/pipe/unique-key.pipe';
import { SortHelperPipe } from 'src/app/shared/pipe/sort-helper.pipe';
import { DATE_FORMAT } from 'src/app/library/date-format/date-format.model';
import moment from 'moment-timezone';

enum ModuleGroups {
  TimeAndExpense = 'time & expense',
  Job = 'job',
  Assignment = 'assignment',
  StatementOfWork = 'statement of work',
  RFX = "rfx"
};

@Component({
  selector: 'app-add-delegates',
  templateUrl: './add-delegates.component.html',
  styleUrls: ['./add-delegates.component.scss']
})
export class AddDelegatesComponent implements OnInit, OnDestroy {

  private subscrptions: Subscription[] = [];

  public programId: any;
  public today = new Date();
  public selectedRole: any = {};
  public createDelegateForm: UntypedFormGroup;
  public delegateModule = [];
  public currentProgram;
  public userType;

  programDetails: any;
  isMultiple: boolean = true;
  logs: Log = undefined;
  isDisabled: boolean = false;
  title = 'Add New Delegation';
  btnName = 'Add Delegate';
  clickOutside = false;
  addDelegates = "hidden";
  delegateFromLoading = false
  delegateToLoading = false
  isDuplicate: boolean = false
  userListDataFrom: any = [];
  userListDataTo: any = [];
  userListDataFromFordelegateFrom: any = [];
  searchTermFrom: any;
  searchTermTo: any;
  isType: any;
  delegateFrom = new Subject<string>();
  delegateTo = new Subject<string>();
  editDelegateData: any = {};
  options2: any = {
    language: 'English',
    timepicker: true,
    format12h: true,
    range: false,
    enabledDateRanges: [
      { start: this.today?.setDate(this.today?.getDate() - 1) },

    ]
  };

  options1 = {
    language: 'English',
    timepicker: true,
    format12h: true,
    range: false,
    enabledDateRanges: [
      { start: this.today?.setDate(this.today?.getDate()) }
    ]
  };

  @Output() close = new EventEmitter();
  supportData: any = {}

  public programMember: any = null;
  @Input('programMember') set memberData(data: any) {
    this.programMember = data;
    this.delegateModule = this.programMember?.role?.module_groups?.filter((d: any) => {
      return (
        d?.name?.toLowerCase() === ModuleGroups?.TimeAndExpense ||
        d?.name?.toLowerCase() === ModuleGroups?.Job ||
        d?.name?.toLowerCase() === ModuleGroups?.Assignment ||
        d?.name?.toLowerCase() === ModuleGroups?.StatementOfWork ||
        d?.name?.toLowerCase() === ModuleGroups?.RFX
      )
    });

    this.delegateModule?.forEach((dModule: any) => {
      dModule.display_name = dModule?.name;
      if (dModule?.name?.toLowerCase() === ModuleGroups?.Job) {
        dModule.display_name = 'Job, Submission, Interview & Offer';
        dModule.order = 1
      }
      if (dModule?.name?.toLowerCase() === ModuleGroups?.Assignment) {
        dModule.order = 2
      }
      if (dModule?.name?.toLowerCase() === ModuleGroups?.TimeAndExpense) {
        dModule.order = 3
      }
      if (dModule?.name?.toLowerCase() === ModuleGroups?.RFX) {
        dModule.display_name = 'RFx, Bid';
        dModule.order = 4
      }
      if (dModule?.name?.toLowerCase() === ModuleGroups?.StatementOfWork) {
        dModule.display_name = 'Statement of Work, Progress Update';
        dModule.order = 5
      }
    });

    this.sortPipe.transform(this.delegateModule, 'order');

    if(!this.createDelegateForm) {
      this.initializeForm();
    }

    this.setdelegateModuleData();
    return;
  }

  constructor (
    private eventStream: EventStreamService,
    public storageService: StorageService,
    private _alert: AlertService,
    private fb: UntypedFormBuilder,
    public programService: ProgramService,
    private authorizationService: AuthorizationService,
    private uniqueKeyPipe: UniqueKeyPipe,
    private sortPipe: SortHelperPipe
  ) {

    this.delegateFrom.pipe(
      debounceTime(500),
      distinctUntilChanged())
      .subscribe(value => {
        this.searchTermFrom = value['term'];
        this.getAllUsersFrom();
      }
    );

    this.delegateTo.pipe(
      debounceTime(500),
      distinctUntilChanged())
      .subscribe(value => {
        this.searchTermTo = value['term'];
        this.getAllUsersTo();
      }
    );
  }

  ngOnInit(): void {
    this.currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.userType = this.storageService.get(StorageKeys.USER_TYPE);
    if (this.currentProgram) {
      this.programId = this.currentProgram?.id;
    }
    this.initializeForm();
    this.createDelegateForm.reset();
    // this.getdelegateModule();
    this.subscrptions.push(this.eventStream.on(Events.ADD_DELEGATE).subscribe((data) => {
      if (data.value) {
        this.title = 'Add New Delegation';
        this.btnName = 'Add Delegate';
        this.addDelegates = 'visible';
      } else {
        this.addDelegates = 'hidden';
      }
      this.getAllUsersFrom();
      this.getAllUsersTo();
      let userId = this.storageService.get('user')?.id;
      this.createDelegateForm?.patchValue({
        delegated_from: userId,
      });

      this.clickOutside = false;
    }));
    this.subscrptions.push(this.eventStream.on(Events.EDIT_DELEGATE).subscribe((data) => {
      this.isMultiple = false
      data.data.data.delegated_to.bindLable = data?.data?.data?.delegated_to?.full_name || '';
      this.editDelegateData = data?.data?.data;
      //this.searchTermFrom = this.editDelegateData?.delegated_by?.first_name
      // this.searchTermTo = this.editDelegateData?.delegated_to?.first_name
      this.searchTermFrom = '';
      this.getAllUsersFrom();
      this.getAllUsersTo();
      this.userListDataTo.push(this.editDelegateData?.delegated_to)
      this.userListDataTo = [...new Set(this.userListDataTo)]
      this.userListDataFrom.push(this.editDelegateData?.delegated_by)
      this.userListDataFrom = [...new Set(this.userListDataFrom)]
      this.isType = data?.type;
      this.btnName = 'Save';
      this.title = 'Edit Delegate'
      // this.updateUserFrom();
      //this.updateUserTo();

      const start_date: Date = new Date(this.editDelegateData?.start_date);
      const end_date: Date = new Date(this.editDelegateData?.end_date);
      this.createDelegateForm?.patchValue({
        delegated_from: this.editDelegateData?.delegated_by?.id,
        delegated_to: this.editDelegateData?.delegated_to?.id,
        delegated_to_single: this.editDelegateData?.delegated_to?.id,
        start_date: moment(start_date).format(this.dateFormat),
        end_date: moment(end_date).format(this.dateFormat),
        module_groups: this.formatModule(this.editDelegateData?.module_groups),
        is_enabled: this.editDelegateData?.is_enabled || true
      });
      this.activeDelegateModules(this.editDelegateData?.module_groups, data?.type);
    }));
  }

  checkAuthorization(permission) {
    return this.authorizationService.authorize(permission)
  }

  getDate(date) {
    if (date) {
      const splittedDate = date.split('-');
      const yy = splittedDate[0];
      const month = splittedDate[1];
      const dd = splittedDate[2];
      return new Date(yy, month - 1, dd);
    }
  }

  updateUserFrom() {
    let userList = JSON.parse(JSON.stringify(this.userListDataFrom));
    const isUser = userList?.some(u => u?.id === this.editDelegateData?.delegated_to?.id);
    if (!isUser) {
      userList.push(this.editDelegateData?.delegated_to);
    }
    this.userListDataFrom = [...userList];
  }

  updateUserTo() {
    let userList = JSON.parse(JSON.stringify(this.userListDataFrom));
    const isUser = userList?.some(u => u?.id === this.editDelegateData?.delegated_to?.id);
    if (!isUser) {
      userList.push(this.editDelegateData?.delegated_to);
    }
    this.userListDataTo = [...userList];
  }

  formatModule(data) {
    const moduleGroups = new Array;
    data?.forEach(d => {
      moduleGroups.push(d?.id);
    });
    return moduleGroups;
  }

  activeDelegateModules(module_group, type) {
    this.delegateModule?.forEach(dm => {
      dm.is_enabled = false;
      module_group?.forEach(m => {
        if (dm?.name === m?.name) {
          if (type === 'active') {
            dm.disable = true;
          }
          dm.is_enabled = m?.is_enabled;
        }
      });
    });
  }

  sidebarClose() {
    this.logs = undefined;
    this.isMultiple = true;
    this.isDisabled = false;
    this.addDelegates = "hidden";
    this.close.emit({ type: 'getdelegates' });
    this.createDelegateForm.reset();
    this.getdelegateModule();
    this.editDelegateData = {};
  }

  getAllUsersFrom(pageNo = 1) {

    if(!this.searchTermFrom && !this.searchTermTo)
      this.delegateToLoading = true;

    this.delegateFromLoading = true;
    let roleId = this.storageService.get('account')?.role?.id;
    let userId = this.storageService.get('user')?.id;
    let org_Ids = this.storageService.get('ORG_ID');
    let qry;
    if (this.searchTermFrom) {
      qry = '&limit=' + 10 + '&page=' + pageNo + '&role_ids=' + roleId + '&name=' + this.searchTermFrom;
    } else {
      qry = '&limit=' + 10 + '&page=' + pageNo + '&role_ids=' + roleId;
    }

    if(this.userType === 'CANDIDATE' || this.userType === 'VENDOR') {
      qry += `&org_ids=${org_Ids}`;
    }

    // if(this.userType === 'MSP') {
    if(this.storageService.get(StorageKeys.CURRENT_PROGRAM)?.config?.restrict_delegation_by_hierarchy) {
      const account: any = this.storageService.get(StorageKeys.CURRENT_ACCOUNT);
      const hierarchies: Array<any> = account?.hierarchies;
      if (Array.isArray(hierarchies)) {
        let hierarchy_ids: Array<string> = hierarchies.map((hierarchy: any) => hierarchy?.id);
        hierarchy_ids = this.uniqueKeyPipe.transform(hierarchy_ids);
        if (Array.isArray(hierarchy_ids) && hierarchy_ids.length) qry += `&hierarchy_ids=${hierarchy_ids.join(',')}&h_children=true`;
      }
    }
    // }

    this.subscrptions.push(this.programService.get(`/configurator/programs/${this.programId}/members?exclude_user_ids=${userId}&additional_user_role=true` + qry+'&is_all_users_required=true').subscribe({
      next: (data: any) => {
        const user = this.storageService.get('user')
        if(user){
          data?.members?.push(user)
        }
        this.userListDataFrom = data?.members ? [...new Set(this.formatUserList(data?.members))] : [...this.formatUserList([user])];
      },
      error: error => {
        // this._alert.error(errorHandler(error), {});
        this.showError(error);
      },
      complete : ()=> {
        this.delegateFromLoading = false;
      }
    }));
  }

  formatUserList(members: any): [] {
    members?.forEach(m => {
      if (m?.first_name) {
        m.bindLable = m?.first_name;
      } if (m?.first_name && m?.middle_name) {
        m.bindLable = m?.first_name + ' ' + m?.middle_name;
      } if (m?.first_name && m?.last_name) {
        m.bindLable = m?.first_name + ' ' + m?.last_name;
      } if (m?.first_name && m?.middle_name && m?.last_name) {
        m.bindLable = m?.first_name + ' ' + m?.middle_name + ' ' + m?.last_name
      }
    });
    return members ? this.sortPipe.transform(members, 'bindLable') : [];
  }

  getAllUsersTo(pageNo = 1) {

    this.delegateToLoading = true;
    let roleId = this.storageService.get('account')?.role?.id;
    let userId = this.storageService.get('user')?.id;
    let org_Ids = this.storageService.get('ORG_ID');
    let qry;
    if (this.searchTermTo) {
      qry = '&limit=' + 10 + '&page=' + pageNo + '&role_ids=' + roleId + '&name=' + this.searchTermTo;
    } else {
      qry = '&limit=' + 10 + '&page=' + pageNo + '&role_ids=' + roleId;
    }

    if(this.userType === 'CANDIDATE' || this.userType === 'VENDOR') {
      qry += `&org_ids=${org_Ids}`;
    }

    // if(this.userType === 'MSP') {
    if(this.storageService.get(StorageKeys.CURRENT_PROGRAM)?.config?.restrict_delegation_by_hierarchy) {
      const account: any = this.storageService.get(StorageKeys.CURRENT_ACCOUNT);
      const hierarchies: Array<any> = account?.hierarchies;
      if (Array.isArray(hierarchies)) {
        let hierarchy_ids: Array<string> = hierarchies.map((hierarchy: any) => hierarchy?.id);
        hierarchy_ids = this.uniqueKeyPipe.transform(hierarchy_ids);
        if (Array.isArray(hierarchy_ids) && hierarchy_ids.length) qry += `&hierarchy_ids=${hierarchy_ids.join(',')}&h_children=true`;
      }
    }
    // }

    this.subscrptions.push(this.programService.get(`/configurator/programs/${this.programId}/members?exclude_user_ids=${userId}&additional_user_role=true` + qry).subscribe({
      next: (data: any) => {
        this.userListDataTo = [...this.formatUserList(data?.members)];
      },
      error: error => {
        // this._alert.error(errorHandler(error), {});
        this.showError(error);
      },
      complete : ()=> {
        this.delegateToLoading = false;
      }
    }));
  }

  getdelegateModule() {

    let programMember = this.storageService.get(StorageKeys.PROGRAM_MEMBER);
    this.delegateModule = [];

    this.subscrptions.push(this.programService.get(`/configurator/programs/${this.programId}/members/${programMember?.id}`).subscribe({
      next: (data: any) => {
        /*  data?.member?.role?.module_groups?.forEach(element => {
           this.delegateModule.push(element)
         }); */
        this.delegateModule = data?.member?.role?.module_groups?.filter((d: any) => {
          return (
            d?.name?.toLowerCase() === ModuleGroups?.TimeAndExpense ||
            d?.name?.toLowerCase() === ModuleGroups?.Job ||
            d?.name?.toLowerCase() === ModuleGroups?.Assignment ||
            d?.name?.toLowerCase() === ModuleGroups?.StatementOfWork ||
            d?.name?.toLowerCase() === ModuleGroups?.RFX
          );
        });
        this.delegateModule.forEach((dModule: any) => {
          dModule.display_name = dModule?.name;
          if (dModule?.name?.toLowerCase() === ModuleGroups?.Job) {
            dModule.display_name = 'Job, Submission, Interview & Offer';
            dModule.order = 1
          }
          if (dModule?.name?.toLowerCase() === ModuleGroups?.Assignment) {
            dModule.order = 2
          }
          if (dModule?.name?.toLowerCase() === ModuleGroups?.TimeAndExpense) {
            dModule.order = 3
          }
          if (dModule?.name?.toLowerCase() === ModuleGroups?.RFX) {
            dModule.display_name = 'RFx, Bid';
            dModule.order = 4
          }
          if (dModule?.name?.toLowerCase() === ModuleGroups?.StatementOfWork) {
            dModule.display_name = 'Statement of Work (SOW), Progress Update';
            dModule.order = 5
          }
        })
        this.sortPipe.transform(this.delegateModule, 'order');
        this.setdelegateModuleData();
      },
      error: error => {
        // this._alert.error(errorHandler(error), {});
        this.showError(error);
      }
    }));
  }

  createDelegate() {
    this.isDisabled = true;
    this.createDelegateForm?.patchValue({
      is_enabled: true
    })
    let payLoad = {
      "delegated_from": this.createDelegateForm.value.delegated_from,
      "delegated_to": this.isMultiple ? this.createDelegateForm.value.delegated_to : [this.createDelegateForm.value.delegated_to_single],
      "start_date": moment(this.createDelegateForm.value.start_date, this.dateFormat)?.toDate()?.setHours(0, 0, 0 ,0),
      "end_date": moment(this.createDelegateForm.value.end_date, this.dateFormat)?.toDate()?.setHours(23, 59, 59 ,59),
      "tz_offset": new Date().toString().match(/[\+,\-](\d{4})\s/g)[0].trim(),
      "module_groups": this.createDelegateForm.value.module_groups,
      "is_enabled": true,
      "display_module_name": this.getDelegateNames(this.createDelegateForm.value?.module_groups)
      // ...this.createDelegateForm.value
    }

    let userId = this.storageService.get('user')?.id;
    if (!this.editDelegateData?.id) {
      this.subscrptions.push(this.programService.post(`/configurator/programs/${this.programId}/members/${userId}/delegations`, payLoad).subscribe(
        data => {
          if (data) {
            this.isDisabled = false;
            this._alert.success(`You have added delegate successfully.`);
            this.createDelegateForm.reset();
            this.sidebarClose();
          }
        },
        (err) => {
          this.isDisabled = false;
          // this._alert.error(errorHandler(err));
          this.showError(err);
        }));
    } else {
      this.subscrptions.push(this.programService.put(`/configurator/programs/${this.programId}/members/${userId}/delegations/${this.editDelegateData?.id}`, payLoad).subscribe(
        data => {
          if (data) {
            this.isDisabled = false;
            this._alert.success(`You have updated delegate successfully.`);
            this.createDelegateForm.reset();
            this.sidebarClose();
          }
        },
        (err) => {
          this.isDisabled = false;
          // this._alert.error(errorHandler(err));
          this.showError(err);
        }));
    }
  }

  onClickToggleModule(data) {
    data.is_enabled = !data.is_enabled;
    this.setdelegateModuleData();
    // if(this.editDelegateData?.id && data?.disable){
    //   return;
    // } else {

    // }
  }

  setdelegateModuleData() {
    let selectedDelegate = new Array();
    this.delegateModule?.forEach(d => {
      if (d?.is_enabled) {
        selectedDelegate.push(d?.id);
      }
    });
    this.createDelegateForm?.patchValue({
      module_groups: selectedDelegate
    })
    this.supportTextCheck()
  }

  initializeForm() {
    this.createDelegateForm = this.fb.group({
      delegated_from: ['', Validators.required],
      delegated_to: [[]],
      delegated_to_single: [''],
      start_date: ['', Validators.required],
      end_date: ['', Validators.required],
      module_groups: ['', Validators.required],
      is_enabled: [true],
    }, {
      validators: [this.dateValidator]
    });
  }

  ngOnDestroy(): void {
    this.subscrptions?.forEach(sub => sub.unsubscribe());
  }

  showError(err) {
    window.scrollTo(0, 0);
    this.logs = {
      type: LOG_TYPE.ERROR, heading: err?.error?.error?.message, messages: [], autoClose: true, isShown: true, showReportButton: err?.status == 500, additionalInfo: { trace_id: err?.error?.trace_id }
    };
    err?.error?.errors?.forEach(msg => {
      if (msg?.message) {
        this.logs.messages.push(msg?.message);
      }
    });
  }

  dateValidator = (formControl: AbstractControl) => {
    let { start_date, end_date } = formControl?.value;
    start_date = moment(start_date || 0, this.dateFormat)?.toDate();
    end_date = moment(end_date || 0, this.dateFormat)?.toDate();

    if(start_date?.getTime() > end_date?.getTime()) {
      return { workerDurationDateErr: 'Delegate End Date should be greater than Delegate Start Date.' };
    }

    return null;
  }

  getDelegateNames = (delegates: Array <string>): string => {

    if(!Array.isArray(delegates))
      return "";

    let result: Array <string> = [];
    this.delegateModule.forEach((entry: any) => {
      if(delegates.includes(entry?.id)) {
        result.push(entry?.display_name);
      }
    });

    return result.join(', ');
  }

  get dateFormat(): string {
    let format: string = this.storageService.get(StorageKeys.CURRENT_PROGRAM)?.defaultDateFormat ?? DATE_FORMAT.FORMATMDY;
    return format;
  }

  sortList(list: []): any {
    return this.sortPipe.transform(list, 'bindLable');
  }
  checkDelegateAssigned(){
    this.isDuplicate = false
    this.delegateToLoading = true;
    let userId = this.storageService.get('user')?.id;
    let payLoad = {
      "delegated_from": this.createDelegateForm.value.delegated_from, 
      "delegated_to": this.isMultiple ? this.createDelegateForm.value.delegated_to : [this.createDelegateForm.value.delegated_to_single],
      "start_date": moment(this.createDelegateForm.value.start_date, this.dateFormat)?.toDate()?.setHours(0, 0, 0 ,0),
      "end_date": moment(this.createDelegateForm.value.end_date, this.dateFormat)?.toDate()?.setHours(23, 59, 59 ,59),
      "tz_offset": new Date().toString().match(/[\+,\-](\d{4})\s/g)[0].trim(),
      "module_groups": this.createDelegateForm.value.module_groups,
      "is_enabled": true,
      "display_module_name": this.getDelegateNames(this.createDelegateForm.value?.module_groups)
    }
    const url = this.title == 'Add New Delegation' ? `/configurator/programs/${this.programId}/members/${userId}/delegation-validation` : `/configurator/programs/${this.programId}/members/${userId}/delegation-validation/${this.editDelegateData?.id}`
    const method = this.title == 'Add New Delegation' ? "post" : "put"
    this.programService[method](url,payLoad).subscribe({
      next: (data: any) => {
        if(data?.message){
        this.supportData['support_text'] = data?.message;
        this.supportData['close_icon'] = 'close_icon';
        }
        this.delegateToLoading = false;
      },
      error: error => {
        this.isDuplicate = true
        this.delegateToLoading = false;
        // this._alert.error(errorHandler(error), {});
        this.showError(error);
      }
    });
  }
  dateChanged(event:any){
    let isValidForm = this.checkValidation()
    if(isValidForm){
      this.checkDelegateAssigned()
    }
  }
  supportTextCheck(){
    let isValidForm = this.checkValidation()
    if(isValidForm){
      this.checkDelegateAssigned()
    }
  }
  checkValidation(){
    if(this.createDelegateForm?.controls['delegated_from']?.value && (this.createDelegateForm?.controls['delegated_to']?.value?.length || this.createDelegateForm?.controls['delegated_to_single']?.value)
    && this.createDelegateForm?.controls['start_date']?.value && this.createDelegateForm?.controls['end_date']?.value && this.createDelegateForm?.controls['module_groups']?.value?.length!=0){
  return true
  }
  }
}
