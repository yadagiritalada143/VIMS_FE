import { Component, Injector, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, UntypedFormBuilder, UntypedFormControl, Validators } from '@angular/forms';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { BaseProgramConfigComponent } from '../base/base-program-config.component';
import { ControlType, EnableNotificationType, IProgramConfigurationControl } from '../program-config-control/program-config-control.model';
import * as _ from 'lodash';
import { ProgramService } from 'src/app/programs/program.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { GlobalConstants } from 'src/app/shared/globalconstants';
import { Subscription, forkJoin } from 'rxjs';
import { SortHelperPipe } from 'src/app/shared/pipe/sort-helper.pipe';
import { UniqueKeyPipe } from 'src/app/shared/pipe/unique-key.pipe';
import { DATE_FORMAT } from 'src/app/library/date-format/date-format.model';
import { ProgramConfig } from 'src/app/jobs/job-details/interfaces/ProgramConfig';

@Component({
  selector: 'app-platform-program-config',
  templateUrl: './platform-program-config.component.html',
  styleUrls: ['./platform-program-config.component.scss']
})
export class PlatformProgramConfigComponent extends BaseProgramConfigComponent implements OnInit, OnDestroy {

  private subscriptions: Array <Subscription> = [];

  public programControls: Array <IProgramConfigurationControl> = [];
  public mounted: boolean = false;
  public showEnableNotificationSection: boolean = false;
  programStatus:any;
  programDetails:ProgramConfig;
  onFirtTime: boolean = true;

  public currenciesCodes: Array<{ code: string; description: string }> = [];
  public languageCodes: Array<{ code: string; description: string }> = [];
  public unitsValues: Array<{ code: string; description: string }> = [
    { code: 'daily', description: 'Daily' },
    { code: 'hourly', description: 'Hourly' },
    { code: 'weekly', description: 'Weekly' },
    { code: 'monthly', description: 'Monthly' },
    { code: 'yearly', description: 'Yearly' },
  ];

  public moduleLoader: boolean = true;
  public modulesList: Array <{ code: string; description: string }> = [];

  public timeZoneList: Array<{ code: string; description: string }> = [];
  public userTypes: Array<{ code: any; description: string }> = [
    { code: 'client', description: 'Client' },
    { code: 'msp', description: 'MSP' },
    { code: 'vendor', description: 'Vendor' },
    { code: 'candidate', description: 'Candidate' },
  ];
  public adjustmentCalculatedForm: Array<{ code: any; description: string }> = [
    { code: 'billable_hours', description: 'Billable Hours' },
  ];
  public adjustmentCalculatedTo: Array<{ code: any; description: string }> = [
    { code: 'client_bill_rate', description: 'Total Client Amount' },
    { code: 'vendor_bill_rate', description: 'Total Vendor Amount' }
  ];
  public taxCalculatedForm: Array<{ code: any; description: string }> = [
    { code: 'client_bill_rate', description: 'Client Amount' },
    { code: 'vendor_bill_rate', description: 'Vendor Amount' },
  ];
  public taxCalculatedTo: Array<{ code: any; description: string }> = [
    { code: 'client_bill_rate', description: 'Total Client Amount' },
    { code: 'vendor_bill_rate', description: 'Total Vendor Amount' }
  ];

  public currencyLoader: boolean = true;
  public languageLoader: boolean = false;
  public timezoneLoader: boolean = false;
  public rate_model: Array<{ code: string; description: string }> = [
    { code: 'BILL_RATE', description: 'Bill Rate (No Markup)' },
    { code: 'PAY_RATE', description: 'Pay Rate (Markup)' },
    { code: 'MARKUP', description: 'Bill Rate (Markup)' },
  ];

  public nonEditableCurrencies: Array <string> = [];

  constructor(
    public fb: UntypedFormBuilder,
    protected injector: Injector,
    private storageService: StorageService,
    private programService: ProgramService,
    private alert: AlertService,
    private sortHelper: SortHelperPipe,
    private uniquePipe: UniqueKeyPipe,
  ) {
    super(injector);
  }

