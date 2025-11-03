import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { forkJoin, Subject, Subscription } from 'rxjs';
import { FoundationalFieldsHttpService } from '../http.service';
import { debounceTime } from 'rxjs/operators';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { ArrayOfCustFields, DependentCustomFields } from '../../../assignment/assignment.model';
import { JobDetailsService } from 'src/app/jobs/job-details/job-details.service';
import { CommonService } from '../../custom-fields/common.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';

@Component({
  selector: 'app-foundational-fields',
  templateUrl: './foundational-fields.component.html',
  styleUrls: ['./foundational-fields.component.scss'],
})
export class FoundationalFieldsComponent implements OnInit {

  @Input() moduleName;
  @Input() activeOptions;
  @Input() showLoader: boolean = true;
  @Input() foundational_params: any = null;
  @Input() isManagerUpdated: boolean = false;

  @Output() foundationalFieldUpdated = new EventEmitter();
  @Output() isFoundationalFieldsFormValid: EventEmitter<boolean> = new EventEmitter();

  private subscriptions: Subscription[] = [];
  public foundationalDataSubject: Subject<object> = new Subject<object>();
  public foundationalFieldsForm: UntypedFormGroup;
  public orderingMap: Map<string, number> = null;
  foundationalFieldsTooltipData = []

  dataLoading: boolean = false;
  currentDropdownIndex: number = null;
  foundational_fields_Values: any = undefined;
  foundationTypeList: any = undefined;
  _foundationTypelist: any[] = [];
  current_program: any;
  accountConfig: any;
  fixedFoundationDataSet: Array<any>;
  customFieldsList: DependentCustomFields[] = [];
  hideMasterDataTypeName:boolean;
  page = 1;
  limit = 25;
  pagination = {
    page: 1,
    limit: 25
  }
  listEnd = false;
  isReadOnlyField: any[] = [];
  @Output() fdLoaded = new EventEmitter();
  @Input() set foundational_data(fields: Array<any>) {
    if (fields && fields.length > 0) {
      const foundation_value_ids: Array<any> = fields?.filter(field => field?.id !== null && field?.id !== undefined)?.map(field => field?.id);
      this.isReadOnlyField = fields?.filter(f => f?.is_read_only)?.map(f => f?.foundational_data_type?.id);
      if (foundation_value_ids?.length > 0) {
        let currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
        if (this.showLoader) {
          this._loader.show();
        }
        this.httpService.getFoundationalDataDetails(currentProgram?.id, '*', foundation_value_ids).subscribe(
          response => {
            if (response && response?.foundational_data?.length > 0) {
              this.assignFoundationCustomFieldsDetails(fields, response.foundational_data);
              this.foundational_fields_Values = fields;
              this.patchFoundationalData(fields);
              response?.foundational_data?.forEach(fd => {
                this.updateDependentFields([fd || {}], !this.isManagerUpdated, this.isManagerUpdated);
              });
            }
          },
          err => {
            console.error(err);
            this._loader.hide();
          },
          () => {
            this._loader.hide();
          }
        );
      } else {
        this.resetFoundationFieldValues();
      }
    }
  }

  constructor (
    private fb: UntypedFormBuilder,
    private httpService: FoundationalFieldsHttpService,
    private storageService: StorageService,
    private _loader: LoaderService,
    private jobDetailService: JobDetailsService,
    private commonService: CommonService,
    private alertService: AlertService
  ) { }

