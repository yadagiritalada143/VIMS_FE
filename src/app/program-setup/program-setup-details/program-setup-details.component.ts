import { AfterViewInit, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Subject, Subscription, forkJoin, of } from 'rxjs';
import {
  concatMap,
  debounceTime,
  distinctUntilChanged,
  tap,
} from 'rxjs/operators';
import { GlobalLaunchKeys, GlobalLaunchService } from 'src/app/control-panel/configs/global-launches/global-launch.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import {
  EmitEvent,
  EventStreamService,
  Events,
} from 'src/app/core/services/event-stream.service';
import { UserService } from 'src/app/core/services/user.service';
import { DATE_FORMAT } from 'src/app/library/date-format/date-format.model';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { SortHelperPipe } from 'src/app/shared/pipe/sort-helper.pipe';
import { UniqueKeyPipe } from 'src/app/shared/pipe/unique-key.pipe';
import { environment } from 'src/environments/environment';
import { LoaderService } from '../../core/components/loader/loader.service';
import { ClonerService } from '../../core/services/cloner.service';
import { StorageKeys, StorageService } from '../../core/services/storage.service';
import { ProgramService } from '../../programs/program.service';
import { ClientData, ProgramConfig } from '../../shared/enums';
import { errorHandler } from '../../shared/util/error-handler';

@Component({
  selector: 'app-program-setup-details',
  templateUrl: './program-setup-details.component.html',
  styleUrls: ['./program-setup-details.component.scss'],
})
export class ProgramSetupDetailsComponent implements OnInit, AfterViewInit, OnDestroy {
  private subscriptions: Subscription[] = [];
  //public programSetup: FormGroup;
  showDropdwon = false;
  showCustomPanel = true;
  public programId: any;
  vmsData: any;
  public editData: boolean;
  public manageUserComp: any;
  public editProgramForm: UntypedFormGroup;

  public toggle = {
    title: 'active',
    value: true,
  };
  public status: boolean;
  public programData: any;
  public showUserCreate = false;
  public existMail: any;
  clientName: any;
  clientData: any;
  is_enabled: any;
  programName: any;
  defaultDateFormat: any = DATE_FORMAT.FORMATMDY;
  labor_category: any = [];
  uniqueId: any;
  service_type: any;
  msp: any;
  start_date: any;
  laborCategory: any;
  category: any;
  client_logo: any;
  email: any;
  public duplicateProgram: any;
  public mspList: Array<any> = [];
  moduleGroup: any = [];
  configData: any;
  public programStatus: boolean;
  public dataLoad = true;
  public clientLoad: boolean;
  public programModuleGroup;
  start_date_options: any = {
    language: 'English',
    timepicker: true,
    format12h: true,
    range: false,
    enabledDateRanges: [],
  };
  public programDetails: any = {};
  public mspLoading: boolean = false;
  public mspTotalRecords: number = 0;
  public prevMSPSearch: any = { term: '', page: 1 };
  public mspsearchManager: Subject<any> = new Subject<any>();

  constructor(
    private programService: ProgramService,
    private fb: UntypedFormBuilder,
    private localStorage: StorageService,
    private _userService: UserService,
    private _cloneService: ClonerService,
    private _loadService: LoaderService,
    private _alert: AlertService,
    private changeDetection: ChangeDetectorRef,
    private eventStream: EventStreamService,
    private sortHelper: SortHelperPipe,
    private uniqueHelper: UniqueKeyPipe,
    private datePipe: LocalDateFormatPipe,
    private globalLaunchService: GlobalLaunchService,
  ) {
    this.subscriptions.push(
      this.mspsearchManager
        .pipe(
          debounceTime(800),
          distinctUntilChanged((prev: any, curr: any) => {
            return prev?.page === curr?.page && prev?.term === curr?.term;
          }),
          concatMap((query: any) => {
            const term: string = query?.term ?? '';
            const page: number = query?.page ?? 1;

            this.prevMSPSearch = { term, page };

            this.mspLoading = true;
            return forkJoin([this.MSPService(term, page), of(page)]);
          }),
        )
        .subscribe({
          next: (data: any) => {
            if (Array.isArray(data) && data.length) {
              const res: any = data[0];
              const page: number = data[1];

              let result: any = res?.organizations;
              this.mspTotalRecords = res?.total_records;
              this.mspLoading = false;

              if (page === 1) {
                this.mspList = result;
              } else {
                this.mspList = [...this.mspList, ...result];
              }

              if (this.msp) {
                this.mspList = [...this.mspList, this.msp];
              }

              this.mspList = this.uniqueHelper.transform(this.mspList, 'id');
              this.mspList = this.sortHelper.transform(this.mspList, 'name');
            }
          },
          error: (err: any) => {
            console.error(err);
            this.mspLoading = false;
            this._alert.error('Error encountered while fetching MSP entries');
          },
        }),
    );
  }

