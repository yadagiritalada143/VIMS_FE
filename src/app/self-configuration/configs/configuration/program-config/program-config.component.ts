import { Component, OnDestroy, OnInit } from '@angular/core';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { CandidateProgramConfigComponent } from './candidate-program-config/candidate-program-config.component';
import { JobProgramConfigComponent } from './job-program-config/job-program-config.component';
import { OfferProgramConfigComponent } from './offer-program-config/offer-program-config.component';
import { IProgramConfiguration } from './program-config-model';
import { ProgramConfigService } from './service/program-config.service';
import { NotificationProgramConfigComponent } from './notification-program-config/notification-program-config.component';
import { SubmissionProgramConfigComponent } from './submission-program-config/submission-program-config.component';
import { InterviewConfigComponent } from './interview-config/interview-config.component';
import * as _ from 'lodash';
import { ProgramService } from 'src/app/programs/program.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { AuthorizationService } from 'src/app/core/services/authorize.service';
import { FeaturesConfigComponent } from './features-config/features-config.component';
import { PlatformProgramConfigComponent } from './platform-program-config/platform-program-config.component';
import DataParser from 'src/app/shared/util/data-parser';
import { AccessControlService } from 'src/app/core/services/access-control.service';
import { DATE_FORMAT } from 'src/app/library/date-format/date-format.model';
import { EmailService } from 'src/app/shared/service/email.service';
import { TimeSheetAndExpenseComponent } from './time-sheet-and-expense/time-sheet-and-expense.component';
import { EmitEvent, EventStreamService, Events } from 'src/app/core/services/event-stream.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-program-config',
  templateUrl: './program-config.component.html',
  styleUrls: ['./program-config.component.scss'],
})
export class ProgramConfigComponent implements OnInit, OnDestroy {