  ngOnInit(): void {
    this.current_program = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.hideMasterDataTypeName = this.current_program?.config?.show_only_master_codes ?? false;
    this.accountConfig = this.storageService.get(StorageKeys.ACCOUNT_CODE_CONFIG);
    if (this.accountConfig && this.accountConfig?.components) {
      this.fixedFoundationDataSet = this.accountConfig?.components;
    }
    this.jobDetailService.masterDataProgressiveLoader().then(res => {
      this.orderingMap = res?.map;
      this.getFoundationalType();
    });
    this.foundationalFieldsForm = this.fb.group({
      foundational_data: this.fb.array([]),
    });
    this.foundationalFieldsForm?.get('foundational_data').valueChanges.subscribe(selectedValue => {
      this.foundationalFieldUpdated.emit(selectedValue);
      this.updateTooltipData()
    });
    this.foundationalFieldsForm?.get('foundational_data').statusChanges.subscribe(newStatus => {
      const isValid = newStatus?.toLowerCase() == 'valid' ? true : false;
      this.isFoundationalFieldsFormValid.emit(isValid);
    });
    this.subscriptions.push(
      this.foundationalDataSubject
        .asObservable()
        .pipe(debounceTime(800))
        .subscribe((res: any) => {
          this.getfoundationData(res?.term, res?.foundationDataType, res?.index, res?.page, res?.limit);
        }),
    );
  }

  ngOnDestroy(): void {
    this.subscriptions?.forEach(sub => sub.unsubscribe());
  }

  filterAccountCodeConfiguredFields = (foundational_data_types: Array<any>) => {
    if (foundational_data_types && foundational_data_types.length > 0) {
      let foundationFields = [...foundational_data_types];
      if (this.fixedFoundationDataSet != null && this.fixedFoundationDataSet.length > 0) {
        this.fixedFoundationDataSet.forEach(fds => {
          foundational_data_types?.forEach(fd => {
            let isMultiPurpose = fd?.configuration?.is_multi_purpose === 'true';
            if (!isMultiPurpose && fd?.slug?.toLowerCase() === fds?.slug?.toLowerCase()) {
              let index = foundationFields.indexOf(fd)
              if (index !== -1) {
                foundationFields.splice(index, 1);
              }
            }
          });
        })
      }
      return foundationFields;
    }
    return foundational_data_types;
  }

  assignFoundationCustomFieldsDetails = (fields: Array<any>, foundationValueDetails: Array<any>) => {
    if (fields && fields.length > 0 && foundationValueDetails?.length > 0) {
      fields.map(field => {
        if (field) {
          let fieldValue = foundationValueDetails.find(value => value.id === field.id && value.foundational_data_type?.id === field?.foundational_data_type?.id);
          if (fieldValue) {
            field.custom_fields = fieldValue.custom_fields;
          }
        }
      })
    }
  }

  async getFoundationalType(pageNo = 1) {
    if (pageNo === 1) {
    }
    this.httpService.getFoundationalType(this.current_program?.id, this.foundational_params).subscribe(data => {
      if (data && data.foundational_data_types) {
        data.foundational_data_types = this.filterAccountCodeConfiguredFields(data?.foundational_data_types);
      }
      data?.foundational_data_types?.forEach(a => {
        if (typeof a?.configuration?.view_only === 'string') {
          a.configuration.view_only = a?.configuration?.view_only === 'true' ? true : false;
        }
      });
      const { foundational_data_types } = data;
      this.foundationTypeList = foundational_data_types
        .filter(fd => {
          if (this.moduleName === 'ASSIGNMENT') {
            return fd?.configuration && (fd?.configuration?.module_assignment !== 'OFF');
          } else {
            return fd?.configuration && (fd?.configuration?.module_jobs !== 'OFF');
          }

        })
        .map(fd => {
          fd.code = this.snakeCase(fd.name);
          return fd;
        });
      const foundationalDataHttp = this.foundationTypeList.map(dataType => {
        return this.httpService.getFoundationalData(this.current_program?.id, dataType?.id);
      });

      let foundationalValue: any[] = [];
      forkJoin(foundationalDataHttp).subscribe(
        (res: any) => {
          foundationalValue = res.map((foundData: any) => foundData?.foundational_data);
          foundationalValue.forEach((val, index) => {
            this.foundationTypeList[index].values = val;
          });
          this.foundationTypeList = [...this.foundationTypeList];
          this._foundationTypelist = this.chunkArray(this.foundationTypeList, 3);
          this.updateFoundationalForm();
          this.fdLoaded.emit(true);
        },
        // err => { }, commenting out as not in use
      );
    });
  }

