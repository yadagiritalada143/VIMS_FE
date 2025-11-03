import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { UpdateFormRenderModel } from 'src/app/library/form-renderer/form-renderer.model';
import { AssignmentService } from '../assignment.service';
import { ConfirmationDialogService } from 'src/app/shared/components/confirmation-dialog/confirmation-dialog.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { EmitEvent, Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { ReasonCodesService } from 'src/app/shared/service/reson-codes.service';
import { MassUpdateService } from '../mass-update.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { LOG_TYPE } from 'src/app/library/logs/logs.model';
import { FormRendererService } from 'src/app/library/form-renderer/form-renderer.service';
import { AccuracyPipe } from 'src/app/shared/pipe/accuracy.pipe';
import { AccuracyConfigEnum, CurrencyConfig } from '../enums/accuracy-config';
import { errorHandler } from 'src/app/shared/util/error-handler';

import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { ChangeDetectorRef } from '@angular/core';

export enum FIELDS_TO_UPDATE {
  END_DATE = 'end_date',
  ASSIGNEMENT_MANAGER = 'assignment_manager',
  TIMESHEET_MANAGER= 'timesheet_manager',
  EXPENSE_MANAGER = 'expense_manager',
  MASTER_DATA_TYPE = 'MDT',
  WORK_LOCATION= 'work_location'
}
export enum UPDATE_FOR {
  DATE = 'date',
  RATE = 'rate',
  REVIEW = 'review',
  TAX = 'tax'
}

@Component({
  selector: 'app-mass-assignment',
  templateUrl: './mass-assignment.component.html',
  styleUrls: ['./mass-assignment.component.scss']
})
export class MassAssignmentComponent implements OnInit {

  @ViewChild('target') target: ElementRef;
  disableAddActionButton :boolean = true;
  fieldOption=[];
  programId: string;
  fields = [];
  reasonCodes = [];
  errorCheckList = [];
  updateConfig: UpdateFormRenderModel[];
  assignmentIds = [];
  configVersion: any;
  allValidationList: any = [];
  updateForm: UntypedFormGroup = this.fb.group({
    module: [{ value: null, disabled: true }],
    field_name: [],
    effective_date: [''],
    reason: [null, [Validators.required]],
    request_notes: [],
    documents: [],
    fields:  this.fb.array([])
  });
  actionCode: any;
  reviewAcceptence = false;
  submitted : boolean = false;
  formValue: any={};
  validationList = [];
  showModule = 'hidden';
  showFailedAssignments= 'hidden';
  updateDetails: boolean = true;
  summary: boolean = false;
  showImpactedBilling: string = "hidden";
  selectedValues: any = [];
  failedAssignments: any = [];
  logs:any= undefined;
  public totalRecords = 0;
  public itemsPerPage = 10;
  public currentPage = 1;
  public pageNumber = 1;
  recordsPerPageSetting?= [10];
  public maxPages = 1;
  public limit= 10;
  massUpdateDetails: any = {};
  dateFormat = 'yyyy/MM/dd'; // 'dd/MM/yyyy';
  accuracyConfig = AccuracyConfigEnum;
  public currencyConfig = CurrencyConfig
  formatted_working_days: any;
  is_activity_based = false;
  assignmentData: any;
  newResourseBudget: any;
  noImpactedData: boolean;
  selectedModule: any;
  support_text = {
      id:'module_level',
      support_text : 'By performing fields update in bulk, only the specific field(s) value selected will be updated. No other dependent field will be impacted or automatically updated as a result of this change. If dependent fields are able to be updated in bulk, the recommendation is to include those fields in this bulk update as well.',
      close_icon : true
  }
  showDialogBox: boolean;
  action: string;
  linkText: string = "View More";
  textVisibility: boolean = false;
  constructor(
    public route: ActivatedRoute,
    public _assignmentService: AssignmentService,
    private storageService: StorageService,
    private fb: UntypedFormBuilder,
    private confirmService: ConfirmationDialogService,
    private alertService: AlertService,
    private router: Router,
    private reasonCodesService: ReasonCodesService,
    private eventStream: EventStreamService,
    private loaderService: LoaderService,
    private _formRendererService: FormRendererService,
    private accuracyPipe: AccuracyPipe,
    private datePipe: LocalDateFormatPipe,
    public massUpdateService:MassUpdateService,
    private cdref: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.showDialogBox = true;
    this.massUpdateDetails = {};
    let programDetails = this.storageService?.get(StorageKeys.CURRENT_PROGRAM);
    this.route.queryParamMap.subscribe(param => {
      if(param) {
        this.action = param?.get('actions') === 'Bulk Close' ? 'bulk_close' : 'bulk_update';
        this.disableAddActionButton = param?.get('actions') === 'Bulk Close' ? false : true;
        this.assignmentIds = param?.get('assignment_ids')?.split(',');
      }

    })
    this.dateFormat = this._assignmentService?.getDefaultDateFormat();
    this.massUpdateService.selectedAssignments$.subscribe((value) => {
      if(value && value?.length > 0) {
        this.assignmentIds = value?.map(ids=> {
           if(ids?.hasOwnProperty('allRecordSelected') ) {
            this.massUpdateDetails.validateAllRecord = ids;
            this.assignmentIds = new Array();
           } else {
            return ids?.id
           }

        });
      }
    });
    if((!this.assignmentIds || this.assignmentIds?.length === 0 ) && !this.massUpdateDetails?.validateAllRecord?.allRecordSelected ) {
      this.back();
    }
    this.updateConfig =  JSON?.parse(JSON?.stringify(this.massUpdateService?.dataSourceUrl))
    this.programId = programDetails['id'];
    // this.getAssignmentConfig();
    this.getReasonCode();
    this.getAssignmentConfig();
    this.updateForm.valueChanges.subscribe(res => {
      this.reviewAcceptence = false;
    })
    this.updateForm.get('effective_date')?.valueChanges.subscribe(res => {
      if(this.action === 'bulk_close') {
        this.fieldsArray?.at(0)?.get('field_value')?.setValue(this._assignmentService.convertDateFormat(res));
        this.fieldsArray?.at(0)?.get('field_label')?.setValue('assignment closing date');
      }
    })
  }

  get updateFormControl() {
    return this.updateForm.controls;
  }

  getReasonCode() {
    this.reasonCodesService?.getResoncodesFor('REQUEST_AMENDMENT')
      .subscribe(res => {
        const { reason_codes, resonCodeID } = res;
        this.reasonCodes = reason_codes;
        this.actionCode = resonCodeID;
      })
  }

