import { Injectable } from '@angular/core';
import { map } from 'rxjs/internal/operators/map';
import { ProgramSetupService } from '../../program-setup.service';
import { Observable } from 'rxjs-compat/Observable';
import { ConfigurationForm, ConfigurationPayload } from '../models/expense-configuration-form.model';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { Hierarchy } from 'src/app/library/hierarchy/hierarchy.model';
import { IExpensesConfigurationListItem } from '../pages/expense-configuration-list/expense-configuration-list-interface';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ExpenseToggle } from '../models/expense-toggle.model';
import { Router } from '@angular/router';
import { NavigationPaths } from '../enums/expense-configuration.enums';
import { Log, LOG_TYPE } from 'src/app/library/logs/logs.model';
import { EmitEvent, Events, EventStreamService } from '../../../core/services/event-stream.service';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { DATE_FORMAT } from 'src/app/library/date-format/date-format.model'; 
import { AddExpenseTypeService } from 'src/app/program-setup/expense-configuration/services/add-expense-type.service';
import { SvmsRouterService } from 'src/app/core/services/svms-router.service';
@Injectable({
  providedIn: 'root'
})
export class ConfigurationActionsService {
  public destroy$: Subject<boolean> = new Subject<boolean>();
  public customFieldToggle: ExpenseToggle = { title: 'Program', value: false };

  constructor(
    private programSetupService: ProgramSetupService,
    private alertService: AlertService,
    private fb: UntypedFormBuilder,
    private router: SvmsRouterService,
    private eventStream:EventStreamService,
    private localDatePipe: LocalDateFormatPipe,
    private storageService: StorageService,
    public Router:Router,
    private addExpenseTypeService: AddExpenseTypeService,
  ) {
  }

  getTimesheetDropdownOptions() {
    return {
      timesheetProjectTypes:[{ value: "foundational", name: "Master Data" },{ value: "custom", name: "Custom Data" },{ value: "project-integration", name: "Project Integration" },{ value: "worker_code", name: "Worker Code" }],
    }
  }
  get(url) {
    return this.programSetupService.get(url);
  }

  public getHierarchy(programId: string): Observable<Hierarchy[]> {
    return this.programSetupService.get(`/configurator/programs/${programId}/hierarchy`)
      .pipe(map((res:any) => res.result));
  }

  public prepareConfigData(formValues: ConfigurationForm, customToggle): ConfigurationPayload {
    const {
      config,
      header,
      exp_amnt_based_on_role ,
      custom_fields,
      config_name,
      week_end_day,
      hierarchy_uuid,
      expense_start_date,
      incurredSubmissionFrom,
      removeWorkerAccessFrom,
      removeVendorAccessFrom,
      removeVendorMiscFrom,
      removeMspAccessFrom,
      removeMspAccessMiscFrom,
      status
    } = formValues;
    return {
      hierarchy_uuid,
      expense_start_date,
      config_name,
      week_end_day,
      status,
      config: {
        ...config,
        header : {
          foundational_data:{
            value:header.foundational_data.value,
            is_allow:header.foundational_data.is_allow
          }
        },
        exp_amnt_based_on_role: {
          is_enabled: exp_amnt_based_on_role.is_enabled,
          value: exp_amnt_based_on_role.value,
        },
        custom_fields: custom_fields,
        grace_period_submission: {
          value: incurredSubmissionFrom.count,
          type: incurredSubmissionFrom.units || 'Days'
        },
        remove_worker_access_general: {
          value: removeWorkerAccessFrom.count,
          type: removeWorkerAccessFrom.units || 'Days'
        },
        remove_vendor_access_general: {
          value: removeVendorAccessFrom.count,
          type: removeVendorAccessFrom.units || 'Days'
        },
        remove_vendor_access_misc: {
          value: removeVendorMiscFrom.count,
          type: removeVendorMiscFrom.units || 'Days'
        },
        remove_msp_access_general: {
          value: removeMspAccessFrom.count,
          type: removeMspAccessFrom.units || 'Days'
        },
        remove_msp_access_misc: {
          value: removeMspAccessMiscFrom.count,
          type: removeMspAccessMiscFrom.units || 'Days'
        }
      }
    };
  }