  resetFoundationFieldValues = () => {
    let f_data = this.foundationalDataArray;
    f_data?.controls?.forEach(element => {
      element.get('values')?.patchValue(null);
    });
    this.customFieldsList = [];
  }

  snakeCase = string => {
    string = string.toLowerCase();
    return string
      .replace(/\W+/g, ' ')
      .split(/ |\B(?=[A-Z])/)
      .map(word => word.toLowerCase())
      .join('_');
  };

  getfoundationData(term, foundationDataType, index, page, limit) {
    if (foundationDataType && foundationDataType?.get('foundational_data_type_id')?.value) {
      this.dataLoading = true;
      this.currentDropdownIndex = index;
      let dataTypeId = foundationDataType?.get('foundational_data_type_id')?.value;
      let controlArray = <UntypedFormArray>this.foundationalFieldsForm.controls['foundational_data'];
      let url = `/configurator/programs/${this.current_program?.id}/foundational-data-types/${dataTypeId}/foundational-data?${term?.term ? '&k=' + term?.term : ''}&cf_detail=true&info_level=full&active=true&page=${page}&limit=${limit}`;
      this.httpService.get(url).subscribe({
        next:(data: any) => {
            this.dataLoading = false;
            if (data && data.foundational_data && data?.foundational_data.length > 0) {
              let mergedData = [...controlArray?.controls[index]?.value?.options, ...data?.foundational_data]
              const foundationalData = [...new Map(mergedData.map(obj => [`${obj.id}`, obj]))?.values()];
              controlArray.controls[index].patchValue({ options: foundationalData });
              controlArray.controls[index].value.page = page;
              if (data?.foundational_data?.length < limit) {
                controlArray.controls[index].value.listEnd = true;
              } else {
                controlArray.controls[index].value.listEnd = false;
              }              
            }
          },
        error: (err) => {
          this.dataLoading = false;
          controlArray.controls[index].value.listEnd = true;
        }
      });
    }
  }

  searchFoundationalData(term, foundationDataType, index, page, limit) {
    if (foundationDataType?.get('restrictValues')?.value) return;
    let controlArray = <UntypedFormArray>this.foundationalFieldsForm.controls['foundational_data'];
    controlArray.controls[index].patchValue({ options: [] });
    controlArray.controls[index].value.listEnd = false;
    controlArray.controls[index].value.page = 1;
    this.pagination.page = 1;
    this.foundationalDataSubject.next({ term, foundationDataType, index, page, limit })
  }
  
  loadMoreFoundationalData(searchTerm, foundationDataType, index) {
    let controlArray = <UntypedFormArray>this.foundationalFieldsForm.controls['foundational_data'];
    if (controlArray?.controls?.[index]?.value?.restrictValues) return;
    if(!this.dataLoading && !controlArray.controls[index].value.listEnd ) {
      this.pagination.page = this.pagination.page + 1;
      let term = { term : searchTerm }
      if(index !== this.currentDropdownIndex && this.currentDropdownIndex != null) {
        this.pagination.page = controlArray.controls[index]?.value?.page ? controlArray.controls[index]?.value?.page + 1 : 1;
      }
      const { page, limit } = this.pagination;
      this.foundationalDataSubject.next({ term, foundationDataType, index, page , limit })
    }
  }