  fieldSeclectionChanged(event , i) {
    if (event) {
      this.removeLabel();
      this.disableAddActionButton = true;
      this.updateForm.addControl(event?.slug, this.fb.control(null));
      let clearSelectedField = this.fields?.filter(res => !(res?.slug === event?.slug)).map(res => res?.slug);
      if (this.fieldsArray?.length === 1) {
        clearSelectedField?.forEach(res => {
          if (this.updateForm?.get(res)) {
            this.updateForm.get(res)?.clearValidators();
            this.updateForm.get(res)?.updateValueAndValidity();
          }
        })
      }
      this.updateForm.get(event?.slug)?.addValidators(Validators.required);
      this.updateForm.get(event?.slug)?.updateValueAndValidity();
      this.updateEffectiveDateControl(event);
      this.isFieldNameExist(event,i);
      this.eventStream.emit(new EmitEvent(Events.UPDATE_DROPDOWN_VALUES, {slug : event?.slug , value : null}));
      this.onFieldValueChange(event?.slug);
      this.cdref.detectChanges();
    }
  }
  removeLabel() {
    this.fieldOption=[...this.fields];
    this.fieldsArray?.getRawValue().forEach(res => {
      let index = this.fieldOption?.findIndex(field => field?.slug === res?.field_name?.slug);
      if(index > -1) {this.fieldOption?.splice(index , 1)}
    })
  }
  get hideAddNewButton() {
     return (this.fieldsArray?.getRawValue().length === this.fields?.length);
  }
  getKeyName(field) {
    if(field) {
      return field?.slug
    }
  }
  updateEffectiveDateControl(event , applyValidation = true){
    if((event && event?.slug !== FIELDS_TO_UPDATE.END_DATE && applyValidation) || this.fieldsArray?.length >= 2) {
      this.updateForm.get('effective_date')?.setValidators([Validators.required]);
    } else {
      this.updateForm.get('effective_date')?.clearValidators();
    }
    this.updateForm.get('effective_date')?.updateValueAndValidity();
    if (this.formValue?.effective_date) {
        this.formValue.effective_date = null;
    }
  }
  getAssignmentConfig() {
    this._assignmentService.get(`/configurator/programs/${this.programId}/config?entity_code=assignment_setting`)
      .subscribe((res: any) => {
        const { config } = res;
        const { resource_budget } = config;
        config.mass_update.options = {};
        let updateConfigData = [];
        return new Promise<void>((resolve, reject) => {
          let isMDT = config?.mass_update?.field_type?.some(res => (res?.field === 'MDT' && res?.is_allow));
          this.getFoundationalFieldsValue().then((data) => {
          if(config?.mass_update?.field_type?.length) {
            config?.mass_update?.field_type?.forEach(res => {
              if (res?.is_allow) {
                config.mass_update.options = Object.assign(config?.mass_update?.options, res?.options[0]);
              }
              if (isMDT &&  res?.options[0]) {
                  Object.keys(res?.options[0])?.forEach(d => {
                    let selectedData = data?.foundational_data_types?.filter(fData => fData?.slug === d);
                    let obj = {
                      'slug': selectedData[0]?.slug,
                      'id': selectedData[0]?.slug,
                      'slug_id':selectedData[0]?.id,
                      'datasource': {
                        'url': `/configurator/programs/${this.programId}/foundational-data-types/${selectedData[0]?.id}/foundational-data?info_level=basic&ordering=name&active=true&limit=25`,
                        'type': 'url',
                        'page' : 1,
                        'getBy': [
                          'foundational_data'
                        ]
                      },
                      "bind_value": "id",
                      "bind_label": ['name'],
                      'label': `${selectedData[0]?.name}`,
                      "placeholder": `Select ${selectedData[0]?.name}`,
                      "type": "HUMAN_DROPDOWN",
                      "selectionType": 'MDT',
                      "separator" : '-'
                    }
                    updateConfigData.push(obj);
                  });
                  resolve();
              } else {
                resolve();
              }
            });
          } else {
            resolve();
          }
        });
        }).then(() => {
          if (config && config?.mass_update && config?.mass_update?.is_allow) {
            let _this = this;
            let fields = Object.keys(config?.mass_update?.options).map(function (k) {
              if (config?.mass_update?.options[k] === true) {
                _this.updateConfig.push(...updateConfigData);
                let config = _this.updateConfig?.find(configData => configData?.slug?.toLowerCase() === k?.toLowerCase())
                return Object.assign({ slug: k, label: k?.replace(/_/g, " ") }, config);
              }
            }).filter(c => c);
            this.fields = [...this.fields, ...fields];
            this.fieldOption = [...this.fields];
            const massUpdateForm = this.fb.group({
              field_name: [null, this.action !== 'bulk_close' ? [Validators.required]:[]],
              field_value: ['', this.action !== 'bulk_close' ? [Validators.required]:[]],
              field_label: ['']
            });
            let formArray = this.updateForm?.get('fields') as UntypedFormArray;
            formArray.push(massUpdateForm);
            this.fields.forEach(field => {
              this.errorCheckList[field?.slug] = `${field?.label} required.`
            });
            if (resource_budget?.is_allow && resource_budget?.post_method) {
              this.massUpdateDetails['resource_budget_setting'] = (resource_budget?.post_method === 'true' || resource_budget?.post_method === true);
            }
          }
        });
      })

  }

  getFoundationalFieldsValue() {
    return new Promise<any>((resolve) => {
      let url = `/configurator/programs/${this.programId}/foundational-data-types?active=true&ordering=ref_order`;
      this._assignmentService.get(url).subscribe((res: any) => {
        resolve(res);
      })
    })
  }

  get fieldsArray(): UntypedFormArray {
    return this.updateForm.get('fields') as UntypedFormArray;
  }

  onFieldValueChange(event,i?) {
    if (event?.slug && event?.value) {
      this.disableAddActionButton = event?.disable;
      if (!this.selectedValues) {
        this.selectedValues = new Array();
      }
      let value = Array.isArray(this.storageService?.get(event?.slug)) ? this.storageService?.get(event?.slug)?.find(val => val?.id === event?.value) || null : null;
      if (!this.selectedValues.some(f => f?.slug === event?.slug)) {
        this.selectedValues.push({ slug: event?.slug, value: event?.value, id: event?.value, new_value: value });
      } else {
        Object.assign(this.selectedValues.filter(res => res?.slug?.toLowerCase() === event?.slug?.toLowerCase())[0], { slug: event?.slug, value: event?.value, id: event?.value, new_value: value });
      }
      let fieldIndex = this.fieldsArray?.value?.findIndex(f => f?.field_name?.slug === event?.slug);
      if (fieldIndex !== -1) {
        this.fieldsArray.at(fieldIndex).patchValue({
          field_value: event?.slug?.toLowerCase() === FIELDS_TO_UPDATE.END_DATE ? this._assignmentService.convertDateFormat(event?.value) : event?.value,
          field_label: event?.slug?.replace(/_/g, " ")
        });
      }
      this.updateEffectiveDateControl(event);
    }
  }