  ngOnInit(): void {

    this.createForm();
    this.fetchProgramDetails();
    this.fillConfigData();

    this.formGroup?.get("currencies")?.valueChanges?.subscribe((value: Array <string>) => {

      const currencyForm: AbstractControl = this.formGroup.get('currency');
      if(!value.includes(currencyForm?.value)) {
        currencyForm?.setValue(null);
      }

      this.fillConfigData();
      this.formGroup.get('currency')?.updateValueAndValidity();
    });

    this.formGroup?.get("languages")?.valueChanges?.subscribe((value: Array <string>) => {

      const languageForm: AbstractControl = this.formGroup.get('language');
      if(!value.includes(languageForm?.value)) {
        languageForm?.setValue(null);
      }

      this.fillConfigData();
      this.formGroup.get('language')?.updateValueAndValidity();
    });

    this.currencyLoader = true;
    this.programService.get('/configurator/resources/currencies?limit=100')
    .subscribe({
      next: (res: any) => {
        if(res?.currencies) {
          this.currencyLoader = false;
          this.currenciesCodes = res?.currencies?.map((entry: any) => {
            return {
              code: entry?.code,
              description: `${entry?.label} (${entry?.symbol})`
            };
          }) ?? [];

          // Remove entries not found in Currency API
          let selectedCurrencies: Array <string> = this.formGroup?.get('currencies')?.value || [];
          this.formGroup.patchValue({
            currencies: selectedCurrencies.filter((curr: string) => {
              return this.currenciesCodes.find((entry: any) => (entry?.code === curr));
            })
          });

          this.fillConfigData();
        }
      }, error: (err: any) => {
        this.currencyLoader = false;
        this.alert.error(errorHandler(err));
      }
    });

    this.languageLoader = true;
    this.programService.get('/configurator/resources/languages')
    .subscribe({
      next: (res: any) => {
        if(res?.languages) {
          this.languageLoader = false;
          this.languageCodes = res?.languages?.map((entry: any) => {
            return {
              code: entry?.code,
              description: entry?.name
            };
          }) ?? [];

          // Remove entries not found in Languages API
          let selectedLanguages: Array <string> = this.formGroup?.get('languages')?.value || [];
          this.formGroup.patchValue({
            languages: selectedLanguages.filter((lang: string) => {
              return this.languageCodes.find((entry: any) => (entry?.code === lang));
            })
          });

          this.fillConfigData();
        }
      }, error: (err: any) => {
        this.languageLoader = false;
        this.alert.error(errorHandler(err));
      }
    });

    this.timezoneLoader = true;
    this.programService.get('/configurator/resources/time_zones')
    .subscribe({
      next: (res: any) => {
        if(res?.time_zones) {
          this.timezoneLoader = false;
          this.timeZoneList = res?.time_zones?.map((entry: any) => {
            return {
              code: entry?.code?.trim(),
              description: entry?.name?.trim()
            }
          }) ?? [];
          this.timeZoneList = this.uniquePipe.transform(this.timeZoneList, 'code');
          this.fillConfigData();
        }
      }, error: (err: any) => {
        this.timezoneLoader = false;
        this.alert.error(errorHandler(err));
      }
    });

    this.moduleLoader = true;
    let url: string = `/configurator/programs/${this.programId}/modules?limit=100&exclude_if_no_event=true`;
    this.programService.get(url)
    .subscribe({
      next: (res: any) => {
        this.moduleLoader = false;
        if(Array.isArray(res?.modules)) {

          this.modulesList = res.modules.map((entry: any) => {
            return {
              code: entry?.code,
              description: entry?.name ?? ''
            };
          });

          this.modulesList = this.uniquePipe.transform(this.modulesList, 'code');
          this.modulesList = this.sortHelper.transform(this.modulesList, 'description');
        }
      }, error: (err: any) => {
        this.moduleLoader = false;
        this.alert.error(errorHandler(err));
      }
    });

    this.fillConfigData();
    this.formGroup.get("hide_fee").valueChanges.subscribe(whitelistCurrentValue => {
      this.checkHideFees();
    });
    this.formGroup.get("enable_notification").valueChanges.subscribe(whitelistCurrentValue => {
      this.checkHideModules();
      if (!this.onFirtTime) {
        this.setEnableNotificationDetails();
      } else {
        this.onFirtTime = false;
      }
    });
    this.formGroup.get("is_custom_tax_on_assignment").valueChanges.subscribe(taxConfigurationValue => {
      this.checkHideTax();
    });
    this.formGroup.get("is_adjustment_fee_allowed").valueChanges.subscribe(taxConfigurationValue => {
      this.checkHideAdjustmentConfig();
    });

    this.checkCurrencyUsage();
  }