  public addExpenseConfig(
    form: UntypedFormGroup,
    hierarchyId: string,
    programId: string,
    customFieldToggle: ExpenseToggle,
    configId?: string,
    activeLineItem?: any
  ) {
    const payload = this.prepareConfigData({ ...form.value, hierarchy_uuid: hierarchyId }, customFieldToggle);
    if(configId){
    return this.programSetupService.put(
      `/expense/programs/${programId}/config-expense` + (configId ? `/${configId}` : ''),
      payload
    ).pipe(takeUntil(this.destroy$))
      .subscribe({next:(res:any) => {
        if(activeLineItem?.length) {
        let apis = [];
        activeLineItem?.forEach(lineItem => {
          apis.push(this.addExpenseTypeService?.addOrEditExpenseType(lineItem, programId, lineItem?.id))
        });
        forkJoin(apis).subscribe((val) => {
        });
      }
        this.alertService.success(res.data.message);
        if(this.Router.url.includes('self-configuration')){
          // , { queryParams: { config_uuid: res.data.config_uuid, status: 'view' } }
          this.router.navigate(['configuration', 'expense-configuration', 'list']);
        } else{
          this.router.navigate(
            NavigationPaths.user.expenseConfigurationDetails()?.split('/')?.slice(1),
            { queryParams: { config_uuid: res.data.config_uuid, status: 'view' } }
          );
        }
       
      },error: err => {
        this.showError(err);
      }});} else{
        return this.programSetupService.post(
          `/expense/programs/${programId}/config-expense`,
          payload
        ).pipe(takeUntil(this.destroy$))
          .subscribe({next:(res:any) => {
            this.alertService.success(res.data.message);
            this.eventStream.emit(new EmitEvent(Events.GET_EXPENSE_CONFIG, res?.data?.config_uuid));
            // if(this.Router.url.includes('self-configuration')){
            //   // , { queryParams: { config_uuid: res.data.config_uuid, status: 'view' } }
            //   this.router.navigate(['configuration', 'expense-configuration', 'list']);
            // } else{
            //   this.router.navigate(
            //     NavigationPaths.user.expenseConfigurationDetails()?.split('/')?.slice(1),
            //     { queryParams: { config_uuid: res.data.config_uuid, status: 'view' } }
            //   );
            // }
           
          },error: err => {
            this.showError(err);
          }});
      }
  }

