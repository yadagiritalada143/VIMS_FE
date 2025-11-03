import { AfterViewInit, Component, EventEmitter, Input, OnDestroy, OnInit, Output, SimpleChange, SimpleChanges } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormGroup, Validators, AbstractControl } from '@angular/forms';
import { Subscription } from 'rxjs/internal/Subscription';
import { CommonService } from '../common.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { CustomFieldsHttpService } from '../http.service';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { DATE_FORMAT } from '../../date-format/date-format.model';
import { customFields } from '../CustomFields.enum'
import { CustomFieldsService } from 'src/app/program-setup/custom-fields/custom-fields.service';
import { AccuracyConfigTypes, CurrencyConfig }  from '../../../expense/enums/accuracy-config.enum';
import * as moment from 'moment-timezone';
import * as _ from 'lodash';

@Component({
  selector: 'app-custom-fields',
  templateUrl: './custom-fields.component.html',
  styleUrls: ['./custom-fields.component.scss']
})
export class CustomFieldsComponent implements OnInit, OnDestroy , AfterViewInit {
  public customFieldsEnum = customFields;
  public accuracyConfig = AccuracyConfigTypes;
  public currencyConfig = CurrencyConfig;
  dateTimeValue: any;

  constructor(private fb: UntypedFormBuilder, private httpService: CustomFieldsHttpService,
    private storageService: StorageService, private commonService: CommonService,
    private datePipe: LocalDateFormatPipe,
    public customFieldService : CustomFieldsService

    ) { }

  options: any = {
      language: 'English',
      timepicker: true,
      format12h: true,
      range: false,
    };
    _showLabel = true;
  _dateFormat= DATE_FORMAT.FORMATMDY;
  @Input () set dateFormat(value  : any) {
    if (value) {
      this._dateFormat = value;
    }
  }

  @Input() queryParameters: any = null;
  @Input() moduleName;
  @Input() entityRefName;
  @Input() hierarchyIds;
  @Input() jobType;
  @Input() isDisabled?: boolean = false;
  // @Input()  showLabel= true;
  @Input() set showLabel(data) {
     this._showLabel = data;
  }
  @Output() customFieldUpdated= new EventEmitter();
  @Output() isCustomFieldsFormValid: EventEmitter<boolean> = new EventEmitter();
  public customFieldsForm: UntypedFormGroup;
  // public timePattern: RegExp = /^[0-9]{1,2}:[0-9]{1,2}$/;
  public timePattern: RegExp = /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/;
  public timeTypePattern: RegExp = /^[0-9]{0,2}[:]{0,1}[0-9]{0,2}$/;
  public timeErrorText: string = `Invalid time format! Required: 00:00-23:59`;
  customFields= undefined;
  custom_fields_Values:any=undefined;
  public closePanel: EventEmitter<boolean> = new EventEmitter();
  @Input() set custom_fields(fields:any){
    if(fields){
      this.custom_fields_Values= fields;
      this.patchCustomData(fields);
    }
  }
  @Input() uploadS3RefName :string;
  @Input() isCreate: boolean = true;
  dependentFieldsSubscription: Subscription;
  checkedCategoryListMap:any = {};
  public emailPattern: RegExp = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
  public alphaNumericPattern: RegExp = /^[a-zA-Z0-9]{0,13}$/;
  public program: any;

  ngOnInit(): void {
    this.program = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.customFieldsForm = this.fb.group({
      custom_fields: this.fb.array([]),
     });
     this.customFieldsForm?.get('custom_fields').valueChanges.subscribe(
      (selectedValue) => {
        this.onEmit();
    });
    this.getCustomFields();
    this.dependentFieldsSubscription = this.commonService.dependentFields.subscribe(dependentFields => {
      if (dependentFields) {
        this.mapDependentFields(dependentFields);
      }
    })
  }