  fetchProgramDetails() {
    this.programService.fetchProgramDetails(this.programId).subscribe({
      next:(res:any) => {
        this.programDetails = res?.payload?.program;
        this.programDetails.module_configs.sort((a, b) => {
          const subModuleA = a.module.sub_module;
          const subModuleB = b.module.sub_module;
          return subModuleA.localeCompare(subModuleB);
        });
        if(!!this.programDetails) {
          this.formGroup.get('enable_notification').setValue(this.programDetails?.is_enabled);
          this.getCurrentProgram();
        }
      },
    })
  }
  setEnableNotificationDetails(){
    if(this.programDetails) {
      const moduleConfig = this.programDetails?.module_configs?.map((val)=>{
        return {
          sub_module_slug : val?.module?.sub_module_slug,
          status : val?.is_enabled
        } 
      })
      const payload = {
        program_status:  this.formGroup?.get("enable_notification")?.value,
        module_status:  moduleConfig
      }
      this.programService?.setEnableNotificationDetails?.next(payload); 
    }
  }
  setProgramConfig = () => {
    if (!this.mounted) {
      this.mounted = true;
      this.patchValue(_.cloneDeep(this.data?.value));
    }
    this.data.value = this.formGroup.value;
  }

  checkHideFees() {
    let index = this.programControls?.findIndex(x => x?.formControlName === "hide_fee_user_types");
    if (this.formGroup?.get("hide_fee")?.value) {
      this.programControls[index].isSelected = true;
    } else {
      this.programControls[index].isSelected = false;
    }
  }