  isFieldNameExist(value, i ) {
    let fieldData = this.updateForm.get('fields') as UntypedFormArray;
    let isPresent = fieldData?.value?.some((act, index) => {
      if (index !== i) {
        let fieldName = act?.field_name?.slug ;
        return (fieldName?.toLowerCase()?.trim() === value?.slug?.toLowerCase()?.trim());
      }
      return false;
    });
    if (isPresent) {
      setTimeout(() => {
        fieldData.at(i)?.get('field_name')?.markAsDirty();
        fieldData.at(i)?.get('field_name')?.markAsTouched();
        fieldData.at(i)?.get('field_name')?.setErrors({ invalidName: true });
      }, 1);
    } else {
     let err = fieldData.at(i)?.get('field_name')?.errors;
     fieldData.at(i)?.get('field_name')?.setErrors(err || null);
     fieldData.at(i)?.get('field_name').updateValueAndValidity();
    }
    this.eventStream.emit(new EmitEvent(Events.SAME_NAME_EXIST, {slug: fieldData.at(i)?.get('field_name')?.value?.slug , value : isPresent}));
    this.cdref.detectChanges();
  }

  isFieldExist(slug?) {
    let isPresent = new Array();
    let fieldData = this.updateForm.get('fields') as UntypedFormArray;
    fieldData.value.forEach(res => {
      if(res?.field_name?.slug === slug?.slug) {
        isPresent.push(res);
      }
    });
    this.eventStream.emit(new EmitEvent(Events.SAME_NAME_EXIST, {slug  : slug?.slug , value : isPresent?.length > 1 ? true  :false}));
  }

  get disableAddAction() {
    if (this.updateForm.get('fields')?.valid && !this.disableAddActionButton) {
      return false || (this.action === 'bulk_close' ? false : Boolean(this.fieldsArray?.length == 0) );
    } else {
      return true;
    }
  }

  addNewFields() {
    const massUpdateForm = this.fb.group({
      field_name: [null,this.action !== 'bulk_close' ? [Validators.required]:[]],
      field_value: ['' ,this.action !== 'bulk_close' ? [Validators.required]:[]],
      field_label: ['']
    });
    let formArray = this.updateForm.get('fields') as UntypedFormArray;
    this.removeLabel();
    formArray.push(massUpdateForm);
    // this.massUpdateDetails.fields.push({});
  }
  removeFields(index) {
    if(index) {
      this.fieldsArray?.removeAt(index);
      this.fieldsArray?.updateValueAndValidity();
      this.removeLabel();
      this.fieldsArray?.value?.forEach((res , index) => {
        this.fieldSeclectionChanged(res?.field_name, index)
      });
      this.disableAddActionButton = false;
    }
  }
  submitForm() {
    this.logs = undefined;
    this.loaderService.show();
    let payload = this.updateForm.value;
    this.formValue = {
      ...payload,
      selectedField: Object.assign({}, payload?.field_name),
      selectedValue:  this.storageService.get(payload?.field_name?.slug) ? this.storageService.get(payload?.field_name?.slug)?.find(val => val.id === payload[payload?.field_name?.slug]) :  this.selectedValues?.find(val=> val.slug=== payload?.field_name?.slug )
    };
      payload.fields = this.formValue?.fields?.filter(res => res?.field_name?.selectionType !== 'MDT')?.map((ele)=>{
      return { key: this.action === 'bulk_close' ? 'end_date' : ele?.field_name?.slug , value : this.action === 'bulk_close' ?  this._assignmentService.convertDateFormat(payload?.effective_date) :  (ele?.field_name?.slug?.toLowerCase() === FIELDS_TO_UPDATE.END_DATE ?  this._assignmentService.convertDateFormat(ele?.field_value) : ele?.field_value)};
    });
    if(this.setPayloadOf('MDT')?.length) {
      payload.fields.push({key : 'foundational' , value : this.setPayloadOf('MDT')});
    }
    payload.assignment_ids = this.assignmentIds;
    delete payload?.field_name;
    if(payload?.effective_date) {
      payload.effective_date = this._assignmentService.convertDateFormat(payload?.effective_date)
    }
    if(payload?.end_date) {payload.end_date = this._assignmentService.convertDateFormat(payload?.end_date)}
    payload.is_assignment_action = this.action === 'bulk_close' ? 'terminate' : 'update';
    this.massUpdateDetails.payload = JSON.parse(JSON.stringify(payload));
    this.validateUpdateAllRecords(payload);
  }
  validityObj = {};
  validateUpdateAllRecords(payload) {
    const url = `/assignment/programs/${this.programId}/mass/validate`;
    this.validityObj = {};
    if(payload?.is_pagination) {delete payload?.is_pagination}
    if(this.massUpdateDetails?.validateAllRecord?.allRecordSelected) {
      payload = {
      "process": "all",
       search: this.massUpdateDetails?.validateAllRecord?.search? this.massUpdateDetails?.validateAllRecord?.search: null,
       filter: this.massUpdateDetails?.validateAllRecord?.filter? this.massUpdateDetails?.validateAllRecord?.filter: {},
       exclude_assignment_uuids: this.massUpdateDetails?.validateAllRecord?.exclude_assignment_uuids? this.massUpdateDetails?.validateAllRecord?.exclude_assignment_uuids: [],
       fields: payload.fields,
       effective_date: this._assignmentService.convertDateFormat(payload?.effective_date),
       is_assignment_action : this.action === 'bulk_close' ? 'terminate' : 'update'
      }
    }
    this._assignmentService.post(url, payload)
      .subscribe((res: any) => {
       this.allValidationList = res.data;
       this.loaderService.hide();
      if(this.allValidationList?.total_request) {
       this.totalRecords = this.allValidationList?.total_request || 0;
       let failedAssignment = this.allValidationList?.assignment?.filter(assignemnt=> !assignemnt?.is_allowed_update);
       this.massUpdateService.setFailedAssignment(failedAssignment);
       this.failedAssignments = failedAssignment?.map(assigment=> assigment?.id) ;
       if(this.massUpdateDetails?.validateAllRecord?.allRecordSelected) {
        this.assignmentIds = this.allValidationList?.assignment?.map(assignment=> assignment?.id)
       }
       this.allValidationList?.assignment?.forEach(element => {
          element.can_update = element?.is_allowed_update;
        this.validityObj[element?.id] = element?.is_allowed_update;
      });
       this.pagination();
        // this.validationList = res.data.assignment;

        this.validateUpdate(payload)
     }

      }, error=> {
        this.loaderService.hide();
      });
  }