  ngOnChanges(changes: SimpleChanges): void {
    const hierarchy_ids: SimpleChange = changes?.hierarchyIds;
    const org_category: SimpleChange = changes?.org_category;
    const job_types: SimpleChange = changes?.jobType;
    if(this.simpleChangeUpdate(hierarchy_ids) || this.simpleChangeUpdate(org_category) || this.simpleChangeUpdate(job_types) ) {
      this.ngOnInit()
    }
  }

  ngAfterViewInit(): void {
    this.onEmit();
  }

  onEmit() {
    if (this.customFieldsForm?.get('custom_fields') && this.customFieldsForm?.get('custom_fields')['controls']) {
      let isValid = true;
      let values = [];
      this.customFieldsForm?.get('custom_fields')['controls']?.forEach(control => {
        if (control?.value?.is_show) {
          if (!control.valid) {
            isValid = false;
          }
          if (control.value.custom_field_type == this.customFieldsEnum.NUMBERS) {
            control.value.values = control?.value?.values ? parseFloat(control.value.values?.toString().replace(/,/g, '')) : control?.value?.values;
            values.push(control.value);
          } else if (control.value.custom_field_type == this.customFieldsEnum.DATE && control?.value?.values) {
            let tempVar = Object.assign({}, control.value);
            tempVar.values = this.datePipe.transform(control.value.values, this._dateFormat, null, null, true, this.program?.defaultDateFormat);
            values.push(tempVar);
          } else if (control.value.custom_field_type == this.customFieldsEnum.DATETIME && control?.value?.values) {
            let tempVar = Object.assign({}, control.value);
            tempVar.values = this.datePipe.transform(control.value.values.split(' ')[0], this._dateFormat, null, null, true, this.program?.defaultDateFormat) + (control.value.values.split(' ')[1] ? (' ' + control.value.values.split(' ')[1]) : '');
            values.push(tempVar);
          } else {
            values.push(control.value);
          }
        }
      });
      this.customFieldUpdated.emit(values);
      this.isCustomFieldsFormValid.emit(isValid);
    }
  }

  get customFieldsArray() {
    return (this.customFieldsForm?.get('custom_fields') as UntypedFormArray || new UntypedFormArray([]));
  }

  get formControl() {
    return this.customFieldsForm.controls;
  }

  timeFieldAction = (event: KeyboardEvent | Event | any): void => {

    // Helpers
    const key: any = event?.key;
    const target: EventTarget | any = event?.target;
    const caretPosition: number = target?.selectionStart;

    // Validations
    const isCorrectPosition: boolean = (caretPosition === 2);
    const isKeyStroke: boolean = (key?.length === 1);
    const includesColon: boolean = ((target?.value ?? "")?.includes(':'))

    if(isCorrectPosition && isKeyStroke && !includesColon) {
      target.value += ':';
    }

    return event;
  }