  checkHideModules() {
    let index = this.programControls?.findIndex(x => x?.formControlName === EnableNotificationType.MODULES.toLowerCase());
    if (this.formGroup?.get("enable_notification")?.value) {
      this.programControls[index].isSelected = true;
    } else {
      this.programControls[index].isSelected = false;
    }
  }
  hideModulesSection() {
    let index = this.programControls?.findIndex(x => x?.formControlName === EnableNotificationType.MODULES.toLowerCase());
    this.programControls[index].isSelected = false;
    this.formGroup?.get("enable_notification")?.setValue(false);
  }
  checkHideTax() {
    let tax_calculated_on = this.programControls?.findIndex(x => x?.formControlName === "tax_calculated_on");
    let tax_calculated_to = this.programControls?.findIndex(x => x?.formControlName === "tax_applicable_on");
    if (this.formGroup?.get("is_custom_tax_on_assignment")?.value) {
      this.programControls[tax_calculated_on].isSelected = true;
      this.programControls[tax_calculated_to].isSelected = true;
    } else {
      const taxClac: AbstractControl = this.formGroup.get('tax_calculated_on');
      const taxApply: AbstractControl = this.formGroup.get('tax_applicable_on');
      taxApply?.setValue(null)
      taxClac?.setValue(null)
      this.programControls[tax_calculated_on].isSelected = false;
      this.programControls[tax_calculated_to].isSelected = false;
    }
  }
  checkHideAdjustmentConfig() {
    let adjustment_fee_calculated_on = this.programControls?.findIndex(x => x?.formControlName === "adjustment_fee_calculated_on");
    let adjustment_fee_applicable_on = this.programControls?.findIndex(x => x?.formControlName === "adjustment_fee_applicable_on");
    if (this.formGroup?.get("is_adjustment_fee_allowed")?.value) {
      this.programControls[adjustment_fee_calculated_on].isSelected = true;
      this.programControls[adjustment_fee_applicable_on].isSelected = true;
    } else {
      const adjus: AbstractControl = this.formGroup.get('adjustment_fee_calculated_on');
      const adjApply: AbstractControl = this.formGroup.get('adjustment_fee_applicable_on');
      adjApply?.setValue(null)
      adjus?.setValue(null)
      this.programControls[adjustment_fee_calculated_on].isSelected = false;
      this.programControls[adjustment_fee_applicable_on].isSelected = false;
    }
  }
  fillConfigData = () => {

    this.programControls = [];
    this.programControls.push(
      {
        isSelected: true,
        title: "ENABLED SETTINGS",
        subtitle: "Currencies",
        description: "Select which currencies are available to be used for this Program. The currencies selected here will then be available for configuration in such admin objects as Rate Cards. In addition, if currency(s) are NOT associated to Work Locations, then the picklist options which display under the 'Currency' field at the Job and Quick Assignment creation will appear based on what has been configured here.",
        type: ControlType.MULTISELECTDROPDOWN,
        formControlName: "currencies",
        dropDrownData: this.currenciesCodes,
        placeholderText: 'Select Currencies',
        loading: this.currencyLoader,
        disabled: false,
        isRequired: true,
        nonEditable: this.currencyUsed?this.nonEditableCurrencies:[]
      },
      {
        isSelected: true,
        subtitle: "Languages",
        description: "Select the languages that are available for this Program.",
        type: ControlType.MULTISELECTDROPDOWN,
        formControlName: "languages",
        dropDrownData: this.languageCodes,
        placeholderText: 'Select Languages',
        loading: this.languageLoader,
        isRequired: true
      },
      {
        isSelected: true,
        subtitle: "Units of Measure",
        description: "Select which units of measure are available to be used for this Program.  The unit(s) of measure selected here will then be available for configuration in such admin objects as Rate Cards.",
        type: ControlType.MULTISELECTDROPDOWN,
        formControlName: "units_of_measures",
        dropDrownData: this.unitsValues
      },
      {
        isSelected: true,
        title: "DEFAULT SETTINGS",
        subtitle: "Default Currency",
        description: "The currency selected here will be the default value when a new user is added.  This is a single-value picklist where the user can only select from the currencies which have been enabled in the ENABLED SETTINGS section above.",
        type: ControlType.DROPDOWN,
        formControlName: "currency",
        isRequired: true,
        dropDrownData: Object.values(this.formGroup.get('currencies')?.value ?? [])?.map((entry: string) => {
          return {
            code: entry,
            description: this.currenciesCodes.find((val: any) => val?.code === entry)?.description ?? entry
          }
        })
      },
      {
        isSelected: true,
        subtitle: "Default Language",
        description: "The language selected here will be the default value when a new user is added.  This is a single-value picklist where the user can only select from the languages which have been enabled in the ENABLED SETTINGS section above.",
        type: ControlType.DROPDOWN,
        isRequired: true,
        formControlName: "language",
        dropDrownData: Object.values(this.formGroup.get('languages')?.value ?? [])?.map((entry: string) => {
          return {
            code: entry,
            description: this.languageCodes.find((val: any) => val?.code === entry)?.description ?? entry
          }
        })
      },
      {
        isSelected: true,
        subtitle: "Default Date Format",
        description: "The date format selected here will be the default value when a new user is added.",
        type: ControlType.DROPDOWN,
        isRequired: true,
        formControlName: "date_format",
        dropDrownData: GlobalConstants?.defaultDateFormat?.filter((dates: string) => dates == DATE_FORMAT.FORMATMDY || dates == DATE_FORMAT.FORMATDDMMYY || dates == DATE_FORMAT.FORMATYYMMDD)
      },
      {
        isSelected: true,
        subtitle: "Default Time Zone",
        description: "The time zone selected here will be the default value when a new user is added.",
        type: ControlType.DROPDOWN,
        formControlName: "time_zone",
        dropDrownData: this.timeZoneList,
        loading: this.timezoneLoader,
        sortNotRequired: true,
        isRequired: true
      },
      {
        isSelected: true,
        subtitle: "Vendor Neutral Program",
        description: "Enabling this setting will allow the Program Team to operate a vendor neutral program.  From a systematic perspective, when a program is identified as vendor neutral it means a) supplier names will be hidden from client managers during the sourcing process, and b) manager/interviewer names will be hidden from suppliers during the sourcing process.",
        type: ControlType.TOGGLE,
        formControlName: "is_vendor_neutral"
      },
      {
        isSelected: true,
        subtitle: "Rate Model for Program",
        description: "The application will first pick up the 'Rate Model' at the Hierarchy level.  However, the Rate Model field is optional at the Hierarchy . In the event it is NOT defined at a Hierarchy then the system will pick up the option selected here at the Program level.",
        type: ControlType.DROPDOWN,
        formControlName: "program_model",
        dropDrownData: this.rate_model
      },
      {
        isSelected: true,
        subtitle: "Hide Suffix Prefix",
        description: "When enabled, the system will hide the 'Prefix' and 'Suffix' fields on create/edit/view candidate, user profile, and other available impacted modules within the UI.",
        type: ControlType.TOGGLE,
        formControlName: "hide_suffix_prefix"
      },
      {
        isSelected: true,
        subtitle: "Financial Authority Chain Ends with Admin Approval",
        description: "When enabled, the system doesn't require further approvals in the financial authority chain once approved by a client admin.  Otherwise the system will trigger approval workflow up to defined approver.",
        type: ControlType.TOGGLE,
        formControlName: "financial_auth_chain_switch_superadmin"
      },
      {
        isSelected: true,
        subtitle: "Display Only Root Hierarchy During Job or Quick Assignment Creation",
        description: "When enabled, during Job or Quick Assignment creation the system will only show the root Hierarchy while all child and sub-child will be hidden.",
        type: ControlType.TOGGLE,
        formControlName: "default_to_root_hierarchy"
      },
      {
        isSelected: true,
        subtitle: "Hide Fees on Assignment",
        description: "When enabled, the system will hide the 'Fees' section on assignments for the user types selected below.",
        type: ControlType.TOGGLE,
        formControlName: "hide_fee"
      },
      {
        isSelected: true,
        directoryIcon: true,
        subtitle: "User Types to Hide Fees",
        description: "Select which User Type(s) you would like to have the 'Fees' section on assignments hidden from.",
        type: ControlType.MULTISELECTDROPDOWN,
        formControlName: "hide_fee_user_types",
        dropDrownData: this.userTypes,
        placeholderText: 'Select User'
      },
      {
        isSelected: true,
        subtitle: "Restrict Delegation by Hierarchy",
        description: "When enabled, the system will restrict the Delegates based on Hierarchy.",
        type: ControlType.TOGGLE,
        formControlName: "restrict_delegation_by_hierarchy"
      },
      {
        isSelected: true,
        subtitle: "Accuracy Configuration",
        description: "When enabled, the “Accuracy Configuration” admin object will be available to configure detailed settings around decimals and rounding for additional accuracy.  If this setting is not enabled, the system will use 4 decimal places when creating/editing a record and 2 decimal places when viewing a record.",
        type: ControlType.TOGGLE,
        formControlName: "accuracy_config",
      },
      {
        isSelected: true,
        subtitle: "Markup by Rate Type",
        description: "When enabled, the system will allow for different Markup percentages to be applied for each billable Rate Type.  As an example, the Markup for Standard Time can be 30%, but Over Time can be 20%, and Double Time can be 15%.  Note that with this setting enabled, the system will calculate each Rate Type independently when determining the Bill Rate versus using the Bill Rate Factor from the Standard Time Rate.  Also note that the permission \"Manage Markup by Rate Type\" should be enabled for users to edit Markups on transactional records.",
        type: ControlType.TOGGLE,
        formControlName: 'markup_by_rate_type',
      },
      {
        isSelected: true,
        subtitle: "Cost Component",
        description: "When enabled, the program can set up Cost Components to determine the overall Bill Rate.  Cost Components build on to the Pay Rate based on the value and level setup of Cost Component Group configuration.  The ‘Rule Builder’ can then associate Cost Component Groups to other criteria like Rate Types, Vendors, Work Locations, etc.",
        type: ControlType.TOGGLE,
        formControlName: 'cost_component',
      },
      {
        isSelected: true,
        subtitle: "Modules using Flow System",
        description: "Select the modules where workflows will be activated.",
        type: ControlType.MULTISELECTDROPDOWN,
        formControlName: "modules_using_flow_system",
        dropDrownData: this.modulesList,
        placeholderText: 'Select Modules',
        loading: this.moduleLoader,
      },
      {
        isSelected: true,
        subtitle: "Support Email",
        description: "Email queries for this program entered on the 'Contact Us' page, will be directed to this email",
        type: ControlType.TEXTBOX,
        formControlName: "email",
        placeholderText: 'Enter your email address.',
        isRequired: true,
      },
      {
        isSelected: true,
        subtitle: 'Session Time',
        description: 'When user is inactive in the application, system logs out user based on the defined Session Time. The format of this setting is HH: MM.',
        type: ControlType.TIMER,
        formControlName: 'session_timeout',
        isRequired: true,
        timerMin: 2
      },
      {
        isSelected: true,
        subtitle: "Manage Taxes",
        description: "When enabled, the program can configure how tax is to be managed throughout the application.",
        type: ControlType.TOGGLE,
        formControlName: "is_custom_tax_on_assignment"
      },
      {
        isSelected: true,
        directoryIcon: true,
        subtitle: "Tax Calculated From",
        description: "Select the amount from which 'Tax' is calculated from.",
        type: ControlType.DROPDOWN,
        formControlName: "tax_calculated_on",
        dropDrownData: this.taxCalculatedForm,
        placeholderText: 'Select',
        isRequired: true
      },
      {
        isSelected: true,
        directoryIcon: true,
        subtitle: "Tax Applies To",
        description: "Select the amount on which 'Tax' is applied to.",
        type: ControlType.DROPDOWN,
        formControlName: "tax_applicable_on",
        dropDrownData: this.taxCalculatedTo,
        placeholderText: 'Select',
        isRequired: true
      },
      {
        isSelected: true,
        subtitle: "Manage Adjustments",
        description: "When enabled, the program can configure how adjustment is to be managed throughout the application.",
        type: ControlType.TOGGLE,
        formControlName: "is_adjustment_fee_allowed"
      },
      {
        isSelected: true,
        directoryIcon: true,
        subtitle: "Adjustment Calculated From",
        description: "Select the amount from which “Adjustment” is calculated from.",
        type: ControlType.DROPDOWN,
        formControlName: "adjustment_fee_calculated_on",
        dropDrownData: this.adjustmentCalculatedForm,
        placeholderText: 'Select',
        isRequired: true
      },
      {
        isSelected: true,
        directoryIcon: true,
        subtitle: "Adjustment Applies to",
        description: "Select the amount on which “Adjustment” is applied to.",
        type: ControlType.DROPDOWN,
        formControlName: "adjustment_fee_applicable_on",
        dropDrownData: this.adjustmentCalculatedTo,
        placeholderText: 'Select',
        isRequired: true
      },
      {
        isSelected: true,
        subtitle:'Enable Notification Engine',
        description: 'When enabled, the notification engine will be turned on for this program. Alternatively, the notification engine can be turned off by disabling this setting. Note that notifications will not be sent during the duration this setting is disabled nor can notifications be retriggered retroactively.',
        type: ControlType.TOGGLE,
        formControlName: 'enable_notification',
      },
      {
        isSelected: true,
        directoryIcon: true,
        subtitle: "Modules",
        description: "When enabled this setting, notification engine will be turned on for the below selected modules.",
        formControlName: "modules",
      },
      {
        isSelected: true,
        type: ControlType.TOGGLE,
        subtitle: 'Allow Impersonation of Inactive Users',
        formControlName: 'inactive_impersonation_enabled',
        description: "When enabled, the system would allow for users with “Allow impersonation” user role permission to impersonate an inactive user."
      }, 
      {
        isRequired: true,
        directoryIcon: true,
        errorText: 'Threshold value cannot be less than 1',
        isSelected: this.formGroup?.get('inactive_impersonation_enabled')?.value,
        subtitle: 'Threshold to Impersonate Inactive Users',
        selectedValue: this.getInactiveImpersonationType(this.inactivitySeconds),
        description: 'The system allows impersonation of inactive users based on the threshold limit defined from the moment the user was inactivated.',
        formControlName: 'inactive_impersonation_duration',
        type: ControlType.NUMBERSELECTOPTION,
        dropDrownData: [
          { code: 'HOUR', name: 'Hours' },
          { code: 'DAY', name: 'Days' },
          { code: 'WEEK', name: 'Weeks' },
          { code: 'MONTH', name: 'Months' },
        ]
      }
    );

    this.checkHideFees();
    this.checkHideModules();
    this.checkHideAdjustmentConfig();
    this.checkHideTax();

  };