  onClearFoundationalData(term, foundationDataType, index) {
    if (foundationDataType?.get('restrictValues')?.value) return;
    if (foundationDataType && foundationDataType?.get('foundational_data_type_id')?.value) {
      this.dataLoading = true;
      this.currentDropdownIndex = index;
      let dataTypeId = foundationDataType?.get('foundational_data_type_id')?.value;
      this.httpService.getFoundationalData(this.current_program?.id, dataTypeId).subscribe(data => {
        this.dataLoading = false;
        if (data && data.foundational_data && data?.foundational_data.length > 0) {
          let controlArray = <UntypedFormArray>this.foundationalFieldsForm.controls['foundational_data'];
          controlArray.controls[index].patchValue({ options: data?.foundational_data });
          controlArray.controls[index].value.listEnd = false;
          controlArray.controls[index].value.page = 1;
          this.pagination.page = 1;
        }
      });
      if (foundationDataType?.get('dependent_foundational_data_type_id')?.value?.length) {
        foundationDataType?.get('dependent_foundational_data_type_id')?.value.forEach(dfdt => {
          const depIndex = this.foundationalDataArray.value.findIndex(x => x.foundational_data_type_id === dfdt?.toString());
          if (this.foundationalDataArray?.controls[depIndex]?.get('dependent_foundational_data_type_id')?.value?.length) {
            this.onClearFoundationalData(undefined, this.foundationalDataArray?.controls[depIndex], depIndex);
          }
          if (this.foundationalDataArray?.controls[depIndex]?.get('restrictValues')?.value) {
            this.foundationalDataArray?.controls[depIndex]?.get('restrictValues')?.patchValue(false);
            this.foundationalDataArray?.controls[depIndex]?.get('options')?.patchValue([...this.foundationalDataArray.value[depIndex].originalOptions]);
            if (typeof this.foundationalDataArray?.controls[depIndex]?.get('values').value === 'string') {
              this.foundationalDataArray?.controls[depIndex]?.get('values')?.patchValue(null);
              if (this.foundationalDataArray?.controls[depIndex]?.get('dependent_foundational_data_type_id')?.value?.length) {
                this.onClearFoundationalData(undefined, this.foundationalDataArray?.controls[depIndex], depIndex);
              }
            }
            else if (typeof this.foundationalDataArray?.controls[depIndex]?.get('values').value === 'object') {
              this.foundationalDataArray?.controls[depIndex]?.get('values')?.patchValue([]);
              if (this.foundationalDataArray?.controls[depIndex]?.get('dependent_foundational_data_type_id')?.value?.length) {
                this.onClearFoundationalData(undefined, this.foundationalDataArray?.controls[depIndex], depIndex);
              }
            }
          }
        });
      }
    }
  }

  get foundationlGroupForm() {
    return this.foundationalFieldsForm?.get('foundational_data') as UntypedFormGroup;
  }

  updateFoundationalForm() {
    const formArray = this.foundationalFieldsForm?.get('foundational_data') as UntypedFormArray;
    while (formArray && formArray?.length !== 0) {
      formArray?.removeAt(0);
    }
    this.foundationTypeList.forEach(element => {
      const isRequired = element?.configuration?.module_jobs?.toUpperCase() === 'REQUIRED';
      const isReadOnly = element?.configuration?.view_only;
      const isMultiple = element?.configuration?.allow_multiple_jobs?.toLowerCase() === 'true';
      const default_value = element?.configuration?.[`default_module_${this.moduleName?.toLowerCase()}`];
      const default_values = default_value ? (isMultiple ? [default_value] : default_value) : [];
      const isFinancialMasterData = element?.configuration?.hasOwnProperty('financial_master_data_type') && element?.configuration?.financial_master_data_type !== 'false' ? Boolean(element?.configuration?.financial_master_data_type) : false; 
      this.foundationalDataArray.push(
        this.fb.group({
          is_required: [isRequired],
          is_readonly: [isReadOnly],
          foundational_data_name: [element.name],
          foundational_data_type_id: [element.id],
          slug: [element?.slug],
          isMultiple: [isMultiple],
          values: [default_values, isRequired ? [Validators.required] : []],
          options: [this.activeOptions ? element.values.filter(x => x.is_enabled === true) : element.values],
          originalOptions: [this.activeOptions ? element.values.filter(x => x.is_enabled === true) : element.values],
          restrictValues: [false],
          dependent_foundational_data_type_id: [[]],
          financial_master_data_type : isFinancialMasterData
        }),
      );
    });
    if (this.foundational_fields_Values) {
      this.patchFoundationalData(this.foundational_fields_Values);
    }
  }