  //setcustom data
  patchCustomData(custom_fields) {
    if (!this.isEmptyObject(custom_fields)) {
      let c_data = this.customFieldsArray;
      c_data.controls?.forEach(element => {
        for (const [key, value] of Object.entries(custom_fields)) {
          if (element?.value?.custom_field_slug === key) {
            if (element?.value?.custom_field_type?.toUpperCase() === this.customFieldsEnum.DATE) {
              let dateValue = value ? this.datePipe.transform(value, this.program?.defaultDateFormat, null, null, true, this._dateFormat) : null;
              element.get('values').patchValue(dateValue);
              element.value.values = dateValue;
            } else if (element?.value?.custom_field_type?.toUpperCase() === 'CHECKBOX') {
              this.checkedCategoryListMap[element.value.custom_field_slug] = {items : value};
               element?.value?.meta_data?.datasource?.options.forEach(o => {
                o.checked = value?.['indexOf'](o.label) !== -1;
              });
              element.get('values').patchValue(value)
            } else if(element?.value?.custom_field_type?.toUpperCase() === 'TOGGLE' && typeof value == "string") {
              element.get('values').patchValue(value == "true");
              element.value.values = (value == "true");
            } else if (element?.value?.custom_field_type == this.customFieldsEnum.DATETIME) {
              element
                ?.get('values')
                ?.patchValue(
                  value === '' || value === ' '
                    ? null
                    : value,
                );
                const date = this.datePipe.transform((value as string)?.split(' ')?.[0], null, null, null, true);
                const time = (value as string)?.split(" ")?.[1] ? moment((value as string)?.split(" ")?.[1] , "HH:mm:ss" ).format('HH:mm') : null;
                element?.get('date_time_obj')?.patchValue({date,time})
                if(element?.value?.is_required && (!date || !time)) {
                  element?.get('date_time_obj')?.setErrors({ invalid: true });
                }
            } else if (element?.value?.custom_field_type == this.customFieldsEnum.NUMBERS) {
              if (element?.value?.meta_data?.show_in_thousands || element?.value?.meta_data?.decimal) {
                this.getCommaSaparatedValue((Number(value) === 0 || value)  ? value : null, element?.value?.custom_field_id)
              } else {
                element.get('values').patchValue(value);
                element.value.values = value;
              }
            } else if(element?.value?.custom_field_type?.toUpperCase() === 'TIME') {
              let timeValue = (value as string)?.split(' ')?.length === 2 ? moment(value as string , 'YYYY-MM-DD HH:mm:ss').format('HH:mm') : moment(value as string , 'HH:mm:ss').format('HH:mm');
              element.get('values').patchValue(timeValue);
              element.value.values = timeValue;
            } else if(element?.value?.custom_field_type?.toUpperCase() === 'SOURCE') {
              element.get('values').patchValue(value);
              element.value.values = value;
              this.mapSourceData(element?.value);
            } else {
              element.get('values').patchValue(value);
              element.value.values = value;
            }
          }
        }
        if(!custom_fields?.hasOwnProperty(element?.value?.custom_field_slug)) {
          if(!element?.get('values')?.value && element?.get('is_readonly')?.value && element?.get('is_required')?.value) {
            element.get('is_readonly').patchValue(false);
            element.value.is_readonly = false;
          }
        }
      });
      this.updateDependantFlag(undefined);
    } else {
      this.customFieldsArray?.controls?.forEach((element) => {
        if (!element?.get('values')?.value && element?.get('is_readonly')?.value && element?.get('is_required')?.value) {
          element.get('is_readonly').patchValue(false);
          element.value.is_readonly = false;
        }
      })
    }
 }

 mapDependentFields(dependentFields) {
  for (const foundationalField of dependentFields || []) {
    const { custom_field_mapping } = foundationalField || {};
    if (!custom_field_mapping?.length) { // should have custom_field_mapping
      return;
    }
    custom_field_mapping?.forEach(dependentField => {
      const getDependentControlIndex = this.customFieldsArray.value.findIndex(control => control?.custom_field_id === dependentField?.custom_field_id);
      if (getDependentControlIndex !== -1 && dependentField.default) {
        this.customFieldsArray?.controls[getDependentControlIndex]?.get('values')?.patchValue(dependentField.default);
      }
    });
  }
 }