  createForm() {
    this.formGroup = this.fb.group({
      'currencies': new UntypedFormControl(),
      'languages': new UntypedFormControl(),
      'units_of_measures': new UntypedFormControl(),
      'currency': new UntypedFormControl(null ,[Validators.required]),
      'language': new UntypedFormControl(null, [Validators.required]),
      'date_format': new UntypedFormControl(null, [Validators.required]),
      'time_zone': new UntypedFormControl(null, [Validators.required]),
      'is_vendor_neutral': new UntypedFormControl([Validators.required]),
      'program_model': new UntypedFormControl(),
      'hide_suffix_prefix': new UntypedFormControl([Validators.required]),
      'financial_auth_chain_switch_superadmin': new UntypedFormControl([Validators.required]),
      'default_to_root_hierarchy': new UntypedFormControl([Validators.required]),
      'is_adjustment_fee_allowed': new UntypedFormControl(),
      'adjustment_fee_calculated_on': new UntypedFormControl(),
      'adjustment_fee_applicable_on': new UntypedFormControl(),
      'is_custom_tax_on_assignment': new UntypedFormControl(),
      'tax_calculated_on': new UntypedFormControl(),
      'tax_applicable_on': new UntypedFormControl(),
      'hide_fee': new UntypedFormControl([Validators.required]),
      'hide_fee_user_types': new UntypedFormControl(),
      'enable_notification': new UntypedFormControl([Validators.required]),
      'modules': new UntypedFormControl(),
      'restrict_delegation_by_hierarchy': new UntypedFormControl([Validators.required]),
      'accuracy_config': new UntypedFormControl([Validators.required]),
      'modules_using_flow_system': new UntypedFormControl(),
      'email' : new UntypedFormControl('', [Validators.required]),
      'session_timeout': new UntypedFormControl('', [Validators.required]),
      'markup_by_rate_type': new UntypedFormControl(false, [Validators.required]),
      'cost_component': new UntypedFormControl(false, [Validators.required]),
      'inactive_impersonation_enabled': new UntypedFormControl(false, [Validators.required]),
      'inactive_impersonation_duration': new UntypedFormControl(null),
      'inactive_impersonation_type': new UntypedFormControl(null)
    });

    // Inactive Impersonation (listener)
    this.subscriptions.push(
      this.formGroup
        .get('inactive_impersonation_enabled')
        .valueChanges.subscribe((val: boolean) => {
          this.toggleImpersonationSelector(val);
        })
    );
  }

