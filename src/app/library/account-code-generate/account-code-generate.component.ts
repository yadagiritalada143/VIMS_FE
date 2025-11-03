import { FoundationalFieldsHttpService } from './../foundational-fields/http.service';
import { AccountCodeService } from './../../account-code-setup/services/account-code-setup.service';
import { LoaderService } from './../../core/components/loader/loader.service';
import { Component, Input, OnInit, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { StorageKeys, StorageService } from './../../core/services/storage.service';
import { UserService } from './../../core/services/user.service';
import { forkJoin } from 'rxjs';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { AlertService } from './../../core/components/alert/alert.service';
import { AccoutCodeValidationRequest, AccountCodeValidationParams, AccountCodeValidationPayload } from 'src/app/account-code-setup/models/account-code-setup-model';
import { AccountCodeData, AccountCodeFields } from './models/account-code-data';

@Component({
  selector: 'app-account-code-generate',
  templateUrl: './account-code-generate.component.html',
  styleUrls: ['./account-code-generate.component.scss']
})
export class AccountCodeGenerateComponent implements OnInit, OnChanges {

  @Input() module: string;
  @Input() accountCodeFields: AccountCodeData
  @Input() visiblity: string = 'hidden';
  @Input() entityId: string;
  @Input() readOnly: boolean;

  @Output() onCreateAccountCode: EventEmitter<AccountCodeData> = new EventEmitter<AccountCodeData>();
  @Output() onClose: EventEmitter<string> = new EventEmitter<string>();
  @Output() foundationalFieldUpdated = new EventEmitter();

  fixedFoundationDataSet = [];
  accountConfig = undefined;
  currentProgram: any = undefined;
  foundationTypeList: any[] = [];
  public accountCodeGenerateForm: UntypedFormGroup;
  _foundationTypelist: any[] = [];
  pageNo: number = 1;
  disableSave: boolean = true;
  configurationNotExist = false;
  isValidAccountCode: boolean = false;
  accountCodeMessage = "Please select the above fields to generate the account code";
  validationMessage:string;
  accountCodeTitle:string;
  disableContinue: boolean = true;

  hideMasterDataTypeName:boolean;

  constructor(private storageService: StorageService,
    private _loader: LoaderService, private _alert: AlertService,
    private fb: UntypedFormBuilder, public userService: UserService,
    private foudationDataService:FoundationalFieldsHttpService,
    private accountCodeService: AccountCodeService) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.visiblity?.currentValue == 'visible') {
      this.accountCodeGenerateForm.get('accountCodeGenerated').setValue({dirty:false});
      this.validationMessage = '';
        this.patchAccountCodeDetails();
    }
  }

  ngOnInit(): void {
    this.currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.accountConfig = this.storageService.get(StorageKeys.ACCOUNT_CODE_CONFIG);
    this.hideMasterDataTypeName = this.currentProgram?.config?.show_only_master_codes ?? false;
    if (this.accountConfig && this.accountConfig?.components) {
      this.fixedFoundationDataSet = this.accountConfig?.components;
      if (this.fixedFoundationDataSet && this.fixedFoundationDataSet.length > 0) {
        this.fixedFoundationDataSet = this.fixedFoundationDataSet.sort((config1, config2) => config1?.sort - config2?.sort);
      }
    } else {
      this.configurationNotExist = true;
    }
    this.createForm();
    this.getFoundantionalType(this.pageNo = 1);
  }

  onSelectAccountCode = (value) =>{
    this.generateAccountCode(false);
  }

  createForm() {
    this.accountCodeGenerateForm = this.fb.group({
      foundational_data: this.fb.array([]),
      accountCodeGenerated: [null],
    });
  }

  async getFoundantionalType(pageNo = 1) {
    this.userService.getFoundantionalType(this.currentProgram?.id).subscribe(data => {
      const { foundational_data_types } = data;
      let foundational_types = [];
      if (this.fixedFoundationDataSet != null && this.fixedFoundationDataSet.length > 0) {
        this.fixedFoundationDataSet.forEach(fds => {
          foundational_data_types?.forEach(fd => {
            if (fd?.slug?.toLowerCase() === fds?.slug?.toLowerCase()) {
              fd.isRequired = fds.is_mandatory;
              fd.key_slug = fds.key_slug;
              foundational_types.push(fd);
            }
          });
        })
        if (foundational_types && foundational_types.length == 0) {
          this.configurationNotExist = true;
        }
      } else {
        this.configurationNotExist = true;
      }

      this.foundationTypeList = foundational_types;
      if(!this.readOnly){
        const foundationalDataHttp = this.foundationTypeList.map(dataType => {
         return this.foudationDataService.getFoundationalData(this.currentProgram?.id,dataType?.id);
        });

        let foundationalValue: any[] = [];
        forkJoin(foundationalDataHttp).subscribe(res => {
          foundationalValue = res.map(foundData => foundData?.foundational_data);
          foundationalValue.forEach((val, index) => {
            this.foundationTypeList[index].values = val;
          });
          this.foundationTypeList = [...this.foundationTypeList];
          this._foundationTypelist = this.chunkArray(this.foundationTypeList, 3);
          this.updateFoudationalForm();
        }, err => {
          this._alert.error(errorHandler(err));
        });
      }else {
        this.updateFoudationalForm();
      }
    }, error => {
      this._alert.error(errorHandler(error), {});
    },
      () => {
      });
  }

  updateFoudationalForm() {
    this.foundationTypeList.forEach(element => {
      this.foundationalDataArray.push(
        this.fb.group({
          is_required: [element?.isRequired],
          foundational_data_name: [element.name],
          foundational_data_type_id: [element.id],
          values: [null, element?.isRequired ? [Validators.required] : []],
          options: [element.values],
          slug: element.slug,
          key_slug: element.key_slug
        })
      )
    });
    this._loader.hide();
  }

  getfoundationalData(term, fondationDataType, index) {
    if (fondationDataType && fondationDataType?.get('foundational_data_type_id')?.value) {
      let dataTypeId = fondationDataType?.get('foundational_data_type_id')?.value;
      let url = `/configurator/programs/${this.currentProgram?.id}/foundational-data-types/${dataTypeId}/foundational-data?k=${term.term}`;
      this.userService.get(url).subscribe({
        next: (data: any) => {
        if (data && data.foundational_data && data?.foundational_data.length > 0) {
          let controlArray = <UntypedFormArray>this.accountCodeGenerateForm.controls["foundational_data"];
          controlArray.controls[index].patchValue({ options: data?.foundational_data });
        }
      }, 
      error: error => {
        this._alert.error(errorHandler(error), {});
        this._loader.hide();
      },
      complete:  () => {
          this._loader.hide();
        }});
    }

  }

  onBtnContinueClick = () => {
    this.visiblity = 'hidden';
    let value = this.getAccountCodeFieldDetails();
    this.onCreateAccountCode.emit(value);
  }

  sidebarClose = () => {
    this.visiblity = 'hidden';
    this.onClose.emit('hidden');
  }

  createAccountCode() {
    if (this.accountCodeGenerateForm.get('foundational_data')?.valid) {
      this.disableSave = true;
      if (this.accountConfig?.is_validation_required) {
        let accountCodeSelected = this.getVerifyAccountCodePayload();
        this._loader.show();
        this.accountCodeService.verifyAccountCodeToken(this.currentProgram.id, accountCodeSelected).subscribe(result => {
          this.validationMessage = '';
          if (result?.response) {
            this.isValidAccountCode = result?.response.isValid;
            if (this.isValidAccountCode) {
              this.validationMessage = "Success : Account code validated";
              this.disableContinue = false;
              this._alert.success(result?.response.message);
            } else {
              this.validationMessage = "Error : Account Code combination doesn’t exist, please check the details";
              this.disableContinue = true;
              this.disableSave = false;
            }
            this.accountCodeGenerateForm.get('accountCodeGenerated').markAsDirty();
            this.accountCodeGenerateForm.get('accountCodeGenerated').setErrors({ invalid: !this.isValidAccountCode });
          }

          this._loader.hide();
        }, error => {
          this.disableSave = false;
          this.isValidAccountCode = false;
          this._alert.error(errorHandler(error));
          this._loader.hide();
        })
      } else {
        this.generateAccountCode(true);
        this.disableSave = false;
      }
    } else {
      this._alert.error("Please select all compulsary fields");
    }
  }

  getVerifyAccountCodePayload = (): AccoutCodeValidationRequest => {
    let verificationPayload: AccoutCodeValidationRequest = new AccoutCodeValidationRequest()
    verificationPayload.params = new AccountCodeValidationParams();
    verificationPayload.params.worker_id = "";
    verificationPayload.params.module_name = this.module;
    verificationPayload.params.action = 'create';
    verificationPayload.params.unit_id = "";
    verificationPayload.payload = new AccountCodeValidationPayload();
    this.accountCodeGenerateForm.value.foundational_data.forEach(foundational_data => {
      if (foundational_data) {
        verificationPayload.payload[foundational_data.key_slug] = foundational_data.values?.code ?? '';
      }
    });
    return verificationPayload;
  }

  generateAccountCode = (validAccountCode:boolean) => {
      let accountCodeValue = '';
      this.validationMessage = '';
      this.accountCodeTitle = '';
      this.isValidAccountCode = validAccountCode;
      if(this.isFoundationValueSelected()){
        let codeSeparator = this.accountConfig?.component_separator;
        if (!codeSeparator || codeSeparator === '') {
          codeSeparator = '-'
        }
        this.accountCodeGenerateForm.get('foundational_data').value.forEach(foundational_data => {
          if (foundational_data?.values?.name && foundational_data?.values?.name !== '') {
            accountCodeValue = accountCodeValue ? `${accountCodeValue}${codeSeparator}${foundational_data.values.code}` : foundational_data.values.code;
            this.accountCodeTitle = this.accountCodeTitle ? `${this.accountCodeTitle}${codeSeparator}${foundational_data.values.name}` : foundational_data.values.name;
          } else {
            accountCodeValue = `${accountCodeValue}${codeSeparator}`;
            this.accountCodeTitle = `${this.accountCodeTitle}${codeSeparator}`;
          }
        });
        this.accountCodeMessage = accountCodeValue;
        this.disableSave = !this.accountCodeGenerateForm.get('foundational_data')?.valid;
        this.accountCodeGenerateForm.patchValue({
          accountCodeGenerated: accountCodeValue
        });
      }else {
        this.accountCodeMessage = "Please select the above fields to generate the account code";
      }
  }

  isFoundationValueSelected = () :boolean => {
    let values  : Array<any> = this.accountCodeGenerateForm.get('foundational_data').value;
    if(values?.length > 0){
     return values.some(fd => fd.values)
    }
    return false;
  }

  getAccountCodeFieldDetails = () => {
    let value: AccountCodeData = new AccountCodeData();
    value.is_validated = this.isValidAccountCode;
    if (this.isValidAccountCode) {
      value.account_code = this.accountCodeGenerateForm.get('accountCodeGenerated').value;
      value.account_title = this.accountCodeTitle;
      value.fields = new Array<AccountCodeFields>();
      this.accountCodeGenerateForm.value.foundational_data.forEach(foundational_data => {
        if (foundational_data && foundational_data.values) {
          let field: AccountCodeFields = new AccountCodeFields();
          field.foundational_data_type_id = foundational_data.foundational_data_type_id;
          field.foundation_data_id = foundational_data.values.id;
          field.slug = foundational_data.slug;
          field.key_slug = foundational_data.key_slug;
          field.value = { name: foundational_data.values.name, code: foundational_data.values.code }
          value.fields.push(field);
        }
      });
    }
    return value;
  }

  snakeCase = string => {
    string = string.toLowerCase();
    return string.replace(/\W+/g, ' ')
      .split(/ |\B(?=[A-Z])/)
      .map(word => word.toLowerCase())
      .join('_');
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

  get foundationalDataArray() {
    return (this.accountCodeGenerateForm.get('foundational_data') as UntypedFormArray || new UntypedFormArray([]));
  }

  patchAccountCodeDetails() {
    if (this.accountCodeFields && this.accountCodeFields.fields && this.accountCodeFields.fields.length > 0 && this.accountCodeGenerateForm.get('foundational_data').value) {
      let f_data: UntypedFormArray = <UntypedFormArray>this.accountCodeGenerateForm.get('foundational_data');
      this.isValidAccountCode = this.accountCodeFields.is_validated;
      this.disableSave = false;
      this.accountCodeGenerateForm.patchValue({
        accountCodeGenerated: this.accountCodeFields.account_code
      });
      this.accountCodeMessage = this.accountCodeFields.account_code
      f_data?.controls?.forEach(element => {
        let configFoundation = this.accountCodeFields.fields.find(db => db?.foundational_data_type_id == element?.value?.foundational_data_type_id);
        if (configFoundation) {
          let options = element.get('options');
          let defaultValue = options?.value?.find(v => v.id === configFoundation?.foundation_data_id);
          if (!defaultValue) {
            defaultValue = {
              id: configFoundation?.foundation_data_id,
              name: configFoundation?.value?.name,
              code: configFoundation?.value.code,
            };
            if(!element.get('options').value && defaultValue){
              element.get('options').setValue([]);
            }
            element.get('options')?.value.push(defaultValue);
          }
          element.get('values')?.patchValue(defaultValue);
          element.value.values = defaultValue;
        } else {
          element.get('values')?.patchValue(null);
        }
      });
    }
  }

}
