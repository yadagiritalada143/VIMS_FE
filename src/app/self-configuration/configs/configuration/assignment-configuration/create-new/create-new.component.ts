import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { AssignmentConfigurationService } from 'src/app/program-setup/assignment-configuration/assignment-configuration.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { ClonerService } from 'src/app/core/services/cloner.service';

@Component({
  selector: 'app-create-new',
  templateUrl: './create-new.component.html',
  styleUrls: ['./create-new.component.scss']
})
export class CreateNewComponent implements OnInit {
  assignmentDropDownValues = [];
  config: any = {};
  options: any = {};
  readonly VENDOR_USER_TYPE: string = 'vendor';
  assignmentActiveUpon: string = "Select all";
  managerOptionValue: { label: string; key: string; isSelected: boolean; }[];
  currentProgram: any;
  allowOptionForFoundational: any[];
  duplicateOptions: any;
  massUpdateOptionValue: any[];

  constructor(private route: Router,
    private storageService: StorageService, private alertService: AlertService,
    private assignmentConfigService: AssignmentConfigurationService,
    private activatedRoute: ActivatedRoute, private loader: LoaderService,
    private _cloneService: ClonerService,
    ) { }

  ngOnInit(): void {
    this.currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.loadForm();
    this.activatedRoute.queryParams
      .subscribe(params => {
        // this.mode = params['mode'];
        this.configId = params['id'];
        if (this.configId) {
          this.loadAssignmentConfiguration();
        }
      });
  }

  loadForm() {
    this.getFoundationalFieldsValue().then(() => {
      this.getAssignmentConfiguration();
      this.getConfigurationOptions();
      this.getDefaultConfiguration();
    });
  }
  getFoundationalFieldsValue() {
    return new Promise<void>((resolve) => {
      let url = `/configurator/programs/${this.currentProgram?.id}/foundational-data-types?active=true&ordering=ref_order`;
      this.assignmentConfigService.get(url).subscribe((res: any) => {
        this.allowOptionForFoundational = [];
        res?.foundational_data_types?.forEach(res => {
          this.allowOptionForFoundational.push({ key: res?.slug, label: res?.name , type: 'MDT' });
        });
        resolve();
      })
    })
  }
  getConfigurationOptions() {
    this.options = this.assignmentConfigService.getAssignmentDropdownOptions();
    let allowOption = ['assignment_manager', 'end_date' , 'timesheet_manager' , 'expense_manager','work_location'];
    allowOption = allowOption.concat(this.allowOptionForFoundational.map(res => res?.key));
    this.options.massUpdateOptions.push(...this.allowOptionForFoundational);
    this.options.massUpdateOptions = this.options?.massUpdateOptions?.filter(value => allowOption.includes(value?.key)).map((value, index) => ({ ...value, id: index + 1 }));
    this.duplicateOptions = this._cloneService.deepClone(this.options.massUpdateOptions);
  }

  getDefaultConfiguration() {
    this.config = this.assignmentConfigService.getDefaultAssignmentConfig();
  }

  changeTempAccessFlag() {
    this.config.config.temp_access_data.is_allow = !this.config?.config?.temp_access_data?.is_allow;
    this.config.config.temp_access_data = {
      is_allow: this.config?.config?.temp_access_data?.is_allow,
      submit: {
        is_allow: false,
        type: null,
        period: null
      },
      modify: {
        is_allow: false,
        type: null,
        period: null
      },
    }
  }

  toggleChanged(field, fieldData, nestedField = null, setToNull = true, resetField = null) {
    if(!this.config.config[field]) {
      this.config.config[field] = {} ;
    }
    this.config.config[field].is_allow = !this.config?.config[field]?.is_allow;

    if (!this.config?.config[field]?.is_allow && fieldData) {
      if (setToNull) {
        this.config.config[field][fieldData] = null;
      } else {
        this.config.config[field][fieldData]?.forEach(element => {
          if (nestedField) {
            element[nestedField] = {};
          }
          if (resetField) {
            element[resetField] = false;
          }
        });
      }
    }
  }

  allowAssignmentCreation() {
    if (this.config?.config?.do_not_rehire?.is_allow) {
      this.config.config.do_not_rehire.options[0].is_enabled = true;
    }
  }

  getAssignmentConfiguration() {
    const url = `/configurator/programs/${this.currentProgram?.id}/config?entity_code=assignment_setting`;
    this.assignmentConfigService.get(url)
      .subscribe({
        next: (response: any) => {
          const newResponse = { ...response, config: { ...(response?.config || {}), mass_update: { ...(response?.config?.mass_update || {})}}};
          this.processResponse(newResponse);
          this.loader.hide();
        }, error: (err: Error) => {
          this.processResponse({});
        }
      }
    );
  }

