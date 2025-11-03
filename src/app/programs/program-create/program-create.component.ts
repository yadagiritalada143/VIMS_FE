import {ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {UntypedFormBuilder, UntypedFormGroup, Validators} from '@angular/forms';
import {NgSelectComponent} from '@ng-select/ng-select';
import {Subject, Subscription} from 'rxjs';
import {
  debounceTime, distinctUntilChanged, map, pluck, switchMap, tap
} from 'rxjs/operators';
import {
  EmitEvent, Events, EventStreamService
} from 'src/app/core/services/event-stream.service';
import {StorageKeys, StorageService} from 'src/app/core/services/storage.service';
import {errorHandler} from 'src/app/shared/util/error-handler';
import {environment} from 'src/environments/environment';
import {ClonerService} from '../../core/services/cloner.service';
import {AlertService} from '../../core/components/alert/alert.service';
import {LoaderService} from '../../core/components/loader/loader.service';
import {ProgramManageComponent} from '../../shared/components/program-manage/program-manage.component';
import {ProgramConfig} from '../../shared/enums';
import {ProgramService} from '../program.service';
import { GlobalConstants } from 'src/app/shared/globalconstants';
import { SvmsRouterService } from 'src/app/core/services/svms-router.service';
import { SortHelperPipe } from 'src/app/shared/pipe/sort-helper.pipe';
import { DATE_FORMAT } from 'src/app/library/date-format/date-format.model';
import moment from 'moment-timezone';
import { GlobalLaunchService,GlobalLaunchKeys } from 'src/app/control-panel/configs/global-launches/global-launch.service';

export type ORG_TYPE = 'TYPE_MSP';

@Component({
  selector: 'app-program-create',
  templateUrl: './program-create.component.html',
  styleUrls: ['./program-create.component.scss'],
})
export class ProgramCreateComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];
  public showCreate = false;
  public showUserCreate = false;
  public addUser = false;
  public inviteUser = false;
  public inviteUserName: string;
  public usernameOldValue: string;
  public clientList = [];
  public mspList = [];
  public input$ = new Subject<string>();
  public mspInput$ = new Subject<string>();
  public programsid: string;
  public validProgramId = false;
  public clientInfo: any;
  public userRoles: any;
  public Users: any;
  public program_uniqId: string;
  public clientId: string;
  public createProgramForm: UntypedFormGroup;
  public duplicateProgram: any;
  public validationMsg = undefined;
  public formValidMsg: any;
  public showSuccessModal = false;
  public programName: any;
  public newProgramId: any;
  public dbValidationMsg: any;
  public dbErrorMsg: any;
  public programIdValdation: any;
  public invalidClientId: any;
  public existMail: any;
  public clientName: any;
  public moduleGroup: any;
  public labor_category: any;
  public config: any;
  public programObj: any;
  public isSaveLoader: boolean = false;
  public clientLoading: boolean = false;
  public showModules: boolean = false;

  public toggle = {
    value: true,
  };
  public toggleOptions = {
    vendor: {
      value: true,
    },
    candidate: {
      value: false,
    },
    is_work_location_read_only: {
      value: false,
    },
    // show_associated_locations_only: {
    //   value: false
    // },
    // allow_multiple_default_values: {
    //   value: false
    // }
  };
  clientsearchManager = new Subject<string>();
  // public userRoleRef;
  @ViewChild('searchUser') searchUser: NgSelectComponent;
  @ViewChild('dateFiled') svmsDatePicker;
  @ViewChild(ProgramManageComponent) programMembers: ProgramManageComponent;

  public editProgramId = true;
  dateFormats = GlobalConstants?.defaultDateFormat;
  defaultDateFormat: any = '';
  programDetails: any = {};
  constructor(
    private formBuilder: UntypedFormBuilder,
    private eventStream: EventStreamService,
    private changeDetection: ChangeDetectorRef,
    private router: SvmsRouterService,
    private _programService: ProgramService,
    private _alertService: AlertService,
    private _loader: LoaderService,
    private _cloneService: ClonerService,
    private localStorage: StorageService,
    private sortPipe: SortHelperPipe,
    private globalLaunchService: GlobalLaunchService,
  ) {
    this.clientsearchManager
      .pipe(
        tap(() => {
          this.clientLoading = true;
        }),
        switchMap((term: any) => this.clientService(term?.term)),
      )
      .subscribe((data: any) => {
        this.clientList = this.sortPipe.transform(data?.organizations ?? [], 'name');
        this.clientLoading = false;
      });
  }

  options: any = {
    language: 'English',
    timepicker: true,
    format12h: true,
    range: true,
    // enabledDateRanges: [
    //   { start: new Date(this.now - 3 * this.days), end: new Date(this.now + 2 * this.days) },
    //   { start: new Date(this.now + 4 * this.days), end: new Date(this.now + 7 * this.days) }
    // ]
  };

  ngOnInit(): void {
    this.programDetails = this.localStorage.get(StorageKeys.CURRENT_PROGRAM);
    this.defaultDateFormat = this.programDetails?.defaultDateFormat ? this.programDetails?.defaultDateFormat : DATE_FORMAT.FORMATMMDDYY;
    this.createProgramForm = this.formBuilder.group({
      client: [null, Validators.required],
      programType: [null, Validators.required],
      msp: [null, ''],
      labor_category: [[], ''],
      name: [null, Validators.compose([Validators.required, Validators.pattern('^[a-zA-Z0-9 -]+$')])],
      programID: [null, Validators.compose([Validators.required, Validators.pattern('^[a-zA-Z0-9]+$')])],
      date: [null, Validators.required],
      // dateFormat: [null],
      UserRole: [null, ''],
      description: ['.', ''],
      members: this.formBuilder.array([]),
      managerName: [null, ''],
      username: [null, ''],
    });

    this.getModuleList().then(() => {

    this.clientData();
    // this.onSearch();
    this.onSearchMSP();
    this.mspData();
    // This means whenever client sidebar is closed, we are refreshing list of clients.
    this.subscriptions.push(
      this.eventStream.on(Events.ORG_CREATE).subscribe((param: any) => {
        if (param?.key == false && param?.name) {
          this._programService.get(`/configurator/organizations?category=CLIENT&active=true&name=${param.name}`).subscribe((data: any) => {
            if (data?.organizations[0]?.name == param.name) {
              this.createProgramForm?.get('client')?.setValue(param.name);
              this.clientInfo = data?.organizations[0];
            }
          });
        }
      }),
    );

    this.subscriptions.push(
      this.eventStream.on(Events.DO_SHOW_CLIENT_FORM).subscribe((data: any) => {
        this.showCreate = data;
        this.changeDetection.detectChanges();
      }),
    );

    this.subscriptions.push(
      this.eventStream.on(Events.DO_SHOW_USER_FORM).subscribe((data: any) => {
        this.showUserCreate = data;
        this.changeDetection.detectChanges();
      }),
    );

    this.subscriptions.push(
      this.createProgramForm
        .get('name')
        ?.valueChanges?.pipe(
          debounceTime(400),
          distinctUntilChanged(),
          tap(text => {
            this.checkProgramName(text);
          }),
        )
        .subscribe(),
    );

    });
  }

  createOrg() {
    this.eventStream.emit(new EmitEvent(Events.ORG_CREATE, true));
  }

  checkProgramName(term) {
    let duplicate = false;
    this.subscriptions.push(
      this._programService.get(`/configurator/programs?name=${term}`).subscribe((data: any) => {
        data?.programs?.map(data1 => {
          if (data1?.name?.toUpperCase() === term?.toUpperCase()) {
            duplicate = true;
          }
        });
        if (duplicate) {
          this.duplicateProgram = 'Program name already in use';
        } else {
          this.duplicateProgram = '';
        }
      }),
    );
  }

  checkProgramId(term) {
    let duplicate = false;
    this.subscriptions.push(
      this._programService.get(`/configurator/programs?unique_id=${term}`).subscribe((data: any) => {
        data?.programs?.map(data1 => {
          if (data1.unique_id.toUpperCase() === term.toUpperCase()) {
            duplicate = true;
          }
        });
        if (duplicate) {
          this.programIdValdation = 'Program id already in use';
        } else {
          this.programIdValdation = '';
          duplicate = false;
        }
      }),
    );
  }

  changeMSP() {
    const val = this.createProgramForm.get('programType').value;
    if (val === 'SELF-SERVICED') {
      this.createProgramForm.controls.msp.setValue('');
    }
  }

  addLaborCategory(event, isTabPressed?) {
    if (event.key === 'Enter' || event.key === ',' || isTabPressed) {
      const laborCategory = event.target.value.trim().replace(/,/g, '');
      if (laborCategory) {
        const isAlreadyExist = this.createProgramForm?.get('labor_category')?.value.findIndex(entity => entity?.name === laborCategory);
        if (isAlreadyExist === -1) {
          if (laborCategory.length > 100) {
            return this._alertService.error('Labor Category name can be up to 100 characters long');
          }
          this.createProgramForm?.get('labor_category')?.value.push({
            name: laborCategory,
          });
        }
      }
      event.target.value = '';
    }
  }

  gotToconfiguration() {
    this.localStorage.set(ProgramConfig[5], this.programObj, true);
    this.router.navigate(['program-setup', 'program-detail'], {
      queryParams: {
        programId: this.program_uniqId,
        clientId: this.clientId,
        program_req_id: this.newProgramId,
        clientName: this.clientName,
      },
    });
  }

  clientData() {
    this.clientLoading = true;

    this._programService.get('/configurator/organizations?category=CLIENT&active=true').subscribe((data: any) => {
      this.clientList = this.sortPipe.transform(data?.organizations ?? [], 'name');
    });
    this.clientLoading = false;
  }

  mspData() {
    this.subscriptions.push(
      this._programService.get('/configurator/organizations?category=MSP&active=true').subscribe((data: any) => {
        this.mspList = this.sortPipe.transform(data?.organizations ?? [], 'name');
      }),
    );
  }

  addUserToProgram(event) {
    this.eventStream.emit(new EmitEvent(Events.CREATE_NEW_USER, { show: true, orgId: environment.SIMPLIFY_ORG_ID }));
  }

  onFormSubmit() {
    let payLoad;
    const programMembers = this.programMembers?.programManagersObj;
    let conditions = false;
    const datefield = this.createProgramForm.get('date').value;
    let date1;
    if (datefield) {
      let date = moment(this.createProgramForm.get('date')?.value, this.defaultDateFormat?.toUpperCase())?.toDate();
      const day = date.getDate();
      const month = date.getMonth();
      const year = date.getFullYear();
      date1 = new Date(year, month, day + 1);
      date1 = date1.getTime() / 1000;
    }
    // this.moduleGroup.map( function(module) {return  { id: module.id , is_enabled: module.is_enabled} ; } )
    payLoad = {
      name: this.createProgramForm.get('name').value,
      unique_id: this.createProgramForm.get('programID').value,
      description: this.createProgramForm.get('description').value || 'testing',
      type: this.createProgramForm.get('programType').value,
      industries: this.createProgramForm.get('labor_category').value,
      config: {
        program_driver: 'CLIENT',
        // allow_multiple_default_values: this.toggleOptions.allow_multiple_default_values,
        // show_associated_locations_only: this.toggleOptions.show_associated_locations_only
      },
      client: this.clientInfo?.id,
      msp: this.createProgramForm.get('msp').value || null,
      vendors: [],
      start_date: date1?.toString() || '',
      members: this.prepareObj(programMembers),
      module_groups: this.getModuleGroup(),
    };

    // if(this.createProgramForm.get('dateFormat').value !== null)
    //   payLoad.config.preferred_date_format = this.createProgramForm.get('dateFormat')?.value.toLowerCase();

    if (!payLoad.client) {
      this._alertService.error('Please Select a Client', {});
      return;
    }
    if (!payLoad.type) {
      this._alertService.error('Please Select a Program Type', {});
      return;
    }
    if (!payLoad.name) {
      this._alertService.error('Please Enter Your Program Name', {});
      return;
    }
    if (payLoad.msp == null && payLoad.type === 'MSP-MANAGED') {
      this._alertService.error('Please Select a MSP', {});
      return;
    }
    if (!payLoad.unique_id) {
      this._alertService.error('Please Enter Your Program Code', {});
      return;
    }
    // if (this.toggle.value && !payLoad.industries?.length) {
    //   this._alertService.error('Please Enter Your Program Labor Category', {});
    //   return;
    // }
    if (programMembers?.length === 0) {
      this._alertService.error('Please Select a user and Position', {});
      return;
    }
    if (this.programIdValdation && this.programIdValdation !== '' && this.programIdValdation !== undefined) {
      this._alertService.error('Program id Already in use', {});
      return;
    }
    if (this.duplicateProgram && this.duplicateProgram !== '') {
      this._alertService.error('Program Name Already in use', {});
      return;
    }

    this.validationMsg = conditions;
    if (!conditions) {
      this.program_uniqId = payLoad.unique_id;
      this.clientId = payLoad.client;
      // this._loader.show();
      this.isSaveLoader = true;
      this.programName = payLoad.name;
      this.subscriptions.push(
        this._programService.post('/configurator/programs', payLoad).subscribe({
          next: (data: any) => {
            // this._loader.hide();
            this.isSaveLoader = false;
            if (data?.id) {
              const newData = {
                description: payLoad.description,
                name: payLoad.name,
                shortName: payLoad.name.toLowerCase(),
                refId: data.id,
              };
              //this.inviteUsers();
              this.clientName = this.clientInfo.name;
              this.newProgramId = data.id;
              this._programService.post(`/notification-config/programs/${this.newProgramId}/tenant`, newData).subscribe();
              this.localStorage.set('newProgramId', JSON.stringify(this.newProgramId), true);
              this.showSuccessModal = true;
              this.createProgramForm.reset();
              this.programMembers.programMemidObj = [];
              this.programMembers.programManagersObj = [];
              this.clientInfo = '';
              this.svmsDatePicker._value = '';
              this.dbValidationMsg = '';
              this.dbErrorMsg = '';
              this.programMembers.usernameOldValue = '';
              this.programMembers.roleOldValue = '';
              this.programMembers.programMemForm.reset();
              this.programMembers.userEmail = [];
              this.programMembers.selectedUsers = [];
              this.programObj = payLoad;
              this.resetModuleList();
            }
            if (data[0]?.type?.message) {
              this.dbValidationMsg = data[0]?.type?.message;
              this._alertService.error(this.dbValidationMsg, {});
            }
            if (data[0]?.name?.message) {
              this.dbValidationMsg = data[0]?.name?.message;
              this._alertService.error(this.dbValidationMsg, {});
            }
          },
          error: (err: Error | any) => {
            this._alertService.error(errorHandler(err), {});
            // this._loader.hide();
            this.isSaveLoader = false;
          },
        }),
      );
    }
  }

  getModuleGroup() {
    let module: Array <any> = (this.moduleGroup || []).map((mg: any) => {
      return { 
        id: mg?.id, 
        is_enabled: !['rfx', 'statement of work'].includes(((mg?.name) || "").toLowerCase())
      };
    });

    return module;
  }

  closeSuccessModal() {
    this.showSuccessModal = false;
    this.resetModuleList();
  }

  onClickAddUser() {
    this.addUser = true;
    if (this.searchUser !== undefined) {
      this.searchUser.open();
      setTimeout(() => {
        this.searchUser.focus();
      }, 0);
    }
  }

  onAddUserChange(event) {
    this.validateEmail(event);
    this.inviteUserName = event.term;
    if (this.inviteUserName.length === 0) {
      this.inviteUser = false;
    }
  }

  validateEmail(eve) {
    const pattern = /^[A-Za-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/;
    let emailpttern;
    emailpttern = pattern.test(eve.term);
    if (emailpttern && this.clientInfo?.id) {
      this.inviteUser = true;
    } else {
      this.inviteUser = false;
    }
  }

  inviteUsers() {
    const emailArr = this.programMembers.userEmail;
    emailArr?.map(val => {
      const payLoad = { email: val };
      this.subscriptions.push(
        this._programService.post(`/profile-manager/organizations/${environment.SIMPLIFY_ORG_ID}/members/invite`, payLoad).subscribe({
          next: (data: any) => {
            if (data?.member?.id) {
              this.existMail = '';
            }
            if (data?.error?.message) {
              this.existMail = data.error.message;
            }
          },
          error: (err: Error | any) => {
            this._alertService.error(errorHandler(err));
          },
        }),
      );
    });
  }

  onBackToLIsting(event) {
    this.router.navigate(['programs', 'list']);
    event.preventDefault();
  }

  prepareObj(obj) {
    const copyObj = this._cloneService.deepClone(obj);
    const programObj = [];
    let copyElemet;
    copyObj?.map(element => {
      copyElemet = element;
      delete copyElemet.id;
      programObj.push(copyElemet);
    });
    return programObj;
  }

  generateProgramId() {
    const payLoad = { organization_id: this.clientInfo?.id };
    this.subscriptions.push(
      this._programService.post('/configurator/programs/unique-id', payLoad).subscribe((data: any) => {
        this.programIdValdation = data?.error?.message;
        this.createProgramForm.controls.programID.setValue(data?.unique_id);
      }),
    );
  }

  editProgramsId() {
    this.editProgramId = false;
  }

  onSearch() {
    this.clientList = [];
    this.subscriptions.push(
      this.input$
        .pipe(
          debounceTime(500),
          distinctUntilChanged(),
          switchMap(term => this.clientService(term)),
        )
        .subscribe((data: any) => {
          this.clientLoading = true;
          this.clientList = this.sortPipe.transform(data?.organizations ?? [], 'name');
          this.clientLoading = false;
        }),
    );
  }

  onSearchMSP() {
    this.subscriptions.push(
      this.mspInput$
        .pipe(
          debounceTime(500),
          distinctUntilChanged(),
          switchMap(term => this.MSPService(term)),
        )
        .subscribe((data: any) => {
          this.mspList = this.sortPipe.transform(data?.organizations ?? [], 'name');
        }),
    );
  }

  private clientService(term) {
    if (term == null || !term) {
      this.clientData();
    }
    return this._programService.get(`/configurator/organizations?category=CLIENT&active=true&name=${term}`);
  }

  private MSPService(term) {
    if (term == null || !term) {
      this.mspData();
    }
    return this._programService.get(`/configurator/organizations?category=MSP&active=true&name=${term}`);
  }

  getUsers() {
    this.subscriptions.push(
      this._programService.get(`/profile-manager/organizations/${environment.SIMPLIFY_ORG_ID}/members`).subscribe((data: any) => {
        this.Users = data?.membersList?.filter(element => element.first_name && element.first_name !== undefined);
      }),
    );
  }

  changeClient() {
    const client = this.createProgramForm.get('client').value;
    if (client === '' || client == null) {
      this.clientInfo = '';
    } else {
      this.clientInfo = this.clientList.find(client_ => client_.name === client);
    }
  }
  validatProgramID(event) {
    let payload = {
      unique_id: this.createProgramForm.get('programID').value,
    };
    this.subscriptions.push(
      this._programService.post('/configurator/programs/unique-code-validate', payload).subscribe((data: any) => {
        this.validProgramId = false;
        if (!data?.id) {
          this.validProgramId = true;
        }
      }),
    );
  }
  onClickModule(e) {}

  resetModuleList() {
    (this.moduleGroup || []).map(module => {
      module.is_enabled = false;
      return module;
    });
  }

  get modulesToHide() {
    let modulesToHide: Array<string> = [];
    if (!this.globalLaunchService.isglobalLaunchSlugFlagEnabled(GlobalLaunchKeys.MASTER_TALENT_PROFILE_MODULE))
      modulesToHide.push('Master Talent Profile');
    return modulesToHide;
  }

  getModuleList() {
    this._loader.show();
    return new Promise((resolve: any, reject: any) => {
      this._programService
        .get('/configurator/resources/module-groups')
        .pipe(
          pluck('module_groups'),
          map((modulegrp: Array<any>) => modulegrp.filter(grp => !this.modulesToHide.includes(grp.name))),
        )
        .subscribe({
          next: (data: any) => {
            if (data && data?.length) {
              this.moduleGroup = [];
              data?.forEach((mGroup: any) => {
                mGroup.is_enabled = false;
                mGroup.modules = mGroup.modules.map(module => {
                  return {
                    name: module.name,
                    code: module.code,
                    module_id: module.id,
                    is_enabled: false,
                    is_read_allowed: true,
                    is_create_allowed: false,
                    is_edit_allowed: false,
                    is_delete_allowed: false,
                  };
                });
                this.moduleGroup.push(mGroup);
              });
            }

            this._loader.hide();
            resolve(true);
          },
          error: (error: Error | any) => {
            console.error(error);
            this._loader.hide();
            reject(false);
          },
        });
      });

    // TODO enable/disable module in edit mode from "role.module_groups"
  }

  onClickToggle() {
    if (this.toggle.value) {
      this.toggle.value = false;
    } else {
      this.toggle.value = true;
    }
  }

  ngOnDestroy() {
    this.eventStream.emit(new EmitEvent(Events.DO_SHOW_CLIENT_FORM, false));
    this.subscriptions?.forEach(sub => sub.unsubscribe());
  }
}