  validateUpdate(payload) {
    payload.effective_date = this._assignmentService.convertDateFormat(payload.effective_date);
    payload.is_pagination= true;
    this.loaderService.show();
    // payload.page = 1;
    // payload.limit = this.limit;
    payload.assignment_ids = this.getRecordsByPage(this.assignmentIds, this.pageNumber, this.limit);

    const url = `/assignment/programs/${this.programId}/mass/validate`;
    this._assignmentService.post(url, payload)
      .subscribe({next:(res: any) => {
        this.summary = true;
        this.updateDetails = false;
        this.submitted = true;
        this.validationList = res?.data?.assignment || [];
        const mergeResponse = this.validationList?.map(validAssignment => ({...validAssignment, ...this.allValidationList?.assignment?.find(assignment => assignment?.id === validAssignment?.id)}))
        this.validationList = [...mergeResponse];
        this.loaderService.hide();
        this.getImpactedCount('timesheet');
        this.getImpactedCount('expense');
        if(this.validationList && this.validationList?.length > 0) {
          setTimeout(() => {
            this.submitted = true;
            this.target?.nativeElement?.scrollIntoView({ behavior: "smooth", block: "start" });
          }, 500);
        }
       let assignment =  this.validationList?.find(assignment=> assignment?.is_allowed_update);
       if(assignment) {
        assignment.visible = true;
       }
      },error: err => {
        this.loaderService.hide();
      }});
  }
  getImpactedCount(fieldName?) {
    if (this.formValue.fields?.length === 1 && (this.formValue?.hasOwnProperty(FIELDS_TO_UPDATE.WORK_LOCATION)) ) {
    return
    }
    let payload : any;
    if (fieldName === 'timesheet') {
      payload = {
        input: {
          effective_start_date: this.formValue?.effective_date ? this._assignmentService.convertDateFormat(this.formValue?.effective_date) : null,
          finance_change: {
            start_date_change: false,
            end_date_change: this.action === 'bulk_close' ? true : false,
            rate_change: false,
            st_hours: false,
            days_per_week: false,
            fee_change: false,
            tax_change: false
          },
          non_finance_change: {
            timesheet_manager: null, // future case, not needed as of now
            custom_field: false
          },
          is_non_finance_change: 0,
          is_finance_change: 0
        },
      }
      if (this.formValue?.hasOwnProperty(FIELDS_TO_UPDATE.TIMESHEET_MANAGER) && this.formValue[FIELDS_TO_UPDATE.TIMESHEET_MANAGER] && this.fieldsArray?.getRawValue()?.some(f => f?.field_name?.slug === FIELDS_TO_UPDATE.TIMESHEET_MANAGER)) {
        payload.input.is_non_finance_change = 1;
        payload.input.non_finance_change.timesheet_manager = [this.formValue[FIELDS_TO_UPDATE.TIMESHEET_MANAGER]];
      }
      if (this.formValue?.fields && this.formValue?.fields?.length > 0) {
        let end_date_present = this.formValue?.fields.some(f => f?.field_name?.slug === FIELDS_TO_UPDATE.END_DATE);
        if (end_date_present) {
          payload.input.finance_change.end_date_change = true;
        }
        if (this.formValue.fields?.length === 1 && end_date_present) {
          payload.input.effective_start_date = null;
        }
      }
      if (payload?.input?.finance_change?.end_date_change || this.action === 'bulk_close') {
        payload.input.is_finance_change = 1
      }
    } else if (fieldName === 'expense') {
      payload = {
        input: {
          effective_start_date: this.formValue?.effective_date ? this._assignmentService.convertDateFormat(this.formValue?.effective_date) : null,
          finance_change: {},
          non_finance_change: {},
          is_finance_change: this.action === 'bulk_close' ? true : false,
          is_non_finance_change: false,
          // is_expense_enable: false  // commited for V2M-21034
        },
        assignment: []
      }
      if (this.formValue?.hasOwnProperty(FIELDS_TO_UPDATE.EXPENSE_MANAGER) && this.formValue[FIELDS_TO_UPDATE.EXPENSE_MANAGER] && this.fieldsArray?.getRawValue()?.some(f => f?.field_name?.slug === FIELDS_TO_UPDATE.EXPENSE_MANAGER)) {
        payload.input.is_non_finance_change = true;
        payload.input.non_finance_change.expense_manager = [this.formValue[FIELDS_TO_UPDATE.EXPENSE_MANAGER]];
      }
      if (this.formValue?.hasOwnProperty(FIELDS_TO_UPDATE.ASSIGNEMENT_MANAGER) && this.formValue[FIELDS_TO_UPDATE.ASSIGNEMENT_MANAGER] && this.fieldsArray?.getRawValue()?.some(f => f?.field_name?.slug === FIELDS_TO_UPDATE.ASSIGNEMENT_MANAGER)) {
        payload.input.is_non_finance_change = true;
        payload.input.non_finance_change.assignment_manager = this.formValue[FIELDS_TO_UPDATE.ASSIGNEMENT_MANAGER];
      }
    }
      let assignments = new Array();
      let validAssignment = this.validationList.filter(assign => assign?.is_allowed_update);
      validAssignment?.forEach((m) => {
        assignments.push({ assignment_uuid: m?.id, hierarchy_id: m?.hierarchy_id, new_end_date: this.action === 'bulk_close' ? this._assignmentService.convertDateFormat(this.formValue?.effective_date) : this.updateForm?.value?.end_date ?? null, old_end_date: m?.end_date ?? null });
      });
      fieldName === 'timesheet' ? payload.assignments = assignments : payload.assignment = assignments;
      if (assignments && assignments?.length === 0) {
        return;
      }
    const url = `/${fieldName}/programs/${this.programId}/mass/impacted`;
    this._assignmentService.post(url, payload)
      .subscribe({
        next: (res: any) => {
          let assignments = fieldName === 'timesheet'? res?.data?.assignments: res?.data;
          this.validationList?.forEach((item) => {
            assignments?.forEach((ele) => {
              if (ele?.assignment_uuid === item?.id) {
                if (fieldName === 'timesheet' && !item?.impacted_timesheet) {
                  item.impacted_timesheet = {};
                  item.impacted_timesheet['count'] = ele?.count || 0;
                } else if(fieldName === 'expense' && !item?.impacted_expense) {
                  item.impacted_expense = {};
                  item.impacted_expense['count'] = ele?.count || 0;
                }
              }
            });
          });
        }, error: error => {
          this.loaderService.hide();
        }
      });
  }

