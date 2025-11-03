import { Component, OnInit, ElementRef, Renderer2, ViewChild, OnDestroy } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { Subject, Subscription, debounceTime, tap, distinctUntilChanged, concatMap, forkJoin, of } from 'rxjs';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { ProgramService } from 'src/app/programs/program.service';
import { ProgramConfig } from 'src/app/shared/enums';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { EventStreamService, Events, EmitEvent } from 'src/app/core/services/event-stream.service';
import {environment} from 'src/environments/environment';
import {ClonerService} from 'src/app/core/services/cloner.service';
import { SortHelperPipe } from 'src/app/shared/pipe/sort-helper.pipe';
import { UniqueKeyPipe } from 'src/app/shared/pipe/unique-key.pipe';
import {UserService} from 'src/app/core/services/user.service';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { DATE_FORMAT } from 'src/app/library/date-format/date-format.model';
import { CustomFieldsComponent } from 'src/app/library/custom-fields/custom-fields/custom-fields.component';
import { CommonService } from 'src/app/library/custom-fields/common.service';
import { CommonViewDetail } from 'src/app/shared/components/common-view-rule-flow/common-view-rule-flow.component';
import { GlobalLaunchService,GlobalLaunchKeys } from 'src/app/control-panel/configs/global-launches/global-launch.service';
import { LoginService } from 'src/app/auth/login/login.service';

@Component({
  selector: 'app-program-details',
  templateUrl: './program-details.component.html',
  styleUrls: ['./program-details.component.scss'],
})
export class ProgramDetailsComponent implements OnInit, OnDestroy {
  public editMode: boolean = false;
  public programEditStatus: boolean = false;
  public programStatus: string = 'Active';

  public programId: string = null;
  public programDetails: any = null;
  public mspDetails: any = null;
  public dateFormat: string = '';

  public programDetailForm: UntypedFormGroup;
  public mountChild: boolean = false;
  moduleGroup: any = [];
  configData: any;
  public duplicateProgram: any;
  public mspList: Array<any> = [];
  msp: any;
  public programModuleGroup;
  laborCategory: any;
  category: any;

  private subscriptions: Array<Subscription> = [];
  public programSubject: Subject<any> = new Subject<any>();

  @ViewChild('editStatusBtn', { read: ElementRef, static: false }) editStatusBtn: ElementRef;
  public mspsearchManager: Subject<any> = new Subject<any>();
  public mspLoading: boolean = false;
  public mspTotalRecords: number = 0;
  public prevMSPSearch: any = { term: '', page: 1 };

  @ViewChild(CustomFieldsComponent) cfCmp: CustomFieldsComponent;
  public customFieldView: Array<{ label: string; value: string }> = [];
  public updatedCFs: Array<any>;
  public recievedCFs: Array<any>;
  public isCFValid: boolean = true;