  updateCustomFieldForm() {
    const formArray = this.customFieldsForm?.get('custom_fields') as UntypedFormArray;
    while (formArray && formArray?.length !== 0) {
      formArray?.removeAt(0);
    }
    this.customFields?.forEach((element ,i) => {
      let isRequired = element?.is_required ? element?.is_required: false;
      //const isRequired = element?.is_required && element?.can_edit && !element?.is_readonly; //element?.is_readonly
      let isReadOnly = element?.type == 'DROPDOWN' ? element?.is_readonly && element?.meta_data?.datasource?.options?.filter(f=>f.selected == "ON").length > 0 ? true : false : element?.is_readonly ? element?.is_readonly : false;
      if(isReadOnly && this.isCreate && !element?.meta_data?.hasOwnProperty('default_value') && element?.can_edit && isRequired) {
        isReadOnly = false;
      }
      const isElementSingleRow = ((element?.type == this.customFieldsEnum.MULTI_SELECT_DROPDOWN || (element?.type == this.customFieldsEnum.PICKLIST && element?.pick_list?.multiselect) || element?.type == this.customFieldsEnum.FILE || element?.type == this.customFieldsEnum.IMAGE)) ? true : false;
      this.customFieldsArray.push(
        this.fb.group({
          is_required: [isRequired],
          custom_field_name: [element.name],
          custom_field_label: [element.label],
          custom_field_id: [element.id],
          custom_field_slug:[element.slug],
          custom_field_type: [element?.type],
          custom_field_placeholder: [element?.placeholder],
          ref_column: [element?.ref_column],
          values: [this.getValue(element) , isRequired ? [Validators.required] : []],
          range_error : null,
          meta_data: element?.meta_data,
          api_url: element?.api_url,
          slug: element?.slug,
          is_show: [true],
          is_depend_slug: [null],
          is_depend_value: [null],
          can_edit: [element?.can_edit],
          is_readonly: [isReadOnly],
          supporting_text: [element?.supporting_text],
          picklist_data: [element?.type == this.customFieldsEnum?.PICKLIST ? element?.pick_list : null],
          is_single_row: [isElementSingleRow],
          date_time_obj: [element?.type == this.customFieldsEnum.DATETIME ? { date: null, time: null } : null]
        })
      )
      if(element?.type == this.customFieldsEnum.NUMBERS) {
        if (element?.meta_data?.show_in_thousands || element?.value?.meta_data?.decimal)
          this.getCommaSaparatedValue((element?.meta_data?.default_value || Number(element?.meta_data?.default_value) === 0) ? element?.meta_data?.default_value : null, element.id);
        else
          element.values = element?.meta_data?.default_value;
      }
    });
    this.isCustomFieldsFormValid.emit(this.customFieldsForm?.valid);
    this.isCreate && this.patchDefaultValue();
    this.updateDependantFields();
  }

  getValue(element) {
    if(element && (element.type === 'RADIO' || element?.type === 'TOGGLE')) {
      return false
    } else if(element && element?.type === 'HYPERLINK') {
      return  element?.meta_data?.url;
    } else {
     return  null
    }
  }

  getCommaSaparatedValue(item, itemId) {
    item = parseFloat(item?.toString().replace(/,/g, ''))
    const getSelectedIndex = this.customFieldsArray.value.findIndex(control => control?.custom_field_id === itemId);
    if(!isNaN(item)) {
    if (getSelectedIndex !== -1 && item && this.customFieldsArray?.controls[getSelectedIndex]?.get('meta_data').value.show_in_thousands) {
      // this.customFieldsArray?.controls[getSelectedIndex]?.get('values')?.patchValue(formatNumber(Number(item), 'en-US', '1.0-0'));
      this.customFieldsArray?.controls[getSelectedIndex]?.get('values')?.patchValue(item.toLocaleString('en-US', {minimumFractionDigits: this.customFieldsArray?.controls[getSelectedIndex]?.get('meta_data')?.value?.decimal}));
    }
    item = parseFloat(item?.toString().replace(/,/g, ''))
    if(this.customFieldsArray?.controls[getSelectedIndex]?.get('meta_data').value.decimal && !this.customFieldsArray?.controls[getSelectedIndex]?.get('meta_data').value.show_in_thousands) {
      this.customFieldsArray?.controls[getSelectedIndex]?.get('values')?.patchValue(item.toFixed(this.customFieldsArray?.controls[getSelectedIndex]?.get('meta_data')?.value?.decimal));
    }
    if(this.customFieldsArray?.controls[getSelectedIndex]?.get('meta_data').value.range_applicable && (Number(item) > this.customFieldsArray?.controls[getSelectedIndex]?.get('meta_data')?.value?.range?.range_max || Number(item) < this.customFieldsArray?.controls[getSelectedIndex]?.get('meta_data')?.value?.range?.range_min)) {
      this.customFieldsArray.controls[getSelectedIndex].get('values').setErrors({'incorrect': true})
      this.customFieldsArray.controls[getSelectedIndex].get('range_error').setValue(true)
    } else {
      this.customFieldsArray.controls[getSelectedIndex].get('range_error').setValue(false)
    }
  }
  }