  processTempAccessData(module) {
    const temp_access = this.config?.config?.temporary_access?.filter(temp_access => { return temp_access?.module_type === module });
    if (temp_access?.length > 0) {
      this.config.config.temp_access_data.is_allow = temp_access[0]?.is_allow;
      this.config.config.temp_access_data[module]["submit"]["is_allow"] = temp_access[0]?.module_action?.submit?.is_allow;
      const submitOption = temp_access[0]?.module_action?.submit?.option?.filter(option => { return option?.user_type?.toLowerCase() === this.VENDOR_USER_TYPE });
      if (submitOption?.length > 0) {
        // this.config.config.temp_access_data.is_allow = this.config?.config?.temp_access_data?.is_allow ? true : (submitOption[0]?.period && submitOption[0]?.type);
        this.config.config.temp_access_data[module]["submit"]["period"] = submitOption[0]?.period;
        this.config.config.temp_access_data[module]["submit"]["type"] = submitOption[0]?.type?.toLowerCase();
      }
      this.config.config.temp_access_data[module]["modify"]["is_allow"] = temp_access[0]?.module_action?.modify?.is_allow;
      // this.config.config.temp_access_data.is_allow = this.config?.config?.temp_access_data?.is_allow ? true : temp_access[0]?.module_action?.modify?.is_allow;
      const modifyOption = temp_access[0]?.module_action.modify?.option?.filter(option => { return option?.user_type?.toLowerCase() === this.VENDOR_USER_TYPE });
      if (modifyOption?.length > 0) {
        // this.config.config.temp_access_data.is_allow = this.config?.config?.temp_access_data?.is_allow ? true : (modifyOption[0]?.period && modifyOption[0]?.type);
        this.config.config.temp_access_data[module]["modify"]["period"] = modifyOption[0]?.period;
        this.config.config.temp_access_data[module]["modify"]["type"] = modifyOption[0]?.type?.toLowerCase();
      }
    }
    if (module === 'timesheet') {
      this.config.config.temp_access_data[module]["past_period_allow"] = temp_access[0]?.module_action?.past_period?.is_allow;
      this.config.config.temp_access_data[module]["past_period"]["is_allow"] = temp_access[0]?.module_action?.past_period?.is_allow;
      const pastPeriodOption = temp_access[0]?.module_action?.past_period?.option?.filter(option => { return !option?.user_type });
      if (pastPeriodOption?.length > 0) {
        this.config.config.temp_access_data[module]["past_period_allow"] = this.config?.config?.temp_access_data[module]["past_period_allow"] ? true : (pastPeriodOption[0]?.period && pastPeriodOption[0]?.type);
        this.config.config.temp_access_data[module]["past_period"]["period"] = pastPeriodOption[0]?.period;
        this.config.config.temp_access_data[module]["past_period"]["type"] = pastPeriodOption[0]?.type?.toLowerCase();
      }
    }

  }

  updatePastPeriod() {
    this.config.config.temp_access_data.timesheet.past_period_allow = !this.config?.config?.temp_access_data?.timesheet?.past_period_allow;
    if (!this.config.config.temp_access_data.timesheet.past_period_allow) {
      this.config.config.temp_access_data.timesheet.past_period.is_allow = false;
    }
  }

  updateStartDate() {
    this.config.config.update_start_date.is_allow = !this.config?.config?.update_start_date?.is_allow;
  }
  processResponse(response) {
    const defaultConfig = this.assignmentConfigService.getDefaultAssignmentConfig();
    this.config = this.mergeDeep(defaultConfig, response);
    if(this.config?.config?.mass_update?.field_type?.length) {
      this.config?.config?.mass_update?.field_type?.forEach(res => {
        const getVal = this.options.fieldMassUpdateOptions.find(data => data?.key === res?.field);
        res?.options?.forEach(res => {
          Object.keys(res).forEach(res => {
           const val = this.options?.massUpdateOptions.find(data => data?.key === res);
           if(val) {this.massUpdateValues.push(val) ; this.config?.config?.mass_update?.selectedValues?.push(val?.id)}
          });
        })
        if(getVal) {
          this.config.config.mass_update.options.push(getVal?.id);
        }
      })
    }
    if (this.config?.config?.temporary_access?.length > 0) {
      this.processTempAccessData("expense");
      this.processTempAccessData("timesheet");
    }
    if (this.config?.config?.additional_budget?.options?.length > 0) {
      this.config.config.additional_budget?.options?.forEach(option => {
        if (option?.key === 'allow_add') {
          this.options.additionalBudgetAddTypeOptions.forEach(key => {
            if (option.options?.hasOwnProperty(key.value)) {
              option.options.type = key?.value;
              option.options.period = option?.options[key.value];
            }
          });

        }
      });
    }
    if(this.config?.config?.assignment_title) {
      if(this.config?.config?.assignment_title?.search_by_job && this.config?.config?.assignment_title?.search_by_job_template) {
        this.assignmentDropDownValues = this.assignment_title_arr;
      } else if (!this.config?.config?.assignment_title?.search_by_job && this.config?.config?.assignment_title?.search_by_job_template){
        this.assignmentDropDownValues = [this.assignment_title_arr[1]];
      } else {
        this.assignmentDropDownValues = [this.assignment_title_arr[0]];
      }
    }
    if(this.config?.config?.show_managers) {
      this.showManagerOptions.forEach(element => {
        if(element.key == 'create_assignment') {
          element.isSelected = this.config?.config?.show_managers?.create?.is_enabled;
        }
        if(element.key == 'update_assignment') {
          element.isSelected = this.config?.config?.show_managers?.update?.is_enabled;
        }
      })
    }
    this.managerOptionValue = this.showManagerOptions.filter(res => res?.isSelected);
    if(this.config?.config?.active_on?.options[0]?.value?.length >0){
      this.config.config.active_on.options[0].value?.forEach(data => {
        this.options.activeOnData?.forEach(option => {
          if(option?.value === data?.value){
            option.isEnabled= true;
          }
        });
      });
    }else{
      this.options?.activeOnData?.forEach(option => {
        if(option?.value === "create"){
          option.isEnabled= true;
        }
      });
    }
    if(this.config?.config?.mass_update?.is_allow) {
      let fieldOptions = this.config?.config?.mass_update?.field_type?.map(res => res?.field);
      this.massUpdateOptionValue = this.options?.fieldMassUpdateOptions?.filter(res => fieldOptions?.includes(res?.key));
    }
  }