  loadMoreMSP() {
    if (this.mspList.length < this.mspTotalRecords) {
      let panel: Element = document.querySelector('.ng-dropdown-panel > div');
      if (panel) {
        panel.scroll({ top: 0 });
      }
      this.mspsearchManager.next({
        ...this.prevMSPSearch,
        page: this.prevMSPSearch?.page ? this.prevMSPSearch?.page + 1 : 1,
      });
    }
  }

  ngOnInit() {
    this.programDetails = this.localStorage.get(StorageKeys.CURRENT_PROGRAM);
    this.defaultDateFormat = this.programDetails?.defaultDateFormat?.toUpperCase();
    this.editProgramForm = this.fb.group({
      client: [null, Validators.required],
      programType: [null, Validators.required],
      msp: [null, ''],
      name: [null, Validators.compose([Validators.required, Validators.pattern('^[a-zA-Z0-9 -]+$')])],
      programID: [null, Validators.compose([Validators.required, Validators.pattern('^[a-zA-Z0-9-]+$')])],
      date: [null],
      UserRole: [null, ''],
      description: ['.', ''],
      members: this.fb.array([]),
      managerName: [null, ''],
      is_enabled: [null, ''],
      labor_category: [[], ''],
    });

    this.mspData();
    //this.programId = this.route.snapshot.queryParams.programId ? this.route.snapshot.queryParams.programId : '';
    this.editData = false;
    let programdata = this.localStorage.get(ProgramConfig[0]);
    if (programdata) {
      this.programData = JSON.parse(programdata);
    }
    let clientData = this.localStorage.get(ClientData[0]);
    if (clientData) {
      this.clientData = JSON.parse(clientData);
    }

    this.programId = this.programData?.program_req_id;
    this.fetchProgramIddetails();
    this.getProgramModuleList();
    this.editProgramForm
      .get('name')
      ?.valueChanges.pipe(
        debounceTime(400),
        distinctUntilChanged(),
        tap(text => {
          this.checkProgramName(text);
        }),
      )
      .subscribe();

    this.subscriptions.push(
      this.eventStream.on(Events.DO_SHOW_USER_FORM).subscribe(data => {
        this.showUserCreate = data;
        this.changeDetection.detectChanges();
      }),
    );
  }

  ngAfterViewInit() {}

  addUserToProgram(eve) {
    this.eventStream.emit(new EmitEvent(Events.CREATE_NEW_USER, { show: true, orgId: environment.SIMPLIFY_ORG_ID }));
  }

  addLaborCategory(event, isTabPressed?) {
    if (event.key === 'Enter' || event.key === ',' || isTabPressed) {
      const laborCategory = event.target.value.trim().replace(/,/g, '');
      if (laborCategory) {
        const isAlreadyExist = this.editProgramForm.get('labor_category').value.findIndex(entity => entity?.name === laborCategory);
        if (isAlreadyExist === -1) {
          if (laborCategory.length > 100) {
            return this._alert.error('Labor category name can be up to 100 characters long');
          }
          this.editProgramForm.get('labor_category').value.push({
            name: laborCategory,
          });
        }
      }
      event.target.value = '';
    }
  }

  dateFormat(date) {
    if (!date) {
      return;
    }
    let shortMonth = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    date = new Date(date);
    let day = date.getDate();
    let month = date.getMonth() + 1;
    let year = date.getFullYear();
    if (month < 10) {
      month = '0' + month;
    }
    if (day < 10) {
      day = '0' + day;
    }
    if (Number.isNaN(shortMonth[date.getMonth()] + ' ' + day + ', ' + year)) {
      return null;
    }
    return shortMonth[date.getMonth()] + ' ' + day + ', ' + year;
  }