  get foundationalDataArray() {
    let ref = (this.foundationalFieldsForm?.get('foundational_data') as UntypedFormArray) || new UntypedFormArray([]);
    if (this.orderingMap && ref.controls.length) {
      ref.controls = ref.controls.sort((node1: any, node2: any) => {
        return this.orderingMap.get(node1.value.foundational_data_type_id) -
          this.orderingMap.get(node2.value.foundational_data_type_id);
      });
    }

    return ref;
  }

  checkDisabled(isReadOnly, selectedValues, fdId) {
    return (isReadOnly && ((Array.isArray(selectedValues) && selectedValues.length > 0) || selectedValues)) || this.isReadOnlyField.includes(fdId);
  }

  chunkArray(array, size) {
    const result = [];
    for (let i = 0; i < array.length; i += size) {
      const chunk = array.slice(i, i + size);
      if (chunk.length < size) {
        chunk.push({ hidden: true });
      }
      result.push(chunk);
    }
    return result;
  }

  get showCustomFields() {
    return this.validateModules && this.customFieldsList.length;
  }

  addDependentCustomFields(foundationValue, foundationalDataType): void {
    if (this.validateModules) {
      if (foundationValue?.id) {
        const foundationalData = foundationalDataType.get('options').value.find(x => x.id === foundationValue?.id);
        if (foundationalData) {
          foundationalData.foundational_data_type = foundationValue.foundational_data_type;
        }
        this.fillCustomFields(foundationalData, foundationalDataType);
      } else if (this.customFieldsList.length) {
        const index = this.customFieldsList.findIndex(e => e.id === foundationalDataType.get('foundational_data_type_id').value);
        if (index > -1) this.customFieldsList.splice(index, 1);
      }
    }
  }

  fillCustomFields = (foundationalData: any, foundationalDataType: any) => {
    if (foundationalData && foundationalData.custom_fields && foundationalData.custom_fields.length > 0) {
      if (this.customFieldsList.findIndex(e => e.id === foundationalDataType.get('foundational_data_type_id').value) === -1) {
        let dependentCustomField: DependentCustomFields = {
          label: `${foundationalData?.foundational_data_type?.name} dependent Custom Fields`,
          id: foundationalData?.foundational_data_type?.id,
          customFieldsArray: []
        };
        let arrOfCustFields: ArrayOfCustFields = {
          name: foundationalData.name,
          code: foundationalData.code,
          showFields: foundationalData.custom_fields
        }
        dependentCustomField.customFieldsArray.push(arrOfCustFields);
        this.customFieldsList.push(dependentCustomField);
      } else {
        let dependentCustomField = this.customFieldsList.find(e => e.id === foundationalDataType.get('foundational_data_type_id').value);
        if (dependentCustomField?.customFieldsArray?.findIndex(e => e.code === foundationalData?.code) > -1) {
          dependentCustomField.customFieldsArray.find(e => e.code === foundationalData?.code).showFields = foundationalData.custom_fields;
        }
        else {
          let arrOfCustFields: ArrayOfCustFields = {
            name: foundationalData.name,
            code: foundationalData.code,
            showFields: foundationalData.custom_fields
          }
          dependentCustomField.customFieldsArray.push(arrOfCustFields);
        }
      }
    } else if (this.customFieldsList.length) {
      const index = this.customFieldsList.findIndex(e => e.id === foundationalDataType.get('foundational_data_type_id').value);
      if (index > -1) this.customFieldsList.splice(index, 1);
    }
  }

  updateTooltipData() {
    this.foundationalFieldsTooltipData = this.foundationalDataArray?.controls?.map(control=>{
      let value = control?.value?.values
      if(!value || value?.length == 0)
        return 
      if(control['controls']?.isMultiple?.value){
        let temparr = Array.from(value)
        let temp = []
        temparr.forEach(ele=>{
          temp.push((control?.value?.options.filter((option)=>{
            return (option['id'] == ele)
          })))
        })
        let element = ''
        for (let i = 0; i < temp.length; i++) {
          element += `${temp[i][0]?.name} - ${temp[i][0]?.code}`;
          if(i!=(temp.length-1)){
            element += ', '
          }
        }
        return element
      }else{
        let temp = (control?.value?.options.filter((option)=>{
          return (option['id'] == value)
        }))
        return temp[0]?.name+" - "+temp[0]?.code
      }
    })
  }

