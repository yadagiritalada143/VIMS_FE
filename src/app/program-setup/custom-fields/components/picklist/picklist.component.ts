import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { IPicklistOption } from './picklist-options.interface';

@Component({
  selector: 'app-picklist',
  templateUrl: './picklist.component.html',
  styleUrls: ['./picklist.component.scss'],
})
export class PicklistComponent implements OnInit {
  @Input() existingOptions: IPicklistOption[];
  @Input() isMultiselect: boolean = false;
  @Input() type: string;
  @Input() isEditMode: boolean;
  @Input() showMultiselect: boolean = true;

  @Output() changeMultiselect = new EventEmitter<boolean>();
  @Output() changeOptions = new EventEmitter<IPicklistOption[]>();

  @ViewChild('optionsList', { static: false }) optionsListElement: ElementRef;

  oldValue : string = 'ON';
  selectedIndex : number = 0;
  public picklistForm: UntypedFormGroup;

  constructor(private fb: UntypedFormBuilder) {}

  get picklistOptions(): UntypedFormArray {
    return this.picklistForm?.get('picklistOptions') as UntypedFormArray;
  }

  ngOnInit(): void {
    this.picklistForm = this.fb.group({
      isMultiselect: [this.isMultiselect || false],
      newValue: [''],
      picklistOptions: this.fb.array([]),
    });
    if(Array.isArray(this.existingOptions)) {
      this.existingOptions?.forEach(option => {
        this.picklistOptions.push(this.fb.group({ ...option, selected: option?.selected ?? 'OFF' }));
      });
    }
  }

  ngOnChanges() {
    if(this.isMultiselect === false && this.picklistOptions) {
      this.updateOptionsInForm();
    }
  }

  public addNewValue(value?: string, selected?: boolean) {
    this.picklistOptions.push(
      this.fb.group({
        label: value ?? this.picklistForm.get('newValue')?.value,
        value: (value ?? this.picklistForm.get('newValue')?.value)?.toLowerCase().replaceAll(' ', '_'),
        selected: selected ? 'ON' : 'OFF',
        help_text: "",
        help_text_type: "INFO",
        is_help_text_enabled: true
      }),
    );
    this.picklistForm.get('newValue').reset();
    this.updateOptionsInForm();
  }

  public onDropField(event) {
    if (this.isEditMode) {
      const targetPosition = this.getOptionIndex(event.event.y, event.event.x);
      this.setOptionOnPosition(event.data, targetPosition);
    }
  }

  public toggle(fieldName: string, value: boolean) {
    this.picklistForm.patchValue({
      [fieldName]: !value,
    });
    this.changeMultiselect.emit(!value);
  }

  public removeOption(idx: number) {
    if (this.picklistOptions.length > 1) {
      this.picklistOptions.removeAt(idx);
    } else {
      this.picklistOptions.reset();
    }
    this.updateOptionsInForm();
  }

  public changeCheckbox(i, oldValue) {
    if(this.isMultiselect){
      this.picklistOptions
      .at(i)
      .get('selected')
      .setValue(oldValue === 'ON' ? 'OFF' : 'ON');
      this.updateOptionsInForm();
    } else {
      for(let index=0; index< this.picklistOptions.value.length ; index++){
        this.picklistOptions
        .at(index)
        .get('selected')
        .setValue('OFF');
        this.updateOptionsInForm();
      }
      this.picklistOptions?.at(i)?.get('selected')
      .setValue(oldValue === 'ON' ? 'OFF' : 'ON');
      this.updateOptionsInForm();
      this.selectedIndex = i;
      this.oldValue = oldValue
    }
  }

  public updateOptionsInForm() {
    this.changeOptions.emit(this.picklistOptions.value);
  }

  public editOption(event, i: number) {
    this.picklistOptions.at(i).get('value').setValue(event.target.value?.toLowerCase().replaceAll(' ', '_'));
    this.updateOptionsInForm();
  }

  private getOptionIndex(eventDropY: number, eventDropX: number): number {
    let positionIndex: number;
    const optionsElements = this.optionsListElement.nativeElement.children;
    for (let i = 0; i < optionsElements.length; i++) {
      const el = optionsElements[i];
      const elementBoundingClientRect = el.getBoundingClientRect();
      if (eventDropY > elementBoundingClientRect.y && eventDropY < elementBoundingClientRect.y + elementBoundingClientRect.height) {
        positionIndex = i;
        if (eventDropX < elementBoundingClientRect.x) {
          positionIndex--;
        }
      }
    }
    if (positionIndex === undefined) {
      positionIndex = !optionsElements[0] || eventDropY < optionsElements[0].getBoundingClientRect().y ? 0 : optionsElements.length - 1;
    }
    return positionIndex;
  }

  private setOptionOnPosition(option: IPicklistOption, index: number) {
    const currentIdx = this.picklistOptions.value.findIndex(opt => opt.value === option.value);
    if (currentIdx >= 0) {
      const currentGroup = this.picklistOptions.at(currentIdx);
      this.picklistOptions.removeAt(currentIdx);
      this.picklistOptions.insert(index, currentGroup);
    }
    if(!this.isMultiselect){
      const selectedONIndex = this.picklistOptions.value.findIndex(opt => opt.selected == "ON");
      this.selectedIndex = selectedONIndex
    }
    this.updateOptionsInForm();
  }
}