  public fillFormWithConfigData(configurationForm: UntypedFormGroup, configurationData: IExpensesConfigurationListItem, fromSelfConfig: boolean = false) {
    let dateFormat = this.storageService.get(StorageKeys.CURRENT_PROGRAM)?.defaultDateFormat;
    const {
      expense_config,
      config_name,
      expense_start_date,
      hierarchy,
      week_end_day
    } = configurationData;
    configurationForm.patchValue({
      header:{
        foundational_data:{
          value: expense_config?.header?.foundational_data?.value ? expense_config?.header?.foundational_data?.value : [],
          is_allow: expense_config?.header?.foundational_data?.is_allow ? expense_config?.header?.foundational_data?.is_allow : false
        }
      },
      exp_amnt_based_on_role: {
        is_enabled: expense_config?.exp_amnt_based_on_role?.is_enabled,
        value: expense_config?.exp_amnt_based_on_role?.value,
      },
      config: {
        is_expense: expense_config.is_expense,
        is_taxable: expense_config.is_taxable
      },
      custom_fields:{
        is_enabled: expense_config?.custom_fields?.is_enabled ?? false,
      },
      project_name: expense_config?.custom_fields?.fields?.length >= 1 ? [...new Set(expense_config?.custom_fields?.fields.map(m => m.type))] : [],
      option_name: [],
      config_name: config_name,
      week_end_day: week_end_day,
      expense_start_date: this.localDatePipe.transform(expense_start_date,dateFormat,null,null,true,DATE_FORMAT?.FORMATYMD),
      incurredSubmissionFrom: {
        count: expense_config.grace_period_submission?.value || 0,
        units: expense_config.grace_period_submission?.type || 'Days'
      },
      removeWorkerAccessFrom: {
        count: (expense_config.remove_worker_access_general?.value
          ? expense_config.remove_worker_access_general?.value : expense_config.remove_worker_access_general) || 0,
        units: expense_config.remove_worker_access_general?.type || 'Days'
      },
      removeVendorAccessFrom: {
        count: (expense_config.remove_vendor_access_general?.value
          ? expense_config.remove_vendor_access_general?.value : expense_config.remove_vendor_access_general) || 0,
        units: expense_config.remove_vendor_access_general?.type || 'Days'
      },
      removeVendorMiscFrom: {
        count: (expense_config.remove_vendor_access_misc?.value
          ? expense_config.remove_vendor_access_misc?.value : expense_config.remove_vendor_access_misc) || 0,
        units: expense_config.remove_vendor_access_misc?.type || 'Days'
      },
      removeMspAccessFrom: {
        count: expense_config.remove_msp_access_general?.value || 0,
        units: expense_config.remove_msp_access_general?.type || 'Days'
      },
      removeMspAccessMiscFrom: {
        count: expense_config.remove_msp_access_misc?.value || 0,
        units: expense_config.remove_msp_access_misc?.type || 'Days'
      },
      account_code: expense_config.custom_fields?.is_enabled && expense_config.custom_fields?.fields[0]?.name ? expense_config.custom_fields?.fields[0].name : null
    });
    if (!fromSelfConfig) {
      configurationForm.patchValue({
        hierarchy_uuid: hierarchy?.map(val => val?.title)?.toString()
      });
    }
    this.customFieldToggle.value = expense_config.custom_fields?.is_enabled ?? false;
  }

  public createForm(startDate: string) : UntypedFormGroup {
    return this.fb.group({
      config: this.fb.group({
        is_expense: [true],
        is_taxable: [true]
      }),
      header: this.fb.group({
        foundational_data: this.fb.group({
          is_allow: [false],
          value: [null],
        }),
      }),
      exp_amnt_based_on_role: this.fb.group({
        is_enabled: [false],
        value: [null],
      }),
      custom_fields: this.fb.group({
        is_enabled: []
      }),
      week_end_day: ['',Validators.required],
      project_name: [''],
      option_name: [null],
      config_name: ['', Validators.required],
      hierarchy_uuid: [[], Validators.required],
      expense_start_date: [startDate, Validators.required],
      incurredSubmissionFrom: this.fb.group({
        count: [null],
        units: [null]
      }),
      removeWorkerAccessFrom: this.fb.group({
        count: [null],
        units: [null]
      }),
      removeVendorAccessFrom: this.fb.group({
        count: [null],
        units: [null]
      }),
      removeVendorMiscFrom: this.fb.group({
        count: [null],
        units: [null]
      }),
      removeMspAccessFrom: this.fb.group({
        count: [null],
        units: [null]
      }),
      removeMspAccessMiscFrom: this.fb.group({
        count: [null],
        units: [null]
      }),
      account_code: [null]
    });
  }

  // private convertDate(unix_timestamp: number): string {
  //   const date = new Date(unix_timestamp * 1000);
  //   const formattedDate =
  //     date.getFullYear() + '-' + ('0' + (date.getMonth() + 1)).slice(-2) + '-' + ('0' + date.getDate()).slice(-2);
  //   return formattedDate;
  // }

  public unsubscribe() {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
  showError(err) {
    window.scrollTo(0, 0);
    let logs:Log = {
      type: LOG_TYPE.ERROR, heading: err?.error?.error?.message ? err?.error?.error?.message : err, messages: [], autoClose: true, isShown: true, showReportButton: (err?.status == 500 || err?.status == 400), additionalInfo: { trace_id: err?.error?.trace_id }
    };
    err?.error?.error?.errors?.forEach(msg => {
      if (msg?.message) {
        logs.messages.push(msg?.message);
      }
    });
    this.eventStream.emit(new EmitEvent(Events.SHOW_EXPENSE_LOGS, logs));
  }

}
