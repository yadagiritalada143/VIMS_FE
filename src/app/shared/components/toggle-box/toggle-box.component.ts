import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-toggle-box',
  templateUrl: './toggle-box.component.html',
  styleUrls: ['./toggle-box.component.scss']
})
export class ToggleBoxComponent implements OnInit {
  @Input() title: string;
  @Input() subtitle: string;
  @Input() selectbox: boolean;
  @Input() selectboxlabel: string;
  @Input() selectrequired: boolean;
  @Input() checkbox: boolean;
  @Input() isMultiple: boolean = false;
  @Input() placeholderLabel = "Select value";
  @Input() isReadOnly: boolean = false;
  @Input() selectFieldName: string;
  @Input() checkBoxFieldName: string;
  @Input() checkBoxIsChecked: string;
  @Input() showOnlyNgContent: boolean = false;
  @Input() set items(value: any) {
    this._items = value;
  }
  @Input() inputSelect: boolean;
  @Input() inputSelectLabel: string;
  @Input() inputSelectRequired: boolean;
  @Input() subItem: boolean = false;
  @Input() showInputBox: boolean = false;
  @Input() subItemTitle: string;
  @Input() subItemDescription: string;
  public _items: any = [];
  public toggleForm: UntypedFormGroup;
  public _patchSelectData: any;
  @Input() isTrue: boolean = false;
  @Input() isSubItemToggleTrue = false;
  @Input() set patchSelectData(value: any) {
    if (this.isEdit || this.isReadOnly || this.isSelectedRole) {
      if(value){
        this._patchSelectData = value;
        this.toggleForm?.patchValue({
          selectValue: this._patchSelectData
        })
      }
    }
  }

  public _patchCheckBoxData: any;
  @Input() set patchCheckBoxData(value: any) {
    this._patchCheckBoxData = value;
  }

  @Input() isEdit: boolean = false;
  @Input() fromTSConfig: boolean = false;
  @Input() isSelectedRole: boolean = false;
  @Input() showMdtInput: boolean = false;
  @Input() isMultipleCheckBox: boolean = false;
  @Input() projectTypes : any;
  @Input() projectSource : any;
  @Input() request: any;
  @Input() mode : any;
  @Input() foundationalFields : any;
  @Input() customFields : any;
  @Input() customProjects : any;
  @Input() configurationMode: any;
  @Input() secondProjectsDropdown: any;
  @Input() secondProjects: any;
  @Input() value:any;
  @Input() dropDownValue: any;
  @Input() index: any;
  @Input() val: any;
  @Input() options: any;
  @Output() selectionChanged = new EventEmitter();
  @Output() initSelectionChanged = new EventEmitter();
  @Output() projectSelectOptionChanged = new EventEmitter();
  @Output() isToggleBtnChecked = new EventEmitter();
  @Output() isToggleSubItemBtnChecked = new EventEmitter();
  @Output() checkBoxChanged = new EventEmitter();
  @Output() textValue = new EventEmitter();
  constructor(
    private fb: UntypedFormBuilder
  ) {}

  ngOnInit(): void {
    this.toggleForm = this.fb.group({
      selectValue: [[], this.selectrequired && this.isTrue ? [Validators.required] : []],
    })
    setTimeout(() => {
      if(this.projectTypes){
      this.changeSelection(this.projectTypes, true)
      }
    },1000)

  }

  toggleChange() {  
    this.isTrue = !this.isTrue;
    // this.request.rules.basic_rules.break.options[this.index].penality_rule =this.isTrue
    this.isToggleBtnChecked.emit(this.isTrue);
  }

  toggleSubItemChange() {  
    this.isSubItemToggleTrue = !this.isSubItemToggleTrue;
    this.isToggleSubItemBtnChecked.emit(this.isSubItemToggleTrue);
  }
  preventSpecialChar(event)
  {   
     var k;  
     k = event?.charCode;  //         k = event.keyCode;  (Both can be used)
     return((k > 64 && k < 91) || (k > 96 && k < 123) || k == 8 || k == 32 || (k >= 48 && k <= 57)); 
  }

  changeSelection(selectedProjectTypes, onLoadToggle = false) {
    // if(selectedProjectTypes.length > 0) {
    //   this.inputSelect = true;
    // }else {
    //   this.inputSelect = false;

    // }
    // this.secondProjects=[];
    if(this.isSelectedRole) {
      this.selectionChanged.emit(selectedProjectTypes);
      return;
    }

    this.secondProjectsDropdown= [];
    if(selectedProjectTypes?.length > 0){
      if(selectedProjectTypes.includes("foundational_data")){
        this.secondProjectsDropdown= [... this.secondProjectsDropdown, ...this.foundationalFields];
      }
      if(selectedProjectTypes.includes("custom_data")){
        this.secondProjectsDropdown= [... this.secondProjectsDropdown, ...this.customFields];
      }
      if(selectedProjectTypes.includes("project-x")){
        this.secondProjectsDropdown= [... this.secondProjectsDropdown, ...this.customProjects]; // ...this.options.projectXPredefinedValues,
      }
      // Added due to V2M-30164
      if(selectedProjectTypes.includes("project-code-integration")){
         if (Array?.isArray(this.options.projectCodeIntegration)) {
          this.secondProjectsDropdown = [...this.secondProjectsDropdown, ...this.options.projectCodeIntegration];
        } else {
          this.secondProjectsDropdown?.push(this.options.projectCodeIntegration);
        }
      }
      if(selectedProjectTypes.includes("worker_code")){
        // this.secondProjectsDropdown= [... this.secondProjectsDropdown, ...this.options?.workerCode];
        if (Array?.isArray(this.options.workerCode)) {
          this.secondProjectsDropdown = [...this.secondProjectsDropdown, ...this.options.workerCode];
        } else {
          this.secondProjectsDropdown?.push(this.options.workerCode);
        }
      }
    }
    if(onLoadToggle && this.fromTSConfig) {
      this.initSelectionChanged.emit(selectedProjectTypes);
    }
    else {
    this.selectionChanged.emit(selectedProjectTypes);
    }
  }
  changeProjectSelectionoption(event: any) {
    this.projectSelectOptionChanged.emit(event)
  }

  changeCheckBox(value, index) {
    if (!this.isMultipleCheckBox) {
      this._patchCheckBoxData?.forEach((res,i) => {
        if(i!=index) res[this.checkBoxIsChecked] = false;
      })
    }
    this._patchCheckBoxData[index][this.checkBoxIsChecked] = !this._patchCheckBoxData[index][this.checkBoxIsChecked];
    this.checkBoxChanged.emit(this._patchCheckBoxData);
  }

  selectAll() {
    this._patchCheckBoxData?.forEach((data) => {
      data[this.checkBoxIsChecked] = true;
    });
    this.checkBoxChanged.emit(this._patchCheckBoxData);
  }

  changeText(value:any) {
    this.textValue.emit(value)
  }
}