  updateDependantFields()  {
    let custom_fields = this.customFieldsForm?.get('custom_fields')?.value
    custom_fields.forEach(element => {
       if(element && element.meta_data) {
          if(element.meta_data && element.meta_data.depends_on && element.meta_data.depends_on?.conditions && element.meta_data.depends_on?.conditions?.length > 0) {
            element.meta_data.depends_on?.conditions.forEach(conditions => {
              let dependValue = element.meta_data.depends_on;
            //  let slug_name = dependValue.conditions[0]?.slug;
             let slug_name = conditions?.slug;
             let value =  this.capitalizeFirstLetter(conditions?.condition?.value);
             let depend_slug = custom_fields.filter(c=>c.custom_field_slug === slug_name);
             let index = custom_fields.findIndex(c=> c.custom_field_slug === slug_name);
             if(depend_slug && depend_slug.length > 0) {
               custom_fields[index].is_depend_slug = element.custom_field_slug;
               custom_fields[index].is_depend_value = value;
               custom_fields[index].is_show = false;
               let controlArray = <UntypedFormArray>this.customFieldsForm?.controls["custom_fields"];
               controlArray.controls[index].patchValue({is_depend_slug:element.custom_field_slug});
               controlArray.controls[index].patchValue({is_depend_value:value})
               controlArray.controls[index].patchValue({is_show:false});
               controlArray.controls[index].patchValue({is_required:false});
               controlArray?.controls[index].setValidators(null);
               this.customFieldsForm?.controls?.custom_fields?.updateValueAndValidity();
             }
            });
          }
       }
     });
     if(this.custom_fields_Values){
      this.patchCustomData(this.custom_fields_Values);
     }
   }

  updateDependantFlag(i) {
    //  let contorls = this.customFieldsForm.get('custom_fields')?.controls;
   const custom_fields = this.customFieldsForm?.get('custom_fields')?.value;
     custom_fields?.forEach((element, element_index)  => {
      if(element && element.meta_data) {
        if(element.meta_data && element.meta_data.depends_on && element.meta_data.depends_on?.conditions && element.meta_data.depends_on?.conditions?.length > 0) {
          element.meta_data.depends_on?.conditions?.forEach(conditions => {
            //const dependValue =  element.meta_data.depends_on ;
            const slug_name = conditions?.slug;
            const value =  this.capitalizeFirstLetter(conditions?.condition?.value);
            const depend_slug = custom_fields.filter(c=>c.custom_field_slug === slug_name);
            const index = custom_fields.findIndex(c=> c.custom_field_slug === slug_name);
            if(typeof element?.values == 'string'
            ? element?.values?.toLowerCase() === value?.toLowerCase()
            : typeof element?.values == 'boolean' ? value.toLowerCase() : element?.values?.map(x => x?.toLowerCase())?.includes(value?.toLowerCase())) {
              if(depend_slug && depend_slug.length > 0) {
                custom_fields[index].is_depend_slug = element.custom_field_slug;
                custom_fields[index].is_depend_value = value;
                custom_fields[index].is_show = true;
                let controlArray = <UntypedFormArray>this.customFieldsForm?.controls["custom_fields"];
                controlArray.controls[index].patchValue({is_depend_slug:element.custom_field_slug});
                controlArray.controls[index].patchValue({is_depend_value:value})
                controlArray.controls[index].patchValue({is_show:true});
                controlArray.controls[index].patchValue({is_required:true});
                if (controlArray?.controls?.[index]?.get('custom_field_type')?.value == this.customFieldsEnum.HYPERLINK) {
                  controlArray?.controls?.[index]?.patchValue({ values: controlArray?.controls?.[index]?.get('meta_data')?.value?.url });
                }
                if(index !==-1) {
                  const control = <UntypedFormArray>controlArray?.controls[index]['controls']['values'];
                  control?.setValidators([Validators.required]);
                  control?.updateValueAndValidity();
                }
                this.customFieldsForm?.controls?.custom_fields?.updateValueAndValidity();
              }
            } else {
              if(i === element_index) {
                const controlArray = <UntypedFormArray>this.customFieldsForm.controls["custom_fields"];
                controlArray.controls[index]?.patchValue({is_show:false});
                controlArray.controls[index]?.patchValue({is_required:false});
                controlArray.controls[index]?.patchValue({values:null});
                controlArray?.controls[index]?.setValidators(null);
                if(index !==-1) {
                  const control = <UntypedFormArray>controlArray?.controls[index]['controls']['values'];
                  control?.setValidators(null);
                  control?.updateValueAndValidity();
                }
                controlArray?.controls[index]?.updateValueAndValidity();
                this.customFieldsForm?.controls?.custom_fields?.updateValueAndValidity();
              }
            }
          });

         }
      }
    });
  }