  patchValue(data: any) {
    if (data) {
      let { currencies, languages, units_of_measures, currency, language, date_format,
        time_zone, is_vendor_neutral, program_model, hide_suffix_prefix,
        financial_auth_chain_switch_superadmin, default_to_root_hierarchy, hide_fee,
        is_custom_tax_on_assignment, tax_calculated_on, tax_applicable_on, is_adjustment_fee_allowed, adjustment_fee_calculated_on, adjustment_fee_applicable_on,
        hide_fee_user_types, modules_using_flow_system, email,
        restrict_delegation_by_hierarchy,
        accuracy_config, session_timeout,
        markup_by_rate_type, cost_component,
        inactive_impersonation_duration, inactive_impersonation_enabled 
      } = data;
       
      if(!!currencies) {

        if(!Array.isArray(currencies)) {
          currencies = [...Object.values(currencies ?? {})];
        }

        this.nonEditableCurrencies = currencies;
        if(!currencies.includes(currency)) {
          currency = null;
        }
      }

        if(hide_fee_user_types && Object.keys(hide_fee_user_types).length > 0) {
          hide_fee_user_types = [...Object.keys(hide_fee_user_types ?? {}).filter((key) => {
            return hide_fee_user_types[key];
          })];
        }

      if(!!languages) {

        if(!Array.isArray(languages)) {
          languages = [...Object.values(languages ?? {})];
        }

        if(!languages.includes(language)) {
          language = null;
        }
      }

      date_format = date_format?.toUpperCase() ?? '';
      if(!GlobalConstants?.defaultDateFormat?.includes(date_format)) {
        date_format = null;
      }

      this.unitsValues = [...Object.keys(units_of_measures ?? [])].map((unit: string) => {
        return {
          code: unit,
          description: unit?.toUpperCase()
        };
      });

      units_of_measures = [...Object.keys(units_of_measures ?? [])].filter((unit: string) => {
        return units_of_measures[unit];
      });

      this.formGroup.patchValue({
        currencies, languages, units_of_measures, currency,
        language, date_format, time_zone, is_vendor_neutral, program_model,
        hide_suffix_prefix, financial_auth_chain_switch_superadmin,
        default_to_root_hierarchy, hide_fee, hide_fee_user_types,
        is_custom_tax_on_assignment, tax_calculated_on, tax_applicable_on, is_adjustment_fee_allowed, adjustment_fee_calculated_on, adjustment_fee_applicable_on,
        accuracy_config, modules_using_flow_system, email, markup_by_rate_type, cost_component,
        restrict_delegation_by_hierarchy, session_timeout: this.minutesToTimer(session_timeout),
        inactive_impersonation_enabled
      });

      // Initialize inactive impersonation duration
      setTimeout(() => {
        if(inactive_impersonation_enabled) {
          this.toggleImpersonationSelector(true);
          this.formGroup.patchValue({
            inactive_impersonation_duration: this.getInactiveImpersonationDuration(inactive_impersonation_duration),
            inactive_impersonation_type: this.getInactiveImpersonationType(inactive_impersonation_duration)
          });
  
          let durationControl: IProgramConfigurationControl = this.programControls.find((entry: any) => {
            return (entry?.formControlName === 'inactive_impersonation_duration');
          });

          if(durationControl) {
            durationControl.selectedValue = this.getInactiveImpersonationType(inactive_impersonation_duration);
          }
        }
      }, 2000);

      this.fillConfigData();
    }
  }