  onChangeFoundationFields(foundationalIdList, foundationalDataType): void {
    if (this.validateModules) {
      const index = this.customFieldsList.findIndex(e => e.id === foundationalDataType.get('foundational_data_type_id').value);
      if (index > -1) {
        let dependentCustomField = this.customFieldsList.find(e => e.id === foundationalDataType.get('foundational_data_type_id').value);
        dependentCustomField.customFieldsArray = [];
      }
      if (typeof foundationalIdList === 'string')
        foundationalIdList = [foundationalIdList];
      if (foundationalIdList) {
        for (let i = 0; i < foundationalIdList.length; i++) {
          let foundationalId = foundationalIdList[i];
          const foundationalData = foundationalDataType.get('options').value.find(x => x.id === foundationalId);
          if (foundationalData) {
            this._loader.show();
            this.httpService.getFoundationalDataDetails(this.current_program?.id, foundationalData?.foundational_data_type?.id ?? foundationalDataType?.value?.foundational_data_type_id, [foundationalId]).subscribe(data => {
              if (data && data?.foundational_data?.length > 0) {
                foundationalData.custom_fields = data.foundational_data[0].custom_fields;
                this.fillCustomFields(foundationalData, foundationalDataType);
                this.setDependentFoundationFields(foundationalDataType.get('slug').value, foundationalData.code, foundationalData.id)
                this.updateDependentFields(data?.foundational_data);
                this.commonService.updateDependentFields(data?.foundational_data);
              } else {
                foundationalData.custom_fields = [];
              }
            }, err => {
              foundationalData.custom_fields = [];
              this._loader.hide();
              this.alertService.error(err?.error?.error?.message);
            },
              () => {
                this._loader.hide();
              });
          }
        }
      } else if (this.customFieldsList.length) {
        const index = this.customFieldsList.findIndex(e => e.id === foundationalDataType.get('foundational_data_type_id').value);
        if (index > -1) this.customFieldsList.splice(index, 1);
      }
    }
    this.updateTooltipData()
  }