  saveConfiguration() {
    this.config.config.update_impact_approved_ts.is_allow = true;
    if (this.config?.config?.budget?.value) {
      this.config.config.budget.is_allow = true;
    }
    this.config.config.mass_update.selectedValues = this.massUpdateValues;
    if (this.config?.config?.mass_update?.is_allow && this.options?.massUpdateOptions?.length === 0) {
      this.alertService.error("Please select option from mass update.!");
      return;
    }
    if (this.config?.config?.mass_update?.is_allow && this.massUpdateValues?.length === 0) {
      this.alertService.error("Please select option from mass update field.!");
      return;
    }
    if (this.config?.config?.secondary_assignment?.is_allow && !this.config?.config?.secondary_assignment?.value) {
      this.alertService.error("Please select option from secondary assignment.!");
      return;
    }
    /* if(this.config?.config?.temp_access_data?.is_allow && !this.config.config.temp_access_data.submit.is_allow && !this.config.config.temp_access_data.modify.is_allow){
      this.alertService.error("Please provide valid data in temporary access.!");
      return;
    } */
    if (!this.config?.config?.temp_access_data?.timesheet?.submit?.is_allow && !this.config?.config?.temp_access_data?.timesheet?.modify?.is_allow &&
      !this.config?.config?.temp_access_data?.expense?.submit?.is_allow && !this.config?.config?.temp_access_data?.expense?.modify?.is_allow && this.config?.config?.temp_access_data?.is_allow) {
      this.alertService.error("Please select at least one option from Additional Special Temporary Access to Vendor.!");
      return;
    }
    if ((this.config?.config?.temp_access_data?.timesheet?.submit?.period == null && this.config?.config?.temp_access_data?.timesheet?.submit?.type) ||
      (this.config?.config?.temp_access_data?.timesheet?.submit?.period && !this.config?.config?.temp_access_data?.timesheet?.submit?.type)
      || (this.config?.config?.temp_access_data?.timesheet?.submit?.period < 0) || (this.config?.config?.temp_access_data?.timesheet.submit?.is_allow && this.config?.config?.temp_access_data?.timesheet?.submit?.period == null && this.config?.config?.temp_access_data?.timesheet?.submit?.type == null)) {
      this.alertService.error("Please provide valid data in temporary access to Submit timesheet.!");
      return;
    }
    if ((this.config?.config?.temp_access_data?.expense?.submit?.period == null && this.config?.config?.temp_access_data?.expense?.submit?.type) ||
      (this.config?.config?.temp_access_data?.expense?.submit?.period && !this.config?.config?.temp_access_data?.expense?.submit?.type)
      || (this.config?.config?.temp_access_data?.expense?.submit?.period < 0) || (this.config?.config?.temp_access_data?.expense?.submit?.is_allow && this.config?.config?.temp_access_data?.expense?.submit?.period == null && this.config.config.temp_access_data.expense.submit.type == null)) {
      this.alertService.error("Please provide valid data in temporary access to Submit expense.!");
      return;
    }
    if ((this.config?.config?.temp_access_data?.timesheet?.modify?.period == null && this.config?.config?.temp_access_data?.timesheet?.modify?.type) ||
      (this.config?.config?.temp_access_data?.timesheet?.modify?.period && !this.config?.config?.temp_access_data?.timesheet?.modify?.type)
      || (this.config?.config?.temp_access_data?.timesheet?.modify?.period < 0) || (this.config?.config?.temp_access_data?.timesheet?.modify?.is_allow && this.config?.config?.temp_access_data?.timesheet?.modify?.period == null && this.config?.config?.temp_access_data?.timesheet?.modify?.type == null)) {
      this.alertService.error("Please provide valid data in temporary access to modify timesheet.!");
      return;
    }
    if ((this.config?.config?.temp_access_data?.expense?.modify?.period == null && this.config?.config?.temp_access_data?.expense?.modify?.type) ||
      (this.config?.config?.temp_access_data?.expense?.modify?.period && !this.config?.config?.temp_access_data?.expense?.modify?.type)
      || (this.config?.config?.temp_access_data?.expense?.modify?.period < 0) || (this.config?.config?.temp_access_data?.expense?.modify?.is_allow && this.config?.config?.temp_access_data?.expense?.modify?.period == null && this.config?.config?.temp_access_data?.expense?.modify?.type == null)) {
      this.alertService.error("Please provide valid data in temporary access to modify expense.!");
      return;
    }
    //
    if (this.config?.config?.additional_budget?.options?.length > 0 && this.config?.config?.additional_budget?.options[0].key == "allow_add" && this.config?.config?.additional_budget?.is_allow) {
      if ((this.config?.config?.additional_budget?.options[0]?.options?.type == null || this.config?.config?.additional_budget?.options[0]?.options?.period == null || this.config?.config?.additional_budget?.options[0]?.options?.period <= 0) &&
        !(this.config?.config?.additional_budget?.options[0]?.options?.type == null && this.config?.config?.additional_budget?.options[0]?.options?.period == null && !this.config?.config?.additional_budget?.options[0]?.is_enabled)) {
        this.alertService.error("Please provide valid data in add allow in additional budget.!");
        return;
      }
    }
    if (this.config?.config?.additional_budget?.options?.length > 0 && this.config?.config?.additional_budget?.options[3].key == "threshold" && this.config?.config?.additional_budget?.is_allow) {
      if ((this.config?.config?.additional_budget?.options[3]?.options?.type == null || this.config?.config?.additional_budget?.options[3]?.options?.value == null || this.config?.config?.additional_budget?.options[3]?.options?.value <= 0 || this.config?.config?.additional_budget?.options[3]?.options?.operator == null) &&
        !(this.config?.config?.additional_budget?.options[3]?.options?.type == null && this.config?.config?.additional_budget?.options[3]?.options?.value == null && this.config?.config?.additional_budget?.options[3]?.options?.operator == null && !this.config?.config?.additional_budget?.options[3]?.is_enabled)) {
        this.alertService.error("Please provide valid data in threshold in additional budget.!");
        return;
      }
    }
    if (this.config?.config?.additional_budget?.is_allow && !this.config?.config?.additional_budget?.options[0]?.is_enabled &&
      !this.config?.config?.additional_budget?.options[1]?.is_enabled && !this.config?.config?.additional_budget?.options[2]?.is_enabled && !this.config?.config?.additional_budget?.options[3]?.is_enabled) {
      this.alertService.error("Please select at least one option from Additional Budget.!");
      return;
    }
    if (this.config?.config?.temp_access_data?.timesheet?.past_period_allow && !this.config?.config?.temp_access_data?.timesheet?.past_period?.is_allow &&
      !this.config?.config?.temp_access_data?.timesheet?.past_period?.type && !this.config?.config?.temp_access_data?.timesheet?.past_period?.period) {
      this.alertService.error("Please provide valid data in temporary access to Submit Archieved/restricted/blocked timesheet..!");
      return;
    }

    if ((this.config?.config?.temp_access_data?.timesheet?.past_period?.period == null && this.config?.config?.temp_access_data?.timesheet?.past_period?.type) ||
      (this.config?.config?.temp_access_data?.timesheet?.past_period?.period && !this.config?.config?.temp_access_data?.timesheet?.past_period?.type)
      || (this.config?.config?.temp_access_data?.timesheet?.past_period?.period < 0) || (this.config?.config?.temp_access_data?.timesheet.past_period?.is_allow && this.config?.config?.temp_access_data?.timesheet?.past_period?.period == null && this.config?.config?.temp_access_data?.timesheet?.past_period?.type == null)) {
      this.alertService.error("Please provide valid data in temporary access to Submit Archieved/restricted/blocked timesheet.!");
      return;
    }

    if (this.config?.config?.update_start_date?.is_allow &&
      (!this.config?.config?.update_start_date?.type || !this.config?.config?.update_start_date?.period)
      || (!this.config?.config?.update_start_date?.type && this.config?.config?.update_start_date?.period>0)
    || (this.config?.config?.update_start_date?.type && !this.config?.config?.update_start_date?.period)) {
      this.alertService.error("Please provide valid data in Update Assignment Start Date..!");
      return;
    }

    if (!this.config?.config?.assignment_title?.search_by_job_template && !this.config?.config?.assignment_title?.search_by_job) {
      this.alertService.error("Please select atleast 1 select assignment option..!");
      return;
    }

    // if (!this.config?.config?.update_assignment_title?.search_by_job_template && !this.config?.config?.update_assignment_title?.search_by_job) {
    //   this.alertService.error("Please select atleast 1 option from update assignment on job Title section ..!");
    //   return;
    // }

    /* if ((this.config?.config?.update_start_date?.monthly.period == null && this.config?.config?.update_start_date?.monthly.past_period?.type) ||
      (this.config?.config?.update_start_date?.monthly?.period && !this.config?.config?.update_start_date?.monthly?.type)
      || (this.config?.config?.update_start_date?.monthly?.period < 0) || (this.config?.config?.update_start_date?.monthly?.is_allow && this.config?.config?.update_start_date?.monthly?.period == null && this.config?.config.update_start_date?.monthly?.type == null)) {
      this.alertService.error("Please provide valid start monthly data in temporary access to Submit Archieved/restricted/blocked timesheet.!");
      return;
    }
    if (this.config?.config?.update_start_date?.is_allow && !this.config?.config?.update_start_date?.weekly?.is_allow &&
      !this.config?.config?.update_start_date?.weekly?.type && !this.config?.config?.update_start_date.weekly?.period) {
      this.alertService.error("Please provide valid weekly data in temporary access to Submit Archieved/restricted/blocked timesheet..!");
      return;
    }

    if ((this.config?.config?.update_start_date?.weekly.period == null && this.config?.config?.update_start_date?.weekly?.past_period?.type) ||
      (this.config?.config?.update_start_date?.weekly?.period && !this.config?.config?.update_start_date?.weekly?.type)
      || (this.config?.config?.update_start_date?.weekly?.period < 0) || (this.config?.config?.update_start_date?.weekly?.is_allow && this.config?.config?.update_start_date?.weekly?.period == null && this.config?.config.update_start_date?.weekly?.type == null)) {
      this.alertService.error("Please provide valid weekly start data in temporary access to Submit Archieved/restricted/blocked timesheet.!");
      return;
    }
    */
    const selectedItemsList= this.options?.activeOnData.filter((value) => {
      return value?.isEnabled;
    });
    if(!selectedItemsList || selectedItemsList?.length == 0){
      this.alertService.error("Please select at least one option from Create Assignment & make it Open/Active.!");
      return;
    } else {
      // let option = selectedItemsList.map(item => ({ ...item }));
      selectedItemsList.forEach(element => {
        delete element.isEnabled;
      });
      this.config.config.active_on.options[0].value=selectedItemsList;
    }
    this.config.config.mass_update.field_type = [];
    this.config.config.mass_update.options = this.massUpdateOptionValue;
    if (this.config?.config?.mass_update?.is_allow) {
      if(this.config?.config?.mass_update?.options?.length) {
        this.config?.config?.mass_update?.options.forEach(res => {
          let val = this.options?.fieldMassUpdateOptions?.filter(data => data?.id === (res.hasOwnProperty('id') ? res?.id : res));
          if(val?.length) {
            let a = {};
            let obj = {field : val[0]?.key , is_allow : true , options:[]};
            this.config?.config?.mass_update?.selectedValues?.forEach(res => {
              let optionVal = this.duplicateOptions?.filter(data => (data?.id == res?.id && data?.type === val[0]?.key))?.[0]?.key;
              if(optionVal) {
                a[optionVal] = true ;
              }
            });
            if(Object.keys(a)?.length) obj.options.push(a);
            this.config?.config?.mass_update?.field_type?.push(obj);
          }
        })
      }
    }
    ['options' , 'selectedValues'].forEach(res => delete this.config?.config?.mass_update[res]);
    let timesheetOptionFound = false;
    let ExpenseOptionFound = false;
    if (this.config?.config?.temporary_access?.length > 0) {
      this.config.config.temporary_access?.forEach(temp_access => {
        if (temp_access.module_type?.toLowerCase() == 'timesheet') {
          this.setTempAccess(temp_access, 'timesheet');
          timesheetOptionFound = true;

        } else if (temp_access?.module_type?.toLowerCase() == 'expense') {
          this.setTempAccess(temp_access, 'expense');
          ExpenseOptionFound = true;
        }
      });
    }
    if (!this.config?.config?.temporary_access) {
      this.config.config.temporary_access = [];
    }
    if(!this.config?.config?.assignment_title?.is_allow || !this.config?.config?.assignment_title?.search_by_job) {
      this.config.config.assignment_title.allow_filled_job_selection = false;
    }
    if (!timesheetOptionFound) {
      this.config.config.temporary_access.push({
        is_allow: this.config?.config?.temp_access_data?.is_allow || false,
        module_type: "timesheet", module_action: {
          modify: {
            option: [{
              type: this.config?.config?.temp_access_data?.timesheet?.modify?.type, period: this.config?.config?.temp_access_data?.timesheet?.modify?.period, is_allow: this.config?.config?.temp_access_data?.timesheet?.modify?.is_allow || false, user_type: this.VENDOR_USER_TYPE
            }], is_allow: this.config?.config?.temp_access_data?.timesheet?.modify?.is_allow || false
          }, submit: {
            option: [
              { type: this.config?.config?.temp_access_data?.timesheet?.submit?.type, period: this.config?.config?.temp_access_data?.timesheet?.submit?.period, is_allow: this.config?.config?.temp_access_data?.timesheet?.submit?.is_allow || false, user_type: this.VENDOR_USER_TYPE }
            ], is_allow: this.config?.config?.temp_access_data?.timesheet?.submit?.is_allow || false
          },
          past_period: {
            option: [
              { type: this.config?.config?.temp_access_data?.timesheet?.past_period?.type, period: this.config?.config?.temp_access_data?.timesheet?.past_period?.period, is_allow: this.config?.config?.temp_access_data?.timesheet?.past_period?.is_allow || false, user_type: null }
            ], is_allow: this.config?.config?.temp_access_data?.timesheet?.past_period?.is_allow || false
          },
          // update_start_date:{
          //   monthly:{
          //   type: this.config?.config?.temp_access_data?.timesheet?.update_start_date?.monthly.type,
          //    period: this.config?.config?.temp_access_data?.timesheet?.update_start_date?.monthly.period,
          //    is_allow: this.config?.config?.temp_access_data?.timesheet?.update_start_date_allow?.monthly
          //   },
          //   weekly: {
          //     type: this.config?.config?.temp_access_data?.timesheet?.update_start_date?.weekly?.type,
          //     period: this.config?.config?.temp_access_data?.timesheet?.update_start_date?.weekly?.period,
          //     is_allow: this.config?.config?.temp_access_data?.timesheet?.update_start_date_allow?.weekly
          //   }
          // }
        }
      });
    }
    if (!ExpenseOptionFound) {
      this.config.config.temporary_access.push({
        is_allow: this.config?.config?.temp_access_data?.expense?.submit?.is_allow || this.config?.config?.temp_access_data?.expense?.modify?.is_allow || this.config?.config?.temp_access_data?.timesheet?.past_period_allow || false,
        module_type: "expense", module_action: {
          modify: {
            option: [{ type: this.config?.config?.temp_access_data?.expense?.modify?.type, period: this.config?.config?.temp_access_data?.expense?.modify?.period, is_allow: this.config?.config?.temp_access_data?.expense?.modify?.is_allow || false, user_type: this.VENDOR_USER_TYPE }],
            is_allow: this.config?.config?.temp_access_data?.expense?.modify?.is_allow || false
          },
          submit: {
            option: [
              { type: this.config?.config?.temp_access_data?.expense?.submit?.type, period: this.config?.config?.temp_access_data?.expense?.submit?.period, is_allow: this.config?.config?.temp_access_data?.expense?.submit?.is_allow || false, user_type: this.VENDOR_USER_TYPE }
            ], is_allow: this.config?.config?.temp_access_data?.expense?.submit?.is_allow || false
          }
        }
      });
    }
    //delete
    if (this.config?.config?.additional_budget?.options?.length > 0) {
      this.config?.config?.additional_budget?.options?.forEach(option => {
        if (option?.key === 'allow_add') {
          this.options.additionalBudgetAddTypeOptions.forEach(key => {
            if (option.options?.hasOwnProperty(key?.value)) {
              const key = this.config?.config?.additional_budget?.options[0]?.options?.type;
              const value = this.config?.config?.additional_budget?.options[0]?.options?.period;
              if (key) {
                option.options = { [key]: value };
              }
            }
          });

        }
      });
    }
    // delete this.config?.config?.temp_access_data;
    //after save make get api call
    // this.loadForm();
    this.updateConfiguration();
  }