  private currencyUsed: boolean = true;
  checkCurrencyUsage() {

    forkJoin([
      this.programService.get(`/job-manager/programs/${this.programId}/jobs`),
      this.programService.get(`/assignment/programs/${this.programId}/assignment`),
      this.programService.get(`/sow/programs/${this.programId}/sow_list`)
    ]).subscribe({
      next: (res: any) => {
        if(Array.isArray(res)) {

          let jobCount: number = res?.[0]?.total_records;
          let assignmentCount: number = res?.[1]?.data?.total_records;
          let sowCount: number = res?.[2]?.count;

          this.currencyUsed = !!(jobCount + assignmentCount + sowCount);
          this.fillConfigData();
        }
      }, error: (err: any) => {
        this.currencyUsed = true;
        console.error(err);
      }
    });
  }

  getCurrentProgram() {
    let currentProgram = this.storageService.get('CurrentProgram');
    if(!currentProgram) {
      this.programService.fetchCurrentProgram(this.programId).subscribe((res:any) => {
        currentProgram = res?.program;
        this.getEnableNotificationDetails(currentProgram);
      })
    }else{
        this.getEnableNotificationDetails(currentProgram);
    }
  }

  getEnableNotificationDetails(currentProgram){
    const jNotify = currentProgram?.config?.notifications?.switch_to_jnotify
    for (const key in jNotify) {
      if (jNotify.hasOwnProperty(key) && jNotify[key] === true) {
        this.showEnableNotificationSection = true;
        this.setEnableNotificationDetails()
        break;
      }
    }
  }