  updateDependentFields(foundational_data, isEditPatch?, fromJobManager?) {
    for (const foundationalField of foundational_data) {
      const getCurrentControlIndex = this.foundationalDataArray.value.findIndex(control => control?.foundational_data_type_id === foundationalField?.foundational_data_type?.id);
      const { foundational_data_mapping } = foundationalField || {};
      if (!foundational_data_mapping?.length) { // it should not work for multiple values and have foundational_data_mapping
        return;
      }
      foundational_data_mapping?.forEach(element => {
        const dependentField = element ? element : {};
        const getDependentControlIndex = this.foundationalDataArray.value.findIndex(control => control?.foundational_data_type_id === dependentField?.foundational_data_type_id);
        if (Number(getDependentControlIndex) !== -1) {
          const { options, isMultiple } = this.foundationalDataArray?.controls[getDependentControlIndex]?.value;
          const valueLength = this.foundationalDataArray?.value?.find(x=> x?.slug == foundational_data?.[0]?.foundational_data_type.slug)?.values;
          if(dependentField?.restrict_values && dependentField?.values?.length > 0 && (!isEditPatch || !fromJobManager)) {
            this.foundationalDataArray?.controls[getDependentControlIndex]?.get('restrictValues')?.patchValue(true);
            const newArraySet = [...this.foundationalDataArray?.controls[getCurrentControlIndex]?.get('dependent_foundational_data_type_id')?.value, dependentField?.foundational_data_type_id];
            this.foundationalDataArray?.controls[getCurrentControlIndex]?.get('dependent_foundational_data_type_id')?.patchValue(newArraySet);
            if(Array.isArray(valueLength) && valueLength?.length > 1) {
              this.foundationalDataArray?.controls[getDependentControlIndex]?.get('options')?.patchValue(this.foundationalDataArray?.controls[getDependentControlIndex]?.get('originalOptions')?.value);
            } else {
              this.foundationalDataArray?.controls[getDependentControlIndex]?.get('options')?.patchValue(dependentField?.values);
            }
          } else {
            this.foundationalDataArray?.controls[getDependentControlIndex]?.get('restrictValues')?.patchValue(false);
            this.foundationalDataArray?.controls[getCurrentControlIndex]?.get('dependent_foundational_data_type_id')?.patchValue([]);
            this.foundationalDataArray?.controls[getDependentControlIndex]?.get('options')?.patchValue(this.foundationalDataArray?.controls[getDependentControlIndex]?.get('originalOptions')?.value);
            if (dependentField?.defaults && dependentField?.defaults?.[0])
              this.foundationalDataArray?.controls[getDependentControlIndex]?.get('values')?.patchValue(isMultiple ? dependentField?.defaults : dependentField?.defaults?.[0]);
          }
          if (dependentField?.defaults?.length) {
            if(!dependentField?.restrict_values || (Array.isArray(valueLength) && valueLength?.length > 1) || isEditPatch) {
              for (const opt of element?.values) {
                const foundOpt = options?.find(val => val.id === opt?.id);
                if (!foundOpt) {
                  this.foundationalDataArray?.controls[getDependentControlIndex]?.get('options')?.value?.push(opt);
                }
              }
            }
            if (!isEditPatch)
              this.foundationalDataArray?.controls[getDependentControlIndex]?.get('values')?.patchValue(isMultiple ? dependentField?.defaults : dependentField?.defaults?.[0]);
              this._loader.show()
              if(isMultiple) {
                this.onChangeFoundationFields(dependentField?.defaults, this.foundationalDataArray?.controls[getDependentControlIndex])
              } else {
                this.onChangeFoundationFields(dependentField?.defaults?.[0], this.foundationalDataArray?.controls[getDependentControlIndex])
              }
              this._loader.hide()
          } else if (!dependentField?.defaults?.length && dependentField?.restrict_values && !fromJobManager && !isEditPatch) {
            this.foundationalDataArray?.controls[getDependentControlIndex]?.get('values')?.patchValue(isMultiple ? [] : null);
          }
          //this.foundationalDataArray?.controls[getDependentControlIndex]?.get('is_readonly')?.patchValue(!(dependentField?.values?.find(x => x?.id === dependentField?.defaults?.[0])?.is_editable) ?? false); // defaults coming undefined
          const dependant= dependentField?.values?.find(x => x?.id === dependentField?.defaults?.[0]);
          this.foundationalDataArray?.controls[getDependentControlIndex]?.get('is_readonly')?.patchValue( dependant ? !dependant?.is_editable : false);
        }
      });
    }
  }

  get validateModules() {
    return (this.moduleName === 'ASSIGNMENT' || this.moduleName === 'JOBS' || this.moduleName === 'OFFERS');
  }

