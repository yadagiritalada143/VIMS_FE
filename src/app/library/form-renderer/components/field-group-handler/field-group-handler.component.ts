import { DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, OnInit, Output } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Observable } from 'rxjs-compat/Observable';
import { map } from 'rxjs/internal/operators/map';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { EmitEvent, Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { ReasonCodesService } from 'src/app/shared/service/reson-codes.service';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { FieldGroup, UpdateFormRenderModel } from '../../form-renderer.model';
import { FormRendererService } from '../../form-renderer.service';

@Component({
  selector: 'app-field-group-handler',
  templateUrl: './field-group-handler.component.html',
  styleUrls: ['./field-group-handler.component.scss']
})
export class FieldGroupHandlerComponent implements OnInit, OnChanges {

  @Input() jsonData;
  @Input() config;
  @Input() groups;
  @Input() tabName: string;
  @Input() tabIndex: number = 0;
  @Input() userAssociatedHierarchyID: string[] = []
  @Input() selectedHierarchy: string[] = []
  @Input() is_update = false
  @Input() updateConfig: UpdateFormRenderModel[];
  @Input() updateValue: any;
  @Input() finalUpdateData: any;
  @Input() candidateId: string;
  @Input() isSaveLoader: boolean;
  @Input() assignmentId: string;
  document: any = undefined;

  @Output() onClickContinue = new EventEmitter()
  @Output() onBtnClick = new EventEmitter()
  @Output() onBackBtnClick = new EventEmitter();
  @Output() onFinalSubmitBtn = new EventEmitter()

  @Output() onClickCandidateView = new EventEmitter();
  @Output() onClickVendorView = new EventEmitter();
  // renderForm: FormGroup;
  renderFormModel: UntypedFormGroup[] = []

  // card toggole;
  cardToggole = []

  // on table row toggole
  tableRowToggle = []

  // on click hirerachy field
  isAddHirerachy = 'hidden'
  hirerachyFieldSlug = ''
  // this array will keep all data calling by API for dropdown or hirerachy
  allAPIData = []

  // for field show hide
  fieldProp = []
  fieldRequiredList = []

  programId = ''
  errorCheckList = []
  is_continue = false
  currency = 'INR'
  public updateOfReason$: Observable<Array<any>>;
  effectiveDateOption: any;
  allDateFieldDisable = []
  is_candidate_registered = false;

  customFieldsListKey: string[] = [];
  customFieldsListKeyType = new Map<string, string>();
  fieldDataFromConfig = new Map<string, any>();
  jobId: string;
  weekday = new Array(7);
  constructor(private fb: UntypedFormBuilder,
    private _formRendererService: FormRendererService,
    private storageService: StorageService,
    private datePipe: DatePipe,
    private _alert: AlertService,
    private _loader: LoaderService,
    private changeDetectorRef: ChangeDetectorRef,
    private eventStream: EventStreamService,
    private reasonCodesService: ReasonCodesService,
    private _storageService: StorageService) {
    this.weekday[0] = "sunday";
    this.weekday[1] = "monday";
    this.weekday[2] = "tuesday";
    this.weekday[3] = "wednesday";
    this.weekday[4] = "thursday";
    this.weekday[5] = "friday";
    this.weekday[6] = "saturday";
  }

  ngOnInit(): void {
    let programDetails = this._storageService.get(StorageKeys.CURRENT_PROGRAM)
    if (programDetails) {
      this.programId = programDetails['id'];
    }
    if (this.is_update) {
      this.getReasonCode();
      this.getTimesheetConfig();

      let start_date = new Date(this.getUpdateFormValues('start_date'))
      let end_date = new Date(this.getUpdateFormValues('end_date'))
      this.effectiveDateOption = {
        language: 'English',
        enabledDateRanges: [
          {
            start: start_date.setDate(start_date.getDate() - 1),
            end: end_date.setDate(end_date.getDate() + 1)
          },
        ]
      };
    }

    if (this.jsonData?.nav_tabs) {
      this.jsonData?.nav_tabs.forEach((tab, index) => {
        this.renderFormModel[tab?.label] = this.fb.group([])
        if (index === (this.jsonData?.nav_tabs?.length - 1)) {
          if (this.is_update) {
            this.renderFormModel[tab?.label].addControl('effective_date', this.fb.control(null, Validators.required))
            this.renderFormModel[tab?.label].addControl('request_reason', this.fb.control(null, Validators.required))
            this.renderFormModel[tab?.label].addControl('reason_code_action', this.fb.control(null))
            this.renderFormModel[tab?.label].addControl('request_notes', this.fb.control(null))
            this.renderFormModel[tab?.label].addControl('documents', this.fb.control(null))
            this.errorCheckList['effective_date'] = `Effective Date required.`
            this.errorCheckList['request_reason'] = `Reason for Update required.`
            this.registerEffectiveDateChange(tab?.label);
          } else {
            this.renderFormModel[tab?.label].addControl('is_account_required', this.fb.control(true))
          }
        }
        tab?.field_groups?.forEach(group => {
          // creating toggle option for toggle card if needed
          if (group?.is_toggle?.is_needed && !(group?.is_toggle?.slug in this.cardToggole)) {
            this.cardToggole[group?.is_toggle?.slug] = group?.is_toggle?.value
            this.renderFormModel[tab?.label].addControl(group?.is_toggle?.slug, this.fb.control(group?.is_toggle?.value ? group?.is_toggle?.value : false))
          }

          group.fields.forEach(element => {

            if (element.group_type) {

              if (element.group_type === "ARRAY" || element.group_type === 'FOOTER_ARRAY') {
                element.fields.forEach(ele => {
                  this.fieldDataFromConfig.set(ele?.slug, ele);
                  if (ele.source === 'CUSTOM' && ele?.source_type !== 'foundational') {
                    this.customFieldsListKey.push(ele?.slug);
                    this.customFieldsListKeyType.set(ele?.slug, ele?.type);
                  }

                  this.fieldRequiredList[ele?.slug] = ele?.is_required
                  if (ele?.meta_data?.rules?.length > 0) {
                    let condition = []
                    ele?.meta_data?.rules?.forEach(param => {
                      condition.push(param?.condition)
                    });
                    if (condition.indexOf('hidden') > -1) {
                      ele?.meta_data?.rules?.forEach(param => {
                        if ((param?.condition === 'hidden') && (param?.value.indexOf("") > -1)) {
                          this.fieldProp[ele?.slug] = false
                        }
                      })
                    } else {
                      this.fieldProp[ele?.slug] = true
                    }
                  } else {
                    this.fieldProp[ele?.slug] = true
                  }
                  if (ele?.is_readonly || (!ele?.is_update_allow && this.is_update)) {
                    this.allDateFieldDisable[ele?.slug] = true
                  } else {
                    this.allDateFieldDisable[ele?.slug] = false
                  }
                  this.creteForm(tab?.label, ele)
                });
              } else if ((element.group_type === "TABLE") || (element.group_type === "DISPLAY_TABLE")) {
                // crating toggole option for table row
                element?.row.forEach(row => {
                  if (row.is_show_hide && !(row?.slug in this.tableRowToggle)) {
                    this.tableRowToggle[row?.slug] = row?.value
                    this.renderFormModel[tab?.label].addControl(row?.slug, this.fb.control(row?.value ? row?.value : false))
                  }
                })

                element.fields.forEach(ele => {
                  ele.forEach(eles => {
                    this.fieldRequiredList[eles?.slug] = eles?.is_required
                    if (eles?.meta_data?.rules?.length > 0) {
                      let condition = []
                      eles?.meta_data?.rules?.forEach(param => {
                        condition.push(param?.condition)
                      });
                      if (condition.indexOf('hidden') > -1) {
                        eles?.meta_data?.rules?.forEach(param => {
                          if ((param?.condition === 'hidden') && (param?.value.indexOf("") > -1)) {
                            this.fieldProp[eles?.slug] = false
                          }
                        })
                      } else {
                        this.fieldProp[eles?.slug] = true
                      }
                    } else {
                      this.fieldProp[eles?.slug] = true
                    }
                    if (ele?.is_readonly || (!ele?.is_update_allow && this.is_update)) {
                      this.allDateFieldDisable[ele?.slug] = true
                    } else {
                      this.allDateFieldDisable[ele?.slug] = false
                    }
                    this.creteForm(tab?.label, eles)
                  });
                });
              }
            } else {
              this.fieldRequiredList[element?.slug] = element?.is_required
              if (element?.meta_data?.rules?.length > 0) {
                let condition = []
                element?.meta_data?.rules?.forEach(param => {
                  condition.push(param?.condition)
                });
                if (condition.indexOf('hidden') > -1) {
                  element?.meta_data?.rules?.forEach(param => {
                    if ((param?.condition === 'hidden') && (param?.value.indexOf("") > -1)) {
                      this.fieldProp[element?.slug] = false
                    }
                  })
                } else {
                  this.fieldProp[element?.slug] = true
                }
              } else {
                this.fieldProp[element?.slug] = true
              }
              if (element?.is_readonly || (!element?.is_update_allow && this.is_update)) {
                this.allDateFieldDisable[element?.slug] = true
              } else {
                this.allDateFieldDisable[element?.slug] = false
              }
              this.creteForm(tab?.label, element)
            }

          });
          if (this.is_update) {
            Object.keys(this.renderFormModel[tab?.label].controls).forEach(slug => {
              this.showHideOnUpdateTime(slug)
            });
          }
        })
      })
    }
  }

  registerEffectiveDateChange(label) {
    this.renderFormModel[label].get("effective_date")?.valueChanges?.subscribe(updatedDate => {
      if (updatedDate) {
        const date = updatedDate?.split("-");
        const start_date = this.getFormControl("start_date")?.value;//this.updateValue?.assignment?.start_date
        if (date?.length === 3) {
          let validTimesheetPeriod = true;
          if (this.workWeekPeriod) {
            const day = new Date(updatedDate).getDay();
            if (this.workWeekPeriod === 'weekly' && this.weekday[day] !== this.workWeekStartDay) {
              validTimesheetPeriod = false;
            }
          }
          if (updatedDate === start_date || validTimesheetPeriod) {
            this.getImpactedTimesheets(updatedDate);
            this.errorCheckList['effective_date_selection_invalid'] = undefined;
            let errors = this.renderFormModel[this.tabName].get('effective_date')?.errors || null;
            if (errors) {
              delete errors['effective_date_selection_invalid'];
              if (errors && this.isEmptyObject(errors)) {
                errors = null;
              }
              this.renderFormModel[this.tabName].get('effective_date')?.setErrors(errors);
            }
          } else {
            this.renderFormModel[this.tabName].get('effective_date')?.setErrors({ 'effective_date_selection_invalid': true });
            this.errorCheckList['effective_date_selection_invalid'] = `The effective date must be start date of assignment or 1st day of every ${this.workWeekPeriod === 'weekly' ? 'week' : ''}`;
          }
        }
      }
    })
  }

  isEmptyObject(value) {
    return value && Object.keys(value).length === 0 && value.constructor === Object;
  }

  getFormControl?(key): any {
    let control = undefined;
    Object.keys(this.renderFormModel).forEach(tabName => {
      if (this.renderFormModel[tabName].get(key)) {
        control = this.renderFormModel[tabName].get(key);
      }
    });
    return control;
  }

  getImpactedTimesheets(updatedDate) {
    this._loader.show();
    const end_date = this.getFormControl("end_date")?.value;
    const net_allocated_budget = this.getFormControl("net_allocated_budget")?.value;
    const timesheet_manager_id = this.getFormControl("timesheet_manager")?.value;
    const regular_billrate = this.getFormControl("regular_billrate")?.value;
    const timesheet_type = this.getFormControl("timesheet_type")?.value;
    let requestBody: any = {
      page: 1,
      per_page: 15,
      hierarchy_id: this.updateValue?.assignment?.hierarchy?.id,
      effective_start_date: updatedDate,
      finance_change: { working_days: null, rate_change: false },
      non_finance_change: { timesheet_manager: null, custom_field: false, timesheet_type: false },
      is_non_finance_change: 0,
      is_finance_change: 0
    };

    let url = `/timesheet/programs/${this.programId}/assignment/${this.updateValue?.assignment?.assignment_uuid}/impacted`;
    if (end_date && end_date !== this.updateValue?.assignment?.end_date) {
      requestBody.new_end_date = end_date;
      requestBody.is_finance_change = 1;
    } else if (parseFloat(net_allocated_budget) != parseFloat(this.updateValue?.finance?.net_allocated_budget)) {//add
      requestBody.is_finance_change = 1;
    }

    if (parseFloat(regular_billrate) !== parseFloat(this.updateValue?.finance?.regular_billrate)) {
      requestBody.finance_change.rate_change = true;
    }

    if (timesheet_type !== this.updateValue?.finance?.timesheet_type) {
      requestBody.finance_change.rate_change = true;
    }

    requestBody.non_finance_change.custom_field = this.customFieldsListKey.some(e => {
      let oldValue = this.getFormControl(e)?.value;
      oldValue = oldValue ? oldValue : '';
      const newValue = this.updateValue?.custom ? this.updateValue?.custom[e] : '';
      let modified = false;
      // console.log('customFieldsListKeyType',e, this.customFieldsListKeyType.get(e), oldValue, newValue);
      modified = (oldValue || '') !== (newValue || '');
      return modified;
    });

    if (requestBody.non_finance_change.custom_field) {
      requestBody.is_non_finance_change = 1;
    }

    if (this.updateValue?.finance?.timesheet_manager?.id && timesheet_manager_id && timesheet_manager_id != this.updateValue.finance.timesheet_manager.id) {
      requestBody.is_non_finance_change = 1;
      requestBody.non_finance_change.timesheet_manager = timesheet_manager_id;
    }
    // url+=`&is_finance_change=${is_finance_change}&is_non_finance_change=${is_non_finance_change}`;
    this._formRendererService.post(url, requestBody).subscribe(
      (data: any) => {
        let impactedTimesheets = undefined;
        let showTable = undefined;
        if (data?.data?.timesheet?.length > 0) {
          impactedTimesheets = data?.data?.timesheet;
          this.renderFormModel[this.tabName]?.addControl('impacted_timesheet_data', this.fb.control(impactedTimesheets));
          showTable = true;
        } else {
          showTable = false;
        }
        this.eventStream.emit(new EmitEvent(Events.SHOW_IMPACTED_TIMESHEETS, { impactedTimesheets, showTable }));
        this._loader.hide();
      }, err => {
        if (err?.error?.error?.errors[0]?.message) {
          this._alert.error(err.error.error.errors[0].message, { type: { INTERVAL_TIME: 5000 } });
        } else {
          this._alert.error(errorHandler(err), { type: { INTERVAL_TIME: 5000 } });
        }
        this._loader.hide();
      });
  }


  ngOnChanges() {
    this._formRendererService.getCurrency().subscribe(data => {
      if (data) {
        this.currency = data;
        this.changeDetectorRef.detectChanges()
      }
    })
    if (this.candidateId) {
      this.getFormBySlug('candidate_uuid', true).setValue(this.candidateId)
    }
  }

  getUpdateFormValues(slug) {
    for (var field of this.updateConfig) {
      if (field.fieldName === slug) {
        return (field.value);
      }
    }
  }

  creteForm(formName, field) {
    let validation = [];
    let updatedvalue: any;
    if (this.is_update) {
      updatedvalue = this.getUpdateFormValues(field.slug);
    }
    // adding some dynamic validation
    this.errorCheckList[field?.slug] = `${field?.label} required.`
    if (field?.is_required) {
      validation.push(this.addValidator('required'))
    }
    if (field?.min_length) {
      validation.push(this.addValidator('min_length'), field?.min_length)
    }
    if (field?.max_length) {
      validation.push(this.addValidator('max_length'), field?.max_length)
    }

    // creating reactive form
    if ((field?.type === 'DROPDOWN') || (field?.type === 'PERSON_DROPDOWN') || (field?.type === 'CANDIDATE_DROPDOWN') || (field?.type === 'VENDOR_DROPDOWN') || (field?.type === 'HUMAN_DROPDOWN') || (field?.type === 'JOB_DROPDOWN')) {
      this.renderFormModel[formName].addControl(field?.slug, this.fb.control({ value: this.is_update ? (updatedvalue ? updatedvalue : (field?.has_default ? field?.default_value : null)) : (field?.has_default ? field?.default_value : null), disabled: (field?.is_readonly ? field?.is_readonly : (this.is_update ? !field?.is_update_allow : false)) }, { updateOn: 'blur' }))

    } else if ((field?.type === 'MULTIDROPDOWN') || (field?.type === 'PERSON_MULTIDROPDOWN')) {
      this.renderFormModel[formName].addControl(field?.slug, this.fb.control({ value: this.is_update ? (updatedvalue ? updatedvalue : []) : [], disabled: (field?.is_readonly ? field?.is_readonly : (this.is_update ? !field?.is_update_allow : false)) }, { updateOn: 'blur' }))

    } else if ((field?.type === 'NUMBER') || (field?.type === 'EXTENDED_NUMBER') || (field?.type === 'CURRENCY')) {
      this.renderFormModel[formName].addControl(field?.slug, this.fb.control({ value: this.is_update ? (updatedvalue ? updatedvalue : (field?.has_default ? field?.default_value : null)) : (field?.has_default ? field?.default_value : null), disabled: (field?.is_readonly ? field?.is_readonly : (this.is_update ? !field?.is_update_allow : false)) }, { updateOn: 'blur' }))

    } else if (field?.type === 'DATE') {
      this.renderFormModel[formName].addControl(field?.slug, this.fb.control({ value: this.is_update ? (updatedvalue ? updatedvalue : (field?.has_default ? field?.default_value : null)) : (field?.has_default ? field?.default_value : null), disabled: (field?.is_readonly ? field?.is_readonly : (this.is_update ? !field?.is_update_allow : false)) }, { updateOn: 'blur' }))

    } else if ((field?.type === 'TEXT') || (field?.type === 'EXTENDED_TEXT')) {
      this.renderFormModel[formName].addControl(field?.slug, this.fb.control({ value: this.is_update ? (updatedvalue ? updatedvalue : (field?.has_default ? field?.default_value : null)) : (field?.has_default ? field?.default_value : null), disabled: (field?.is_readonly ? field?.is_readonly : (this.is_update ? !field?.is_update_allow : false)) }, { updateOn: 'blur' }))

    } else if (field?.type === 'SEARCH') {
      this.renderFormModel[formName].addControl(field?.slug, this.fb.control({ value: this.is_update ? (updatedvalue ? updatedvalue : null) : null, disabled: (field?.is_readonly ? field?.is_readonly : (this.is_update ? !field?.is_update_allow : false)) }, { updateOn: 'blur' }))

    } else if (field?.type === 'EMAIL') {
      this.renderFormModel[formName].addControl(field?.slug, this.fb.control({ value: this.is_update ? (updatedvalue ? updatedvalue : null) : null, disabled: (field?.is_readonly ? field?.is_readonly : (this.is_update ? !field?.is_update_allow : false)) }, { updateOn: 'blur' }))
      validation.push(this.addValidator('email'))

    } else if (field?.type === 'TOGGLE') {
      this.renderFormModel[formName].addControl(field?.slug, this.fb.control({ value: this.is_update ? (updatedvalue ? updatedvalue : (field?.has_default ? field?.default_value : null)) : (field?.has_default ? field?.default_value : false), disabled: (field?.is_readonly ? field?.is_readonly : (this.is_update ? !field?.is_update_allow : false)) }, { updateOn: 'blur' }))

    } else if (field?.type === 'HIERARCHY') {
      this.renderFormModel[formName].addControl(field?.slug, this.fb.control({ value: this.is_update ? (updatedvalue ? [updatedvalue] : null) : null, disabled: (field?.is_readonly ? field?.is_readonly : (this.is_update ? !field?.is_update_allow : false)) }, { updateOn: 'blur' }))
      this.hirerachyFieldSlug = field?.slug
      this.hierarchyList()
    }

    this.renderFormModel[formName].get(field?.slug).setValidators(validation)
    this.renderFormModel[formName].get(field?.slug).updateValueAndValidity()
    this.setValue(field)
  }

  emailValidator(control) {
    if (control.value) {
      const matches = control.value.match(/[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/);
      return matches ? null : { 'invalidEmail': true };
    } else {
      return null;
    }
  }

  addValidator(name: string, value: any = 0) {
    switch (name) {
      case 'required':
        return Validators.required
      case 'num':
        return Validators.pattern("^[0-9]\d*(\.\d+)?$")
      case 'email':
        return this.emailValidator
      case 'min_length':
        return Validators.minLength(value)
      case 'max_length':
        return Validators.maxLength(value)
    }
  }

  onSubmit() {
    if (this.onContinue(false)) {
      return;
    }

    if (this.tabIndex === (this.config?.length - 1)) {
      this.onFinalSubmitBtn.emit(this.renderFormModel)
    }
  }

  onContinue(next = true) {
    this.is_continue = true
    this.callValidateTab()
    if (!this.renderFormModel[this.tabName].valid) {

      const controls = this.renderFormModel[this.tabName]?.controls
      for (const name in controls) {
        if (controls[name].invalid) {
          // this._alert.error('There is one or more issues on the page. Please review and correct errors prior to resubmitting.', { INTERVAL_TIME: 5000 })
          return true
        }
      }

      return true;
    } else {
      if (!next) {
        return false
      }
    }
    this.is_continue = false
    if (next) {
      this.onClickContinue.emit(this.renderFormModel)
    }

  }

  checkFieldType(fieldType) {
    if (fieldType === 'EXTENDED_NUMBER') {
      return false;
    } else if (fieldType === 'EXTENDED_TEXT') {
      return false;
    } else {
      return true
    }
  }

  onClickCardToggle(cardSlugName: string) {
    this.cardToggole[cardSlugName] = !this.cardToggole[cardSlugName]
    this.renderFormModel[this.tabName].controls[cardSlugName].setValue(this.cardToggole[cardSlugName])
    if (!this.cardToggole[cardSlugName]) {
      this.groups.forEach((group) => {
        if (group?.is_toggle?.slug === cardSlugName) {
          group.fields.forEach(element => {
            if (element.group_type) {
              if (element.group_type === "ARRAY" || element.group_type === 'FOOTER_ARRAY') {
                element.fields.forEach(ele => {
                  if (ele.type === 'TOGGLE') {
                    this.renderFormModel[this.tabName].controls[ele?.slug].setValue(ele?.default)
                  } else if (ele?.has_default) {
                    this.renderFormModel[this.tabName].controls[ele?.slug].setValue(ele?.default_value)
                  } else if (ele?.datasource?.on_land) {
                    this.setValue(ele)
                  } else {
                    this.renderFormModel[this.tabName].controls[ele?.slug].reset()
                  }
                  this.renderFormModel[this.tabName].controls[ele?.slug].clearValidators([Validators.required])
                  this.renderFormModel[this.tabName].controls[ele?.slug].setErrors(null)
                  this.renderFormModel[this.tabName].updateValueAndValidity()
                  // this.onChangeFieldDataChageOthers(ele, cardSlugName)
                });
              } else if ((element.group_type === "TABLE") || (element.group_type === "DISPLAY_TABLE")) {
                element?.row.forEach(row => {
                  if (row.is_show_hide) {
                    this.tableRowToggle[row?.slug] = row?.value
                  }
                })
                element.fields.forEach(ele => {
                  ele.forEach(eles => {
                    if (eles.type === 'TOGGLE') {
                      this.renderFormModel[this.tabName].controls[eles?.slug].setValue(eles?.default)
                    } else if (eles?.datasource?.on_land) {
                      this.setValue(eles)
                    } else {
                      this.renderFormModel[this.tabName].controls[eles?.slug].reset()
                    }
                    this.renderFormModel[this.tabName].controls[eles?.slug].clearValidators([Validators.required])
                    this.renderFormModel[this.tabName].controls[eles?.slug].setErrors(null)
                    this.renderFormModel[this.tabName].updateValueAndValidity()
                  });
                });
              }
            } else {
              if (element.type === 'TOGGLE') {
                this.renderFormModel[this.tabName].controls[element?.slug].setValue(element?.default)
              } else if (element?.datasource?.on_land) {
                this.setValue(element)
              } else {
                this.renderFormModel[this.tabName].controls[element?.slug].reset()
              }
              this.renderFormModel[this.tabName].controls[element?.slug].clearValidators([Validators.required])
              this.renderFormModel[this.tabName].controls[element?.slug].setErrors(null)
              this.renderFormModel[this.tabName].updateValueAndValidity()
            }

          });
        }
      })
    } else {
      this.groups.forEach((group) => {
        if (group?.is_toggle?.slug === cardSlugName) {
          group.fields.forEach(element => {

            if (element.group_type) {

              if (element.group_type === "ARRAY" || element.group_type === 'FOOTER_ARRAY') {
                element.fields.forEach(ele => {
                  if (ele?.is_required) {
                    this.renderFormModel[this.tabName].controls[ele?.slug].setValidators([Validators.required])
                    this.renderFormModel[this.tabName].controls[ele?.slug].setErrors({ 'required': true })
                    this.renderFormModel[this.tabName].updateValueAndValidity()
                  }

                  // this.onChangeFieldDataChageOthers(ele, cardSlugName)
                });
              } else if ((element.group_type === "TABLE") || (element.group_type === "DISPLAY_TABLE")) {
                element?.row.forEach(row => {
                  if (row.is_show_hide) {
                    this.tableRowToggle[row?.slug] = row?.value
                  }
                })
                element.fields.forEach(ele => {
                  ele.forEach(eles => {
                    if (eles?.is_required) {
                      this.renderFormModel[this.tabName].controls[eles?.slug].setValidators([Validators.required])
                      this.renderFormModel[this.tabName].controls[eles?.slug].setErrors({ 'required': true })
                      this.renderFormModel[this.tabName].updateValueAndValidity()
                    }
                  });
                });
              }
            } else {
              if (element?.is_required) {
                this.renderFormModel[this.tabName].controls[element?.slug].setValidators([Validators.required])
                this.renderFormModel[this.tabName].controls[element?.slug].setErrors({ 'required': true })
                this.renderFormModel[this.tabName].updateValueAndValidity()
              }
            }

          });
        }
      })
    }

    if (this.jsonData?.nav_tabs) {
      this.jsonData?.nav_tabs.forEach(tab => {
        tab?.field_groups?.forEach(groups => {
          groups?.fields.forEach(field => {
            if (field.group_type) {
              if (field.group_type === "ARRAY" || field.group_type === 'FOOTER_ARRAY') {
                field.fields.forEach(eles => {
                  if (eles?.meta_data?.rules?.length > 0) {
                    eles?.meta_data?.rules.forEach(param => {
                      if (param?.slug === cardSlugName) {
                        this.onChangeFieldDataChageOthers(eles, cardSlugName)
                      }
                    })
                  }
                })
              } else if ((field.group_type === "TABLE") || (field.group_type === "DISPLAY_TABLE")) {
                field.fields.forEach(ele => {
                  ele.forEach(eles => {
                    if (eles?.meta_data?.rules?.length > 0) {
                      eles?.meta_data?.rules.forEach(param => {
                        if (param?.slug === cardSlugName) {
                          this.onChangeFieldDataChageOthers(eles, cardSlugName)
                        }
                      })
                    }
                  })
                })
              }
            } else {
              if (field?.meta_data?.rules?.length > 0) {
                field?.meta_data?.rules.forEach(param => {
                  if (param?.slug === cardSlugName) {
                    this.onChangeFieldDataChageOthers(field, cardSlugName)
                  }
                })
              }
            }
          })
        })
      })
    }
  }

  triggerCardToggleForBilling(cardSlugName: string) {
    this.cardToggole[cardSlugName] = !this.cardToggole[cardSlugName];
    const tabName = 'Financial Info';
    this.renderFormModel[tabName].controls[cardSlugName].setValue(this.cardToggole[cardSlugName])
    if (!this.cardToggole[cardSlugName]) {
      this.groups.forEach((group) => {
        if (group?.is_toggle?.slug === cardSlugName) {
          group.fields.forEach(element => {
            if (element.group_type) {
              if (element.group_type === "ARRAY" || element.group_type === 'FOOTER_ARRAY') {
                element.fields.forEach(ele => {
                  if (ele.type === 'TOGGLE') {
                    this.renderFormModel[tabName].controls[ele?.slug].setValue(ele?.default)
                  } else if (ele?.has_default) {
                    this.renderFormModel[tabName].controls[ele?.slug].setValue(ele?.default_value)
                  } else if (ele?.datasource?.on_land) {
                    this.setValue(ele)
                  } else {
                    this.renderFormModel[this.tabName].controls[ele?.slug].reset()
                  }
                  this.renderFormModel[tabName].controls[ele?.slug].clearValidators([Validators.required])
                  this.renderFormModel[tabName].controls[ele?.slug].setErrors(null)
                  this.renderFormModel[tabName].updateValueAndValidity();
                });
              } else if ((element.group_type === "TABLE") || (element.group_type === "DISPLAY_TABLE")) {
                element?.row.forEach(row => {
                  if (row.is_show_hide) {
                    this.tableRowToggle[row?.slug] = row?.value
                  }
                })
                element.fields.forEach(ele => {
                  ele.forEach(eles => {
                    if (eles.type === 'TOGGLE') {
                      this.renderFormModel[tabName].controls[eles?.slug].setValue(eles?.default)
                    } else if (eles?.datasource?.on_land) {
                      this.setValue(eles)
                    } else {
                      this.renderFormModel[tabName].controls[eles?.slug].reset()
                    }
                    this.renderFormModel[tabName].controls[eles?.slug].clearValidators([Validators.required])
                    this.renderFormModel[tabName].controls[eles?.slug].setErrors(null)
                    this.renderFormModel[tabName].updateValueAndValidity()
                  });
                });
              }
            } else {
              if (element.type === 'TOGGLE') {
                this.renderFormModel[tabName].controls[element?.slug].setValue(element?.default)
              } else if (element?.datasource?.on_land) {
                this.setValue(element)
              } else {
                this.renderFormModel[tabName].controls[element?.slug].reset()
              }
              this.renderFormModel[tabName].controls[element?.slug].clearValidators([Validators.required])
              this.renderFormModel[tabName].controls[element?.slug].setErrors(null)
              this.renderFormModel[tabName].updateValueAndValidity()
            }

          });
        }
      })
    } else {
      this.groups.forEach((group) => {
        if (group?.is_toggle?.slug === cardSlugName) {
          group.fields.forEach(element => {

            if (element.group_type) {

              if (element.group_type === "ARRAY" || element.group_type === 'FOOTER_ARRAY') {
                element.fields.forEach(ele => {
                  if (ele?.is_required) {
                    this.renderFormModel[tabName].controls[ele?.slug].setValidators([Validators.required])
                    this.renderFormModel[tabName].controls[ele?.slug].setErrors({ 'required': true })
                    this.renderFormModel[tabName].updateValueAndValidity()
                  }

                  // this.onChangeFieldDataChageOthers(ele, cardSlugName)
                });
              } else if ((element.group_type === "TABLE") || (element.group_type === "DISPLAY_TABLE")) {
                element?.row.forEach(row => {
                  if (row.is_show_hide) {
                    this.tableRowToggle[row?.slug] = row?.value
                  }
                })
                element.fields.forEach(ele => {
                  ele.forEach(eles => {
                    if (eles?.is_required) {
                      this.renderFormModel[tabName].controls[eles?.slug].setValidators([Validators.required])
                      this.renderFormModel[tabName].controls[eles?.slug].setErrors({ 'required': true })
                      this.renderFormModel[tabName].updateValueAndValidity()
                    }
                  });
                });
              }
            } else {
              if (element?.is_required) {
                this.renderFormModel[tabName].controls[element?.slug].setValidators([Validators.required])
                this.renderFormModel[tabName].controls[element?.slug].setErrors({ 'required': true })
                this.renderFormModel[tabName].updateValueAndValidity()
              }
            }

          });
        }
      })
    }
    this.groups = [...this.groups];

    if (this.jsonData?.nav_tabs) {
      this.jsonData?.nav_tabs.forEach(tab => {
        tab?.field_groups?.forEach(groups => {
          groups?.fields.forEach(field => {
            if (field.group_type) {
              if (field.group_type === "ARRAY" || field.group_type === 'FOOTER_ARRAY') {
                field.fields.forEach(eles => {
                  if (eles?.meta_data?.rules?.length > 0) {
                    eles?.meta_data?.rules.forEach(param => {
                      if (param?.slug === cardSlugName) {
                        this.onChangeFieldDataChageOthers(eles, cardSlugName)
                      }
                    })
                  }
                })
              } else if ((field.group_type === "TABLE") || (field.group_type === "DISPLAY_TABLE")) {
                field.fields.forEach(ele => {
                  ele.forEach(eles => {
                    if (eles?.meta_data?.rules?.length > 0) {
                      eles?.meta_data?.rules.forEach(param => {
                        if (param?.slug === cardSlugName) {
                          this.onChangeFieldDataChageOthers(eles, cardSlugName)
                        }
                      })
                    }
                  })
                })
              }
            } else {
              if (field?.meta_data?.rules?.length > 0) {
                field?.meta_data?.rules.forEach(param => {
                  if (param?.slug === cardSlugName) {
                    this.onChangeFieldDataChageOthers(field, cardSlugName)
                  }
                })
              }
            }
          })
        })
      })
    }
  }

  callValidateTab() {
    let tabs = this.jsonData?.nav_tabs
    for (let tab of tabs) {
      for (let group of tab?.field_groups) {
        for (let element of group?.fields) {
          if (element?.group_type) {
            if (element?.group_type === "ARRAY" || element?.group_type === 'FOOTER_ARRAY') {
              for (let ele of element?.fields) {
                this.validFieldValue(ele)
              }
            } else if ((element?.group_type === "TABLE") || (element?.group_type === "DISPLAY_TABLE")) {
              // crating toggole option for table row
              for (let ele of element?.fields) {
                for (let eles of ele) {
                  this.validFieldValue(eles)
                }
              }
            }
          } else {
            this.validFieldValue(element)
          }
        }
      }
    }
  }

  showHideOnUpdateTime(slug) {
    let tabs = this.jsonData?.nav_tabs
    for (let tab of tabs) {
      for (let group of tab?.field_groups) {
        for (let element of group?.fields) {
          if (element?.group_type) {
            if (element?.group_type === "ARRAY" || element?.group_type === 'FOOTER_ARRAY') {
              for (let ele of element?.fields) {
                this.onChangeFieldDataChageOthers(ele, slug, true)
              }
            } else if ((element?.group_type === "TABLE") || (element?.group_type === "DISPLAY_TABLE")) {
              // crating toggole option for table row
              for (let ele of element?.fields) {
                for (let eles of ele) {
                  this.onChangeFieldDataChageOthers(eles, slug, true)
                }
              }
            }
          } else {
            this.onChangeFieldDataChageOthers(element, slug, true)
          }
        }
      }
    }
  }

  getShowHideCardFlag(cardId: string) {
    if (cardId in this.cardToggole) {
      if (this.cardToggole[cardId]) {
        return false
      } else {
        return true
      }
    } else {
      return false
    }
  }

  onClickRowToggle(toggleName: string, index: number, groupId: string) {
    this.changeDetectorRef.detectChanges()
    this.tableRowToggle[toggleName] = !this.tableRowToggle[toggleName]
    this.getFormBySlug(toggleName, true).setValue(this.tableRowToggle[toggleName])

    this.groups.forEach((group: FieldGroup) => {
      group.fields.forEach(element => {

        if (element.group_type) {

          if ((element.group_type === "TABLE") || (element.group_type === "DISPLAY_TABLE")) {
            if (group.id === groupId) {
              element.fields[index].forEach(eles => {
                if (eles.type === 'TOGGLE') {
                  this.renderFormModel[this.tabName].controls[eles?.slug].setValue(eles?.default)
                  if (!this.tableRowToggle[toggleName]) {
                    this.renderFormModel[this.tabName].controls[eles?.slug].disable()
                  } else {
                    this.renderFormModel[this.tabName].controls[eles?.slug].enable()
                  }
                } else {
                  if ((group?.id === 'taxes') || (group?.id === 'fees')) {
                    if ((eles?.type === 'NUMBER') || (eles?.type === 'CURRENCY')) {
                      this.getFormBySlug(eles?.slug, true).setValue(0)
                      // this.onFieldValueChange({ value: 0, slug: eles?.slug })
                    } else if (eles?.type === 'DROPDOWN') {
                      if (eles?.id === 'types') {
                        this.getFormBySlug(eles?.slug, true).setValue('percentage')
                      } else if (eles?.id === 'applicable_on') {
                        this.getFormBySlug(eles?.slug, true).setValue('client_bill_rate')
                      }
                      // this.onFieldValueChange({ value: 0, slug: eles?.slug })
                    }
                  } else {
                    this.renderFormModel[this.tabName].controls[eles?.slug].reset()
                  }
                  if (!this.tableRowToggle[toggleName]) {
                    this.renderFormModel[this.tabName].controls[eles?.slug].disable()
                  } else {
                    this.renderFormModel[this.tabName].controls[eles?.slug].enable()
                  }
                }
              });
            }
          }
        }

      });
    })


  }

  onClickHirerachy(fieldSlug) {
    this.hirerachyFieldSlug = fieldSlug
    if (this.renderFormModel[this.tabName].get(this.hirerachyFieldSlug).value !== null) {
      this.selectedHierarchy = this.renderFormModel[this.tabName].get(this.hirerachyFieldSlug).value
    }

    this.isAddHirerachy = 'visible'
  }

  sidebarClose() {
    this.isAddHirerachy = 'hidden'
  }

  assignmentManagerDetails;
  getDefaultDataForManager(memberId) {
    this._formRendererService.get(`/configurator/programs/${this.programId}/members/${memberId}`)
      .subscribe(res => {
        this.assignmentManagerDetails = res?.member;
        if (this.assignmentManagerDetails?.defaults) {
          this.assignmentManagerDetails.defaults?.forEach(element => {
            if (element?.entity_type === 'HIERARCHY') {
              this.selectHierarchy([element?.entity_id]);
            } else if (element?.entity_type === 'FOUNDATIONAL_DATA' || element?.entity_type === 'CUSTOM_FIELD') {
              let slug = element?.entity_type === 'FOUNDATIONAL_DATA' ? element?.foundational_data_type?.slug : element?.slug;
              const field = this.getFormBySlug(slug, true);
              const fieldFromConfig = this.fieldDataFromConfig.get(slug);
              if (field) {
                if (fieldFromConfig?.type == 'MULTIDROPDOWN' || fieldFromConfig?.type == 'DROPDOWN') {
                  const dropDownList = this._storageService.get(slug) || [];
                  const hasValue = dropDownList.some(opt => opt[fieldFromConfig?.bind_value] === element?.entity_id);
                  if (!hasValue) {
                    dropDownList.push(element?.entity_object);
                    this._storageService.set(slug, dropDownList);
                    this.eventStream.emit(new EmitEvent(Events.UPDATE_DROPDOWN_VALUES, {slug}));
                  }
                }
                if (element?.entity_type !== 'CUSTOM_FIELD') {
                  this.getFormBySlug(slug, true).setValue(fieldFromConfig?.type !== 'MULTIDROPDOWN' ? element?.entity_id : [element?.entity_id], { emitEvent: true });
                } else {
                  this.getFormBySlug(slug, true).setValue(element?.entity_object[fieldFromConfig?.bind_value]);
                }

              }
            } else if (element?.entity_type === 'WORK_LOCATION') {
              const slug = 'work_location';
              const fieldFromConfig = this.fieldDataFromConfig.get(slug);
              const dropDownList = this._storageService.get(slug) || [];
              const hasValue = dropDownList.some(opt => opt[fieldFromConfig?.bind_value] === element?.entity_id);
              console.log('hasValue', hasValue);
              if(!hasValue) {
                this.addworkLocationToDropDown(element?.entity_id);
              } else {
                this.getFormBySlug(slug, true).setValue(element?.entity_id);
              }
              
            } else if (element?.entity_type === 'CURRENCY') {
              // need to discuss this one.
              // this.currency =  element?.entity_object?.code;
            }
          });
        }
      })
  }

  addworkLocationToDropDown(value) {
    this._formRendererService.get(`/configurator/programs/${this.programId}/work-locations/${value}`).subscribe(data => {
      const workLocation = data?.work_location;
      const dropDownList = this._storageService.get('work_location') || [];
      dropDownList.push(workLocation);
      this._storageService.set('work_location', dropDownList);
      this.eventStream.emit(new EmitEvent(Events.UPDATE_DROPDOWN_VALUES, {slug : 'work_location'}));
      this.getFormBySlug('work_location', true).setValue(value);
    })
  }

  //get hierarchy available in this program
  hierarchyList() {
    this.allAPIData['hirerachyLvlList'] = []

    if (this.allAPIData['hirerachyLvlList'].length === 0) {
      this._formRendererService.get(`/configurator/programs/${this.programId}/hierarchy`).subscribe(
        data => {
          if (data) {
            this.allAPIData['hirerachyLvlList'] = data.result[0].hierarchies;
            data.result[0].hierarchies.forEach(h => {
              this.userAssociatedHierarchyID.push(h?.id)
            });

            if (this.is_update) {
              this.selectHierarchy(this.renderFormModel[this.tabName]?.get(this.hirerachyFieldSlug)?.value)
            } else {
              if ((this.allAPIData['hirerachyLvlList']?.length === 1) && (this.allAPIData['hirerachyLvlList'][0]?.hierarchies?.length === 0)) {
                this.selectHierarchy([this.allAPIData['hirerachyLvlList'][0]?.id])
              }
            }
          }
        });
    }

  }

  getHirerachyById(hierarchy, id) {
    for (const datum of hierarchy) {
      if (datum.id == id) return datum;
      if (datum.hierarchies) {
        let result = this.getHirerachyById(datum.hierarchies, id);
        if (result) return result;
      }
    }
  }

  programType: any;
  selectHierarchy(event) {
    if (event?.length > 0) {
      if (this.allAPIData['hirerachyLvlList']?.length === 0) {
        this.hierarchyList()
      }
      const callHierarchyData = this.getHirerachyById(this.allAPIData['hirerachyLvlList'], event[0]);
      this.programType = callHierarchyData?.program_type;
      this.changeMarkupOption();
      
      if (callHierarchyData?.id === event[0]) {
        this._formRendererService.setHierarchyName(callHierarchyData?.name)
      } else {
        this._formRendererService.setHierarchyName('')
      }
    } else {
      this._formRendererService.setHierarchyName('')
    }
    this.getFormBySlug(this.hirerachyFieldSlug, true).setValue(event)
  }

  changeMarkupOption() {
    this.jsonData?.nav_tabs.forEach(tab => {
      tab?.field_groups?.forEach(groups => {
        groups?.fields.forEach(field => {
          if (field.group_type === "ARRAY" || field.group_type === 'FOOTER_ARRAY') {
            field.fields.forEach(eles => {
              if (eles?.slug === 'rate_model') {
                eles.datasource.options = eles.datasource.options.filter(opt => {
                  console.log(opt, this.programType);

                  if (this.programType === 'MARKUP_DRIVEN') {
                    return opt?.slug === 'markup';
                  } else if (this.programType === 'BILL_RATE_DRIVEN') {
                    return opt?.slug === 'billrate';
                  }
                })
              }
            })
          }
        });
      })
    });
  }

  onBtnClickEvent(slug) {
    this.onBtnClick.emit(slug)
  }

  onClickBack() {
    this.onBackBtnClick.emit(true)
  }

  onFieldValueChange(event) {
    let start_date = new Date(this.getUpdateFormValues('start_date'))
    let end_date = new Date(this.getUpdateFormValues('end_date'))
    this.effectiveDateOption = {
      language: 'English',
      enabledDateRanges: [
        {
          start: start_date.setDate(start_date.getDate()),
          end: end_date.setDate(end_date.getDate() + 1)
        },
      ]
    };
    // this.renderFormModel[this.tabName]?.get('effective_date')?.setValue(null);
    this.getFormControl('effective_date')?.setValue(null);
    if (event?.slug === 'candidate_uuid') {
      this.getFormBySlug('vendor_id', true).enable()
      this.allDateFieldDisable['original_start_date'] = false
      this.getFormBySlug('official_email', true).enable()
      this.getFormBySlug('source_type', true).enable()
      this.getFormBySlug('sso_id', true).enable()
      this.getFormBySlug('source_id', true).enable()
      this.setWorkerDetails(event?.value)
      let candidateDetails: any[] = this.storageService.get('candidate_uuid')
      this.is_candidate_registered = candidateDetails.find(c => c.id === event?.value)?.is_registered || false
    }

    if (event?.slug === 'job_id') {
      this.setJobTemplate(event?.value)
    }

    if (event?.slug === 'assignment_manager') {
      this.setManager(event?.value);
      this.getDefaultDataForManager(event?.value);
    }

    if (event?.slug === 'sourcing_model') {
      const hideBillableFor = ['Direct Hire', 'Headcount tracking'];
      if (hideBillableFor.includes(event.value)) {
        this.cardToggole['is_billable'] = true; // making value true before toggle trigger 
        this.triggerCardToggleForBilling('is_billable')
      } else if (!this.cardToggole['is_billable']) {
        this.cardToggole['is_billable'] = false; // making value false before toggle trigger
        this.triggerCardToggleForBilling('is_billable')
      }
    }

    if (this.jsonData?.nav_tabs) {
      this.jsonData?.nav_tabs.forEach(tab => {
        if (tab?.label !== this.tabName) {
          if (this.renderFormModel[tab?.label].get(event?.slug)) {
            this.renderFormModel[tab?.label].get(event?.slug).setValue(this.getFieldValue(event?.slug), { emitEvent: false })
          }
        }
        tab?.field_groups?.forEach(groups => {
          groups?.fields.forEach(field => {
            if (field.group_type) {
              if (field.group_type === "ARRAY" || field.group_type === 'FOOTER_ARRAY') {
                
                field.fields.forEach(eles => {
                  // operating on field
                  if (eles?.slug === event?.slug) {
                    let result = this.validFieldValue(eles)
                    if (!result) {
                      return
                    }
                  }
                  this.onChangeFieldDataChageOthers(eles, event?.slug)
                  if (eles?.datasource?.params?.length > 0) {
                    eles?.datasource?.params.forEach(param => {
                      if (param?.slug === event.slug) {
                        if (eles?.datasource?.type === 'function') {
                          const e = eval
                          e(eles?.datasource?.function)

                          const fn = window['' + eles?.datasource?.function_name]
                          let argu = {}

                          eles?.datasource?.argu.forEach(par => {
                            if ((this.renderFormModel[this.tabName].get(par?.slug) !== null) && (this.renderFormModel[this.tabName].get(par?.slug).value !== null)) {
                              argu[par?.name] = this.renderFormModel[this.tabName].get(par?.slug).value
                            }
                          })

                          let is_validation = true
                          eles?.datasource?.argu.forEach(par => {
                            if (this.getFormBySlug(par?.slug, true) !== null) {
                              if (par?.required && (this.getFormBySlug(par?.slug, true).value === null)) {
                                is_validation = false
                              }
                            } else if (par?.required && (this.getFormBySlug(par?.slug, true) === null)) {
                              is_validation = false
                            }
                          })

                          if (is_validation) {
                            let funResult = fn(argu)
                            this.renderFormModel[this.tabName].get(eles?.slug).setValue(funResult)
                          }
                        } else if (eles?.datasource?.type === 'url') {
                          let searchData = ''
                          let searchArray = [];
                          eles?.datasource?.params.forEach(par => {
                            if (par?.required && (par?.value || par?.value >= 0)) {
                              if (searchData === '') {
                                searchData = par?.name + '=' + par?.value
                              } else {
                                searchData = searchData + '&' + par?.name + '=' + par?.value
                              }
                            }
                            if (this.getFormBySlug(par?.slug, true) !== null) {
                              if (par?.type === 'array') {
                                if (par?.name in searchArray) {
                                  searchArray[par?.name].push(this.getFieldValue(par?.slug))
                                } else {
                                  searchArray[par?.name] = [this.getFieldValue(par?.slug)]
                                }
                              } else if (searchData === '') {
                                searchData = par?.name + '=' + this.getFormBySlug(par?.slug, true).value
                              } else {
                                searchData = searchData + '&' + par?.name + '=' + this.getFormBySlug(par?.slug, true).value
                              }
                            }
                          })

                          for (const name in searchArray) {
                            if (searchArray[name]?.length > 0) {
                              searchArray[name]?.forEach((arrayVal, index) => {
                                if (arrayVal !== null) {
                                  searchData = searchData + `&${name}[${index}]=${arrayVal}`
                                }
                              });
                            }
                          }

                          let is_validation = true
                          eles?.datasource?.params.forEach(par => {
                            if (!('value' in eles?.datasource?.params) && par?.slug) {
                              if (this.getFormBySlug(par?.slug, true) !== null) {
                                if (par?.required && (this.getFormBySlug(par?.slug, true).value === null)) {
                                  is_validation = false
                                }
                              } else if (par?.required && (this.getFormBySlug(par?.slug, true) === null)) {
                                is_validation = false
                              }
                            }
                          })

                          if (is_validation) {
                            if (eles?.meta_data?.rules?.length > 0) {
                              eles?.meta_data?.rules?.forEach(rule => {
                                if (rule?.condition === 'required') {
                                  if (rule?.value?.indexOf(this.getFieldValue(rule?.slug)) > -1) {
                                    if (this.getFieldValue(rule?.name) === null) {
                                      is_validation = false
                                    }
                                  }
                                }
                              })
                            }
                          }


                          if (is_validation) {
                            let url = eles?.datasource?.url
                            console.log(`:>> ${event?.slug} value changed updating value of ${eles?.slug}`);
                            url = url.replace('${programId}', this.programId);
                            searchData += `&name=${eles?.slug}`;
                            if (this.isModifyAllow(eles)) {
                              this._formRendererService.get(url + '?' + searchData).subscribe(data => {
                                if (data) {
                                  eles?.datasource?.getBy.forEach(d => {
                                    if (data) {
                                      data = data[d]
                                    }
                                  });
                                  if (data) {
                                    this.getFormBySlug(eles?.slug, true).setValue(data, { emitEvent: false })
                                  } else if (eles?.has_default) {
                                    this.getFormBySlug(eles?.slug, true).setValue(eles?.default_value, { emitEvent: false })
                                  }
                                }
                              }, err => {
                                console.error(err)
                              })
                            }
                          }
                        } else if (eles?.datasource?.type === 'url_function') {
                          this.forUrlFunction(eles)
                        }  else if (eles?.datasource?.type === 'sum') {
                          let sum =  0;
                          eles?.datasource?.params.forEach(par => {
                            if (this.getFormBySlug(par?.slug, true) !== null) {
                              const fieldVal = this.getFormBySlug(par?.slug, true).value;
                              if(fieldVal) {
                                sum += Number(fieldVal);
                              }
                            }
                          });
                          this.getFormBySlug(eles?.slug, true).setValue(sum, { emitEvent: true })
                        }
                      }
                    });
                  }


                });
              } else if ((field.group_type === "TABLE") || (field.group_type === "DISPLAY_TABLE")) {
                field.fields.forEach(ele => {
                  ele.forEach(eles => {
                     // operating on field
                    if (eles?.slug === event?.slug) {
                      let validate_result = this.validFieldValue(eles)
                      if (!validate_result) {
                        return
                      }
                    }

                    this.onChangeFieldDataChageOthers(eles, event?.slug)
                    if (eles?.datasource?.params?.length > 0) {
                      for (let i = 0; i < eles?.datasource?.params?.length; i++) {
                        let param = eles?.datasource?.params[i]
                        if (param?.slug === event.slug) {

                          if (eles?.datasource?.type === 'function') {
                            const e = eval
                            e(eles?.datasource?.function)

                            const fn = window['' + eles?.datasource?.function_name]
                            let argu = {}

                            eles?.datasource?.params.forEach(par => {
                              if (this.renderFormModel[this.tabName].get(par?.name) !== null) {
                                argu[par?.name] = this.renderFormModel[this.tabName].get(par?.name).value
                              }
                            })

                            let is_validation = false
                            eles?.datasource?.params.forEach(par => {
                              if (par?.required && (this.renderFormModel[this.tabName].get(par?.name).value === null)) {
                                is_validation = true
                              }
                            })

                            if (!is_validation) {
                              let funResult = fn(argu)
                              this.renderFormModel[this.tabName].get(eles?.slug).setValue(funResult)
                            } else {
                              this.renderFormModel[this.tabName].get(eles?.slug).setValue(null)
                            }
                          } else if (eles?.datasource?.type === 'url') {
                            let searchData = ''
                            let searchArray = []
                            eles?.datasource?.params.forEach(par => {
                              if (par?.required && (par?.value || par?.value >= 0)) {
                                if (searchData === '') {
                                  searchData = par?.name + '=' + par?.value
                                } else {
                                  searchData = searchData + '&' + par?.name + '=' + par?.value
                                }
                              }
                              if (this.getFormBySlug(par?.slug, true) !== null) {
                                if (par?.type === 'array') {
                                  if (par?.name in searchArray) {
                                    searchArray[par?.name].push(this.getFieldValue(par?.slug))
                                  } else {
                                    searchArray[par?.name] = [this.getFieldValue(par?.slug)]
                                  }
                                } else if (searchData === '') {
                                  searchData = par?.name + '=' + this.getFormBySlug(par?.slug, true).value
                                } else {
                                  searchData = searchData + '&' + par?.name + '=' + this.getFormBySlug(par?.slug, true).value
                                }
                              }
                            })

                            for (const name in searchArray) {
                              if (searchArray[name]?.length > 0) {
                                searchArray[name]?.forEach((arrayVal, index) => {
                                  if (arrayVal !== null) {
                                    searchData = searchData + `&${name}[${index}]=${arrayVal}`
                                  }
                                });
                              }
                            }

                            let is_validation = true
                            eles?.datasource?.params.forEach(par => {
                              if (!('value' in eles?.datasource?.params) && par?.slug) {
                                if (this.getFormBySlug(par?.slug, true) !== null) {
                                  if (par?.required && (this.getFormBySlug(par?.slug, true).value === null)) {
                                    is_validation = false
                                  }
                                } else if (par?.required && (this.getFormBySlug(par?.slug, true) === null)) {
                                  // ot payrate error
                                  is_validation = false
                                }
                              }
                            })
                            if (is_validation) {
                              if (eles?.meta_data?.rules?.length > 0) {
                                eles?.meta_data?.rules?.forEach(rule => {
                                  if (rule?.condition === 'required') {
                                    if (rule?.value?.indexOf(this.getFieldValue(rule?.slug)) > -1) {
                                      if (this.getFieldValue(rule?.name) === null) {
                                        is_validation = false
                                      }
                                    }
                                  }
                                })
                              }
                            }

                            if (is_validation) {
                              let url = eles?.datasource?.url
                              console.log(`:>> ${event?.slug} value changed updating value of ${eles?.slug}`);
                              url = url.replace('${programId}', this.programId)
                              searchData += `&name=${eles?.slug}`;
                              if (this.isModifyAllow(eles)) {
                                this._formRendererService.get(url + '?' + searchData).subscribe(data => {
                                  if (data) {
                                    eles?.datasource?.getBy.forEach(d => {
                                      if (data) {
                                        data = data[d]
                                      }
                                    });

                                    if (data) {
                                      this.getFormBySlug(eles?.slug, true).setValue(data, { emitEvent: false })
                                      this.onFieldValueChange({ value: this.getFieldValue(eles?.slug), slug: eles?.slug })
                                    } else if (eles?.has_default) {
                                      this.getFormBySlug(eles?.slug, true).setValue(eles?.default_value, { emitEvent: false })
                                      this.onFieldValueChange({ value: this.getFieldValue(eles?.slug), slug: eles?.slug })
                                    }
                                  }
                                })
                              }
                            }
                          }  else if (eles?.datasource?.type === 'sum') {
                            let sum =  0;
                            eles?.datasource?.params.forEach(par => {
                              if (this.getFormBySlug(par?.slug, true) !== null) {
                                const fieldVal = this.getFormBySlug(par?.slug, true).value;
                                if(fieldVal) {
                                  sum += Number(fieldVal);
                                }
                              }
                            });
                            
                            this.getFormBySlug(eles?.slug, true).setValue(sum, { emitEvent: true })
                          }
                        }
                      }
                    }

                  })
                })
              }
            } else {
               // operating on field
              if (field?.slug === event?.slug) {
                let validate_result = this.validFieldValue(field)
                if (!validate_result) {
                  return
                }
              }
              this.onChangeFieldDataChageOthers(field, event?.slug)
              
              if (field?.datasource?.params?.length > 0) {
                field?.datasource?.params.forEach(param => {
                  if (param?.slug === event.slug) {
                    if (field?.datasource?.type === 'function') {
                      const e = eval
                      e(field?.datasource?.function)

                      const fn = window['' + field?.datasource?.function_name]
                      let argu = {}

                      field?.datasource?.params.forEach(par => {
                        if (this.getFormBySlug(par?.slug, true) !== null) {
                          argu[par?.name] = this.getFormBySlug(par?.slug, true).value
                        }
                      })
                      let is_validation = false
                      field?.datasource?.params.forEach(par => {
                        if (par?.required && (this.getFormBySlug(par?.slug, true).value === null)) {
                          is_validation = true
                        }
                      })
                      if (!is_validation) {
                        let funResult = fn(argu)
                        this.renderFormModel[this.tabName].get(field?.slug).setValue(funResult)
                      }

                    } else if (field?.datasource?.type === 'url') {

                      let searchData = ''
                      let searchArray = []

                      field?.datasource?.params.forEach(par => {
                        if (par?.required && (par?.value || par?.value >= 0)) {
                          if (searchData === '') {
                            searchData = par?.name + '=' + par?.value
                          } else {
                            searchData = searchData + '&' + par?.name + '=' + par?.value
                          }
                        }
                        if (this.getFormBySlug(par?.slug, true) !== null) {
                          if (par?.type === 'array') {
                            if (par?.name in searchArray) {
                              searchArray[par?.name].push(this.getFieldValue(par?.slug))
                            } else {
                              searchArray[par?.name] = [this.getFieldValue(par?.slug)]
                            }
                          } else if (searchData === '') {
                            searchData = par?.name + '=' + this.getFormBySlug(par?.slug, true).value
                          } else {
                            searchData = searchData + '&' + par?.name + '=' + this.getFormBySlug(par?.slug, true).value
                          }
                        }
                      })

                      for (const name in searchArray) {
                        if (searchArray[name]?.length > 0) {
                          searchArray[name]?.forEach((arrayVal, index) => {
                            if (arrayVal !== null) {
                              searchData = searchData + `&${name}[${index}]=${arrayVal}`
                            }
                          });
                        }
                      }

                      let is_validation = true
                      field?.datasource?.params.forEach(par => {
                        if (!('value' in field?.datasource?.params) && par?.slug) {
                          if (this.getFormBySlug(par?.slug, true) !== null) {
                            if (par?.required && (this.getFormBySlug(par?.slug, true).value === null)) {
                              is_validation = false
                            }
                          } else if (par?.required && (this.getFormBySlug(par?.slug, true) === null)) {
                            is_validation = false
                          }
                        }
                      })

                      if (is_validation) {
                        if (field?.meta_data?.rules?.length > 0) {
                          field?.meta_data?.rules?.forEach(rule => {
                            if (rule?.condition === 'required') {
                              if (rule?.value?.indexOf(this.getFieldValue(rule?.slug)) > -1) {
                                if (this.getFieldValue(rule?.name) === null) {
                                  is_validation = false
                                }
                              }
                            }
                          })
                        }
                      }

                      if (is_validation) {
                        let url = field?.datasource?.url
                        url = url.replace('${programId}', this.programId)
                        searchData += `&name=${field?.slug}`;
                        console.log(`:>> ${event?.slug} value changed updating value of ${field?.slug}`);
                        if (this.isModifyAllow(field)) {
                          this._formRendererService.get(url + '?' + searchData).subscribe(data => {
                            if (data) {
                              field?.datasource?.getBy.forEach(d => {
                                if (data) {
                                  data = data[d]
                                }
                              });
                              if (data) {
                                this.getFormBySlug(field?.slug, true).setValue(data, { emitEvent: false })
                              } else if (field?.has_default) {
                                this.getFormBySlug(field?.slug, true).setValue(field?.default_value, { emitEvent: false })
                              }
                            }
                          }, err => {
                            console.error(err)
                          })
                        }
                      }
                    }  else if (field?.datasource?.type === 'sum') {
                      let sum =  0;
                      field?.datasource?.params.forEach(par => {
                        if (this.getFormBySlug(par?.slug, true) !== null) {
                          const fieldVal = this.getFormBySlug(par?.slug, true).value;
                          if(fieldVal) {
                            sum += Number(fieldVal);
                          }
                        }
                      });
                      this.getFormBySlug(field?.slug, true).setValue(sum, { emitEvent: true })
                    }
                  }
                });
              }

            }
          });
        });
      });
    }
  }

  isModifyAllow(field) {
    const rules = field?.meta_data?.rules || [];
    const hasRestrictionRule = rules.some(rule => rule.condition === 'restrict_modify');
    if (hasRestrictionRule) {
      const rulesToVerify = rules
        .filter(rule => rule.condition === 'restrict_modify')
        .some(rule => {
          const value = this.getFormBySlug(rule?.slug, true)?.value;
          return rule?.value?.includes(value);
        });
      return !rulesToVerify;
    } else {
      return true;
    }
  }

  setWorkerDetails(candidateId: string) {
    this._formRendererService.get(`/assignment/programs/${this.programId}/assignment/candidate/${candidateId}`).subscribe(data => {
      if (data) {
        let workerDetails = data?.data?.worker
        if (workerDetails) {
          let temp_vendor_data: any[] = this.storageService.get('vendor_id')
          if (temp_vendor_data.some(v => v?.vendor?.id !== workerDetails?.vendor_id?.id)) {
            temp_vendor_data.push({ vendor: workerDetails?.vendor_id })
            this.storageService.set('vendor_id', temp_vendor_data)
          }
          this.getFormBySlug('vendor_id', true).setValue(workerDetails?.vendor_id?.id)
          this.getFormBySlug('original_start_date', true).setValue(workerDetails?.original_start_date)
          this.getFormBySlug('official_email', true).setValue(workerDetails?.official_email)
          this.getFormBySlug('source_type', true).setValue(workerDetails?.source_type)
          // this.getFormBySlug('vendor_id', true).disable()//WIP-1545:Create Assignment : After Close assignment, candidate needs to show in drop down for create assignment.
          this.allDateFieldDisable['original_start_date'] = true
          this.getFormBySlug('official_email', true).disable()
          this.getFormBySlug('source_type', true).disable()
          this.getFormBySlug('sso_id', true).disable()
          this.getFormBySlug('source_id', true).disable()
          if (workerDetails?.source_type === "new_worker") {
            this.getFormBySlug('sso_id', true).setValue(workerDetails?.sso_id)
          } else {
            this.getFormBySlug('source_id', true).setValue(workerDetails?.source_id)
          }
        } else {
          let candidateList = this._storageService.get('candidate_uuid')
          if (candidateList) {
            let candidate = this.getDataByKey(candidateList, 'id', candidateId);

            this.getFormBySlug('official_email', true).setValue(candidate?.email)
          }
        }
      }
    })
  }

  setJobTemplate(jobId: string) {
    const jobList = this._storageService.get('job_id');
    const selectedJob = jobList.find(r => r.id === jobId);
    if (selectedJob) {
      const url = `/job-manager/programs/${this.programId}/job-templates/${selectedJob?.template}`
      this._formRendererService.get(url)
        .subscribe(res => {
          const template = res.job_template;
          if (template) {
            const templateDropdownList = this._storageService.get('assignment_title_uuid') || [];
            if (!templateDropdownList.some(temp => temp.id === template.id)) {
              templateDropdownList.push(template);
              this.jobId = jobId;
              this.getFormBySlug('assignment_title_uuid', true).setValue(template?.id);
            } else {
              this.getFormBySlug('assignment_title_uuid', true).setValue(template?.id);
              this.jobId = jobId;
            }
          }
        })
    }

  }

  setManager(managerId: string) {
    const managerList = this._storageService.get('assignment_manager');
    const managerObj = managerList.find(r => r.id === managerId);
    if (managerObj) {
      const templateDropdownList = this._storageService.get('timesheet_manager') || [];
      if (!templateDropdownList.some(temp => temp.id === managerObj.id)) {
        templateDropdownList.push(managerObj);
        this.getFormBySlug('timesheet_manager', true).setValue(managerId);
      } else {
        this.getFormBySlug('timesheet_manager', true).setValue(managerId);
      }

      this._storageService.set('timesheet_manager', templateDropdownList);
      const expenseManagerDropdownList = this._storageService.get('expense_manager') || [];
      if (!expenseManagerDropdownList.some(temp => temp.id === managerObj.id)) {
        expenseManagerDropdownList.push(managerObj);
        this.getFormBySlug('expense_manager', true).setValue(managerId);
      } else {
        this.getFormBySlug('expense_manager', true).setValue(managerId);
      }
      this._storageService.set('expense_manager', expenseManagerDropdownList);
    }

  }
  // straight forword rules check
  validFieldValue(field) {
    if (this.getFieldValue(field?.slug) !== null) {
      for (let i = 0; i < field?.meta_data?.rules?.length; i++) {
        const rule = field?.meta_data?.rules[i]
        if (rule?.condition === 'ltr') {
          if (field?.type === 'DATE') {
            if (this.getFieldValue(rule?.slug) === null) {
              // this.getFormBySlug(field?.slug, true).setValue(null, { emitEvent: false })
              this.getFormBySlug(field?.slug, true).setErrors({ ltr: true })
              this.errorCheckList[field?.slug] = rule?.message
              this._alert.error(rule?.message, { type: { INTERVAL_TIME: 5000 } })
              return false
            } else if ((new Date(this.getFieldValue(field?.slug))).getTime() < (new Date(this.getFieldValue(rule?.slug))).getTime()) {
              // this.getFormBySlug(field?.slug, true).setValue(null, { emitEvent: false })
              this.getFormBySlug(field?.slug, true).setErrors({ ltr: true })
              this.errorCheckList[field?.slug] = rule?.message
              this._alert.error(rule?.message, { type: { INTERVAL_TIME: 5000 } })
              return false
            } else {
              let fieldError = this.getFormBySlug(field?.slug, true).errors
              if (fieldError) {
                delete fieldError['ltr']
                if (!Object.keys(fieldError).length) {
                  this.getFormBySlug(field?.slug, true).setErrors(null)
                } else {
                  this.getFormBySlug(field?.slug, true).setErrors(fieldError)
                }
              }
              return true
            }
          } if ((field?.type === 'NUMBER') || (field?.type === 'CURRENCY')) {
            if (this.getFieldValue(rule?.slug) === null) {
              return true
            } else if (this.getFieldValue(field?.slug) < this.getFieldValue(rule?.slug)) {
              // this.getFormBySlug(field?.slug, true).setValue(null, { emitEvent: false })
              this.getFormBySlug(field?.slug, true).setErrors({ ltr: true })
              this.errorCheckList[field?.slug] = rule?.message
              this._alert.error(rule?.message, { type: { INTERVAL_TIME: 5000 } })
              return false
            }
          }
        } else if (rule?.condition === 'gtr') {
          if (field?.type === 'DATE') {
            if (this.getFieldValue(rule?.slug) === null) {
              return true
            } else if ((new Date(this.getFieldValue(field?.slug))).getTime() > (new Date(this.getFieldValue(rule?.slug))).getTime()) {
              // this.getFormBySlug(field?.slug, true).setValue(null)
              this.getFormBySlug(field?.slug, true).setErrors({ gtr: true })
              this.errorCheckList[field?.slug] = rule?.message
              this._alert.error(rule?.message, { type: { INTERVAL_TIME: 5000 } })
              return false
            } else {
              let fieldError = this.getFormBySlug(field?.slug, true).errors
              if (fieldError) {
                delete fieldError['gtr']
                if (!Object.keys(fieldError).length) {
                  this.getFormBySlug(field?.slug, true).setErrors(null)
                } else {
                  this.getFormBySlug(field?.slug, true).setErrors(fieldError)
                }
              }
              return true
            }
          } else if ((field?.type === 'NUMBER') || (field?.type === 'CURRENCY')) {
            if (this.getFieldValue(rule?.slug) === null) {
              return true
            } else if (this.getFieldValue(field?.slug) > this.getFieldValue(rule?.slug)) {
              // this.getFormBySlug(field?.slug, true).setValue(null, { emitEvent: false })
              this.getFormBySlug(field?.slug, true).setErrors({ gtr: true })
              this.errorCheckList[field?.slug] = rule?.message
              this._alert.error(rule?.message, { type: { INTERVAL_TIME: 5000 } })
              return false
            }
          } else {
            let fieldError = this.getFormBySlug(field?.slug, true).errors
            if (fieldError) {
              delete fieldError['gtr']
              if (!Object.keys(fieldError).length) {
                this.getFormBySlug(field?.slug, true).setErrors(null)
              } else {
                this.getFormBySlug(field?.slug, true).setErrors(fieldError)
              }
            }
            return true
          }
        } else if (rule?.condition === 'gtr_equal') {
          if (field?.type === 'DATE') {
            if (this.getFieldValue(rule?.slug) === null) {
              return true
            } else if ((new Date(this.getFieldValue(field?.slug))).getTime() >= (new Date(this.getFieldValue(rule?.slug))).getTime()) {
              // this.getFormBySlug(field?.slug, true).setValue(null)
              this.getFormBySlug(field?.slug, true).setErrors({ gtr_equal: true })
              this.errorCheckList[field?.slug] = rule?.message
              this._alert.error(rule?.message, { type: { INTERVAL_TIME: 5000 } })
              return false
            } else {
              let fieldError = this.getFormBySlug(field?.slug, true).errors
              if (fieldError) {
                delete fieldError['gtr_equal']
                if (!Object.keys(fieldError).length) {
                  this.getFormBySlug(field?.slug, true).setErrors(null)
                } else {
                  this.getFormBySlug(field?.slug, true).setErrors(fieldError)
                }
              }
              return true
            }
          }
        } else if (rule?.condition === 'ltr_equal') {
          if (field?.type === 'DATE') {
            if (this.getFieldValue(rule?.slug) === null) {
              // this.getFormBySlug(field?.slug, true).setValue(null)
              this.getFormBySlug(field?.slug, true).setErrors({ ltr_equal: true })
              this.errorCheckList[field?.slug] = rule?.message
              this._alert.error(rule?.message, { type: { INTERVAL_TIME: 5000 } })
              return true
            } else if ((new Date(this.getFieldValue(field?.slug))).getTime() <= (new Date(this.getFieldValue(rule?.slug))).getTime()) {
              // this.getFormBySlug(field?.slug, true).setValue(null)
              this.getFormBySlug(field?.slug, true).setErrors({ ltr_equal: true })
              this.errorCheckList[field?.slug] = rule?.message
              this._alert.error(rule?.message, { type: { INTERVAL_TIME: 5000 } })
              return false
            } else {
              let fieldError = this.getFormBySlug(field?.slug, true).errors
              if (fieldError) {
                delete fieldError['ltr_equal']
                if (!Object.keys(fieldError).length) {
                  this.getFormBySlug(field?.slug, true).setErrors(null)
                } else {
                  this.getFormBySlug(field?.slug, true).setErrors(fieldError)
                }
              }
              return true
            }
          }
        } else if (rule?.condition === 'match') {
          if (this.getFieldValue(rule?.slug) !== rule?.value) {
            // this.getFormBySlug(field?.slug, true).setValue(null)
            this.getFormBySlug(field?.slug, true).setErrors({ match: true })
            this.errorCheckList[field?.slug] = rule?.message
            this._alert.error(rule?.message, { type: { INTERVAL_TIME: 5000 } })
            return false
          } else {
            let fieldError = this.getFormBySlug(field?.slug, true).errors
            if (fieldError) {
              delete fieldError['match']
              if (!Object.keys(fieldError).length) {
                this.getFormBySlug(field?.slug, true).setErrors(null)
              } else {
                this.getFormBySlug(field?.slug, true).setErrors(fieldError)
              }
            }
            return true
          }
        }
      }
    }
    return true
  }

  getFormBySlug(slug: string, field = false) {
    for (let i = 0; i < this.jsonData?.nav_tabs?.length; i++) {
      if (this.renderFormModel[this.jsonData?.nav_tabs[i].label]) {
        if (this.renderFormModel[this.jsonData?.nav_tabs[i].label].get(slug)) {
          if (field) {
            return this.renderFormModel[this.jsonData?.nav_tabs[i].label].get(slug)
          } else {
            return this.renderFormModel[this.jsonData?.nav_tabs[i].label]
          }
        }
      }
    }
    return null
  }

  getFieldValue(slug) {
    let control = this.getFormBySlug(slug, true)
    if (control !== null) {
      return control.value
    } else {
      return null
    }
  }

  // reverse check rules
  onChangeFieldDataChageOthers(field, matchSlug = '', noReset = false) {
    if (this.getFormBySlug(field?.slug, true)) {
      if (field?.meta_data?.rules?.length > 0) {
        field?.meta_data?.rules?.forEach(rule => {
          if (rule?.slug === matchSlug) {
            if (rule?.condition === 'hidden') {
              if (rule?.value.indexOf(this.getFieldValue(rule?.slug)) > -1) {
                this.fieldProp[field?.slug] = false
                if (this.getFormBySlug(field?.slug, true)) {
                  this.getFormBySlug(field?.slug, true).setValue(field?.has_default ? field?.default_value : null)
                }
              } else {
                this.fieldProp[field?.slug] = true
              }
            } else if (rule?.condition === 'required') {
              if (this.fieldProp[field?.slug]) {
                if (rule?.value) {
                  this.getFormBySlug(field?.slug, true).setValidators([Validators.required])
                  this.getFormBySlug(field?.slug, true).updateValueAndValidity()
                  this.fieldRequiredList[field?.slug] = true
                }
              } else {
                this.getFormBySlug(field?.slug, true).setValidators([])
                this.getFormBySlug(field?.slug, true).updateValueAndValidity()
                this.fieldRequiredList[field?.slug] = false
              }
            } else if (rule?.condition === 'equal_data') {
              this.getFormBySlug(field?.slug, true).setValue(this.getFieldValue(rule?.slug))
            } else if (rule?.condition === 'reset') {
              if (!noReset) {
                // this.getFormBySlug(field?.slug, true).setValue(null)
                // this.getFormBySlug(field?.slug, true).updateValueAndValidity()
              }
              return false
            } else if (rule?.condition === 'match') {
              if (this.getFieldValue(rule?.slug) !== rule?.value) {
                this.getFormBySlug(field?.slug, true).setValue(null)
                this._alert.error(rule?.message, { type: { INTERVAL_TIME: 5000 } })
                return false
              }
            } else if (rule?.condition === 'readonly') {
              if (this.getFieldValue(rule?.slug) === rule?.value) {
                this.getFormBySlug(field?.slug, true).disable()
                return false
              } else {
                this.getFormBySlug(field?.slug, true).enable()
                return true
              }
            } else if (rule?.condition === 'set_value') {
              const ruleSlugData = this._storageService.get(rule?.slug)
              if (ruleSlugData) {
                let result = this.getDataByKey(ruleSlugData, rule?.slug_value, this.getFieldValue(rule?.slug));
                let id = this.getDataByKeyArray(result, rule?.value_get_by);
                if ((this.getFieldValue(field?.slug) === null) || (this.getFieldValue(field?.slug) === undefined)) {
                  if ((field?.type === 'DROPDOWN') || (field?.type === 'PERSON_DROPDOWN') || (field?.type === 'CANDIDATE_DROPDOWN') || (field?.type === 'VENDOR_DROPDOWN')) {
                    this.getFormBySlug(field?.slug, true).setValue(id, { emitEvent: false })
                    this.updateValue = true
                  } else if (field.type === 'DATE') {
                    id = this.datePipe.transform(id, 'yyyy-MM-dd')
                    this.getFormBySlug(field?.slug, true).setValue(id)
                  } else {
                    this.getFormBySlug(field?.slug, true).setValue(id, { emitEvent: false })
                  }
                }
              }
            }
          }
        });
      }
    }
  }

  forUrlFunction(field) {
    const e = eval
    e(field?.datasource?.function)

    const fn = window['' + field?.datasource?.function_name]
    let argu = {}

    let searchData = ''
    let searchArray = []
    field?.datasource?.params.forEach(par => {
      if (par?.required && par?.value) {
        if (searchData === '') {
          searchData = par?.name + '=' + par?.value
        } else {
          searchData = searchData + '&' + par?.name + '=' + par?.value
        }
      }
      if (this.getFormBySlug(par?.slug, true) !== null) {
        if (par?.type === 'array') {
          if (par?.name in searchArray) {
            searchArray[par?.name].push(this.getFieldValue(par?.slug))
          } else {
            searchArray[par?.name] = [this.getFieldValue(par?.slug)]
          }
        } else if (searchData === '') {
          searchData = par?.name + '=' + this.getFormBySlug(par?.slug, true).value
        } else {
          searchData = searchData + '&' + par?.name + '=' + this.getFormBySlug(par?.slug, true).value
        }
      }
    })

    for (const name in searchArray) {
      if (searchArray[name]?.length > 0) {
        searchArray[name]?.forEach((arrayVal, index) => {
          if (arrayVal !== null) {
            searchData = searchData + `&${name}[${index}]=${arrayVal}`
          }
        });
      }
    }
    let is_validation_url = true
    field?.datasource?.params.forEach(par => {
      if (!('value' in field?.datasource?.params) && par?.slug) {
        if (this.getFormBySlug(par?.slug, true) !== null) {
          if (par?.required && (this.getFormBySlug(par?.slug, true).value === null)) {
            is_validation_url = false
          }
        } else if (par?.required && (this.getFormBySlug(par?.slug, true) === null)) {
          is_validation_url = false
        }
      }
    })

    if (is_validation_url) {
      if (field?.meta_data?.rules?.length > 0) {
        field?.meta_data?.rules?.forEach(rule => {
          if (rule?.condition === 'required') {
            if (rule?.value?.indexOf(this.getFieldValue(rule?.slug)) > -1) {
              if (this.getFieldValue(rule?.name) === null) {
                is_validation_url = false
              }
            }
          }
        })
      }
    }

    if (is_validation_url) {
      let url = field?.datasource?.url
      url = url.replace('${programId}', this.programId)
      this._formRendererService.get(url + '?' + searchData).subscribe(data => {
        if (data) {
          field?.datasource?.getBy.forEach(d => {
            data = data[d]
          });
          argu = data
          // this.renderFormModel[this.tabName].get(field?.slug).setValue(data, { emitEvent: false })
          let funResult = fn(argu)
          this.renderFormModel[this.tabName].get(field?.slug).setValue(funResult)
        }
      }, err => {
        console.error(err)
      })
    }
  }

  onCandidateView(event) {
    this.onClickCandidateView.emit(event)
  }

  onVendorClick(event) {
    this.onClickVendorView.emit(event)
  }

  setValue(field) {
    let url = field?.datasource?.url
    if ((url !== '') && (url !== undefined) && (field?.datasource?.on_land)) {
      url = url.replace('${programId}', this.programId)
      this._formRendererService.get(url).subscribe((data: any[]) => {
        if (data) {
          field?.datasource?.getBy.forEach(d => {
            data = data[d]
          });

          this.getFormBySlug(field?.slug, true).setValue(data)
          this.changeDetectorRef.detectChanges()
        }

      }, err => {

      })
    }
  }

  getDataByKey(updateData, key: string, value: string) {
    if (updateData.hasOwnProperty(key) && updateData[key] === value) {
      return updateData;
    } else {
      for (let i = 0; i < Object.keys(updateData).length; i++) {
        let data = updateData[Object.keys(updateData)[i]];
        if (typeof data === "object" && data !== null) {
          let result = this.getDataByKey(data, key, value);
          if (result) return result;
        }
      }
    }
  }

  getDataByKeyArray(data, keyArray) {
    if (data) {
      for (let key of keyArray) {
        data = data[key]
      }
      return data
    }
  }

  getReasonCode() {
    this.updateOfReason$ = this.reasonCodesService.getResoncodesFor('REQUEST_AMENDMENT').pipe(map((updateReason: any) => {
      this.renderFormModel['Financial Info'].get('reason_code_action')?.setValue(updateReason?.resonCodeID, { emitEvent: false });
      return updateReason?.reason_codes;
    }));
  }

  workWeekPeriod: any;
  workWeekStartDay: any;

  getTimesheetConfig() {
    if (this.assignmentId) {
      const url = `/timesheet/programs/${this.programId}/config?assignment_uuid=${this.assignmentId}`;
      this._formRendererService.get(url)
        .subscribe(res => {
          const { data } = res;
          const { work_week_period, work_week_start_day } = data;
          this.workWeekPeriod = work_week_period;
          this.workWeekStartDay = work_week_start_day;
        })
    }
  }

  uploadFiles(event: any): void {
    if (event && event.raw) {
      let fileExtension = event.ext?.toLowerCase();
      if (fileExtension === 'pdf' || fileExtension === 'doc' || fileExtension === 'docx') {
        let payload = {
          file_name: event['name'],
          raw: event['raw']
        };
        this._loader.show();
        this._formRendererService.post(`/assignment/programs/${this.programId}/assignments/upload`, payload).subscribe((data: any) => {
          if (data) {
            this.document = data.data;
            this.getFormBySlug('documents', true).setValue(this.document, { emitEvent: false })
            this._alert.success('File uploaded successfully');
            this._loader.hide();
          }
        },
          (err) => {
            this._alert.error(errorHandler(err));
            this._loader.hide();
          });
      }
    }
  }
}
