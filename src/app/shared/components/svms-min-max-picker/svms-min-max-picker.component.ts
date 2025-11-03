import { Component, EventEmitter, Input, Output, OnInit, ViewEncapsulation, forwardRef, HostListener, ElementRef } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';

@Component({
  selector: 'svms-min-max-picker',
  templateUrl: './svms-min-max-picker.component.html',
  styleUrls: ['./svms-min-max-picker.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SvmsMinMaxPickerComponent),
      multi: true,
    },
  ],
  encapsulation: ViewEncapsulation.None,
})
export class SvmsMinMaxPickerComponent implements OnInit {
  /** Input Fields */
  @Input() placeholder = 'Enter a number';
  @Input() fieldName;
  @Input() readonly: boolean = false
  @Input() disabled: boolean = false
  @Input() numberType;
  @Input() clearData
  @Input() set allowValue(value: any) {
    if(value?.length == 2 && value[0] && value[1]){
      this.minVal = value[0]
      this.maxVal = value[1]
    }else if(value?.length == 2 && !value[0] && value[1]){
      this.minVal = null
      this.maxVal = value[1]
    }else if(value?.length == 2 && value[0] && !value[1]){
      this.minVal = value[0]
      this.maxVal = null
    }
}

  /** Output Emitters */
  @Output() onValueChange = new EventEmitter<any>();

  /** Declarables */
  readonlyField: boolean = false;
  inputVal;
  minVal: number;
  maxVal: number;
  

    
    constructor(
      private _storageService: StorageService,
      private eRef: ElementRef
  ) {}

  ngOnInit(): void {
    if(window.location.href.includes('jobs/genericlist/')){
     const preserveValue = this._storageService.get(StorageKeys.FILTER_PRESERVE)
   if(preserveValue && Object.keys(preserveValue).length > 0){
    Object.keys(preserveValue).forEach(ele => {
      if(this.fieldName == ele){
      if(preserveValue[ele].length ==1){
      this.inputVal = preserveValue[ele][0]
      }else if(preserveValue[ele].length ==2 &&  preserveValue[ele][0] &&  preserveValue[ele][1]){
        this.minVal =  preserveValue[ele][0]
        this.maxVal =  preserveValue[ele][1]
        this.inputVal = `${this.minVal ?? 0} - ${this.maxVal}`;
      }else if(preserveValue[ele].length == 2 && !preserveValue[ele][0] && preserveValue[ele][1]){
              this.minVal =  null
              this.maxVal =  preserveValue[ele][1]
              this.inputVal = `<= ${preserveValue[ele][1]}`;
            }else if(preserveValue[ele].length == 2 && preserveValue[ele][0] && !preserveValue[ele][1]){
              this.minVal =   preserveValue[ele][0]
              this.maxVal =  null
              this.inputVal = `>= ${preserveValue[ele][0]}`;
            }
    }
    })
  }
}
  }

  ngOnChanges(){
    if(!this.clearData){
      this.inputVal = ''
      this.minVal = null;
      this.maxVal= null
    } 
  }

  readonlyToggle(): void {
    this.readonlyField = !this.readonlyField;
  }

  resetInput(): void {
    if(!this.minVal && !this.maxVal) return
    this.inputVal = this.minVal = this.maxVal = undefined;
    this.onValueChange.emit({
      fieldName: this.fieldName,
      value: null
    });
  }

  // updateVal(): void {
  //   // this.onValueChange.emit([+this.inputVal,this.fieldName]);
  //   this.onValueChange.emit({
  //     fieldName: this.fieldName,
  //     value: [+this.inputVal,this.fieldName]
  //   });

  // }

  applyMinMax(): void {
    // this.onValueChange.emit([this.minVal ? +this.minVal : 0, +this.maxVal ?? 0]);
    this.onValueChange.emit({
      fieldName: this.fieldName,
      value: [this.minVal ? +this.minVal : null, this.maxVal ? +this.maxVal : null]
    });
    if(this.minVal && this.maxVal){
    this.inputVal = `${this.minVal ?? 0} - ${this.maxVal}`;
    }else if(this.minVal && !this.maxVal){
    this.inputVal = `>= ${this.minVal ?? 0}`;
    }else if(!this.minVal && this.maxVal){
    this.inputVal = `<= ${this.maxVal ?? 0}`;
    }
    // this.inputVal = `${this.minVal ?? 0} - ${this.maxVal}`;
    this.readonlyToggle();
  }

  get disableApply() {
    if((!this.maxVal && !this.minVal) || (this.minVal && this.maxVal && Number(this.minVal) > Number(this.maxVal))){
      return true
    }
    // if (this.maxVal || this.maxVal === 0) {
    //   if (!this.minVal || this.minVal <= +this.maxVal) {
    //     return false;
    //   }
    // }
    return false;    
  }
  @HostListener('document:click', ['$event'])
  clickout(event) {
    if(this.eRef.nativeElement.contains(event.target)) {
      // console.log("click inside")
    } else {
      this.readonlyField = false

    }
  }

}
