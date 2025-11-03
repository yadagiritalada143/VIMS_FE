import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { CustomFieldsHttpService } from 'src/app/library/custom-fields/http.service';

@Component({
  selector: 'app-question',
  templateUrl: './question.component.html',
  styleUrls: ['./question.component.scss']
})
export class QuestionComponent implements OnInit {

  constructor(private fb: UntypedFormBuilder, private httpService: CustomFieldsHttpService,
    private storageService: StorageService,) { }

  options: any = {
    language: 'English',
    timepicker: true,
    format12h: true,
    range: false,
    enabledDateRanges: [
      { start: Date.now() },
    ]
  };
  @Input() moduleName;
  @Output() customFieldUpdated = new EventEmitter();
  @Output() isCustomFieldsFormValid: EventEmitter<boolean> = new EventEmitter();
  public questionForm: UntypedFormGroup;
  customFields = undefined;
  custom_fields_Values: any = undefined;
  public closePanel: EventEmitter<boolean> = new EventEmitter();
  @Input() set custom_fields(fields: any) {
    if (fields) {
      this.custom_fields_Values = fields;
      this.customFields = fields;
      setTimeout(() => {
        this.updateCustomFieldForm();
      }, 100);
      // this.patchCustomData(fields);
    }
  }
  isLoader: any;
  @Input() set isSubmit(data: any) {
    if (data) {
      this.isLoader = data;
    }
  }


  ngOnInit(): void {
    this.questionForm = this.fb.group({
      custom_fields: this.fb.array([]),
    });
    this.questionForm?.get('custom_fields').valueChanges.subscribe(
      (selectedValue) => {
        this.customFieldUpdated.emit(selectedValue);
      });
    this.questionForm?.get('custom_fields').statusChanges.subscribe(newStatus => {
      const isValid = newStatus?.toLowerCase() == 'valid' ? true : false;
      this.isCustomFieldsFormValid.emit(isValid);
    });
    // this.getCustomFields();
  }

  get customFieldsArray() {
    // return this.custom_fields_Values;
    return (this.questionForm?.get('custom_fields') as UntypedFormArray || new UntypedFormArray([]));
  }

  //setcustom data
  patchCustomData(custom_fields) {
    if (!this.isEmptyObject(custom_fields)) {
      let c_data = this.customFieldsArray;
      c_data?.controls?.forEach(element => {
        for (const [key, value] of Object.entries(custom_fields)) {
          if (element?.value?.custom_field_slug === key) {
            element.get('values').patchValue(value);
            element.value.values = value;
          }
        }
      });
      this.updateDependantFlag(undefined);
    }
  }

  updateCustomFieldForm() {
    const formArray = this.questionForm?.get('custom_fields') as UntypedFormArray;
    while (formArray && formArray?.length !== 0) {
      formArray?.removeAt(0);
    }
    this.customFields?.forEach(element => {
      let isRequired = element?.is_required ? element?.is_required: false;
      this.customFieldsArray.push(
        this.fb.group({
          is_required: [isRequired],
          custom_field_name: [element?.label],
          custom_field_id: [element?.id],
          dependent_questions: [element?.dependent_questions],
          custom_field_type: [element?.question_type],
          custom_field_placeholder: [element?.label],
          // ref_column: [element?.ref_column],
          values: [element.question_type === 'RADIO' ? false : null , isRequired ? [Validators.required] : [null]],
          meta_data: element?.meta_data,
          is_show: [true],
          is_depend_slug: [null],
          is_depend_value: [null]
        })
      )
    });
    this.updateDependantFields();
  }

  updateDependantFields() {
    // let custom_fields = this.questionForm?.get('custom_fields')?.value
    this.customFields?.forEach((element, i) => {
      if (element && element.meta_data) {
        if (element?.dependent_questions && element?.dependent_questions) {
          element?.dependent_questions.forEach(dq => {
            //  let slug_name = dependValue.conditions[0]?.slug;
            //  let value =  this.capitalizeFirstLetter(dependValue.conditions[0]?.condition?.value);
            let depend_slug = this.customFields.filter(c => c.id === dq?.id);
            let index = this.customFields.findIndex(c => c.id === dq?.id);
            if (depend_slug && depend_slug.length > 0) {
              this.customFields[index].is_depend_slug = dq?.id;
              this.customFields[index].is_depend_value = dq?.condition;
              this.customFields[index].is_show = false;
              let controlArray = <UntypedFormArray>this.questionForm?.controls["custom_fields"];
              controlArray.controls[index].patchValue({ is_depend_slug: dq.id });
              controlArray.controls[index].patchValue({ is_depend_value: dq?.condition })
              controlArray.controls[index].patchValue({ is_show: false });
              controlArray.controls[index].patchValue({ is_required: false });
              let control = <UntypedFormArray>controlArray.controls[index]['controls']['values'];
              controlArray?.controls[index].setValidators(null);
              control?.setValidators(null);
              control?.updateValueAndValidity();
              this.questionForm?.controls?.custom_fields?.updateValueAndValidity();
            }
          });
        }
      }
    });
    //  if(this.custom_fields_Values){
    //   this.patchCustomData(this.custom_fields_Values);
    //  }
  }