  fetchProgramIddetails() {
    this._loadService.show();
    this.subscriptions.push(
      this.programService.get(`/configurator/programs/${this.programData?.program_req_id}`).subscribe(
        (data: any) => {
          this.vmsData = data.program;
          this.clientName = this.vmsData.client.name;
          this.configData = this.vmsData.config ? this.vmsData.config : {};
          this.fetchClientData(this.clientName);
          this.is_enabled = this.vmsData.is_enabled;
          this.programName = this.vmsData.name;
          this.labor_category = this.vmsData?.industries;
          this.uniqueId = this.vmsData.unique_id;
          this.service_type = this.vmsData.service_type;
          this.fetchMSPData(this.vmsData?.msp);
          this.start_date = this.datePipe.transform(
            this.vmsData.start_date,
            this.defaultDateFormat,
            null,
            null,
            true,
            DATE_FORMAT.FORMATYMD,
          );
          this.programStatus = this.vmsData?.is_enabled;
          this._loadService.hide();
          this.dataLoad = true;
        },
        err => {
          this._loadService.hide();
          this._alert.error(errorHandler(err));
        },
      ),
    );
  }

  fetchClientData(client) {
    let clientName = client;
    if (clientName) {
      this.subscriptions.push(
        this.programService.get(`/configurator/organizations?category=CLIENT&active=true&name=${clientName}`).subscribe((data: any) => {
          data = data?.organizations;
          let labor_category = '';
          data[0]?.industries?.map(ele => {
            labor_category += ele.name + ', ';
          });
          labor_category = labor_category?.slice(0, -2);
          this.laborCategory = labor_category;
          this.category = data[0]?.category;
          this.client_logo = data[0]?.logo != null ? data[0]?.logo : data[0]?.name;
          this.email = data[0]?.email != null ? 'mailto:' + data[0]?.email : '';
        }),
      );
    }
  }

  fetchMSPData(msp: string) {
    if (!msp) {
      return;
    }

    this.programService.get(`/configurator/organizations/${msp}`).subscribe({
      next: (data: any) => {
        if (data?.organization) data = data?.organization;
        this.msp = data;
        this.mspList = this.uniqueHelper.transform([...this.mspList, this.msp], 'id');
        this.mspList = this.sortHelper.transform(this.mspList, 'name');
      },
      error: (err: any) => {
        this._alert.error(errorHandler(err));
      },
    });
  }

  loadData() {
    this.editProgramForm.patchValue({
      name: this.vmsData?.name,
      msp: this.vmsData?.msp,
      client: this.vmsData?.client?.id,
      programType: this.vmsData?.service_type,
      programID: this.vmsData?.unique_id,
      date: this.datePipe.transform(this.vmsData?.start_date, this.defaultDateFormat, null, null, true),
      // date: this.dateFormat(this.vmsData?.start_date),
      is_enabled: this.vmsData?.is_enabled,
      labor_category: this.vmsData?.industries ? this.vmsData?.industries : [],
    });
  }