  getCustomFields() {
    //adding active=true/1 for showing active custom fields as per V2M-6634
    let url = `/configurator/programs/${this.program?.id}/custom-fields?entity_ref=${this.moduleName}&active=1&order_by=asc&key=ref_order`;
    if (this.hierarchyIds) {
      if (typeof this.hierarchyIds === 'string')
        url += `&hierarchy_ids=${this.hierarchyIds}`;
      else if (typeof this.hierarchyIds === 'object')
        url += `&hierarchy_ids=${this.hierarchyIds?.join(',')}`
    }
    if(this.jobType && this.jobType?.length > 0 && Array.isArray(this.jobType) ) {
      url += `&job_type=${this.jobType?.join(',')}&empty_job_type=true`
    }

    let queryParams: Array <string> = [...Object.keys(this.queryParameters || {})];
    if(Array.isArray(queryParams) && queryParams.length) {
      queryParams.forEach((query: string) => {
        const value: string = this.queryParameters?.[query] || '';
        if(value) {
          url += `&${query}=${value}`;
        }
      })
    }

    this.httpService.get(url).subscribe({
      next: (data: any) => {
     if(data && data.custom_fields.length > 0) {
      this.customFields = data.custom_fields;
      this.customFields.forEach(element => {
        if(element?.type == 'SOURCE' && element?.api_url) {
          this.httpService.get(element?.api_url).subscribe(data => {
            if(data.members) {
              if(!element?.meta_data?.options || element.meta_data?.options?.length == 0){
                element.meta_data.options = data.members.map(x => { return {
                  value: x.id,
                  label:x.full_name
                }})
              }else{
                data.members.forEach(x => {
                  element.meta_data.options.push({
                    value: x.id,
                    label:x.full_name
                  })
                });

              }

              this.mapSourceData(element);
            }
          });
        }
      })
      setTimeout(() => {
        this.updateCustomFieldForm();
      }, 2000);
     } else {
      this.customFields = new Array();
     }
    }
  });
  }

  mapSourceData(element){
    if(!element?.values)
      return;
    const value= element.values;
    const checkValue = obj => obj.value === value;
    if(element?.meta_data?.options?.length > 0 && element?.meta_data?.options?.some(checkValue)){
      return;
    }
    let url = element.api_url;
    url = url?.includes('?') ? url += `&user_ids=${value}` : url += `?user_ids=${value}`;

    this.httpService.get(url).subscribe(data => {
      if(data?.members?.length > 0) {
        let options= element?.meta_data?.options || [];
        if(options?.length > 0){
          options.push({
            value: data.members[0]?.id,
            label:data?.members[0]?.full_name
          });
        }else{
          options= [{
            value: data.members[0]?.id,
            label:data?.members[0]?.full_name
          }];
        }
        //element.get('values').patchValue(value);
        element.meta_data.options= [];
        element.meta_data.options= [...element.meta_data.options,...options];
      }
    });
  }

  searchSourceFieldValues(searchSourceFieldValues,field) {
    if(field.api_url && (searchSourceFieldValues || searchSourceFieldValues == '')) {
      let url = field.api_url.includes('?') ?  field.api_url + `&k=${searchSourceFieldValues}` : field.api_url + `?k=${searchSourceFieldValues}`
      this.httpService.get(url).subscribe(data => {
        if(data.members) {
          this.customFields.forEach(x => {
            if(field.slug == x.slug) {
              x.meta_data.options = data.members.map(x => { return {
                value: x.id,
                label:x.full_name
              }})
            }
          })
        }
      });
    }
  }