  setDependentFoundationFields(slug, fd_code, fd_id): void {
    // if (this.current_program.name?.toLowerCase()?.includes('amfam') && slug === 'cost_center' && fd_code) {
    //   const superOrgCode = fd_code?.split('-')[fd_code?.split('-')?.length - 1]?.trim();
    //   const superOrgTypeId = this.foundationalDataArray?.value?.find(fdType => fdType.slug === 'suporg_id')?.foundational_data_type_id;
    //   this.httpService.getFoundationalDataFilterByCode(this.current_program?.id, superOrgTypeId, superOrgCode).subscribe(
    //     data => {
    //       if (data?.foundational_data?.length) {
    //         this.foundationalFieldsForm
    //           ?.get('foundational_data')
    //         ['controls']?.find(a => a.value.slug === 'suporg_id')
    //           ?.patchValue({ options: data?.foundational_data, values: data?.foundational_data[0].id });
    //         this.onChangeFoundationFields(
    //           data?.foundational_data[0].id,
    //           this.foundationalFieldsForm?.get('foundational_data')['controls']?.find(a => a.value.slug === 'suporg_id'),
    //         );
    //       }
    //     },
    //     error => {
    //       console.error(error);
    //     },
    //   );
    // } else 
    if (slug === 'gl_service_department' && fd_id) {
      const glServiceDeptTypeId = this.foundationalDataArray?.value?.find(fdType => fdType.slug === 'gl_service_department')?.foundational_data_type_id;
      this._loader.show();
      this.httpService.getFoundationalDataDetail(this.current_program?.id, glServiceDeptTypeId, fd_id).subscribe(
        data => {
          this._loader.hide();
          if (data?.foundational_data_mapping?.length) {
            data.foundational_data_mapping.forEach((mapping) => {
              let foundationalType = this.foundationalDataArray.controls.find(fdType => fdType.value?.foundational_data_type_id === mapping.foundational_data_type_id);
              let originalOptions = foundationalType.get('originalOptions').value;
              if (foundationalType) {
                if (mapping && mapping.values?.length > 0) {
                  let value = originalOptions?.filter(x => mapping.values.indexOf(x.id) >= 0);
                  foundationalType.get('options').patchValue([]);
                  foundationalType.get('options').patchValue(value)
                  if (mapping.defaults && mapping.defaults[0]) {
                    foundationalType.get('values')?.patchValue(mapping.defaults[0]);
                  }
                } else {
                  foundationalType.get('options').patchValue([]);
                  foundationalType.get('values')?.patchValue(null);
                  foundationalType.get('options').patchValue(originalOptions);
                }
              }
            });
          }
        },
        error => {
          this._loader.hide();
          console.error(error);
        },
      );
    }
  }

  patchFoundationalData(foundational_data) {
    let f_data = this.foundationalDataArray;
    this.customFieldsList = [];
    f_data?.controls?.forEach(element => {
      if (element.get('isMultiple').value) {
        let configFoundation = foundational_data?.filter(db => db?.id !== null && db?.id !== undefined && db?.foundational_data_type?.id == element?.value?.foundational_data_type_id);
        if (configFoundation?.length > 0) {
          let selFoundationValArr = [];
          for (var i = 0; i < configFoundation?.length; i++) {
            let options = element.get('options');
            let hasValue = options?.value?.some(v => v.id === configFoundation[i]?.id);
            if (!hasValue) {
              let option_value = {
                id: configFoundation[i]?.id,
                name: configFoundation[i]?.name,
                code: configFoundation[i]?.code,
                custom_fields: configFoundation[i]?.custom_fields
              };
              element.get('options')?.value.push(option_value);
            }
            else {
              let option_value = options?.value?.find(v => v.id === configFoundation[i]?.id);
              option_value.custom_fields = configFoundation[i]?.custom_fields;
            }
            selFoundationValArr.push(configFoundation[i]?.id);
            this.addDependentCustomFields(configFoundation[i], element);
          }
          element.get('values')?.patchValue(selFoundationValArr);
        }
        else {
          element.get('values')?.patchValue(null);
          if (element.get('is_required')?.value && element.get('is_readonly')?.value) {
            element.patchValue({
              is_readonly: false
            });
          }
        }
      }
      else {
        let configFoundation = foundational_data.find(db => db?.foundational_data_type?.id == element?.value?.foundational_data_type_id);
        if (configFoundation) {
          let options = element.get('options');
          let hasValue = options?.value?.some(v => v.id === configFoundation?.id);
          if (!hasValue) {
            let option_value = {
              id: configFoundation?.id,
              name: configFoundation?.name,
              code: configFoundation?.code,
              custom_fields: configFoundation?.custom_fields
            };
            element.get('options')?.value.push(option_value);
          }
          element.get('values')?.patchValue(configFoundation?.id);
          if (configFoundation?.is_disabled) {
            element.get('is_readonly')?.patchValue(configFoundation?.is_disabled);
          }
          element.value.values = configFoundation?.id;
          this.addDependentCustomFields(configFoundation, element);
        } else {
          element.get('values')?.patchValue(null);
          if (element.get('is_required')?.value && element.get('is_readonly')?.value) {
            element.patchValue({
              is_readonly: false
            });
          }
        }
      }
    });
  }

}
