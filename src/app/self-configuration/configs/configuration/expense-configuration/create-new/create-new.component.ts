import { Component, OnInit } from '@angular/core';
import { SvmsRouterService } from 'src/app/core/services/svms-router.service';
import { UntypedFormGroup } from '@angular/forms';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { EmitEvent, Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { StorageService, StorageKeys } from 'src/app/core/services/storage.service';
import { ProgramService } from 'src/app/programs/program.service';
import { Subscription, Subject, interval } from 'rxjs';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { debounceTime, distinctUntilChanged, switchMap, takeUntil } from 'rxjs/operators';
import { ConfigurationActionsService } from 'src/app/program-setup/expense-configuration/services/configuration-actions.service';
import { DATE_FORMAT } from 'src/app/library/date-format/date-format.model';
import { ConfigurationMode } from '../../../../../program-setup/expense-configuration/enums/configuration-mode.enums';
import { Log, LOG_TYPE } from 'src/app/library/logs/logs.model';
import { ExpenseConfigurationListExpenseTypeService } from 'src/app/program-setup/expense-configuration/services/expense-configuration-list-expense-type.service';
import { IExpensesItem, IExpensesItemsListResponse, IExpensesItemVmsData } from '../../../../../program-setup/expense-configuration/models/expense-items-model';
import { ActivatedRoute } from '@angular/router';
import { ExpenseConfigurationItemDetailsTabsModel } from '../../../../../program-setup/expense-configuration/models/expense-configuration-list-expense-type-table-model';
import { ConfigurationDetailsService } from 'src/app/program-setup/expense-configuration/services/configuration-details.service';
import { AddExpenseTypeService } from 'src/app/program-setup/expense-configuration/services/add-expense-type.service';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { UserService } from 'src/app/core/services/user.service';
import { ExpenseType } from 'src/app/expense/enums/expense.enums';

@Component({
  selector: 'app-create-new',
  templateUrl: './create-new.component.html',
  styleUrls: ['./create-new.component.scss']
})
export class CreateNewComponent implements OnInit {
  public expenseForm: UntypedFormGroup;
  public programId: string;
  optionDropdownVisibility: boolean = false;
  secondOptionDropdownVisibility: boolean = false;
  public readonly configurationMode = ConfigurationMode;
  viewStatus = 'create';
  public configId: string;
  public isOpenAddExpenseType = false;
  public hierarchiesLoaded: boolean = false;

  dateFormat = DATE_FORMAT.FORMATMDY;
  submitted = false;
  public titleToggle = {
    value: false
  };
  private subscriptions: Subscription[] = [];
  public masterEditData: Array<string> = [];
  public customEditFields: Array<string> = [];
  expenseType = ExpenseType;
  private hierarchySub: Subject<string> = new Subject<string>();
  public hierarchyTree: Array<any> = [];
  toggles: any = {
    is_taxable: false,
    is_expense:false,
    project: {
      value: true,
      master_data: {
        value: false,
        masterDataFields: [],
      },
      custom_data: {
        value: false,
        customDataFields: [],
      },
      project_integration: {
        value: false,
        projectIntegrationFields: [],
      },
      worker_code: {
        value: false,
        workerCodeFields: [{
          id: 'workercode1', value: "account_code", name: "Account Code",label: "Account Code",
          program: "AmFam MSP",
          slug: "account_code",
          type: "worker_code"
        }]
      },
    },
    header:{
      foundational_data:{
          is_allow:false,
          value:[]
      }              
    },
    exp_amnt_based_on_role: {
      is_enabled:false,
      value: []
    },
    permissions: {
      value: true,
    }
  }
  weekEndDays = [
    { name: 'Sunday', value: 1 },
    { name: 'Monday', value: 2 },
    { name: 'Tuesday', value: 3 },
    { name: 'Wednesday', value: 4 },
    { name: 'Thursday', value: 5 },
    { name: 'Friday', value: 6 },
    { name: 'Saturday', value: 7 },
  ]
  customFields: any;
  foundationalFields: any;
  programDetails: any;
  selectedHierarchyIds:any = [];
  isLoading: boolean;
  public selectedFilter: string;
  logs: Log = undefined;
  vmsData: IExpensesItemVmsData[];
  miscellaneousData: IExpensesItemVmsData[];
  configurationData: any;
  workerEditData: any;
  index: any;
  indexValue: any;
  optionIcon: boolean;
  optionIconGen: boolean;
  miscExIndex : any;
  genExIndex : any;
  public masterDataTypes:any=[];
  public mode:string= undefined;
  public options: any = {};
  public request: any = {};
  public roles:any = [];
  taxable: any;
  activeLineItem: any;
  constructor(private programService: ProgramService,
    private storageService: StorageService,
    private _alertService: AlertService,
    private eventStream: EventStreamService,
    private router: SvmsRouterService,
    private actionService: ConfigurationActionsService,
    private eventStreamService: EventStreamService,
    private service: ExpenseConfigurationListExpenseTypeService,
    private activatedRoute: ActivatedRoute,
    private configurationDetailsService: ConfigurationDetailsService,
    private addExpenseTypeService: AddExpenseTypeService,
    private datePipe: LocalDateFormatPipe,
    private userService: UserService,

  ) { }

  ngOnInit(): void {
    this.activatedRoute.queryParams.subscribe(({ config_uuid, status }) => {
      if (config_uuid || status) {
        this.configId = config_uuid;
        this.viewStatus = status;
      }
    });
    this.programId = this.storageService.get(StorageKeys.PROGRAM_ID);
    this.dateFormat = this.storageService.get(StorageKeys.CURRENT_PROGRAM)?.defaultDateFormat.toUpperCase();
    this.programDetails = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    let startDate = this.datePipe.transform(this.programDetails?.start_date, this.dateFormat ,null ,null , true,)
    this.expenseForm = this.actionService.createForm(startDate);
    this.eventStream.on(Events.FETCH_CONFIGURATION_LIST_EXPENSE_TYPE).subscribe((data: IExpensesItem) => {
      if (this.configId) {
        this.getListExpenseItems(ExpenseConfigurationItemDetailsTabsModel.generalExpenses.filter);
        this.getMiscListExpenseItems(ExpenseConfigurationItemDetailsTabsModel.miscellaneousExpenses.filter);
      }
    });
    // get hierarchy call
    this.subscriptions.push(
      this.hierarchySub
        .pipe(
          distinctUntilChanged((x: string, y: string) => (x === y)),
          debounceTime(600),
          switchMap((programId: string) => {
            const url = `/configurator/programs/${programId}/hierarchy`;
            this.hierarchiesLoaded = false;
            return this.programService.get(url);
          })
        ).subscribe({
          next: (data: any) => {
            if (data?.result) {
              this.hierarchyTree = data.result;
              this.hierarchiesLoaded = true;
            }
          },
          error: err => {
            this._alertService.error(errorHandler(err));
          }
        })
    );
    this.hierarchySub.next(this.programId);
    this.eventStream.on(Events.SHOW_EXPENSE_LOGS).subscribe((data: any) => {
      this.logs = data
    });
    this.eventStream.on(Events.GET_EXPENSE_CONFIG).subscribe((id: any) => {
      this.configId = id;
      this.getDetailExpenseConfig();
    });
    this.isLoading = true;
    this.getDetailExpenseConfig();
    this.getCustomFields();
    this.getFoundationalTypes();
    this.getRoleList(this.programId);
  }

  getDetailExpenseConfig() {
    if (this.configId) {
      this.configurationDetailsService
        .getDetailExpenseConfig(this.configId, this.programId)
        .subscribe({
          next: (data: any) => {
            if (data) {
              this.expenseForm.patchValue({
                config_name: data?.config_name,
                week_end_day: data?.week_end_day
              });
              this.configurationData = data;
              this.setHierarchy(this.configurationData?.hierarchy?.map(val =>val?.id));
              if (this.configId) {
                this.toggles.header.foundational_data.is_allow = this.configurationData?.expense_config?.header?.foundational_data?.is_allow;
                if (this.configurationData?.expense_config?.header?.foundational_data?.value?.length > 0) {
                  this.masterDataTypes = []
                  this.masterDataTypes  = this.configurationData?.expense_config?.header?.foundational_data?.value;
                }
                this.toggles.exp_amnt_based_on_role.is_enabled = this.configurationData?.expense_config?.exp_amnt_based_on_role?.is_enabled;
                this.toggles.exp_amnt_based_on_role.value = this.configurationData?.expense_config?.exp_amnt_based_on_role?.value;
                this.toggles.is_taxable = this.configurationData?.expense_config?.is_taxable;
                this.actionService.fillFormWithConfigData(
                  this.expenseForm,
                  this.configurationData,
                  true
                );
              }
              this.masterEditData = this.configurationData?.expense_config?.custom_fields.fields?.filter(fd => {
                return fd.type == 'foundational';
              }).map(h => h.id);
              this.toggles.project.master_data.masterDataFields = this.configurationData?.expense_config?.custom_fields.fields?.filter(fd => {
                return fd.type == 'foundational';
              });
              this.customEditFields = this.configurationData?.expense_config?.custom_fields.fields?.filter(cd => {
                return (cd.type != 'foundational' && cd.type != 'worker_code');
              }).map(h => h.id);
              this.toggles.project.custom_data.customDataFields = this.configurationData?.expense_config?.custom_fields.fields?.filter(cd => {
                 return (cd.type != 'foundational' && cd.type != 'worker_code')
                });
              this.workerEditData = this.configurationData?.expense_config?.custom_fields.fields?.filter(fd => {
                return fd.type == 'worker_code';
              }).map(h => h.id);
              if(this.configurationData?.status == 'active'){
                this.titleToggle.value = true;
              } else {
                this.titleToggle.value = false;
              }
                this.toggles.project.value = this.configurationData?.expense_config?.custom_fields?.is_enabled,
                this.toggles.is_expense = this.configurationData?.expense_config?.is_expense;
              if (this.configurationData?.expense_config?.custom_fields?.is_enabled) {
                this.toggles.project.master_data.value = true;
                this.toggles.project.custom_data.value = true;
                this.toggles.project.project_integration.value = true;
                this.toggles.project.worker_code.value = true;
              }
              this.getCustomFields();
              this.getFoundationalTypes();
            }
            this.isLoading = false;
          }, error:
            (err) => {
              this.showError(err);
              this.isLoading = false;
            }
        }
        );
        this.getListExpenseItems(ExpenseConfigurationItemDetailsTabsModel.generalExpenses.filter);
        this.getMiscListExpenseItems(ExpenseConfigurationItemDetailsTabsModel.miscellaneousExpenses.filter);
    }
    else {
      if (this.addExpenseTypeService?.addExpenseTypeForm?.value) {
        this.addExpenseTypeService.addExpenseTypeForm.get('is_taxable').setValue(false);
        if(this.addExpenseTypeService?.toggleOptionItems?.length === this.addExpenseTypeService?.toggleOptionItemsData?.length) {
          this.addExpenseTypeService?.toggleOptionItems.splice(0,1);
          }
      }
    }
  }

  setHierarchy(ids: Array <string>) {
    let destroyer$: Subject <void> = new Subject <void> ();
    this.subscriptions.push(
      interval(500).pipe(
        takeUntil(destroyer$)
      ).subscribe(() => {
        if(this.hierarchiesLoaded) {
          this.selectedHierarchyIds = ids;
          this.expenseForm.get('hierarchy_uuid')?.setValue(this.selectedHierarchyIds);
          destroyer$.next();
        }
      })
    );
  }

  onSelectionDays(event){
  }
  getRoleList(programId:string){
    let url = `/configurator/programs/${programId}/roles`;
    this.userService.get(url).subscribe({
      next: (data: any) => {
        let roleList = data?.roles?.filter((val:any) => ((val?.organization_category === 'MSP' || val?.organization_category === 'CLIENT'|| val?.organization_category === 'VENDOR') && !!val?.is_enabled));
          this.roles = roleList?.map((fd => {
            fd.code = this.snakeCase(fd.name);
            fd.type = 'roles';
            fd.label = fd.name;
            return fd;
          }));
          }
        })
      }
  public getListExpenseItems(type: string): void {
    this.selectedFilter = type;
    this.isLoading = true;
    this.service.getListExpenseItems(type, this.configId, this.programId)
      .subscribe((response: IExpensesItemsListResponse) => {
        this.vmsData = response?.data?.expenseItems.map((item: IExpensesItem) => {
          // const createdAtDate = this.datePipe.transform(item.created_at, this.dateFormat ,null ,null , false,);
          return {
            id: item.expense_item_id,
            code: item.expense_code,
            expense_name: item.expense_name,
            icon: item.expense_icon ? item.expense_icon : null,
            // created_at: item.created_by.name ? `By ${item.created_by.name} on` : '' + ` ${createdAtDate}`,
            is_enabled: item.status === 'active',
            is_taxable: item.is_taxable,
            expense_code: item.expense_code
          } as IExpensesItemVmsData;
        });
        this.isLoading = false;
      }, error => {
        this.isLoading = false;
      });
  }
  public getMiscListExpenseItems(type: string): void {
    this.selectedFilter = type;
    this.isLoading = true;
    this.service.getListExpenseItems(type, this.configId, this.programId)
      .subscribe((response: IExpensesItemsListResponse) => {
        this.miscellaneousData = response?.data?.expenseItems.map((item: IExpensesItem) => {
          // const createdAtDate = this.datePipe.transform(item.created_at, this.dateFormat ,null ,null , false,);
          return {
            id: item.expense_item_id,
            code: item.expense_code,
            expense_name: item.expense_name,
            icon: item.expense_icon ? item.expense_icon : null,
            // created_at: item.IExpensesItemVmsData.name ? `By ${item.created_by.name} on` : '' + ` ${createdAtDate}`,
            is_enabled: item.status === 'active',
            is_taxable: item.is_taxable,
            expense_code: item.expense_code
          } as IExpensesItemVmsData;
        });
        this.isLoading = false;
      }, error => {
        this.isLoading = false;
      });
  }

  onHover(i) {
    this.miscExIndex = i;
    this.optionIcon = true;
  }
  onLeave(i) {
      this.miscExIndex = undefined;
  }
  onGenHover(i) {
    this.genExIndex = i;
    this.optionIconGen = true;
  }
  onGenLeave(i) {
      this.genExIndex = undefined;
  }
  onSubmit() {
    if(this.expenseForm?.value?.header?.foundational_data?.is_allow && this.masterDataTypes?.length == 0){
      this._alertService.error("Please select a value for Master Data Type");
      return;
    }
    delete this.expenseForm.value.project_name;
    delete this.expenseForm.value.option_name;
    this.expenseForm.value.status = this.titleToggle?.value;
    this.expenseForm.value.config.is_expense = this.toggles?.is_expense
    this.expenseForm.value.config.is_taxable = this.toggles?.is_taxable;
    this.expenseForm.value.custom_fields.is_enabled = this.toggles?.project?.value;
    this.expenseForm.value.exp_amnt_based_on_role  = this.toggles?.exp_amnt_based_on_role;
    this.expenseForm.value.header.foundational_data.value = this.masterDataTypes;
    this.expenseForm.value.custom_fields.fields = this.customFieldsPayload;
    this.expenseForm.value.account_code = this.toggles?.project?.worker_code?.value && (this.toggles?.project?.worker_code?.workerCodeFields[0]?.name || this.toggles?.project?.worker_code?.workerCodeFields[0]?.label) ? this.toggles?.project?.worker_code?.workerCodeFields[0].name ?? this.toggles?.project?.worker_code?.workerCodeFields[0].label : null;
    this.expenseForm.value.expense_start_date = this.datePipe.transform(this.expenseForm.value.expense_start_date, DATE_FORMAT?.FORMATYMD ,null ,null , true,this.dateFormat);
    this.actionService.addExpenseConfig(
      this.expenseForm,
      this.selectedHierarchyIds,
      this.programId,
      this.toggles?.project,
      this.configId,
      this.activeLineItem
    );
  }
  get customFieldsPayload() {
    let fields: any = [];
    if (this.toggles?.project?.master_data?.value) {
      fields = [...fields, ...this.toggles?.project?.master_data?.masterDataFields];
    }
    if (this.toggles?.project?.custom_data?.value) {
      fields = [...fields, ...this.toggles?.project?.custom_data?.customDataFields];
    }
    if (this.toggles?.project?.project_integration?.value) {
      fields = [...fields, ...this.toggles?.project.project_integration?.projectIntegrationFields];
    }
    if (this.toggles?.project?.worker_code?.value) {
      fields = [...fields, ...this.toggles?.project?.worker_code?.workerCodeFields];
    }
    return fields;
  }

  public addExpenseType(expenseType: ExpenseType) {
    this.toggleOpenAddExpenseType();
    setTimeout(() => {
      this.eventStreamService.emit(new EmitEvent(Events.ADD_EXPENSE_TYPE, true));
      if(expenseType === ExpenseType.Expense) {
        this.addExpenseTypeService?.addExpenseTypeForm?.get('expense_type').setValue('expense')
      }
      else {
        this.addExpenseTypeService?.addExpenseTypeForm?.get('expense_type').setValue('misc_expense')
      }
      if (this.toggles.is_taxable) {
        this.addExpenseTypeService?.addExpenseTypeForm.get('is_taxable').setValue(false);
        this.addExpenseTypeService.toggleOptionItems = [...this.addExpenseTypeService.toggleOptionItemsData];
      } else {
        this.addExpenseTypeService.addExpenseTypeForm.get('is_taxable').setValue(false);
        if (this.addExpenseTypeService?.toggleOptionItems?.length === this.addExpenseTypeService?.toggleOptionItemsData?.length) {
          this.addExpenseTypeService?.toggleOptionItems.splice(0, 1);
        }
      }
    });
  }
  public toggleOpenAddExpenseType(): void {
    this.isOpenAddExpenseType = !this.isOpenAddExpenseType;
  }

  onClickExpenseToggle() {
    if (this.toggles.is_expense) {
      this.toggles.is_expense = false;
    } else {
      this.toggles.is_expense = true;
    }
  }
  onClickExpenseTaxToggle() {
    if (this.toggles.is_taxable) {
      if (this.vmsData?.length || this.miscellaneousData?.length) {
        let activeLineItem = this.vmsData?.filter((val) => val.is_taxable)
        activeLineItem?.map((val) => val.is_taxable = '0');
        let miscActiveLineItem = this.miscellaneousData?.filter((val) => val.is_taxable);
        miscActiveLineItem?.map((val) => val.is_taxable = '0');
        if (activeLineItem?.length && !miscActiveLineItem?.length) {
          this.activeLineItem = [...activeLineItem];
        }
        else if (!activeLineItem?.length && miscActiveLineItem?.length) {
          this.activeLineItem = [...miscActiveLineItem];
        }
        else {
          this.activeLineItem = [...activeLineItem, ...miscActiveLineItem];
        }
      }
      this.toggles.is_taxable = false;
      this.addExpenseTypeService.addExpenseTypeForm.get('is_taxable').setValue(false);
      if (this.addExpenseTypeService?.toggleOptionItems?.length === this.addExpenseTypeService?.toggleOptionItemsData?.length) {
        this.addExpenseTypeService?.toggleOptionItems.splice(0, 1);
      }
    } else {
      this.toggles.is_taxable = true;
      this.addExpenseTypeService?.addExpenseTypeForm.get('is_taxable').setValue(false);
      this.addExpenseTypeService.toggleOptionItems = [...this.addExpenseTypeService.toggleOptionItemsData];
      this.activeLineItem = [];
    }
  }

  onClickToggle() {
    if (this.titleToggle.value) {
      this.titleToggle.value = false;
    } else {
      this.titleToggle.value = true;
    }
  }

  changeSelectedHierarchies(selected: Array<string>) {
    if (Array.isArray(selected) && this.hierarchiesLoaded) {
      this.expenseForm.get('hierarchy_uuid')?.setValue(selected);
      this.selectedHierarchyIds = selected;
    }
  }

  onClickToggleProject() {
    if (this.toggles.project.value) {
      this.toggles.project.value = false;
    } else {
      this.toggles.project.value = true;
    }
  }

  onClickTogglePermissions() {
    if (this.toggles.permissions.value) {
      this.toggles.permissions.value = false;
    } else {
      this.toggles.permissions.value = true;
    }
  }

  toggleSwitchChange($event, type) {
    if (type === 'master_data') {
      this.toggles.project.master_data.value = $event;
    } else if (type === 'custom_data') {
      this.toggles.project.custom_data.value = $event;
    } else if (type === 'project_integration') {
      this.toggles.project.project_integration.value = $event;
    } else if (type === 'worker_code') {
      this.toggles.project.worker_code.value = $event;
    } else if (type === 'exp_amnt_based_on_role') {
      this.toggles.exp_amnt_based_on_role.is_enabled = $event;
    }
    if (!this.toggles.exp_amnt_based_on_role.is_enabled) {
      this.toggles.exp_amnt_based_on_role.value = [];
    }  
  }
  multiSelectValueChanged(event, type) {
    if (type === 'master_data') {
      this.toggles.project.master_data.masterDataFields = event.map(m => { return { id: m.id, slug: m.slug, name: m.name, type: m.type } });
    } else if (type === 'custom_data') {
      this.toggles.project.custom_data.customDataFields = event.map(m => { return { id: m.id, slug: m.slug, name: m.name, type: m.type } });;
    } else if (type === 'project_integration') {
      this.toggles.project.project_integration.projectIntegrationFields = event;
    } else if (type === 'worker_code') {
      this.toggles.project.worker_code.workerCodeFields = event.map(m => { return { id: m.id, slug: m.slug, name: m.name, label: m.name, type: m.type } });;
    } else if(type === 'exp_amnt_based_on_role'){
      this.toggles.exp_amnt_based_on_role.value = event.map(m => m.id);;
    }
  }
  optionDropdown(i) {
    this.optionDropdownVisibility = true;
    this.index = i;
  }
  hideOptionDropdown() {
    this.optionDropdownVisibility = false;
  }
  optionSecondDropdown(i) {
    this.secondOptionDropdownVisibility = true;
    this.indexValue = i;
  }
  hideSecondOptionDropdown() {
    this.secondOptionDropdownVisibility = false;
  }
  public onEditClick(event: IExpensesItemVmsData) {
    this.toggleOpenAddExpenseType();
    setTimeout(() => {
      this.eventStreamService.emit(new EmitEvent(Events.ADD_EXPENSE_TYPE, { itemId: event.id, mode: 'edit' }));
      if (this.toggles.is_taxable) {
        this.addExpenseTypeService.addExpenseTypeForm.get('is_taxable').setValue(false);
        this.addExpenseTypeService.toggleOptionItems = [...this.addExpenseTypeService.toggleOptionItemsData];
      } else {
        this.addExpenseTypeService.addExpenseTypeForm.get('is_taxable').setValue(false);
        if (this.addExpenseTypeService?.toggleOptionItems?.length === this.addExpenseTypeService?.toggleOptionItemsData?.length) {
          this.addExpenseTypeService?.toggleOptionItems.splice(0,1);
        }
      }
    });
  }

  public onViewClick(event: IExpensesItemVmsData) {
    this.toggleOpenAddExpenseType();
    setTimeout(() => {
      this.eventStreamService.emit(new EmitEvent(Events.ADD_EXPENSE_TYPE, { itemId: event.id, mode: 'view' }));
      if (this.toggles.is_taxable) {
        this.addExpenseTypeService.addExpenseTypeForm.get('is_taxable').setValue(false);
        this.addExpenseTypeService.toggleOptionItems = [...this.addExpenseTypeService.toggleOptionItemsData];
      } else {
        this.addExpenseTypeService.addExpenseTypeForm.get('is_taxable').setValue(false);
        if (this.addExpenseTypeService?.toggleOptionItems?.length === this.addExpenseTypeService?.toggleOptionItemsData?.length) {
          this.addExpenseTypeService?.toggleOptionItems.splice(0,1);
        }
      }
    });
  }
  public onDisableOrEnableClick(item: IExpensesItemVmsData) {
    const status = !item.is_enabled;
    this.addExpenseTypeService.addOrEditExpenseType(
      { status, expense_code: item.code, expense_name: item.expense_name },
      this.programId,
      item.id
    ).subscribe((res: any) => {
      if (res.status === 201) {
        this.eventStreamService.emit(new EmitEvent(Events.FETCH_CONFIGURATION_LIST_EXPENSE_TYPE, res.data));
      }
    });
  }
  async getFoundationalTypes() {
    this.programId = this.storageService.get(StorageKeys.PROGRAM_ID);
    if(this.viewStatus?.toLowerCase() == 'view'){
      this.actionService.get(`/configurator/programs/${this.programId}/foundational-data-types?limit=150`).subscribe((data: any) => {
        const { foundational_data_types } = data;
        this.foundationalFields = foundational_data_types?.filter(fd => {
          return fd?.configuration && fd?.configuration?.module_jobs !== 'OFF';
        }).map(fd => {
          fd.code = this.snakeCase(fd.name);
          fd.type = 'foundational';
          fd.label = fd.name;
          return fd;
        });
      });
    }else{
      this.actionService.get(`/configurator/programs/${this.programId}/foundational-data-types?active=true&limit=50`).subscribe((data: any) => {
        const { foundational_data_types } = data;
        this.foundationalFields = foundational_data_types?.filter(fd => {
          return fd?.configuration && fd?.configuration?.module_jobs !== 'OFF';
        }).map(fd => {
          fd.code = this.snakeCase(fd.name);
          fd.type = 'foundational';
          fd.label = fd.name;
          return fd;
        });
      });
    }
  }

  snakeCase = string => {
    string = string.toLowerCase();
    return string.replace(/\W+/g, ' ')
      .split(/ |\B(?=[A-Z])/)
      .map(word => word.toLowerCase())
      .join('_');
  }

  async getCustomFields() {
    this.programId = this.storageService.get(StorageKeys.PROGRAM_ID);
    let url = `/configurator/programs/${this.programId}/custom-fields?entity_ref=EXPENSES&limit=50`;
    this.actionService.get(url).subscribe({
      next: (data: any) => {
        if (data && data.custom_fields.length > 0) {
          this.customFields = data?.custom_fields?.map(cd => {
            cd.parent_type = 'custom';
            return cd;
          });
        }
      }, error:
        (error: any) => { }
    });
  }
  public get incurredSubmissionFrom(): UntypedFormGroup {
    return this.expenseForm.get('incurredSubmissionFrom') as UntypedFormGroup;
  }

  public get removeWorkerAccessFrom(): UntypedFormGroup {
    return this.expenseForm.get('removeWorkerAccessFrom') as UntypedFormGroup;
  }

  public get removeVendorAccessFrom(): UntypedFormGroup {
    return this.expenseForm.get('removeVendorAccessFrom') as UntypedFormGroup;
  }

  public get removeVendorMiscFrom(): UntypedFormGroup {
    return this.expenseForm.get('removeVendorMiscFrom') as UntypedFormGroup;
  }

  public get removeMspAccessFrom(): UntypedFormGroup {
    return this.expenseForm.get('removeMspAccessFrom') as UntypedFormGroup;
  }

  public get removeMspAccessMiscFrom(): UntypedFormGroup {
    return this.expenseForm.get('removeMspAccessMiscFrom') as UntypedFormGroup;
  }

  backClicked() {
    this.router.navigate(['configuration', 'expense-configuration', 'list']);
  }

  // mdt toggle on/off
  mdtToggle(value: any) {
    this.expenseForm.value.header.foundational_data.is_allow = value;
    if(!value){
      this.masterDataTypes = [];
    }    
  }

  // master data type
  selectionMasterDataTypes(value: any) {
    this.masterDataTypes = value
  }

  showError(err) {
    window.scrollTo(0, 0);
    this.logs = {
      type: LOG_TYPE.ERROR, heading: err?.error?.error?.message, messages: [], autoClose: true, isShown: true, showReportButton: (err?.status == 500 || err?.status == 400), additionalInfo: { trace_id: err?.error?.trace_id }
    };
    err?.error?.error?.errors?.forEach(msg => {
      if (msg?.message) {
        this.logs.messages.push(msg?.message);
      }
    });
  }
}