  constructor(
    private renderer: Renderer2,
    private alert: AlertService,
    private loader: LoaderService,
    private storage: StorageService,
    private programService: ProgramService,
    private datePipe: LocalDateFormatPipe,
    private route: ActivatedRoute,
    private router: Router,
    private eventStream: EventStreamService,
    private _cloneService: ClonerService,
    private uniqueHelper: UniqueKeyPipe,
    private sortHelper: SortHelperPipe,
    private _userService: UserService,
    private cfService: CommonService,
    private globalLaunchService: GlobalLaunchService,
    private loginService: LoginService
  ) {
    this.renderer.listen('window', 'click', (e: Event) => {
      if (this.editStatusBtn && this.editStatusBtn.nativeElement.contains(e.target) && !this.programEditStatus) {
        this.programEditStatus = true;
      } else {
        this.programEditStatus = false;
      }
    });

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
            this.alert.error('Error encountered while fetching MSP entries');
          },
        }),
    );
  }

  ngOnInit(): void {
    const currentProgram = this.storage.get(StorageKeys.CURRENT_PROGRAM);
    this.dateFormat = currentProgram?.defaultDateFormat.toUpperCase();
    this.initializeForm();
    this.fetchProgramDetails();
    this.initProgramChangeListener();
    this.getProgramModuleList();
  }

  private MSPService(term: string = '', page: number = 1) {
    let url: string = `/configurator/organizations?category=MSP&active=true&page=${page}`;
    if (term) {
      url += `&name=${term}`;
    }

    return this.programService.get(url);
  }

  initProgramChangeListener() {
    this.subscriptions.push(
      this.programSubject
        .pipe(
          tap(() => {
            this.loader.show();
          }),
          debounceTime(1500),
        )
        .subscribe(([program, location]) => {
          const selectedProgram: any = program?.id;
          const activeProgram = this.storage.get(StorageKeys.CURRENT_PROGRAM);
          if (selectedProgram !== activeProgram?.id) {
            this.storage.set(StorageKeys.PROGRAM_ID, selectedProgram, true);
            this.programService.setProgram(program, true);
          }

          this.router.navigate([location]);
          setTimeout(() => {
            this.loader.hide();
          }, 1500);
        }),
    );
  }

  fetchProgramDetails() {
    this.subscriptions.push(
      this.route.queryParams.subscribe((params: Params) => {
        // Check for query params
        if (params?.program_req_id) {
          this.programId = this.programId = params?.['program_req_id'];
        } else {
          this.programId = this.storage.get(StorageKeys.PROGRAM_ID);
        }

        const url: string = `/configurator/programs/${this.programId}`;

        this.loader.show();
        this.programService.get(url).subscribe({
          next: (res: any) => {
            if (res) {
              this.loader.hide();
              this.programDetails = res?.program;
              this.configData = this.programDetails.config ? this.programDetails.config : {};
              this.mspsearchManager.next({ term: '' });
              this.initializeProgramData();
              this.fetchClientData(this.programDetails?.client?.name);
            }
          },
          error: (err: any) => {
            this.loader.hide();
            this.alert.error(errorHandler(err));
          },
        });
      }),
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
        }),
      );
    }
  }

  configDataChanged(event) {
    this.configData = event;
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
          this.alert.error(errorHandler(error), {});
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
      this.moduleGroup = mGroups?.filter(obj => obj?.name !== "Configuration") ?? [];
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
      this.alert.error("Error encountered while fetching module groups!");
    })
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

  onClickModule(e) {}

  checkProgramName(term) {
    let duplicate = false;
    this.subscriptions.push(
      this.programService.get(`/configurator/programs?name=${term}`).subscribe((data: any) => {
        data.programs.map(data1 => {
          if (data1?.name?.toUpperCase() === term.toUpperCase() && term.toUpperCase() !== this.programDetails?.name?.toUpperCase()) {
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

  initializeProgramData() {
    // View Mode
    this.programStatus = this.programDetails?.is_enabled ? 'Active' : 'Inactive';
    if (this.serviceType === 'MSP Managed') {
      if (this.mspDetails?.id !== this.programDetails?.msp) this.getMSPDetails(this.programDetails?.msp);
    }

    //Edit Mode
    this.programDetailForm.patchValue({
      name: this.programDetails?.name,
      code: this.programDetails?.unique_id,
      type: this.programDetails?.service_type,
      msp: this.programDetails?.msp,
      date: this.startDate,
      labor_category: this.programDetails?.industries?.map((entry: any) => entry?.name),
    });

    // Set Program Configuration
    let newProgramJson: any = {
      program_uniqId: this.programDetails?.unique_id,
      clientId: this.programDetails?.client?.id,
      program_req_id: this.programDetails?.id,
      clientName: this.programDetails?.client?.name,
    };

    this.cfService.amendCFViewData(this.programDetails?.['custom_fields'] || {}, this.programId, 'PROGRAM_DETAILS')
    .then((res: Array <CommonViewDetail>) => {
      this.customFieldView = res;

      if(this.customFieldView.length) {
        this.customFieldView = this.customFieldView.slice(1);
      }
    });

    this.storage.set(ProgramConfig[0], JSON.stringify(newProgramJson), true);
    this.mountChild = true;
  }

  initializeForm() {
    this.programDetailForm = new UntypedFormGroup({
      name: new UntypedFormControl(null, [Validators.required]),
      code: new UntypedFormControl(null, [Validators.required]),
      type: new UntypedFormControl(null, [Validators.required]),
      msp: new UntypedFormControl(null),
      date: new UntypedFormControl(null, [Validators.required]),
      labor_category: new UntypedFormControl([]),
    });
  }

  getMSPDetails(id: string) {
    if (id) {
      const url: string = `/configurator/organizations/${id}`;
      this.programService.get(url).subscribe({
        next: (res: any) => {
          if (res) {
            if ('organization' in res) res = res.organization;
            this.mspDetails = res;
          }
        },
        error: (err: any) => {
          this.alert.error(errorHandler(err));
        },
      });
    }
  }

  editProgramDetails() {
    this.mspsearchManager.next({ term: '' });
    this.mspList.push({ id: this.programDetails?.msp, name: this.mspDetails?.name });
    this.mspList = [...new Set(this.mspList)];
    this.editMode = true;
    setTimeout(() => {
      this.cfService.queueCFpopulation(this.programDetails?.['custom_fields'] || {}, this.cfCmp).then((cfs: any) => {
        this.recievedCFs = cfs;
      });
    }, 0);
  }

  addUserToProgram(eve) {
    this.eventStream.emit(new EmitEvent(Events.CREATE_NEW_USER, { show: true, orgId: environment.SIMPLIFY_ORG_ID }));
  }

  get storedJobObject() {
    if (!this.programDetails?.config?.job) {
      return {};
    }

    return this.programDetails.config.job;
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

  get programClient() {
    return this.storage.get(StorageKeys.CURRENT_PROGRAM)?.client?.id ?? this.storage.get(StorageKeys.CURRENT_PROGRAM)?.client?.id ?? '';
  }

  saveProgramDetails() {

    let conditions;
    let editForm = this.programDetailForm.value;
    let date1;
    let date = new Date(editForm.date);
    let day = date.getDate();
    let month = date.getMonth();
    let year = date.getFullYear();
    date1 = new Date(year, month, day + 1);
    date1 = date1.getTime() / 1000;
    date1 = isNaN(date1?.toString()) ? undefined : date1?.toString();
    let module_groups = this.moduleGroup.map(fg => {
      return { id: fg.id, is_enabled: fg.is_enabled };
    });

    let industries = editForm?.labor_category.map(x => {
      // sometimes x is a string and sometimes it is an object with label property so we need to handle both cases.
      if (typeof x === 'string') {
        return { name: x };
      }
      return { name: x.label };
    });

    let payLoad = {
      name: editForm?.name,
      description: '.',
      service_type: editForm?.type,
      msp: editForm?.msp || null,
      vendors: [],
      start_date: date1 || undefined,
      industries: industries,
      module_groups: module_groups || [],
      is_enabled: !!(this.programStatus === 'Active'),
    };

    if (this.programDetailForm.invalid) {
      this.alert.error('Please fill all the required fields correctly!');
      conditions = true;
    }
    if (payLoad?.service_type == 'MSP-MANAGED' && (payLoad?.msp == undefined || payLoad?.msp == '')) {
      this.alert.error('MSP is required');
      conditions = true;
    }
    if (this.duplicateProgram != '' && this.duplicateProgram != undefined) {
      this.alert.error('Program name already in use');
      conditions = true;
    }

    if(this.cfCmp?.customFieldsForm?.invalid) {
      this.alert.error("Please specify all the required custom fields correctly!");
      conditions = true;
    } else {
      payLoad['custom_fields'] = this.cfService.amendCFData(this.updatedCFs);
    }

    if (!conditions) {
      this.loader.show();
      this.subscriptions.push(
        this.programService.put(`/configurator/programs/${this.programDetails?.id}`, payLoad).subscribe(
          (data: any) => {
            if (data?.program?.id) {
              this.loader.hide();
              this.alert.success('program_updated_successfully');
              if (this.programDetails?.name != payLoad.name || this.programDetails?.is_enabled != payLoad.is_enabled) {
                this.programService.shareProgramData.emit(true);
              }
              this.fetchProgramDetails();
              this.editMode = false;
            }
          },
          err => {
            this.loader.hide();
            this.alert.error(errorHandler(err), {});
          },
        ),
      );
    }
  }

  viewProgramDetails() {
    this.editMode = false;
  }

  cancelEditProgramDetails() {
    this.editMode = false;
    this.initializeProgramData();
  }

  changeStatus(status) {
    if (status === 'Active') {
      this.programStatus = 'Active';
    } else if (status === 'Inactive') {
      this.programStatus = 'Inactive';
    }

    this.programEditStatus = false;
  }

  getDateTimeStamp(date: string): string {
    if (date) {
      let dateObject: Date = new Date(date);
      dateObject.setDate(dateObject.getDate() + 1);
      return dateObject.getTime() / 1000 + '';
    }

    return null;
  }

  get startDate() {
    const date: any = this.datePipe.transform(this.programDetails?.start_date, null, null, null, true, DATE_FORMAT.FORMATYMD);
    return date;
  }

  get serviceType() {
    if (this.programDetails) {
      const { service_type } = this.programDetails;
      if (service_type === 'MSP-MANAGED') return 'MSP Managed';
      else if (service_type === 'SELF-SERVICED') return 'Self Serviced';
    }

    return 'Undefined';
  }

  get isControlPanel() {
    return this.router?.url?.split('/').includes('control-panel');
  }

  private saveThrottler: boolean = false;
  private saveTimeout: any;
  get allowSave() {
    if(!this.loginService.isAPILockResolved) {
      this.saveThrottler = false;
      return false;
    }

    if(this.saveThrottler) {
      return true;
    }

    if(!this.saveTimeout) {
      this.saveTimeout = setTimeout(() => {
        this.saveThrottler = true;
        this.saveTimeout = null;
      }, 4000);

      return false;
    }

    return this.saveThrottler;
  }

  get markupByRateType() {
    return this.storage.get(StorageKeys.CURRENT_PROGRAM)?.config?.markup_by_rate_type || false;
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub: Subscription) => {
      sub?.unsubscribe();
    });
  }
}