  impactedModule = [];
  openImpactedTimesheetExpense(data , fieldName?) {
    this.selectedModule = fieldName;
    this.showModule = 'visible';
    this.impactedModule = new Array();
    if (this.formValue.fields?.length === 1 && (this.formValue?.hasOwnProperty(FIELDS_TO_UPDATE.WORK_LOCATION))) {
      this.noImpactedData = true;
      return
    }
    let payload : any;
    if (fieldName === 'timesheet') {
       payload = {
        page: 1,
        per_page: 15,
        effective_start_date: this.formValue?.effective_date ? this._assignmentService.convertDateFormat(this.formValue?.effective_date) : null,
        hierarchy_id: data?.hierarchy_id,
        finance_change: {
          start_date_change: false,
          end_date_change: this.action === 'bulk_close' ? true : false,
          rate_change: false,
          st_hours: false,
          days_per_week: false,
          fee_change: false,
          tax_change: false
        },
        non_finance_change: {
          timesheet_manager: null, // future case, not needed as of now
          custom_field: false,
          activity_rename: false,
          timesheet_type: data?.finance?.timesheet_type ?? false,
        },
        location_change: {
          work_location: null,
          location_type: null
        },
        location: {
          new: null,
          old: null
        },
        is_non_finance_change: 0,
        is_finance_change: 0,
        is_location_change: 0,
        is_timesheet_type_change: 0,
        old_end_date: data?.end_date,
        old_start_date: data?.start_date,
        new_end_date: this.action === 'bulk_close' ? this._assignmentService.convertDateFormat(this.formValue?.effective_date) : this._assignmentService.convertDateFormat(this.formValue?.end_date || data?.end_date),
        new_start_date: this._assignmentService.convertDateFormat(data?.start_date),
      }
      if (this.formValue?.fields && this.formValue?.fields?.length > 0) {
        let end_date_present = this.formValue?.fields.some(f => f?.field_name?.slug === FIELDS_TO_UPDATE.END_DATE);
        if (end_date_present) {
          payload.finance_change.end_date_change = true;
          const modified_effective_date = this._assignmentService.addDays(this._assignmentService.convertDateFormat(data?.end_date), 1);
          if (modified_effective_date && this.formValue.fields?.length === 1) {
            payload.effective_start_date = this._assignmentService.convertDateFormat(this.datePipe.transform(modified_effective_date, this.dateFormat, undefined, undefined, true))
          }
        }
      }
      if (payload?.finance_change?.end_date_change || this.action === 'bulk_close') {
        payload.is_finance_change = 1
      }
      //  uncomment for Timesheet manager change implementation
      if (this.formValue?.hasOwnProperty(FIELDS_TO_UPDATE.TIMESHEET_MANAGER) && this.formValue[FIELDS_TO_UPDATE.TIMESHEET_MANAGER] && this.formValue[FIELDS_TO_UPDATE.TIMESHEET_MANAGER] != data?.timesheet_manager?.id) {
        payload.is_non_finance_change = 1;
        payload.non_finance_change.timesheet_manager = [data?.timesheet_manager?.id];
      }
    } else if (fieldName === "expense") {
      payload = {
        effective_start_date: this.formValue?.effective_date ? this._assignmentService.convertDateFormat(this.formValue?.effective_date) : this.setDate(data),
        is_finance_change: this.action === 'bulk_close' ? true :false,
        is_non_finance_change: false,
        is_expense_enable: data?.is_expense_enabled,
        finance_change: [],
        non_finance_change: {},
        is_manager_change : false
      }
      if((this.fieldsArray?.value?.some(res => res?.field_name?.slug?.toLowerCase() === FIELDS_TO_UPDATE.EXPENSE_MANAGER) && this.fieldsArray?.value?.filter(res => res?.field_name?.slug?.toLowerCase() === FIELDS_TO_UPDATE.EXPENSE_MANAGER).map(res => res?.field_value)[0] !== data?.expense_manager?.id) || (this.fieldsArray?.value?.some(res => res?.field_name?.slug?.toLowerCase() === FIELDS_TO_UPDATE.ASSIGNEMENT_MANAGER) && this.fieldsArray?.value?.filter(res => res?.field_name?.slug?.toLowerCase() === FIELDS_TO_UPDATE.ASSIGNEMENT_MANAGER).map(res => res?.field_value)[0] !== data?.assignment_manager?.id)) {
        payload.is_manager_change = true;
      }
      if (this.formValue?.hasOwnProperty(FIELDS_TO_UPDATE.EXPENSE_MANAGER) && this.formValue[FIELDS_TO_UPDATE.EXPENSE_MANAGER] && this.fieldsArray?.getRawValue()?.some(f => f?.field_name?.slug === FIELDS_TO_UPDATE.EXPENSE_MANAGER)) {
        payload.is_non_finance_change = true;
        payload.non_finance_change.expense_manager = [this.formValue[FIELDS_TO_UPDATE.EXPENSE_MANAGER]];
      }
      if (this.formValue?.hasOwnProperty(FIELDS_TO_UPDATE.ASSIGNEMENT_MANAGER) && this.formValue[FIELDS_TO_UPDATE.ASSIGNEMENT_MANAGER] && this.fieldsArray?.getRawValue()?.some(f => f?.field_name?.slug === FIELDS_TO_UPDATE.ASSIGNEMENT_MANAGER)) {
        payload.is_non_finance_change = true;
        payload.non_finance_change.assignment_manager = this.formValue[FIELDS_TO_UPDATE.ASSIGNEMENT_MANAGER];
      }
    }
    const url = `/${fieldName}/programs/${this.programId}/assignment/${data.id}/${fieldName === 'timesheet' ? 'impacted' : 'impact'}`;
    this._assignmentService.post(url, payload)
      .subscribe({
        next: (data: any) => {
          this.impactedModule = new Array();
          this.noImpactedData = true;
          if(fieldName === 'expense'  &&  data?.data?.expenses?.length > 0) {
            this.noImpactedData = false;
            this.impactedModule = [...data?.data?.expenses];
            this.impactedModule = [...this.impactedModule];
          } 
           if ( fieldName === 'timesheet' && data?.data[fieldName] && data?.data[fieldName]?.length > 0) {
            this.impactedModule =  [...data?.data[fieldName]];
            this.noImpactedData = false;
          } 
        }, error: error => {
          if(error?.error?.error?.data == null){
            this.noImpactedData = true;
          } else{
            this.noImpactedData = false;
          }
          this.impactedModule = new Array();
          this.showError(error);
          this.loaderService.hide();
        }
      });
  }
  setDate(data){
    const modified_effective_date = this._assignmentService.addDays(this._assignmentService.convertDateFormat(data?.end_date), 1);
    if (modified_effective_date && this.formValue.fields?.length === 1) {
        return  this._assignmentService.convertDateFormat(this.datePipe.transform(modified_effective_date, this.dateFormat, undefined, undefined, true))
    }
  }
  // addDays(dateString: string, noOfDays: number = 0) {
  //   const date = dateString?.split("-");
  //   if (date?.length === 3) {
  //     const new_Date = new Date(parseInt(date[0]), parseInt(date[1]) - 1, parseInt(date[2]), 0, 0, 0, 0); //new Date(duration?.start_date+ " 00:00:00"); fixed for safari
  //     new_Date?.setDate(new_Date?.getDate() + noOfDays);
  //     return new_Date;
  //   }
  //   return null;
  // }
  showError(err){
    window.scrollTo(0,0);
    this.logs = {
      type: LOG_TYPE.ERROR, heading: err?.error?.error?.message, messages: [], autoClose: true, isShown: true, showReportButton: err?.status == 500, additionalInfo:{trace_id: err?.error?.trace_id } };
      err?.error?.error?.errors?.forEach(msg => {
        if (msg?.message) {
          this.logs.messages.push(msg?.message);
        }
      });
  }