  public currentActiveTab: number = 0;
  public programConfiguration: Array<IProgramConfiguration> = [];
  public readOnly: boolean = true;
  public enableNotificationDetails: any;
  public emailPattern = /^[A-Za-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/;
  public subscription: Subscription;
  // public tenureData : any = [];

  constructor(
    private programConfigService: ProgramConfigService,
    private localStorage: StorageService,
    private program: ProgramService,
    private alert: AlertService,
    private loader: LoaderService,
    private authService: AuthorizationService,
    private accessService: AccessControlService,
    private programService: ProgramService,
    private emailService: EmailService,
    private eventStream: EventStreamService
  ) { }

  ngOnInit(): void {
    // this.getTenures();
    this.currentActiveTab = 0;
    this.subscription = this.program.enableNotificationDetails.subscribe(data => this.enableNotificationDetails = data)

    // Fetch latest config state
    this.loader.show();
    let url: string = `/configurator/programs/${this.programId}`;
    this.programService.get(url).subscribe({
      next: (data: any) => {
        this.loader.hide();
        if (data?.program?.config) {

          const program: any = data.program;
          // Default currency edge case
          let supported_currencies: Array <string> = program.config?.billing?.supported_currencies ?? [];
          let defaultCurrency: string = program.config?.billing?.default_currency ?? null;
          if(!supported_currencies.includes(defaultCurrency) && ('default_currency' in (program.config?.billing ?? {}))) {
            program.config.billing.default_currency = null;
          }

          // Default language edge case
          let supported_languages: Array <string> = program.config?.localization?.supported_languages ?? [];
          let defaultLangage: string = program.config?.localization?.default_language ?? null;
          if(!supported_languages.includes(defaultLangage) && ('default_language' in (program.config?.localization ?? {}))) {
            program.config.localization.default_language = null;
          }

          this.currentProgram = _.mergeWith(this.currentProgram, {
            config: data?.program?.config
          }, (oldValue: any, newValue: any) => {
            if(_.isArray(oldValue)) {
              return newValue;
            }
          });

          this.fillConfigTabs();
          this.setActiveTab();
        }
      }, error: (err: Error | any) => {
        this.loader.hide();
        this.alert.error(errorHandler(err));
      }
    });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  toggleMode() {
    if(this.readOnly) {
      this.readOnly = false;
    } else {

      if(this.isFormInvalid) {
        this.alert.error('Please fill all the required fields correctly!');
        return;
      }

      this.onSave();
    }
  }

  get isFeesHide() {
    const hide_fees: any = this.currentProgram?.config?.hide_fees;
    if (Array.isArray(hide_fees)) {
      return Boolean(hide_fees.length);
    }

    return (this.currentProgram?.config?.hide_fees?.msp || this.currentProgram?.config?.hide_fees?.vendor || this.currentProgram?.config?.hide_fees?.client || this.currentProgram?.config?.hide_fees?.candidate);
  }

  getJobData(config : any) {
    // config.consecutive_employment_span = this.tenureData?.consecutive_employment_span
    // config.consecutive_employment_span_unit = this.tenureData?.consecutive_employment_span_unit
    // config.max_job_duration = this.tenureData?.is_enabled
    return config;
  }

  get getPlatformData() {
    return {
      currencies: this.currentProgram.config?.billing?.supported_currencies ?? [],
      languages: this.currentProgram.config?.localization?.supported_languages ?? [],
      units_of_measures: this.currentProgram.config?.unit_of_measures ?? [],
      currency: this.currentProgram.config?.billing?.default_currency ?? null,
      language: this.currentProgram.config?.localization?.default_language ?? null,
      date_format: this.currentProgram.config?.preferred_date_format ?? null,
      // time_zone: this.currentProgram.config?.localization?.program_preferred_timezones ?? null,
      time_zone: this.currentProgram.config?.localization?.time_zone ?? null,
      is_vendor_neutral: this.currentProgram.config?.is_vendor_neutral ?? false,
      program_model: this.currentProgram.config?.program_model ?? null,
      hide_suffix_prefix: this.currentProgram.config?.hide_suffix_prefix ?? false,
      financial_auth_chain_switch_superadmin: this.currentProgram?.config?.financial_auth_chain_switch_superadmin ?? false,
      default_to_root_hierarchy: this.currentProgram?.config?.job?.default_to_root_hierarchy ?? false,
      hide_fee: this.isFeesHide ?? false,
      hide_fee_user_types: this.currentProgram?.config?.hide_fees ?? { msp: false, client: false, vendor: false, candidate: false },
      modules_using_flow_system: this.currentProgram?.config?.modules_using_flow_system ?? [],
      accuracy_config: this.currentProgram?.config?.accuracy_config ?? false,
      restrict_delegation_by_hierarchy:this.currentProgram?.config?.restrict_delegation_by_hierarchy,
      email : this.currentProgram?.config?.email,
      session_timeout: this.currentProgram?.config?.session_timeout || 120,
      markup_by_rate_type: this.currentProgram?.config?.markup_by_rate_type || false,
      cost_component: this.currentProgram?.config?.cost_component || false,
      is_adjustment_fee_allowed: this.currentProgram?.config?.is_adjustment_fee_allowed || false,
      adjustment_fee_applicable_on: this.currentProgram?.config?.adjustment_fee_applicable_on || null,
      adjustment_fee_calculated_on: this.currentProgram?.config?.adjustment_fee_calculated_on || null,
      is_custom_tax_on_assignment: this.currentProgram?.config?.is_custom_tax_on_assignment || false,
      tax_applicable_on: this.currentProgram?.config?.tax_applicable_on || null,
      tax_calculated_on: this.currentProgram?.config?.tax_calculated_on || null,
      inactive_impersonation_enabled: this.currentProgram?.config?.inactive_impersonation?.enabled || false,
      inactive_impersonation_duration: this.currentProgram?.config?.inactive_impersonation?.duration || 0
    }
  }

  get isFormInvalid() {
    return this.programConfigService.getIsInValid;
  }

  /*
  getTenures() {
    let url: string = `/configurator/programs/${this.programId}/tenures?module_code=JOBS`;
    this.programService.get(url).subscribe({
      next: (data: any) => {
        if(data?.tenures?.length > 1) {
          this.alert.error("Invalid tenure config.");
        } else {
          this.tenureData = data?.tenures[0]
          this.fillConfigTabs();
          this.setActiveTab();
        }
      }, error: (err: Error | any) => {
        this.loader.hide();
        this.alert.error(errorHandler(err));
      }
    });
  }
  */

  // Set modules to be part of Program Configuration
  fillConfigTabs = () => {
    this.programConfiguration = new Array<IProgramConfiguration>();
    this.programConfiguration.push(
      // Platform
      {
        tabName: 'Platform',
        tabComponent: PlatformProgramConfigComponent,
        config: { key: 'platform', value: this.getPlatformData ?? null },
        tabOrder: 0,
      },
      // Job
      {
        tabName: 'Job',
        tabComponent: JobProgramConfigComponent,
        config: { key: 'job', value: (this.currentProgram?.config ? this.getJobData(this.currentProgram?.config) : {})},
        tabOrder: 1,
      },
      // Candidate
      {
        tabName: 'Candidate',
        tabComponent: CandidateProgramConfigComponent,
        config: { key: 'candidate', value: (this.currentProgram?.config ?? {})},
        tabOrder: 2,
      },
      // Submission
      {
        tabName: 'Submission',
        tabComponent: SubmissionProgramConfigComponent,
        config: { key: 'submission', value: (this.currentProgram?.config ?? {})},
        tabOrder: 3,
      },
      // Interview
      {
        tabName: 'Interview',
        tabComponent: InterviewConfigComponent,
        config: { key: 'interview', value: (this.currentProgram?.config ?? {})},
        tabOrder: 4,
      },
      // Offer
      {
        tabName: 'Offer',
        tabComponent: OfferProgramConfigComponent,
        config: { key: 'offer', value: (this.currentProgram?.config ?? {})},
        tabOrder: 5,
      },
      {
        tabName: 'Timesheet and Expense',
        tabComponent: TimeSheetAndExpenseComponent,
        config: { key: 'timeshetandexpense', value: (this.currentProgram?.config ?? {})},
        tabOrder: 6,
      },
      // Notifications
      {
        tabName: 'Notifications',
        tabComponent: NotificationProgramConfigComponent,
        config: { key: 'notification', value: (this.currentProgram?.config?.notifications ?? {})},
        tabOrder: 7,
      },
      // Features
      {
        tabName: 'Features',
        tabComponent: FeaturesConfigComponent,
        config: { key: 'features', value: (this.currentProgram?.config ?? {})},
        tabOrder: 8,
      }
    );
  };

  setActiveTab = () => {
    if (this.programConfiguration && this.programConfiguration.length > 0) {
      let config = this.programConfiguration.find(config => config.tabOrder == this.currentActiveTab);
      if(config) {
        config['tabActive'] = true;
      }
    }
  };

  // Set the active tab on program configuration
  setCurrentTab = (currentTab: number) => {
    this.currentActiveTab = currentTab;
  };

  // Executes on click of save button
  onSave = () => {

    let configs = this.programConfiguration?.map((x: any) => x?.config);

    // Configuration below
    let configuration: any = {};
    let validations: boolean = true;
    // let tenureUrl = `/configurator/programs/${this.programId}/tenures/${this.tenureData.id}`
    // let tenurePayload = existingConfig?.value?.maximum_job_duration?.value ? {
    //   is_enabled : true,
    //   consecutive_employment_span : existingConfig?.value?.maximum_job_duration?.count != 0 ? Number(existingConfig?.value?.maximum_job_duration?.count.toString()) : 0,
    //   consecutive_employment_span_unit : existingConfig?.value?.maximum_job_duration?.duration ? existingConfig?.value?.maximum_job_duration?.duration?.toUpperCase() : ''
    // } : {
    //   is_enabled : false
    // }
    configs?.forEach((config: any) => {
      if(config?.value) {
        switch(config?.key) {

          case 'candidate':
            const {
              is_country_mandatory,
              is_state_national_id_mandatory,
              is_candidate_image_hidden,
              candidate_unique_id_format,
              is_candidate_address,
              is_resume_mandatory,
              is_candidate_education_required
            } = config?.value;
            configuration = {
              ...configuration,
              is_candidate_image_hidden,
              candidate_unique_id_format,
              is_candidate_address,
              candidate: {
                ...(configuration?.['candidate'] ?? {}),
                is_country_mandatory,
                is_state_national_id_mandatory,
                is_resume_mandatory,
                is_candidate_education_required
              }
            }
            break;

          case 'submission':
            const {
              can_client_view_non_shortlisted_candidates,
              is_allow_vendor_to_enter_client_bill_rate
              // is_higher_submission_rate_allowed   * Commenting as part of V2M-13355
            } = config?.value;
            configuration = {
              ...configuration,
              // is_higher_submission_rate_allowed,   * Commenting as part of V2M-13355
              submission: {
                ...(configuration?.['submission'] ?? {}),
                can_client_view_non_shortlisted_candidates
              }
            }

            // Program specific
            if(('is_allow_vendor_to_enter_client_bill_rate' in this.currentProgram?.config) || false) {
              configuration = {
                ...configuration,
                is_allow_vendor_to_enter_client_bill_rate
              };
            }

            break;

          case 'interview':
            const {
              is_interview_virtual_link,
              is_outlook_disabled,
              is_additional_attendees_from_out_organization,
              is_work_location_master_enabled
            } = config?.value;
            configuration = {
              ...configuration,
              interview: {
                ...(configuration?.['interview'] ?? {}),
                is_interview_virtual_link,
                is_additional_attendees_from_out_organization,
                is_work_location_master_enabled
              }, submission: {
                ...(configuration?.['submission'] ?? {}),
                is_outlook_disabled
              }
            }
            break;

          case 'offer':
            const {
              is_onboading_disabled,
              is_approval_for_offers,
              is_offer_acceptance_disabled
            } = config?.value;
            configuration = {
              ...configuration,
              is_onboading_disabled,
              is_approval_for_offers,
              is_offer_acceptance_disabled
            }
            break;

            case'timeshetandexpense':
            const {
              multiple_approval_timesheet_expense,
              bulk_timesheet_approval,
              bulk_general_expense_approval,
              bulk_misc_expense_approval
            } = config?.value;
            configuration = {
              ...configuration,
              multiple_approval_timesheet_expense,
              bulk_timesheet_approval,
              bulk_general_expense_approval,
              bulk_misc_expense_approval
            }
            break;

          case 'notification':
            let {
              whitelist,
              exclude_msp,
              approval_link
            } = config?.value;

            exclude_msp = (whitelist && exclude_msp)?
                          (exclude_msp?.split(';')
                            ?.map((email: string) => email?.trim())
                            ?.filter((email: string) => !!email)
                          ?? []): [];

            const emailValidationError: null | string = this.emailValidations(exclude_msp);
            if(emailValidationError) {
              this.alert.error(`List of Domains/Email IDs to Whitelist<br/>Invalid Email: ${emailValidationError} (Notifications)`);
              validations = false;
              break;
            }

            configuration = {
              ...configuration,
              notifications: {
                ...(configuration?.['notifications'] ?? {}),
                whitelist,
                exclude_msp,
                approval_link
              }
            }
            delete configuration.notifications['exclude msp'];
            break;

          case 'job':
            const {
              is_work_location_read_only,
              allow_equal_min_max_rate,
              job_budget_calculation,
              hours_per_day,
              week_working_days,
              adjustment_type,
              job_description,
              enable_auto_opt_in,
              allow_pre_identified_candidates,
              allow_independent_hm_selection
            } = config?.value;
            // if(existingConfig?.value?.maximum_job_duration?.value && tenurePayload.consecutive_employment_span <= 0){
            //   this.alert.error(`Please enter valid Duration`);
            //   validations = false;
            // }
            // if(existingConfig?.value?.maximum_job_duration?.value && (!tenurePayload.consecutive_employment_span_unit)){
            //   this.alert.error(`Please fill all the required fields correctly!`);
            //   validations = false;
            // }
            configuration = {
              ...configuration,
              is_work_location_read_only,
              job: {
                ...(configuration?.['job'] ?? {}),
                allow_equal_min_max_rate,
                job_budget_calculation,
                hours_per_day,
                week_working_days,
                adjustment_type,
                job_description,
                enable_auto_opt_in,
                allow_pre_identified_candidates,
                allow_independent_hm_selection,
              }
            }
            break;

          case 'features':
            const {
              enable_account_code,
              enable_accrual_report,
              enable_bws_report,
              enable_custom_invoice_report,
              direct_sourcing_account_id,
              enable_direct_sourcing,
              enable_data_subject_rights,
              data_subject_rights_closed_assignments,
              data_subject_rights_rejected_candidates,
              threshold_for_rejected_candidates,
              threshold_for_rejected_candidates_option,
              threshold_closed_assignments,
              threshold_closed_assignments_option,
              manage_remote_workers,
              candidate_matching_score,
              candidate_weighted,
              vendor_compliance_restriction_rule,
              job_type,
              credentialing
            } = config?.value;
            let candidate_weightage_values = {}
            if(candidate_matching_score){
              for(const item of candidate_weighted){
                candidate_weightage_values[item.code]=item.inputval;
              }
              const total =  candidate_weighted.reduce((acc, item) => acc + item.inputval, 0);
              if(total != 100){
                this.alert.error(`Candidate Weightage's Total Should be 100`);
                validations = false;
                break;
              }

            }

            configuration = {
              ...configuration,
              account_code: {
                ...(this.currentProgram?.config?.account_code || {}),
                ...(configuration?.['account_code'] || {}),
                enabled: enable_account_code
              },
              report: {
                ...(configuration?.['report'] ?? {}),
                accrual_report: enable_accrual_report,
                bws_report: enable_bws_report,
                custom_invoice_report: enable_custom_invoice_report
              },
              direct_sourcing : {
                enabled: enable_direct_sourcing,
                account_id : direct_sourcing_account_id
              },
              data_subject_rights : {
                enabled: enable_data_subject_rights ? enable_data_subject_rights : false,
                closed_assignments : {
                  enabled: data_subject_rights_closed_assignments ? data_subject_rights_closed_assignments : false,
                  threshold : threshold_closed_assignments ? threshold_closed_assignments : 0,
                  unit_of_threshold: {
                    "days":threshold_closed_assignments_option?.includes('day') ? true : false,
                    "months":threshold_closed_assignments_option?.includes('month') ? true : false,
                    "years":threshold_closed_assignments_option?.includes('year') ? true : false
                  }
                },
                rejected_candidates : {
                  enabled: data_subject_rights_rejected_candidates ? data_subject_rights_rejected_candidates : false,
                  threshold: threshold_for_rejected_candidates ? threshold_for_rejected_candidates : 0,
                  unit_of_threshold: {
                    "days":threshold_for_rejected_candidates_option?.includes('day') ? true : false,
                    "months":threshold_for_rejected_candidates_option?.includes('month') ? true : false,
                    "years":threshold_for_rejected_candidates_option?.includes('year') ? true : false
                  }
                }
              },
              manage_remote_workers,
              candidate_matching_score:{
                is_enabled : candidate_matching_score,
                key_parameters : candidate_matching_score ? candidate_weightage_values : {}
              },
              vendor_compliance_restriction_rule: {
                ...(this.currentProgram?.vendor_compliance_restriction_rule || {}),
                is_allow: vendor_compliance_restriction_rule
              },
              job_type,
              credentialing
            }
            break;

          case 'platform':
            if(config?.value.hide_fee_user_types){
              let hide_feeData: Array <string> | any = config?.value.hide_fee_user_types;
              if(Array.isArray(hide_feeData)) {
                config['value']['hide_fee_user_types'] = {
                  msp: hide_feeData?.includes('msp'),
                  client: hide_feeData?.includes('client'),
                  vendor: hide_feeData?.includes('vendor'),
                  candidate: hide_feeData?.includes('candidate')
                }
              } else {
                config['value']['hide_fee_user_types'] = {
                  msp: !!hide_feeData?.msp,
                  client: !!hide_feeData?.client,
                  vendor: !!hide_feeData?.vendor,
                  candidate: !!hide_feeData?.candidate
                }
              }
            }
            if(!config?.value.is_adjustment_fee_allowed){
              config.value['adjustment_fee_applicable_on'] = null
              config.value['adjustment_fee_calculated_on'] = null
            }
            if(!config?.value.is_custom_tax_on_assignment){
              config.value['tax_applicable_on'] = null
              config.value['tax_calculated_on'] = null
            }

            const {
              currencies,
              languages,
              language,
              currency,
              date_format,
              time_zone,
              hide_fee,
              is_vendor_neutral,
              program_model,
              hide_suffix_prefix,
              financial_auth_chain_switch_superadmin,
              default_to_root_hierarchy,
              hide_fee_user_types,
              restrict_delegation_by_hierarchy,
              units_of_measures,
              accuracy_config,
              modules_using_flow_system,
              email,
              session_timeout,
              markup_by_rate_type,
              cost_component,
              is_adjustment_fee_allowed,
              adjustment_fee_applicable_on,
              adjustment_fee_calculated_on,
              is_custom_tax_on_assignment,
              tax_applicable_on,
              tax_calculated_on,
              inactive_impersonation_enabled,
              inactive_impersonation_duration,
              inactive_impersonation_type
            } = config?.value;

            let parsedTimer = this.timerToSeconds(session_timeout);
            if(parsedTimer < 60) {
              this.alert.error('Minimum value of session timeout should be atleast 1 minute');
              validations = false;
              break;
            }

            if(email && !this.emailPattern.test(email)){
              this.alert.error(`Please provide a valid support email!`);
              validations = false;
              break;
            }
           if(is_adjustment_fee_allowed && (!adjustment_fee_applicable_on || !adjustment_fee_calculated_on)){
            this.alert.error(`Please select Adjustment Calculated From and Adjustment Applies to`);
              validations = false;
              break;
           }
           if(is_custom_tax_on_assignment && (!tax_applicable_on || !tax_calculated_on)){
            this.alert.error(`Please select Tax Calculated From and Tax Applies To`);
              validations = false;
              break;
           }
            configuration = {
              ...configuration,
              markup_by_rate_type,
              cost_component,
              is_adjustment_fee_allowed,
              adjustment_fee_applicable_on,
              adjustment_fee_calculated_on,
              is_custom_tax_on_assignment,
              tax_applicable_on,
              tax_calculated_on,
              session_timeout: parsedTimer,
              modules_using_flow_system: (modules_using_flow_system ?? []),
              billing: {
                ...(configuration?.['billing'] ?? {}),
                supported_currencies: currencies,
                default_currency: currency
              },
              localization: {
                ...(configuration?.['supported_languages'] ?? {}),
                supported_languages: languages,
                // program_preferred_timezones: time_zone,
                time_zone: time_zone,
                default_language: language
              },
              job: {
                ...(configuration?.['job'] ?? {}),
                default_to_root_hierarchy
              },
              preferred_date_format: date_format,
              email : email,
              is_vendor_neutral,
              program_model,
              hide_suffix_prefix,
              financial_auth_chain_switch_superadmin,
              hide_fees: hide_fee ? hide_fee_user_types : [],
              restrict_delegation_by_hierarchy,
              unit_of_measures: {
                daily: units_of_measures?.includes('daily') ?? false,
                hourly: units_of_measures?.includes('hourly') ?? false,
                weekly: units_of_measures?.includes('weekly') ?? false,
                yearly: units_of_measures?.includes('yearly') ?? false,
                monthly: units_of_measures?.includes('monthly') ?? false,
                quarterly: units_of_measures?.includes('quarterly') ?? false
              },
              accuracy_config : accuracy_config ?? false,
              inactive_impersonation: {
                enabled: inactive_impersonation_enabled,
                duration: this.inactivitySeconds(inactive_impersonation_duration, inactive_impersonation_type)
              }
            }
            break;
        }
      }
    });

    if(!validations) {
      return;
    }

    let dataParser: DataParser = new DataParser();
    let validator: Function = (x: any) => (x !== undefined);
    configuration = dataParser.deepOmitFields((configuration ?? {}), validator, false);

    let payload: Array<any> = [];
    [...Object.keys(configuration)].forEach((key: string) => {
      if(key === "notifications") {
        payload.push({ [key]:
          {
            ...(this.currentProgram?.config?.notifications ?? {}),
            ...(configuration?.[key] ?? {})
          }
        });
      } else {
        payload.push({[key]: configuration?.[key]});
      }
    });

    this.loader.show();
    const url: string = `/configurator/programs/${this.currentProgram?.id}/update_config`;
    this.program.put(url, payload)
      .subscribe({
        next: (data: any) => {
          if(data) {


            /*
            this.program.put(tenureUrl, tenurePayload).subscribe({
              next: (data: any) => {
                if(data) {
                  this.alert.success('Program Configuration updated successfully');
                  this.loader.hide();
                }
              }, error: (err: any) => {
                this.loader.hide();
                this.alert.error(errorHandler(err));
              }
            })
            */

            this.loader.hide();
            this.alert.success('Program Configuration updated successfully');
            this.currentProgram = _.mergeWith(this.currentProgram, {
              config: configuration
            }, (oldValue: any, newValue: any) => {
              if(_.isArray(oldValue)) {
                return newValue;
              }
            });

            this.currentProgram.defaultCurrency = this.currentProgram?.config?.billing?.default_currency ?? 'USD';
            this.currentProgram.defaultDateFormat = this.currentProgram?.config?.preferred_date_format ?? DATE_FORMAT.FORMATMDY;
            this.readOnly = true;
            this.localStorage.set(StorageKeys.CURRENT_PROGRAM, this.currentProgram, true);
            this.eventStream.emit(new EmitEvent(Events.PROGRAM_CONFIGURATION_UPDATED, true));
          }
        }, error: (err: any) => {
          this.loader.hide();
          this.alert.error(errorHandler(err));
        }
      })
    if(this.enableNotificationDetails) {
      this.programService.updateProgramConfigDetails(this.programId, this.enableNotificationDetails).subscribe({
        next:(res:any) => {
          this.alert.success(res?.message);
        },
        error: ()=> {}
      })
    }
  };

  emailValidations(emails: Array <string>): null | string {
    if(Array.isArray(emails)) {
      for (let it: number = 0; it < emails.length; it++) {
        const email: string = emails[it];
        if(!this.emailService.emailValidator(email)) {
          return email;
        }
      }
    }

    return null;
  }

  timerToSeconds(timer: string = '') {
    let fragments: Array <string> = timer.split(':');
    let hours: number = Number.parseInt(fragments[0]);
    let minutes: number = Number.parseInt(fragments[1]);
    return (hours*60 + minutes)*60;
  }

  private inactivitySeconds(num: number, type: string): number {
    let result: number = num;
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

  get hasReadPermission() {
    return this.authService.authorize('program_configuration_view');
  }

  get hasUpdatePermission() {
    return this.authService.authorize('program_configuration_manage');
  }

  get saveAccess() {
    return this.accessService.accessControl();
  }

  get programId() {
    return this.localStorage.get(StorageKeys.PROGRAM_ID);
  }

  get currentProgram() {
    return this.localStorage.get(StorageKeys.CURRENT_PROGRAM);
  }

  set currentProgram(data: any) {
    this.localStorage.set(StorageKeys.CURRENT_PROGRAM, data, true);
  }
}