  updateConfiguration() {
    this.loader.show();
    delete this.config?.config?.temp_access_data;
    const url = `/configurator/programs/${this.currentProgram?.id}/config?entity_code=assignment_setting`;
    const payload = { ...this.config, config: { ...(this.config?.config || {}), mass_update: { ...(this.config?.config?.mass_update || {})}}};
    if (this.config?.config?.mass_update?.options?.length) {
      this.config?.config?.mass_update?.options?.forEach(opt => {
        payload.config.mass_update.options[opt?.key] = true;
      });
    }
    this.assignmentConfigService.put(url, payload)
      .subscribe({
        next: () => {
          this.getAssignmentConfiguration();
          this.alertService.success("Assignment configuration is saved successfully");
        }, error: (err: Error | any) => {
          this.alertService.error(errorHandler(err));
        }
      }
    );
  }

  setTempAccess(temp_access, module) {
    temp_access.is_allow = this.config?.config?.temp_access_data?.is_allow;
    if (!temp_access.module_action?.modify) {
      temp_access.module_action.modify = {};
    }
    temp_access.module_action.modify.is_allow = this.config?.config?.temp_access_data[module]?.modify?.is_allow || false;
    let modifyOptionAvailable = false;
    temp_access.module_action.modify?.option?.forEach(option => {
      if (option.user_type?.toLowerCase() === this.VENDOR_USER_TYPE) {
        modifyOptionAvailable = true;
        option.type = this.config?.config?.temp_access_data[module]?.modify?.type;
        option.period = this.config?.config?.temp_access_data[module]?.modify?.period;
        option.is_allow = this.config?.config?.temp_access_data[module]?.modify.is_allow || false;
      }
    });
    if (!modifyOptionAvailable || !temp_access?.module_action?.modify?.option) {
      if (temp_access?.module_action?.modify?.option?.length > 0) {
        temp_access.module_action.modify.option.push({
          type: this.config?.config?.temp_access_data[module]?.modify.type, period: this.config?.config?.temp_access_data[module]?.modify.period, is_allow: this.config?.config?.temp_access_data[module]?.modify?.is_allow || false, user_type: this.VENDOR_USER_TYPE
        });
      } else {
        temp_access.module_action.modify.option = [{
          type: this.config?.config.temp_access_data[module]?.modify.type, period: this.config.config.temp_access_data[module]?.modify.period, is_allow: this.config.config.temp_access_data[module]?.modify.is_allow || false, user_type: this.VENDOR_USER_TYPE
        }];
      }
    }
    if (!temp_access.module_action?.submit) {
      temp_access.module_action.submit = {};
    }
    temp_access.module_action.submit.is_allow = this.config?.config?.temp_access_data[module]?.submit?.is_allow || false;
    let submitOptionAvailable = false;
    temp_access.module_action.submit?.option?.forEach(option => {
      if (option.user_type?.toLowerCase() === this.VENDOR_USER_TYPE) {
        submitOptionAvailable = true;
        option.type = this.config?.config?.temp_access_data[module]?.submit.type;
        option.period = this.config?.config?.temp_access_data[module]?.submit.period;
        option.is_allow = this.config?.config?.temp_access_data[module]?.submit.is_allow || false;
      }
    });
    if (!submitOptionAvailable || !temp_access?.module_action?.submit?.option) {
      if (temp_access?.module_action?.submit?.option?.length > 0) {
        temp_access?.module_action?.submit?.option.push({
          type: this.config?.config?.temp_access_data[module]?.submit.type, period: this.config?.config?.temp_access_data[module]?.submit?.period, is_allow: this.config?.config?.temp_access_data[module]?.submit.is_allow || false, user_type: this.VENDOR_USER_TYPE
        });
      } else {
        temp_access.module_action.submit.option = [{
          type: this.config?.config?.temp_access_data[module]?.submit.type, period: this.config?.config?.temp_access_data[module]?.submit.period, is_allow: this.config?.config?.temp_access_data[module]?.submit.is_allow || false, user_type: this.VENDOR_USER_TYPE
        }];
      }
    }
    if (module == 'timesheet') {
      if (!temp_access.module_action?.past_period) {
        temp_access.module_action.past_period = {};
      }
      temp_access.module_action.past_period.is_allow = this.config?.config?.temp_access_data[module]?.past_period?.is_allow || false;
      let pastPeriodOptionAvailable = false;
      temp_access?.module_action?.past_period?.option?.forEach(option => {
        if (!option.user_type) {
          pastPeriodOptionAvailable = true;
          option.type = this.config?.config?.temp_access_data[module]?.past_period.type;
          option.period = this.config?.config?.temp_access_data[module]?.past_period.period;
          option.is_allow = this.config?.config?.temp_access_data[module]?.past_period.is_allow || false;
        }
      });
      if (!pastPeriodOptionAvailable || !temp_access?.module_action?.past_period?.option) {
        if (temp_access.module_action.past_period?.option?.length > 0) {
          temp_access?.module_action?.past_period?.option.push({
            type: this.config?.config?.temp_access_data[module]?.past_period.type, period: this.config?.config?.temp_access_data[module]?.past_period.period, is_allow: this.config?.config?.temp_access_data[module]?.past_period.is_allow || false, user_type: null
          });
        } else {
          temp_access.module_action.past_period.option = [{
            type: this.config?.config?.temp_access_data[module]?.past_period.type, period: this.config?.config?.temp_access_data[module]?.past_period.period, is_allow: this.config?.config?.temp_access_data[module]?.past_period.is_allow || false, user_type: null
          }];
        }
      }

    }
  }