  submit() {
    this.confirmService.confirm('', `Click Yes to complete the Assignment${this.action === 'bulk_close' ? ' Bulk Close ' : ' Bulk Update '}with impacts on related timesheets and/or expenses. `,
      'Yes', 'No')
      .then((confirmed) => {
        if(confirmed) {
          this.loaderService.show();
          let payload:any = {
            effective_date: this.formValue?.effective_date ? this._assignmentService.convertDateFormat(this.formValue?.effective_date ) : null,
            reason: this.formValue?.reason,
            request_notes: this.formValue?.request_notes,
            reason_code_action:  this.actionCode,
            documents: null,
            assignment: this.assignmentIds
              .filter(assign => this.validityObj[assign])
              .map(assign => {
                return  assign
              }),
              fields : this.formValue?.fields?.filter(res => res?.field_name?.selectionType !== 'MDT').map((ele)=>{
                return { key: this.action === 'bulk_close' ? 'end_date' : ele?.field_name?.slug , value: ele?.field_value};
              }),
              impact_timesheet_flag: false,
              impact_expense_flag:false
          };
          if(this.formValue?.documents && this.formValue?.documents?.length > 0) {
            payload.documents = {key:this.formValue?.documents[0]?.key,filename:this.formValue?.documents[0]?.name}
          }
          if(confirmed){
            payload={
              ...payload,
              impact_timesheet_flag: true,
              impact_expense_flag:true
            }
          }
          payload.is_assignment_action = this.action === 'bulk_close' ? 'terminate' : 'update';
          if(this.setPayloadOf('MDT')?.length) {
            payload.fields.push({key : 'foundational' , value : this.setPayloadOf('MDT')});
          }
          this._assignmentService.put(`/assignment/programs/${this.programId}/mass/update`, payload)
            .subscribe({
              next: res => {
                this.loaderService.hide();
                this.alertService.success('Successfully updated.');
                this.submitted = false;
                this.validationList = [];
                this.validityObj = {};
                this.goToProgressTab();
              },
              error: err => {
                this.loaderService.hide();
                this.showError(err);
               }
            })
          }
      })
      .catch(() => {

      });
  }
  setPayloadOf(event) {
    if (event === 'MDT') {
      let foundationalPayloadValue = [];
      this.formValue?.fields.forEach(ele => {
        if (ele?.field_name?.selectionType === 'MDT') {
          foundationalPayloadValue?.push({ key: ele?.field_name?.slug, value: [ele?.field_value], id: ele?.field_name?.slug_id })
        }
      });
      return foundationalPayloadValue;
    }
  }
  cancle() {
    this.confirmService.confirm('', `Are you sure you want to abort updating selected fields`,
    'Yes', 'No')
    .then((confirmed) => {
      if (confirmed) {
        if(this.updateDetails) {
            this.router.navigate(['/assignment/all-list/open']);
          }
        this.updateForm.setControl('fields', this.fb.array([]));
        this.updateForm.reset();
        this.addNewFields();
        this.formValue = {} ;
        this.massUpdateDetails.uploadDocuments = null;
        this.updateDetails= true;
        this.summary = false;
        this.submitted = false;
        this.removeLabel();
      }
    })
  }

  back() {
    this.router.navigate(['/assignment/all-list/open']);
  }
  goToProgressTab() {
    this.router.navigate(['/assignment/all-list/in progress']);
  }

  get inValidAssignmentCount() {
    return this.allValidationList?.can_not_update;
  }

  get hasValidAssignmentCount() {
    return this.allValidationList?.can_update;
  }
  get checkEffetiveDate() {
    let value = this.fieldsArray?.getRawValue()?.filter(f=>f.field_name?.slug !== FIELDS_TO_UPDATE.END_DATE);
    if(this.fieldsArray && (this.fieldsArray?.length ===1 || !(value.length  > 0)) && this.fieldsArray?.getRawValue()?.some(f=>f.field_name?.slug === FIELDS_TO_UPDATE.END_DATE)) {
      return false;
    }
     return true;

  }

  getOldValue(assignment , slug , selectionType?) {
    if(this.action === 'bulk_close') {
      return this.datePipe.transform(assignment['end_date'] , this.dateFormat , undefined , undefined , true); 
    }
     if(selectionType === 'MDT') {
      return assignment?.foundational?.filter(res => res?.key === slug)?.[0]?.old_value?.join(',');
     }
     else if(slug === FIELDS_TO_UPDATE.END_DATE) {
      return this.datePipe.transform(assignment[slug] , this.dateFormat , undefined , undefined , true);
     } else if( slug === FIELDS_TO_UPDATE.ASSIGNEMENT_MANAGER || slug === FIELDS_TO_UPDATE.TIMESHEET_MANAGER || slug ===  FIELDS_TO_UPDATE.EXPENSE_MANAGER) {
      return assignment[slug]?.name
     } else if (slug ===  FIELDS_TO_UPDATE.WORK_LOCATION){
      return `${assignment[slug]?.name} - ${assignment[slug]?.code} `
     }
    return  '--'
  }


  getSelectedValue(slug) {
  if(this.action === 'bulk_close') {
    return this.datePipe.transform(this.updateForm.get('effective_date').value , this.dateFormat , undefined , undefined , true);
  }
   let value =  this.selectedValues?.find(value => value?.slug ===  slug);
     if(value && value?.hasOwnProperty('slug')) {
        if(value.slug === FIELDS_TO_UPDATE.END_DATE) {
          return this.datePipe.transform(value?.value , this.dateFormat , undefined , undefined , true);
        } else if( value?.slug === FIELDS_TO_UPDATE.ASSIGNEMENT_MANAGER || value?.slug === FIELDS_TO_UPDATE.TIMESHEET_MANAGER || value?.slug === FIELDS_TO_UPDATE.EXPENSE_MANAGER) {
          return value?.new_value?.full_name;
         } 
        //  else if(value?.slug === FIELDS_TO_UPDATE.WORK_LOCATION) {
        //   return value?.new_value?.name + '-' + value?.new_value?.code;
        //  }
     }
      return  `${value?.new_value?.name ?  value?.new_value?.name : '--'} ${value?.new_value?.code ?  '-' +value?.new_value?.code : ''}`
  }
  getRecordsByPage(data , page_number , page_size) {
    return data.slice((page_number - 1) * page_size, page_number * page_size);
  }

  assignmentId(id) {
    if (id) {
      id = id.split("-");
      id.splice(0, 3);
      return id.join("-");
    }
  }

  goToUpdateDetails() {
    this.updateDetails = true;
    this.summary = false;
    this.submitted = false;
    this.fieldsArray?.value?.forEach((res , index) => {
      this.fieldSeclectionChanged(res?.field_name, index)
    });
    this.disableAddActionButton = false;
  }

  goToSummary() {
    this.updateDetails = false;
    this.summary = true;
  }