  private minutesToTimer(timer: any) {
    timer = timer/60;
    let hours: string = Number.parseInt((timer/60) + '') + '';
    while(hours.length < 2) {
      hours = '0' + hours;
    }

    let minutes: string = Number.parseInt((timer%60) + '') + '';
    while(minutes.length < 2) {
      minutes = '0' + minutes;
    }

    return (hours + ':' + minutes);
  }

  get ControlType() {
    return ControlType;
  }

  get getPreferedTimezone() {
    return this.storageService.get('account')?.preferred_time_zone;
  }

  get programId() {
    return this.storageService.get(StorageKeys.PROGRAM_ID);
  }

  changeNumberSelectOption(evt: any, config: any) {
    if(config?.formControlName === "inactive_impersonation_duration") {
      this.formGroup?.get('inactive_impersonation_type')?.setValue(evt);
    }
  }

  private getInactiveImpersonationDuration(duration: number) {
    if(duration === 0) {
      return null;
    }

    if(Number.parseInt('' + duration/(3600*24*30)) !== 0 && Number.parseInt('' + duration%(3600*24*30)) === 0) {
      return Number.parseInt('' + duration/(3600*24*30));
    }

    if(Number.parseInt('' + duration/(3600*24*7)) !== 0 && Number.parseInt('' + duration%(3600*24*7)) === 0) {
      return Number.parseInt('' + duration/(3600*24*7));
    }

    if(Number.parseInt('' + duration/(3600*24)) !== 0 && Number.parseInt('' + duration%(3600*24)) === 0) {
      return Number.parseInt('' + duration/(3600*24));
    }

    return Number.parseInt('' + duration/3600);
  }

  private getInactiveImpersonationType(duration: number) {
    if(duration === 0) {
      return null;
    }

    if(Number.parseInt('' + duration/(3600*24*30)) !== 0 && Number.parseInt('' + duration%(3600*24*30)) === 0) {
      return 'MONTH';
    }

    if(Number.parseInt('' + duration/(3600*24*7)) !== 0 && Number.parseInt('' + duration%(3600*24*7)) === 0) {
      return 'WEEK';
    }

    if(Number.parseInt('' + duration/(3600*24)) !== 0 && Number.parseInt('' + duration%(3600*24)) === 0) {
      return 'DAY';
    }

    return 'HOUR';
  }

  private toggleImpersonationSelector(val: boolean) {
    let impersonationSelectorObject: any = this.programControls.find((entry: any) => {
      return (entry?.formControlName === 'inactive_impersonation_duration');
    });

    if (impersonationSelectorObject) {
      impersonationSelectorObject.isSelected = val;

      const formControlOne: AbstractControl = this.formGroup.get('inactive_impersonation_duration');
      const formControlTwo: AbstractControl = this.formGroup.get('inactive_impersonation_type');

      if (val) {
        formControlOne.setValidators([Validators.required, Validators.min(1)]);
        formControlTwo.setValidators(Validators.required);
      } else {
        formControlOne.clearValidators();
        formControlOne.updateValueAndValidity();
        formControlTwo.clearValidators();
        formControlTwo.updateValueAndValidity();
      }
    }
  }

  get inactivitySeconds(): number {

    let result: number = this.formGroup?.get('inactive_impersonation_duration')?.value;
    let type: string = this.formGroup?.get('inactive_impersonation_type')?.value;
    switch(type) {
      case 'HOUR':
        result *= 3600;
        break;
      case 'DAY':
        result *= (3600*24);
        break;
      case 'WEEK':
        result *= (3600*24*7);
        break;
      case 'MONTH':
        result *= (3600*24*30);
        break;
    }

    return result;
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub: Subscription) => {
      sub?.unsubscribe();
    });
  }
}