  mergeDeep(...objects) {
    const isObject = obj => obj && typeof obj === 'object';

    return objects.reduce((prev, obj) => {
      Object.keys(obj).forEach(key => {
        const pVal = prev[key];
        const oVal = obj[key];

        if (Array.isArray(pVal) && Array.isArray(oVal)) {
          if ((oVal?.length > 0 && oVal[0]?.hasOwnProperty('key')) || (pVal?.length > 0 && pVal[0]?.hasOwnProperty('key'))) {
            prev[key] = [...new Map([...pVal, ...oVal].map(item =>
              [item['key'], item])).values()];
          } else {
            prev[key] = [...pVal, ...oVal].filter((element, index, array) => array.indexOf(element) === index);//for unique
          }
          //
        }
        else if (isObject(pVal) && isObject(oVal)) {
          prev[key] = this.mergeDeep(pVal, oVal);
        }
        else {
          prev[key] = oVal;
        }
      });

      return prev;
    }, {});
  }



  showManagerOptions = [
    {label : 'Create Quick Assignment', key: 'create_assignment', isSelected: false},
    {label : 'Update Assignment', key: 'update_assignment', isSelected: false}
  ]
  massUpdateValues: any = []
  assignment_title_arr = [
    { label : 'Existing Job title', isSelected : false, key : 'search_by_job' },
    { label : 'Job Template', isSelected : false, key : 'search_by_job_template' },
  ]
  public configId: string = undefined;
  onToggleChanged(key) {
    this.config.config[key]['is_allow'] = !this.config?.config[key]?.is_allow;
    if (key === 'activity_rename') {
      this.config.config['project_based'].create.activity_rename = !this.config?.config['project_based']?.create?.activity_rename;
      return;
    }
    if(key === 'assignment_title') {
      this.config.config[key].allow_filled_job_selection = !this.config.config?.[key].allow_filled_job_selection;
      return;
    }
    if(this.config.config['do_not_rehire'].is_allow) {
      this.allowAssignmentCreation();
    }
    if(key == 'mass_update' && !this.config?.config?.[key].is_allow) {
      this.config.config.mass_update.options = this.config.config.mass_update.selectedValues = this.options.massUpdateOptions = [];
    }
    if(key==='project_based' && !this.config?.config?.[key].is_allow){
      this.config.config['project_based'].create.activity_rename = false;
    }
  }