  selectedValues(formControl, item, isChecked, i?){
    if(isChecked) {
      if(!this.checkedCategoryListMap[formControl.value.custom_field_slug]) {
        this.checkedCategoryListMap[formControl.value.custom_field_slug] = {items : []};
      }
      this.checkedCategoryListMap[formControl.value.custom_field_slug].items.push(item);
    } else {
      let index = this.checkedCategoryListMap[formControl.value.custom_field_slug].items.indexOf(item);
      this.checkedCategoryListMap[formControl.value.custom_field_slug].items.splice(index,1);
    }
    formControl.patchValue({values : this.checkedCategoryListMap[formControl.value.custom_field_slug].items});
    this.updateDependantFlag(i)
  }

  uploadFiles(event, item, i) {
    if(event && event.length > 0) {
      let controlArray = <UntypedFormArray>this.customFieldsForm.controls["custom_fields"];
      controlArray.controls[i].patchValue({values:event[0]});
    } else {
      let controlArray = <UntypedFormArray>this.customFieldsForm.controls["custom_fields"];
      controlArray.controls[i].patchValue({values : null});
    }
  }

  updateoldFiles(event) {

  }
  capitalizeFirstLetter(string) {
    if(string) {
      return string?.charAt(0)?.toUpperCase() + string?.slice(1);
    }

  }

  isEmptyObject(object)  {
    return (object && Object.keys(object).length === 0 && object.constructor === Object);
  }

  simpleChangeUpdate(change: SimpleChange) {

    const previousValue: any = change?.previousValue;
    const currentValue: any = change?.currentValue;

    if(change?.firstChange) {
      return false;
    }

    // Array
    if(Array.isArray(previousValue) && Array.isArray(currentValue)) {
      let xor: Array <string> = _.xor(previousValue, currentValue);
      return (xor.length !== 0);
    }

    return previousValue !== currentValue;
  }

  ngOnDestroy() {
    this.dependentFieldsSubscription.unsubscribe();
  }

  modifyToggle(element,event) {
    element?.get('values')?.patchValue(event);
  }

