import { Component, OnInit, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { NgbTimepickerConfig, NgbTimeStruct } from '@ng-bootstrap/ng-bootstrap';
import { UntypedFormGroup } from '@angular/forms';
import { NumCharacters, Period } from '../../../program-setup/expense-configuration/enums/period.enums';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { RuleConfigurationService } from 'src/app/self-configuration/configs/configuration/rule-configuration/rule-configuration.service';
import { EventStreamService, Events, EmitEvent } from 'src/app/core/services/event-stream.service';
import { ConfirmationDialogService } from '../../../shared/components/confirmation-dialog/confirmation-dialog.service';
@Component({
  selector: 'app-config-common-listing',
  templateUrl: './config-common-listing.component.html',
  styleUrls: ['./config-common-listing.component.scss']
})
export class ConfigCommonListingComponent implements OnInit, OnChanges{
@Input() preventZero: boolean = false;
@Input() title: string;
@Input() subtitle: string;
@Input() description: string;
@Input() directoryIcon: string;
@Input() mainIcon: string;
@Input() multiSelectBox: boolean=false;
@Input() selectBox: boolean=false;
@Input() inputText: boolean=false;
@Input() inputNumber: boolean = false;
@Input() onlyText: boolean = false;
@Input() required: boolean = false;
@Input() selectTimeBox: boolean=false;
@Input() cInputBox: boolean=false;
@Input() toggleSwitch: boolean=false;
@Input() radioToggle: boolean=false;
@Input() textArea: boolean=false;
@Input() itemLevel: string;
@Input() toggleOptionsInput: boolean=false;
@Input() multioptionInput: boolean=false;
@Input() isHideButton: boolean=false;
@Input() buttonInput: string;
@Input() buttonIcon: string;
@Input() numberSelectOption: string;
@Input() inputAndSelectOption:string;
@Input() addressLayout: boolean=false;
@Input() checkboxInput:  boolean=false;
@Input() percentInput: boolean = false;
@Input() options: any[] = [];
@Input() updatedSelectBoxValue: any;
@Input() updatedMultiSelectDropdown : any;
@Input() toggleOptionsInputValue: any;
@Input() updatedInputValue: any;
@Input() updatedTimeValue: any;
@Input() updatedTextInput: any;
@Input() viewMode: boolean = false;
@Input() updatedNumberInput: any;
@Input() feesValueInput:any;
@Input() updatedToggleValue: any;
@Input() inputNumberValue: any;
@Input() selectCalendarValue: any;
@Input() form: UntypedFormGroup;
@Input() disabled: boolean;
@Input() restBreak: boolean;
@Input() addRuleTime: boolean;
@Input() filePath: boolean;
@Input() value: any;
@Input() selectedValue: any;
@Input() multipleOption: boolean = false;
@Input() numberSelectNumber: boolean = false;
@Input() ruleConfigs: any;
@Input() basic_config_id: any;
@Input() breakType: any;
@Input() selectNumberSelect: boolean;
@Input() bulletedList: boolean;
@Input() toggleDisabled: boolean;
@Input() multiSelectArray: any;
@Input() payloadType : any;
@Input() selectedInputOption : any;
@Input() secoundSelectedInputOption : any;
@Input() defaultPayloadValue : any;
@Input() inputPropertyChange : any;
@Output() onValueChange = new EventEmitter();
@Output() onValueMultiSelectChange = new EventEmitter();
@Output() onOptionValueChange = new EventEmitter();
@Output() onTextValueChange = new EventEmitter();
@Output() onTimeValueChange = new EventEmitter();
@Input() showPercentage: boolean = false;
@Input() mode: string;
@Input() addRemoveFieldItem: boolean;
@Input() isDisabed : boolean
@Output() onCheckboxValueChange = new EventEmitter();
@Output() onBtnClick = new EventEmitter();
@Output() onMultiSelectArrayChange = new EventEmitter();
userType = ['MSP','Vendor', 'Worker'];
userData = [
  {
    "userType": null,
    "is_allow": false,
    "period": null,
    "type": null
  }
];
  dynamicUserData = [];
  date = new Date();
  public time: NgbTimeStruct = {
    hour: this.date.getHours(), minute: this.date.getMinutes(), second: this.date.getSeconds()
  };
  timeValue: string;
  public uCode;  
  public uInput;  
  public uInputValue;  
  public upadtedText;  
  actionDropdown: any = [];
  public numberPattern: RegExp = /^[0-9]+[.]{0,1}[0-9]{0,}$/gm;
  constructor( config: NgbTimepickerConfig,
    private ruleConfigurationService: RuleConfigurationService,
    private eventStream: EventStreamService,
    private storageService: StorageService,
    private confirmService: ConfirmationDialogService ) { 
    config.seconds = true;
    config.spinners = false;
   }

  msisdn: string;
  msisdn_confirm: string;
  val = '';
  code = '';
  inputData = '';
  public periodOptions: string[] = [Period.Days, Period.Weeks, Period.Month];
  ruleDurationOptions = [
    {label:'Working-Paid',value:'working-paid'},
    {label:'Non-Working-Paid',value:'non-working-paid'},
    {label:'Working-UnPaid',value:'working-non-paid'},
    {label:'Non-Working-UnPaid',value:'non-working-non-paid'}
  ]; 
  rateFactors:any = [];
  weekendOptions:any = [];
  ruleApplyoptions = [{label:'All Others Except Weekend and Holiday', value:'overtime'}, {label:'Weekend', value:'weekend'}, {label:'Holiday', value:'holiday'}];
  operatorOptions = [{label:'Less Than Equal (<=)',value:'<='},{label: 'Less Than (<)', value:'<'}, {label:'Equal (=)', value:'='},{label:'Greater Than (>)', value:'>'}, {label:'Greater Than Equal (>=)',value:'>='}]
  ruleDurationOptionsall = [{label:'Daily', value:'daily'}, { label:'Weekly', value:'weekly'}, {label:'Nth Day',value:'nthday'}];
  typeOptions = [{label:'Hours', value: 'hours'}, {label:'Nth day', value:'nthday'}];
  ngOnInit(): void {
    if(this.addRuleTime){
      this.getRateFactor();
    }
    if(this.defaultPayloadValue) {
      this.dynamicUserData = this.defaultPayloadValue;
    }
    this.timeValueChanges();
    this.form?.get('units')?.valueChanges.subscribe((period: Period) => {
      const value: string = this.form.get('count')?.value?.toString() || null;
      if (value) {
          switch (period) {
              case Period.Days:
                  this.form.get('count').setValue(value.substring(0, NumCharacters.Days));
                  break;
              case Period.Weeks:
                  this.form.get('count').setValue(value.substring(0, NumCharacters.Weeks));
                  break;
              case Period.Month:
                  this.form.get('count').setValue(value.substring(0, NumCharacters.Month));
                  break;
          }
      }
  });

  this.form?.get('count')?.valueChanges.subscribe((value: any) => {
      const stringValue: string = value?.toString();
      const period: string = this.form.get('units')?.value || null;
      let threeCharValue: string;
      switch (period) {
          case Period.Days:
              if (stringValue?.length > NumCharacters.Days) {
                  threeCharValue = stringValue.substring(0, NumCharacters.Days);
                  this.form.get('count').setValue(threeCharValue);
              }
              break;
          case Period.Weeks:
              if (stringValue?.length > NumCharacters.Weeks) {
                  threeCharValue = stringValue.substring(0, NumCharacters.Weeks);
                  this.form.get('count').setValue(threeCharValue);
              }
              break;
          case Period.Month:
              if (stringValue?.length > NumCharacters.Month) {
                  threeCharValue = stringValue.substring(0, NumCharacters.Month);
                  this.form.get('count').setValue(threeCharValue);
              }
              break;
      }
  });  
  // V2M-25704
      this.transformObjectToArray(this.multiSelectArray);
  // end

}

setWeekendOption(basic_config_id:any){
  if(basic_config_id){
    const currentprogram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    let url = `/timesheet/programs/${currentprogram?.id}/config/basic/${basic_config_id}`;
    this.ruleConfigurationService.get(url)
    .subscribe((data:any) => {
      this.weekendOptions = [];
      let allOption = [{label:'All (Weekend Configuration)',value:'all'}];
      let otherOption = [];
      data?.data?.rules?.basic_rules?.weekend?.option.forEach(element => {
        otherOption.push({label:element.charAt(0).toUpperCase() + element.slice(1), value:element})
      });
      this.weekendOptions = otherOption.length >0 ? allOption.concat(otherOption) : allOption;
    }, (err) => {
      if(err) {
        console.error(err);
      }
    });
  }    
}

  ngOnChanges(changes: SimpleChanges) {
    this.setWeekendOption(this.basic_config_id);
    if (this.updatedTimeValue) {
      let timeValue = this.updatedTimeValue.split(':');
      this.time = {
        hour: Number(timeValue[0]), minute: Number(timeValue[1]), second: Number(timeValue[2])
      };
    }
    if (changes?.updatedInputValue?.currentValue != changes?.updatedInputValue?.previousValue) {
      this.updatedInputData();
    }
  }

  intializeRuleStatus(){
    this.actionDropdown = [];
    if(this.ruleConfigs?.length>0){
      this.ruleConfigs.forEach((ruleConfig) => {
          this.actionDropdown.push({status : false});
      });
    }
    return this.actionDropdown;
  }
  
  getConditionType(conditionType:string){
    var value = '';
    this.typeOptions.forEach(element => {
      if(element?.value?.toLowerCase() == conditionType?.toLowerCase()){
        value = element?.label
      }
    });
    return value;
  }

  getConditionOperator(operator:string){
    var value = '';
    this.operatorOptions.forEach(element => {
      if(element?.value?.toLowerCase() == operator?.toLowerCase()){
        value = element?.label
      }
    });
    return value;
  }

  getRateFactor(){
    const currentprogram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    let url = `/configurator/programs/${currentprogram?.id}/rate-factors?limit=150&page=1`;
    this.ruleConfigurationService.get(url)
    .subscribe((data: any) => {
      if(data?.rate_factors?.length > 0) {
        this.rateFactors = data?.rate_factors;
      }
    });
  }

  getRuleDuration(periodicity:string,applyon:string){
    var value = '';
    if(applyon == 'overtime'){
      this.ruleDurationOptionsall.forEach(element => {
        if(element?.value?.toLowerCase() == periodicity?.toLowerCase()){
          value = element?.label;
        }
      });
    }else{
      this.ruleDurationOptions.forEach(element => {
        if(element?.value?.toLowerCase() == periodicity?.toLowerCase()){
          value = element?.label
        }
      });
    }
    return value;
  }

  getRuleApply(applyon:string){
    var value = '';
    this.ruleApplyoptions.forEach(element => {
      if(element?.value?.toLowerCase() == applyon?.toLowerCase()){
        value = element?.label
      }
    });
    return value;
  }
  
  getWeekendDay(day:string){
    var value = '';
    this.weekendOptions.forEach(element => {
      if(element?.value?.toLowerCase() == day?.toLowerCase()){
        value = element?.label;
      }
    });
    return value;
  }
  
  getRateFactorName(ratefactor:string){
    var value = '';
    this.rateFactors.forEach(element => {
      if(element?.abbreviation?.toLowerCase() == ratefactor?.toLowerCase()){
        value = element?.name;
      }
    });
    return value;
  }
  
  updatedInputData() {
    if (this.updatedInputValue &&  typeof this.updatedInputValue != 'number') {
      const valuePostSplit = this.updatedInputValue?.split('-')?.map(v => (typeof v) ?  v.trim() : v)?.filter(a => !!a);
      if (valuePostSplit.length === 1) {
        if (!this.multioptionInput) {
          this.uCode = null;
          this.uInput = null;
          this.uInputValue = this.updatedInputValue?.split('-')[0];
        } else {
          this.uCode = this.updatedInputValue?.split('-')[0];
          this.uInput = null;
          this.uInputValue = null;
        }
       
      }
      else if (valuePostSplit.length === 2) {
        if(!this.multioptionInput) {
          this.uCode = null;
          this.uInput = this.updatedInputValue?.split('-')[0];
          this.uInputValue = this.updatedInputValue?.split('-')[1];
        } else {
          this.uCode = this.updatedInputValue?.split('-')[0];
          this.uInput = this.updatedInputValue?.split('-')[1];
          this.uInputValue = null;
        }
      }
      else {
        this.uCode = this.updatedInputValue?.split('-')[0];
        this.uInput = this.updatedInputValue?.split('-')[1];
        this.uInputValue = this.updatedInputValue?.split('-')[2];
      }
    }
    this.upadtedText = this.uCode ? this.uCode + '-' + this.uInput : this.uInput;
    this.toggleOptionsInputValue = this.upadtedText;
  }

  textValueChanged(e) {
    this.onTextValueChange.emit(e);
  }

  onToggleOptionsInputValue(event) {
    let inputValue = this.toggleOptionsInputValue ? this.toggleOptionsInputValue + '-' + event : event; 
    this.onTextValueChange.emit(inputValue);
  }
  
  valueChanged(e:any) {
    this.onValueChange.emit(e);
  }
  multiSelectValueChanged(event){
    this.onValueMultiSelectChange.emit(event);
  }

  inputTextValueChange(e){
    this.onValueChange.emit(e);
  }

  selectMultiOptionInputValue(e, key) {
    let multiOptiOnInputValue;
    if (key == 'code') {
      this.code = e;
      multiOptiOnInputValue = this.code ? this.code + '-' + this.inputData : this.inputData;
    } else {
      this.inputData = e;
      if(!this.code) this.code = this.uCode ;
      multiOptiOnInputValue = this.code ? this.code + '-' + this.inputData : this.inputData;
    }
    this.onValueChange.emit(multiOptiOnInputValue);
  }

  timeValueChanges(event?) {
    if (event) {
      this.timeValue = event?.hour + ":" + event?.minute + ":" + event?.second;
    } else {
      this.timeValue = this.time.hour + ":" + this.time.minute + ":" + this.time.second;
    }
    this.onTimeValueChange.emit(this.timeValue);
  }

  toggleChanged(event) {
    this.onValueChange.emit(event);
  }
  optionChanged(event) {
    this.onOptionValueChange.emit(event);
  }

  onClickCheckbox(options) {
    this.onCheckboxValueChange.emit(options);
  }
  buttonClicked(event) {
    this.onBtnClick.emit(event);
  }

  inputNumberValueChange(event){
    this.onValueChange.emit(event);
  }

  deleteRule(index:number){
    this.confirmService.confirm('', `Do you really want to delete this rule?`,'Yes', 'No')
        .then((confirmed) => {
          if (confirmed) {
            this.ruleConfigs.splice(index,1);
          }
        })
        .catch(() => {});
  }

  async showActionDropdown(index:number) {
    await this.intializeRuleStatus();
    this.actionDropdown[index].status = true;
  }

  async hideActionDropdown(index:number) {
    await this.intializeRuleStatus();
  }

  isShowBreak(type) {
    return (type?.toLowerCase() === 'break') ? null : 'break';
  }

  openEditModel(){
    this.eventStream.emit(new EmitEvent(Events.ADD_RULE, true));
  }
  addMoreItem(i , dynamicModifiedValue = false) {
    let duplicatePayloadType = {};
    if(dynamicModifiedValue) {
      Object.keys(this.payloadType)?.forEach(res => {
        duplicatePayloadType[res] = null;
    });
      this.dynamicUserData.push(duplicatePayloadType);
    } else {
      this.userData.push({
        "userType": null,
        "is_allow": false,
        "period": null,
        "type": null
      });
    }
    this.onMultiSelectArrayChange?.emit(dynamicModifiedValue ? this.dynamicUserData : this.userData)
  }

  removeMoreItem(i , dynamicModifiedValue = false) {
    if (dynamicModifiedValue) {
      this.dynamicUserData?.splice(i, 1);
    } else {
      this.userData.splice(i, 1);
      this.userType = ['MSP', 'Vendor', 'Worker'];
      this.onDropdownChange();
    }
    this.onMultiSelectArrayChange?.emit(dynamicModifiedValue ? this.dynamicUserData : this.userData);
  }

  emitUserData(event , dynamicModifiedValue = false) {
    this.onMultiSelectArrayChange?.emit(dynamicModifiedValue ? this.dynamicUserData : this.userData)
  }

  transformObjectToArray(inputObject: any): any[] {
    this.userData = new Array();
    const resultArray = [];
    for (const userType in inputObject) {
      if (inputObject.hasOwnProperty(userType)) {
       inputObject[userType].type = inputObject[userType]?.type?.charAt(0).toUpperCase() + inputObject[userType]?.type?.slice(1);
        const userObject = {
          userType: this.getUserType(userType),
          ...inputObject[userType]
        };
        resultArray?.push(userObject);
      }
    }
    if (resultArray?.length === 0) {
      resultArray.push({
        "userType": null,
        "is_allow": false,
        "period": null,
        "type": null
      })
    }
    this.userData = resultArray;
    return resultArray;
  }

  getUserType(type) {
    const userTypeMap: { [key: string]: string } = {
      'msp': 'MSP',
      'vendor': 'Vendor',
      'worker': 'Worker',
    };
    return userTypeMap[type];
  }
  
  onDropdownChange() {
    this.userType = ['MSP','Vendor', 'Worker'];
    this.userType = this.userType?.filter(type =>
      !this.userData?.some(data => data?.userType === type)
    );
  }

  onKeyPress(event: KeyboardEvent, value) {
    if (this.preventZero && event?.key === '0' && value <= 0) {
      event?.preventDefault();
    }
  }

}