  onToggleChangesForIsEnabled(key, index) {
    this.config.config[key].options[index].is_enabled = !this.config?.config[key]?.options[index]?.is_enabled;
  }

  getBudgetCalculatedFrom(event) {
    this.config.config.budget.value = event;
  }
  getSecondaryAssignmentValue(event) {
    this.config.config.secondary_assignment.value = event;
  }
  getUpdateImpactApprovedTSValue(event) {
    this.config.config.update_impact_approved_ts.options[0].is_enabled = event;
  }

  loadAssignmentConfiguration() {
    const currentprogram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    const url = `/assignment/programs/${currentprogram?.id}/config/${this.configId}`;
    this.assignmentConfigService.get(url)
      .subscribe({
        next: (data: any) => {
          this.config = data?.data;
        }, error: (error: Error | any) => {
          // if (error?.error?.error?.errors && error?.error?.error?.errors[0] && error?.error?.error?.errors[0].message) {
          //   this.showError(error);
          // } else {
          //   this.alertService.error('Error While loading Assignment Configuration.');
          // }
        }
      }
      );
  }

  onBack() {
    this.route.navigate(['assignment', 'configuration', 'list']);
  }

  getAssignmentTitleValues(value) {
    this.config.config.assignment_title.search_by_job = false;
    this.config.config.assignment_title.search_by_job_template = false;
    value?.forEach(element => {
      if(element == 'search_by_job') {
        this.config.config.assignment_title.search_by_job = true;
      } else if(element == 'search_by_job_template') {
        this.config.config.assignment_title.search_by_job_template = true;
      }
    });
  }