  checkProgramName(term) {
    let duplicate = false;
    this.subscriptions.push(
      this.programService.get(`/configurator/programs?name=${term}`).subscribe((data: any) => {
        data.programs.map(data1 => {
          if (data1?.name?.toUpperCase() === term.toUpperCase() && term.toUpperCase() !== this.vmsData?.name?.toUpperCase()) {
            duplicate = true;
          } else {
            duplicate = false;
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

  mspData() {
    this.subscriptions.push(
      this.programService.get('/configurator/organizations?category=MSP&active=true').subscribe((data: any) => {
        this.mspList = data?.organizations;
        this.mspTotalRecords = data?.total_records;
        if (this.msp) {
          this.mspList = this.uniqueHelper.transform([...this.mspList, this.msp], 'id');
          this.mspList = this.sortHelper.transform(this.mspList, 'name');
        }
      }),
    );
  }

  selectstatus(flag) {
    this.editProgramForm.get('is_enabled').setValue(flag);
    if (flag) {
      this.programStatus = flag;
    } else {
      this.programStatus = flag;
    }
  }

  private MSPService(term: string = '', page: number = 1) {
    let url: string = `/configurator/organizations?category=MSP&active=true&page=${page}`;
    if (term) {
      url += `&name=${term}`;
    }

    return this.programService.get(url);
  }

  onClickDropdwon() {
    this.showDropdwon = !this.showDropdwon;
  }

  onClickToggle() {
    if (this.toggle.value) {
      this.toggle.value = false;
      this.toggle.title = 'inactive';
    } else {
      this.toggle.value = true;
      this.toggle.title = 'active';
    }
    this.status = this.toggle.value;
  }

  onEditBtnClick() {
    this.editData = true;
    this.dataLoad = false;
    this.loadData();
    this.showCustomPanel = false;
    let date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate());
    this.start_date_options = {
      language: 'English',
      range: false,
      enabledDateRanges: [{ start: date }],
    };
  }

  onCancelBtnClick() {
    this.editData = false;
    this.showCustomPanel = true;
    this.dataLoad = true;
  }

  onSaveBtnClick(send_payload: boolean = false) {
    let conditions;
    let editForm = this.editProgramForm.value;
    let date1;
    let date = new Date(this.editProgramForm.get('date').value);
    let day = date.getDate();
    let month = date.getMonth();
    let year = date.getFullYear();
    date1 = new Date(year, month, day + 1);
    date1 = date1.getTime() / 1000;
    date1 = isNaN(date1?.toString()) ? undefined : date1?.toString();
    let module_groups = this.moduleGroup.map(fg => {
      return { id: fg.id, is_enabled: fg.is_enabled };
    });

    let payLoad = {
      name: editForm?.name,
      description: '.',
      service_type: editForm?.programType,
      msp: editForm?.msp || null,
      vendors: [],
      start_date: date1 || undefined,
      is_enabled: editForm?.is_enabled,
      industries: editForm?.labor_category,
      module_groups: module_groups || [],
    };

    if (send_payload && !conditions) {
      return payLoad;
    }
    if (payLoad?.name == '' || payLoad?.name == undefined) {
      this._alert.error('program name is required');
      conditions = true;
    }
    if (payLoad?.service_type == '' || payLoad?.service_type == undefined) {
      this._alert.error('program type is required');
      conditions = true;
    }
    if (payLoad?.service_type == 'MSP-MANAGED' && (payLoad?.msp == undefined || payLoad?.msp == '')) {
      this._alert.error('MSP is required');
      conditions = true;
    }
    if (this.duplicateProgram != '' && this.duplicateProgram != undefined) {
      this._alert.error('program Name already in use');
      conditions = true;
    }
    if (!conditions) {
      this._loadService.show();
      this.subscriptions.push(
        this.programService.put(`/configurator/programs/${this.vmsData?.id}`, payLoad).subscribe(
          (data: any) => {
            if (data?.program?.id) {
              this._loadService.hide();
              this._alert.success('Program Updated Successfully.');
              if (this.vmsData?.name != payLoad.name || this.vmsData?.is_enabled != payLoad.is_enabled) {
                this.programService.shareProgramData.emit(true);
              }
              this.fetchProgramIddetails();
              this.editData = false;
              this.showCustomPanel = true;
            }
          },
          err => {
            this._loadService.hide();
            this._alert.error(errorHandler(err), {});
          },
        ),
      );
    }
  }

  changeService_Type() {
    this.editProgramForm.controls.msp.setValue(null);
  }

  prepareObj(obj) {
    let copyObj = this._cloneService.deepClone(obj);
    let programObj = [];
    let copyElemet;
    copyObj?.map(element => {
      copyElemet = element;
      delete copyElemet.id;
      programObj.push(copyElemet);
    });
    return programObj;
  }

  getProgramModuleList() {
    this.subscriptions.push(
      this._userService.getAllModuleList(this.programId).subscribe(
        (data: any) => {
          data?.module_groups?.forEach((mGroup: any) => {
            mGroup.is_enabled = true;
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
          });
          this.programModuleGroup = data.module_groups;
          this.getAllModuleList();
        },
        error => {
          this._alert.error(errorHandler(error), {});
        },
        () => {},
      ),
    );
  }

  get modulesToHide() {
    let modulesToHide: Array<string> = [];
    if (!this.globalLaunchService.isglobalLaunchSlugFlagEnabled(GlobalLaunchKeys.MASTER_TALENT_PROFILE_MODULE))
      modulesToHide.push('Master Talent Profile');
    return modulesToHide;
  }

  getAllModuleList() {
      this.programService.getAllModulesList().subscribe((mGroups: Array <any>) => {
        this.moduleGroup = mGroups;
        if (Array.isArray(this.programModuleGroup)) {
          this.programModuleGroup.forEach(programModule => {
            this.moduleGroup.forEach(module => {
              if (programModule.id === module.id) {
                module.is_enabled = true;
              }
            });
          });
        }
      }, (err: any) => {
      console.error(err);
      this._alert.error("Error encountered while fetching module groups!");
    })
  }

  onClickModule(e) {}

  ngOnDestroy(): void {
    this.subscriptions?.forEach(sub => sub.unsubscribe());
  }

  configDataChanged(event) {
    this.configData = event;
  }

  get storedJobObject() {
    if (!this.vmsData?.config?.job) {
      return {};
    }

    return this.vmsData.config.job;
  }

  get programClient() {
    return (
      this.localStorage.get(StorageKeys.CURRENT_PROGRAM)?.client?.id ?? this.localStorage.get(StorageKeys.CURRENT_PROGRAM)?.client?.id ?? ''
    );
  }
}