  updateDependantFlag(i) {
    //  let contorls = this.questionForm.get('custom_fields')?.controls;
    let custom_fields = this.questionForm?.get('custom_fields')?.value;
    custom_fields?.forEach((element, element_index) => {
      if (element && element.meta_data) {
        if (element?.dependent_questions) {
          element?.dependent_questions.forEach(dq => {
            let slug_name = dq?.id;
            let depend_slug = custom_fields.filter(c => c.custom_field_id === slug_name);
            let index = custom_fields.findIndex(c => c.custom_field_id === slug_name);
            if (element?.values === depend_slug[0]?.is_depend_value) {
              if (depend_slug && depend_slug.length > 0) {
                // custom_fields[index].is_depend_slug = element?.is_depend_slug;
                // custom_fields[index].is_depend_value = value;
                custom_fields[index].is_show = true;
                let controlArray = <UntypedFormArray>this.questionForm.controls["custom_fields"];
                // controlArray.controls[index].patchValue({is_depend_slug:element?.is_depend_slug});
                // controlArray.controls[index].patchValue({is_depend_value:value})
                controlArray.controls[index].patchValue({ is_show: true });
                controlArray.controls[index].patchValue({ is_required: true });
                controlArray?.controls[index]?.setValidators([Validators.required]);
                let control = <UntypedFormArray>controlArray.controls[index]['controls']['values'];
                control?.setValidators([Validators.required]);
                control?.updateValueAndValidity();
                this.questionForm?.controls?.custom_fields?.updateValueAndValidity();
              }
            } else {
              if (i === element_index) {
                let controlArray = <UntypedFormArray>this.questionForm.controls["custom_fields"];
                controlArray.controls[index]?.patchValue({ is_show: false });
                controlArray.controls[index]?.patchValue({ is_required: false })
                controlArray?.controls[index]?.setValidators(null);
                // let control = <FormArray>controlArray?.controls[index]['controls']['values'];
                // control?.setValidators(null);
                // control?.updateValueAndValidity();
                controlArray?.controls[index]?.updateValueAndValidity();
                this.questionForm?.controls?.custom_fields?.updateValueAndValidity();
              }
            }
          })
        }

      }
    });
  }

  changeDependantFlag(i, is_checked) {
    let custom_fields = this.questionForm?.get('custom_fields')?.value;
    custom_fields?.forEach((element, element_index) => {
      if (element && element.meta_data) {
        let mulipleValue = new Array();
        if (element?.dependent_questions) {
          element?.dependent_questions.forEach(dq => {
            let slug_name = dq?.id;
            let depend_slug = custom_fields.filter(c => c.custom_field_id === slug_name);
            let index = custom_fields.findIndex(c => c.custom_field_id === slug_name);
            element?.meta_data?.datasource?.options.forEach(options => {
            
              // start
              if (options?.values) {
                if (!element.values) {
                  element.values = new Array();
                }
                let isPresent = mulipleValue?.some(c => c === options?.label);
                if (!isPresent) {
                  mulipleValue.push(options?.label);
                }
              }
              element.values= mulipleValue || null;
              let controlArray = <UntypedFormArray>this.questionForm.controls["custom_fields"];
              let control = <UntypedFormArray>controlArray.controls[element_index]['controls']['values'].patchValue(mulipleValue);
              control?.updateValueAndValidity();
              this.questionForm?.controls?.custom_fields?.updateValueAndValidity();
            });
            if (is_checked?.values && (is_checked?.label === depend_slug[0]?.is_depend_value)) {
              if (depend_slug && depend_slug.length > 0) {
                custom_fields[index].is_show = true;
                let controlArray = <UntypedFormArray>this.questionForm.controls["custom_fields"];
                controlArray.controls[index].patchValue({ is_show: true });
                controlArray.controls[index].patchValue({ is_required: true });
                controlArray?.controls[index]?.setValidators([Validators.required]);
                let control = <UntypedFormArray>controlArray.controls[index]['controls']['values'];
                
                control?.setValidators([Validators.required]);
                control?.updateValueAndValidity();
                this.questionForm?.controls?.custom_fields?.updateValueAndValidity();
               
                
              }
            } else {
              if (i === element_index && !is_checked?.values && (is_checked?.label === depend_slug[0]?.is_depend_value)) {
                let controlArray = <UntypedFormArray>this.questionForm.controls["custom_fields"];
                controlArray.controls[index]?.patchValue({ is_show: false });
                controlArray.controls[index]?.patchValue({ is_required: false })
                controlArray?.controls[index]?.setValidators(null);
                let control = <UntypedFormArray>controlArray.controls[index]['controls']['values'];
                control?.setValidators(null);
                control.patchValue(null);
                control?.updateValueAndValidity();
                controlArray?.controls[index]?.updateValueAndValidity();
                this.questionForm?.controls?.custom_fields?.updateValueAndValidity();
              }
            }
            // end
          })
        }
      }
    });
    this.questionForm?.controls?.custom_fields?.updateValueAndValidity();
  }

  getCustomFields() {
    const current_program = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    let url = `/configurator/programs/${current_program?.id}/custom-fields?entity_ref=${this.moduleName}`;
    this.httpService.get(url).subscribe(data => {
      if (data && data.custom_fields.length > 0) {
        this.customFields = data.custom_fields;
        setTimeout(() => {
          this.updateCustomFieldForm();
        }, 2000);
      } else {
        // this.isCustomFieldsFormValid.emit(true);
      }

    },
      error => {
        // this.approvalList = new Array();
      });
  }

  uploadFiles(event, item, i) {
    if (event && event.length > 0) {
      let controlArray = <UntypedFormArray>this.questionForm.controls["custom_fields"];
      controlArray.controls[i].patchValue({ values: event[0] });
    }
  }

  updateoldFiles(event) {

  }

  capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  isEmptyObject(object) {
    return (object && Object.keys(object).length === 0 && object.constructor === Object);
  }
}