  getAssignmentDetail(data) {
    this.assignmentData = {};
    this.newResourseBudget = {} ;
    this.showImpactedBilling = "visible";
    const url = `/assignment/programs/${this.programId}/finance-details/${data?.id}`;
    this._assignmentService.get(url)
      .subscribe({
        next: (data: any) => {
          this.assignmentData = data?.data;
          if(this.assignmentData){
          this.getEstimatedData(this.assignmentData);
          this.compareFinanceValueChanges();
          }
        }, error: error => {
          this.showError(error);
          this.loaderService.hide();
        }
      });
  }
  getFailedAssignment() {
    this.showFailedAssignments= "visible";
    const url = `/assignment/programs/${this.programId}/mass/failed-assignments`;
    let payload= {
      is_assignment_action : this.action === 'bulk_close' ? 'terminate' : 'update',
      assignment_ids : this.failedAssignments || []
    }
    this._assignmentService.post(url , payload)
      .subscribe({
        next: (data: any) => {
          this.massUpdateDetails.failedAssignment =  data?.data?.assignment
        }, error: error => {
          this.showError(error);
          this.loaderService.hide();
        }
      });
  }

  getEstimatedData(assignmentData){
    const values = assignmentData;
    const { start_date, end_date } = values || {};
    const { st_hours, days_per_week } = values?.finance;
    if (!start_date || !end_date || !st_hours || !days_per_week) {
      this.formatted_working_days = '0 Week 0 Day';
      return null;

    }
    let new_end_date = this.formValue?.fields?.find(f=> f?.field_name?.slug === FIELDS_TO_UPDATE.END_DATE);
    let endDate = this.action === 'bulk_close' ? this.formValue?.effective_date : (new_end_date?.field_value ? new_end_date?.field_value: end_date)
    const url = `/core-money/programs/${this.programId}/working-hours-estimate?start_date=${this._assignmentService.convertDateFormat(this.datePipe.transform(start_date, this.dateFormat , undefined, undefined, true))}&end_date=${this._assignmentService.convertDateFormat(this.datePipe.transform(endDate, this.dateFormat , undefined, undefined, true))}&hours_per_day=${this.accuracyPipe.transform(st_hours , this.accuracyConfig?.hour , {isEdit : true})}&week_working_days=${days_per_week}`;

    this._formRendererService.get(url)
      .subscribe({next:res => {
        this.formatted_working_days = res?.data?.formatted_working_days;
        this.calculateResourceBudget(assignmentData);
      },error: error => {
        this.showError(error);
        this.loaderService.hide();
      }})
  }

  calculateResourceBudget(assignmentData) {
    const formValues = assignmentData;
    let { start_date, end_date } = formValues;
    let { billrate, rate_type, total_working_days, st_hours, days_per_week, rate } = formValues.finance;
    let { st } = formValues?.finance?.rate[0];
    if (!start_date || !end_date || !st_hours || !days_per_week &&  !st && !rate_type && (!total_working_days || !this.formatted_working_days)) {
      return null;
    }
    if (!days_per_week) {
      return null;
    }
    if (!rate_type) {
      return null;
    }
    let end_date_present =  this.formValue?.fields?.some(f=>f?.field_name?.slug === FIELDS_TO_UPDATE.END_DATE);
    if(end_date_present) {
      const modified_effective_date = this._assignmentService.addDays(end_date, 1);
      assignmentData.effective_date = this._assignmentService.convertDateFormat(this.datePipe.transform(modified_effective_date, this.dateFormat , undefined, undefined, true));
    }  else {
      assignmentData.effective_date = this.formValue?.effective_date ? this._assignmentService.convertDateFormat(this._assignmentService.convertToNormalDate(this.formValue?.effective_date )) : null;
    }
    if ( (!assignmentData.effective_date ) && !this.checkEffectiveDate(assignmentData)) {
      return null;
    }
    billrate = rate.reduce((total, act) => total + Number(act?.activity_billrate || act.st), 0);
    const taxValues = formValues.tax || [];
    let url = `/core-money/programs/${this.programId}/resource-budget`;
    let requestBody: any = {};
    if (this.massUpdateDetails['resource_budget_setting']) {
      const { effective_data } = formValues || {};
      // let modifiedEndDate;
      // if (this.formValue?.field_name?.slug == FIELDS_TO_UPDATE.END_DATE) {
      //   modifiedEndDate = this.formValue?.end_date;
      // } else {
      //   modifiedEndDate = formValues?.end_date;
      // }
      // let endDate = this.formValue?.field_name?.slug == FIELDS_TO_UPDATE.END_DATE  ? this.formValue?.end_date: end_date
      let new_end_date = this.formValue?.fields?.find(f=> f?.field_name?.slug === FIELDS_TO_UPDATE.END_DATE);
      let endDate = this.action === 'bulk_close' ? this.formValue?.effective_date :(new_end_date?.field_value ? new_end_date?.field_value: end_date)
      let budget_obj = {};
      requestBody = {
        start_date: this._assignmentService.convertDateFormat(this.datePipe.transform(start_date, this.dateFormat , undefined, undefined, true)),
        end_date: this._assignmentService.convertDateFormat(this.datePipe.transform(endDate, this.dateFormat , undefined, undefined, true)),
        num_resources: 1,
        additional_budget:  assignmentData?.finance?.additional_budget ? assignmentData?.finance?.additional_budget : 0,
        effective_data:   effective_data?.rates ? effective_data?.rates : []
      }
      const current_change: any = {};
      current_change.tax = taxValues;
      current_change.assignment_uuid = formValues?.assignment_uuid;
      current_change.effective_date = this._assignmentService.convertDateFormat((formValues?.effective_date))
      current_change.end_date =  this._assignmentService.convertDateFormat(this.datePipe.transform(endDate, this.dateFormat , undefined, undefined, true))
      current_change.start_date = this._assignmentService.convertDateFormat(this.datePipe.transform(formValues?.start_date, this.dateFormat , undefined, undefined, true))
      current_change.old_start_date = start_date
      current_change.old_end_date = end_date
      current_change.hours_per_day = this.accuracyPipe?.transform(formValues?.finance?.st_hours, this.accuracyConfig.hour);
      current_change.week_working_days = formValues?.finance?.days_per_week;
      current_change.rate_type = formValues?.effective_data?.rate_type;

      if (this.is_activity_based) {
        current_change.rate = this.sortActivityRates(assignmentData);
      } else {
        current_change.rate = billrate || st;
      }
      requestBody.update_change_reference = current_change;
      this.compareFinanceValueChanges();
      if(this.massUpdateDetails['compared_finance_values']?.length === 0) {
        requestBody.update_change_reference = {} ;
      }
      if (budget_obj && Object?.keys(budget_obj)?.length > 0) {
        requestBody?.effective_data?.push(budget_obj);
      }
    } else {
      url += `?start_date=${this._assignmentService.convertDateFormat(this.datePipe.transform(start_date, this.dateFormat , undefined, undefined, true))}&end_date=${this._assignmentService.convertDateFormat(this.datePipe.transform(end_date, this.dateFormat , undefined, undefined, true))}&hours_per_day=${this.accuracyPipe?.transform(st_hours, this.accuracyConfig.hour)}&week_working_days=${days_per_week}&rate=${billrate}&rate_type=${rate_type}&total_hours=${total_working_days}&num_resources=1`;
        url += `&additional_budget=${assignmentData?.finance?.additional_budget || 0}`
      if (taxValues?.length > 0) {
        url += `&adjustment_type=${taxValues[0]?.amount_type}&adjustment_value=${taxValues[0]?.amount_value}`;
      }
    }
    this._formRendererService[this.massUpdateDetails['resource_budget_setting'] ? 'post' : 'get'](url, requestBody)
      .subscribe({
        next: (res: any) => {
          this.newResourseBudget = res?.data;
        }, error: error => {
          this.alertService.error(errorHandler(error));
          this.loaderService.hide();
        }
      })
  }
  // getExpenseImpactedList(){
  //   let expense_manager_id;
  //   if(this.assignmentData?.assignments?.assignment?.finance?.expense_manager?.id === this.assignmentCreateForm.get('expense_manager')?.value){
  //     expense_manager_id = null;
  //   } else{
  //     expense_manager_id = this.assignmentCreateForm.get('expense_manager')?.value;
  //   }
  //   let requestBody:any = {
  //     hierarchy_id:this.assignmentData?.assignments?.assignment?.hierarchy?.id || this.assignmentCreateForm.get('hierarchy_id')?.value,
  //     effective_start_date: this.convertDateFormat(this.assignmentCreateForm.get('effective_date')?.value),
  //     is_finance_change: false,
  //     is_non_finance_change: true,
  //     finance_change: [],
  //     is_expense_enable: this.assignmentCreateForm.get('is_expense_enabled')?.value,
  //     non_finance_change: {
  //       expense_manager: expense_manager_id
  //     }
  //   }
  //   let url = `/expense/programs/${this.programId}/assignment/${this.assignmentId}/impact`;
  //   this._formRendererService.post(url, requestBody).subscribe({next:(data: any) => {