  patchDefaultValue() {
    this.customFieldsArray?.controls?.forEach(element => {
      const custom_field_type = element?.value?.custom_field_type;

      // for radio,checkbox and dropdown default value is there in there options list so creating default key for them to keep every type patching same
      if(custom_field_type == this.customFieldsEnum.DROPDOWN || custom_field_type == this.customFieldsEnum.CHECKBOX) {
        element.value.meta_data.default_value = element?.value?.meta_data?.datasource?.options?.filter((res)=> res?.selected?.toUpperCase() == 'ON' );
      } else if(custom_field_type === this.customFieldsEnum.RADIO) {
        element?.value?.meta_data?.datasource?.options?.forEach((res)=>{
          if(res?.selected?.toUpperCase() == 'ON') {
            element.value.meta_data.default_value = custom_field_type == this.customFieldsEnum.CHECKBOX ? res?.label : res?.value
          }
        })
      }
    if (
        custom_field_type != this.customFieldsEnum.FILE &&
        custom_field_type != this.customFieldsEnum.IMAGE &&
        element?.value?.meta_data?.hasOwnProperty('default_value') &&
        (element?.value?.meta_data?.default_value !== undefined && element?.value?.meta_data?.default_value !== null)
      ) {
        if (custom_field_type == this.customFieldsEnum.DATETIME) {
          element
            ?.get('values')
            ?.patchValue(
              element?.value?.meta_data?.default_value === '' || element?.value?.meta_data?.default_value === ' '
                ? null
                : element?.value?.meta_data?.default_value,
            );
            const date = this.datePipe.transform(element?.value?.meta_data?.default_value?.split(' ')?.[0], null, null, null, true);
            const time =element?.value?.meta_data?.default_value?.split(" ")?.[1] ?  moment(element?.value?.meta_data?.default_value?.split(" ")?.[1], "HH:mm:ss" ).format('HH:mm') : null;
            element?.get('date_time_obj')?.patchValue({date,time})
        } else if(custom_field_type == this.customFieldsEnum.DATE) {
          let dateValue: string = (!(element?.value?.meta_data?.default_value || "").trim()) ? null : element?.value?.meta_data?.default_value;
          if (dateValue) {
            element?.get('values')?.patchValue(this.datePipe.transform(dateValue, this.program.defaultDateFormat, null, null, true, this._dateFormat));
          }
        } else if(custom_field_type == this.customFieldsEnum.CHECKBOX) {
          const default_values = element?.value?.meta_data?.default_value?.map((res)=>res?.label) || [];
          element?.value?.meta_data?.datasource?.options.forEach(o => {
            o.checked = default_values?.includes(o.label);
          });
          this.checkedCategoryListMap[element?.value?.custom_field_slug] = { items: default_values }
          element?.get('values')?.patchValue(default_values);
        } else if(custom_field_type == this.customFieldsEnum.DROPDOWN || custom_field_type == this.customFieldsEnum.MULTI_SELECT_DROPDOWN) {
          const default_values = element?.value?.meta_data?.default_value?.map((res)=>res?.value) || [];
          element?.get('values')?.patchValue(element?.value.meta_data?.datasource?.is_multi_select ? default_values : default_values?.[0]);
        }  else {
          element?.get('values')?.patchValue(element?.value?.meta_data?.default_value);
          if(custom_field_type == this.customFieldsEnum.NUMBERS && (element?.value?.meta_data?.show_in_thousands || element?.value?.meta_data?.decimal)) {
            this.getCommaSaparatedValue(element?.value?.meta_data?.default_value, element?.value?.custom_field_id)
          }
        }
      } else if (
        (custom_field_type == this.customFieldsEnum.FILE ||
          custom_field_type == this.customFieldsEnum.IMAGE) &&
        element?.value?.meta_data?.hasOwnProperty('default_value') &&
        element?.value?.meta_data?.default_value
      ) {
        element?.get('values')?.patchValue(element?.value?.meta_data?.default_value?.[0]);
      }
    });
  }

  onDateTimeChange(element,timeObj?) {
    let str = "";
    const dateVal = this.datePipe.transform(element?.get('date_time_obj')?.value?.date, this._dateFormat, null, null, true, this.program.defaultDateFormat);
    const timeVal = element?.get('date_time_obj')?.value?.time;
    if (timeVal && dateVal) {
      str = dateVal + " " + timeVal;
    } else if (timeVal) {
      str = " " + timeVal;
    } else if (dateVal) {
      str = dateVal;
    }

    /* Validation should work for required fields only */ 
    const isRequired: boolean = element?.get('is_required')?.value;
    if(isRequired) {
      if(!timeVal || !dateVal || timeObj?.invalid) {
        element.get('date_time_obj').setErrors({invalid:true});
      }  
    }
    if(timeVal && dateVal && !timeObj?.invalid) {
      element.get('date_time_obj').setErrors(null);
    }
    element?.get('values')?.patchValue(str);
  }

  getPhoneCFErrorText(item: AbstractControl): string {

    let value: string = item?.get('values')?.value || "";
    if((value.length === 13 && this.phoneLengthExceeded) || value.length > 13) {
      return 'max_13_digits_only_can_be_entered';
    }

    if(item.touched && item.invalid) {
      return 'only_alphanumeric_values_are_allowed';
    }

    return null;
  }

  public phoneLengthExceeded: boolean = false;
  phoneLengthValidator(item: AbstractControl, evt: KeyboardEvent) {

    if(evt.key?.length !== 1) {
      return;
    }

    if((item?.get('values')?.value || "").length === 13) {
      this.phoneLengthExceeded = true;
      setTimeout(() => {
        this.phoneLengthExceeded = false;
      }, 2000);
    }
}
}