  getMultiSelectValues(values) {
    this.config.config.mass_update.selectedValues = this.options.massUpdateOptions = [];
    this.massUpdateOptionValue = [...values];
    if (values?.length) {
      values?.forEach(res => {
        if(res?.key === 'native') {
          this.options.massUpdateOptions = this.options?.massUpdateOptions?.concat(...this.duplicateOptions?.filter(res => res?.type === 'native'));
        } else if (res?.key === 'MDT') {
          this.options.massUpdateOptions = this.options?.massUpdateOptions?.concat(...this.duplicateOptions?.filter(res => res?.type === 'MDT'));
        }
      })
    } else {
      this.config.config.mass_update.field_type = [];
    }
  }
  getMultiSelectValuesOptions(values) {
    this.massUpdateValues = [...values];
  }

  onTimesheetToggleChanged(event , type) {
    if(type == 'timesheet') {
      this.config.config.temp_access_data.timesheet.submit.is_allow = !this.config?.config?.temp_access_data?.timesheet?.submit?.is_allow
    } else if(type == 'timesheet_modification') {
      this.config.config.temp_access_data.timesheet.modify.is_allow = !this.config?.config?.temp_access_data?.timesheet?.modify?.is_allow;
    } else if(type == 'expense') {
      this.config.config.temp_access_data.expense.submit.is_allow = !this.config?.config?.temp_access_data?.expense?.submit?.is_allow;
    } else if(type == 'expense_modification') {
      this.config.config.temp_access_data.expense.modify.is_allow = !this.config?.config?.temp_access_data?.expense?.modify?.is_allow;
    }
  }