  //     let impactedExpenses = undefined;
  //     let showTable = undefined;
  //     if (data?.data?.expenses?.length > 0) {
  //       impactedExpenses = data?.data?.expenses;
  //       showTable = true;
  //     } else {
  //       showTable = false;
  //     }
  //   }, error: err => {
  //     console.log('errr is nowowww', err);
  //   }})
  // }
  checkEffectiveDate(assignmnetData) {
    const { end_date, effective_date } = assignmnetData || {};
    if(new Date(Date.parse(effective_date)) > new Date(Date.parse(end_date))) {
      this.massUpdateDetails['estimated_billing_details'] = {};
    };
    return new Date(Date.parse(effective_date)) > new Date(Date.parse(end_date))
  }
  sortActivityRates(assignmentData) {
    const values = assignmentData;
    let data = [];
    if(values.activity && values?.activity?.length > 0) {
      values?.activity?.forEach(element => {
        data.push({
          activity_title: element.entity_name,
          activity_rate : this.accuracyPipe.transform(element.activity_billrate, this.accuracyConfig.rate, { isEdit: true})
        })
      });
    }
    return data;
  }


  pagination() {
    if (this.itemsPerPage < 1) {
      this.itemsPerPage = 10;
    }
    this.maxPages = Math.ceil(this.totalRecords / this.itemsPerPage);
  }

  onPaginationClick(e) {
    this.pageNumber = e;
    this.limit = 10;
    this.validateUpdate(this.massUpdateDetails.payload);
  }

  onClickRecords(e) {
    this.limit = e;
    this.pageNumber = 1;
    this.validateUpdate(this.massUpdateDetails.payload);
  }

  uploadFiles(event) {
    this.updateForm.get('documents').setValue((event && event.length > 0) ? event : null);
    this.massUpdateDetails.uploadDocuments =  (event && event.length > 0) ? event : null
  }
  updateValidAssignment(assignment) {
    if(assignment && !assignment?.is_allowed_update) {
      this.validityObj[assignment?.id] = false;
    } else if(assignment?.is_allowed_update && assignment?.can_update ) {
      this.validityObj[assignment?.id] = true;
  }
 }
 updateFieldValue($event) {
  this.disableAddActionButton = $event?.value;
  this.updateForm.get($event?.slug).setValue(null);
  let fieldIndex = this.fieldsArray.value?.findIndex(f => f?.field_name?.slug === $event?.slug);
      if (fieldIndex !== -1) {
        this.fieldsArray.at(fieldIndex).patchValue({
          field_value: null
        });
      }
 }
 compareFinanceValueChanges() {
  const oldValues = this.assignmentData;
  const newValues = this.formValue;
  const financeItems = [];
  this.massUpdateDetails['compared_finance_values'] = new Array();
  const old_end_date = this._assignmentService.convertDateFormat(this.datePipe.transform(oldValues?.end_date, this.dateFormat, undefined, undefined, true));
  const new_end_date = this.action === 'bulk_close' ? this._assignmentService.convertDateFormat(this.formValue?.effective_date) : this._assignmentService.convertDateFormat(this.datePipe.transform(newValues?.end_date, this.dateFormat, undefined, undefined, true))

  if(old_end_date !== new_end_date && this.formValue?.fields?.some(f=>f?.field_name?.slug === FIELDS_TO_UPDATE.END_DATE)) {
    financeItems.push({
      label : 'End Date',
      old_value : this.datePipe.transform(oldValues.end_date, this.dateFormat, undefined, undefined, true),
      new_value : this.datePipe.transform(newValues.end_date, this.dateFormat, undefined, undefined, true) })
  }
  this.massUpdateDetails['compared_finance_values'] = [...JSON.parse(JSON.stringify(financeItems))];
 }
 closeDialogBox() {
  this.showDialogBox = false;
 }
  ngOnDestroy(): void {
  }
  assignmentRedirect(id):void{
    const url = this.router.serializeUrl(
      this.router.createUrlTree([`assignment/details/${id}/final?tab=assignment`])
    );
    window.open(url, '_blank');
  }
  getReason(): any {
    return this.reasonCodes?.find(res => res?.id == this.updateForm?.get('reason')?.value);
  }
  isFieldNamePresent(name) {
    return this.formValue?.fields?.some(f => f?.field_name?.slug === FIELDS_TO_UPDATE[name]);
  }
  showHideFullText() {
    this.textVisibility = !this.textVisibility;
    if(this.linkText === "View More") {
      this.linkText = "View Less"
    }
    else if(this.linkText === "View Less") {
      this.linkText = "View More"
    }
  }
  hasDataToShow(): boolean {
    const requestData = this.updateForm?.get('request_notes')?.value;
    return requestData && requestData.length > 0;
  }
  
  showViewMoreLess(): boolean {
    const requestData = this.updateForm?.get('request_notes')?.value ;
    return this.hasDataToShow() && requestData.length > 100;
  }

  getFailureReason(id) {
    return this.allValidationList?.assignment?.filter(res => res?.id === id)?.[0]?.failure_reason;
  }
  getFailureReasonDetails(id) {
    return this.allValidationList?.assignment?.filter(res => res?.id === id)?.[0]?.details;
  }
}