  getNumberInputValue(value, type) {
    if(type == 'update_start_date') {
      this.config.config.update_start_date.period = value;
    } else if(type == 'allow_add') {
      this.config.config.additional_budget.options[0].options.period = value;
    } else if(type == 'past_period') {
      this.config.config.temp_access_data.timesheet.past_period.period = value;
    } else if(type == 'timesheet') {
      this.config.config.temp_access_data.timesheet.submit.period = value;
    } else if(type == 'timesheet_modification') {
      this.config.config.temp_access_data.timesheet.modify.period = value;
    } else if(type == 'expense') {
      this.config.config.temp_access_data.expense.submit.period = value;
    } else if(type == 'expense_modification') {
      this.config.config.temp_access_data.expense.modify.period = value;
    }
  }

  getCalendarValue(value, type) {
    if(type == 'update_start_date') {
      this.config.config.update_start_date.type = value;
    } else if(type == 'allow_add') {
      this.config.config.additional_budget.options[0].options.type = value;
    } else if(type == 'past_period') {
      this.config.config.temp_access_data.timesheet.past_period.type = value;
    } else if(type == 'timesheet') {
      this.config.config.temp_access_data.timesheet.submit.type = value;
    } else if(type == 'timesheet_modification') {
      this.config.config.temp_access_data.timesheet.modify.type = value;
    } else if(type == 'expense') {
      this.config.config.temp_access_data.expense.submit.type = value;
    } else if(type == 'expense_modification') {
      this.config.config.temp_access_data.expense.modify.type = value;
    }
  }

  getShowManagersValues(values) {
    this.config.config.show_managers.create.is_enabled = false;
    this.config.config.show_managers.update.is_enabled = false;
    values?.forEach(element => {
      if(element == 'create_assignment') {
        this.config.config.show_managers.create.is_enabled = true;
      }
      if(element == 'update_assignment') {
        this.config.config.show_managers.update.is_enabled = true;
      }
    });
  }

  selectAllCheckbox() {
    this.options.activeOnData.forEach(key => {
        key.isEnabled = true;
    });
    this.assignmentActiveUpon = "Unselect all";
  }

  unSelectAllCheckbox() {
    this.options.activeOnData.forEach(key => {
      key.isEnabled = false;
      this.assignmentActiveUpon = "Select all";
    });
  }
}
