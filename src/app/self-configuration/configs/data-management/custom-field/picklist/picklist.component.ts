import { Component, ElementRef, EventEmitter, Input, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { IPicklistOption } from './picklist-options.interface';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { SortHelperPipe } from 'src/app/shared/pipe/sort-helper.pipe';

@Component({
  selector: 'app-picklist',
  templateUrl: './picklist.component.html',
  styleUrls: ['./picklist.component.scss'],
})
export class PicklistComponent implements OnInit {

  public existingOptions: IPicklistOption[]
  @Input('existingOptions') set existingOptionsSetter(data: any) {
    if(Array.isArray(data)) {
      data = this.keysort.transform(data, 'ref_order');
    }

    this.existingOptions = data;
  };

  @Input() isMultiselect: boolean = false;
  @Input() type: string;
  @Input() isEditMode: boolean;
  @Input() customFieldListByModule = []
  @Input() selectedHierarchy:any;
  @Input() selectedModule:any;
  @Input() showMultiselect: boolean = true;
  @Input() allSelectedOptions: Array <string> = [];

  @Output() changeMultiselect = new EventEmitter<boolean>();
  @Output() changeOptions = new EventEmitter<IPicklistOption[]>();

  @ViewChild('optionsList', { static: false }) optionsListElement: ElementRef;

  allSelectedCF : any = [];
  allCustomFieldListByModule : any = [];
  oldValue : string = 'ON';
  searchText : string;
  selectedIndex : number = 0;
  currentResultingIndex :any;
  public picklistForm: any = {};
  public dropdownToggle = {
    value: false
  };
  conditionalFields: boolean = false;
  public dependendField = {
    value: false
  };
  public hideDependentInModule = ["MASTER_DATA_TYPE", "PROGRAM_USERS", "WORK_LOCATIONS", "PROGRAM_DETAILS"]

  constructor(
    private alert: AlertService,
    private keysort: SortHelperPipe
  ) {}

  picklistOptions: any = []

  ngOnInit(): void {
    if(this.isMultiselect) {
      this.dropdownToggle.value = true
    }
    this.picklistForm = {
      isMultiselect: [this.isMultiselect || false],
      newValue: [''],
      picklistOptions: [],
    };
    if(Array.isArray(this.existingOptions)) {
      this.existingOptions?.forEach(option => {
        this.picklistOptions.push({ ...option, selected: option?.selected ?? 'OFF',  dependent : option?.dependent ?? false, selectedResultingFields : option?.selectedResultingFields});
      });
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if(this.isMultiselect === false && this.picklistOptions) {
      if(this.isEditMode) {
        this.picklistOptions = [];
        this.existingOptions?.forEach(option => {
          this.picklistOptions.push({ ...option, selected: option?.selected ?? 'OFF',  dependent : option?.dependent ?? false, selectedResultingFields : option?.selectedResultingFields});
        });
       //this.updateOptionsInForm();
      } else {
        // this.customFieldListByModule = this.customFieldListByModule.map((cf) => {
        //   const selected = this.allSelectedCF.find((selected) => selected.id === cf.id);
        //   return selected ? { ...cf, checked: selected.checked } : cf;
        // });
        if(changes.selectedModule) {
          if(changes?.selectedModule?.currentValue) {
            for(let index=0; index< this.picklistOptions.length ; index++){
              this.picklistOptions[index].selected = 'OFF';
              delete this.picklistOptions[index].dependent
              delete this.picklistOptions[index].selectedResultingFields
            }
          } else {
            this.picklistOptions = []
          }
          // this.picklistOptions[this.selectedIndex].selected = 'ON';
          this.updateOptionsInForm();
        }
      }
    }
    this.allCustomFieldListByModule = this.customFieldListByModule
  }

  selectCF(evt,cf) {
    let index = this.allSelectedCF.findIndex(x => x.id == cf.id)
    if(evt) {
      // find if element is exist, If not then push
      cf.checked = true
      if(index == -1) {
        this.allSelectedCF.push(cf)
      }
    } else {
      // Remove for selected vendor
      cf.checked = false
      this.allSelectedCF.splice(index, 1)
    }
  }

  search() {
    if(this.searchText) {
      this.customFieldListByModule = this.allCustomFieldListByModule.filter(search => search?.name.toLowerCase().includes(this.searchText.toLowerCase()))
    } else {
      this.customFieldListByModule = this.allCustomFieldListByModule
    }
  }

  onClickDropdown() {
    if (this.dropdownToggle.value) {
      this.dropdownToggle.value = false;
      this.isMultiselect = false;
      for(let index=0; index< this.picklistOptions.length ; index++){
        this.picklistOptions[index].selected = 'OFF';
        this.updateOptionsInForm();
      }
    } else {
      this.dropdownToggle.value = true;
      this.isMultiselect = true;
    }
  }

  addResultingFields(index) {
    this.currentResultingIndex = index
    let selectedIds = this.picklistOptions[this.currentResultingIndex]?.selectedResultingFields?.map(selectedIds => selectedIds?.id)
    // already selected data push
    this.allSelectedCF =  this.customFieldListByModule.filter(f => selectedIds?.includes(f.id));
    this.customFieldListByModule.forEach(customFieldIds => {
      if(selectedIds?.includes(customFieldIds?.id)) {
        customFieldIds.checked = true
      } else {
        customFieldIds.checked = false
      }
    })
    this.conditionalFields = true;
  }

  selectResultingField() {
    this.picklistOptions[this.currentResultingIndex].selectedResultingFields = this.allSelectedCF.filter(item => item.checked);
    this.conditionalFields = false;
    this.allSelectedCF = []
    this.updateOptionsInForm();
    this.onCloseModal();
  }

  removeResultingField(resultingindex, cfindex) {
    this.picklistOptions[cfindex]?.selectedResultingFields?.splice(resultingindex,1)
    this.updateOptionsInForm();
  }

  onCloseModal() {
    this.conditionalFields = false;
    this.currentResultingIndex = null;
    this.searchText = null;
    this.search()
  }

  onClickDependend(index) {
    if (this.picklistOptions[index].dependent) {
      this.picklistOptions[index].dependent = false;
      this.picklistOptions[index].selectedResultingFields = []
      this.updateOptionsInForm();
    } else {
      this.picklistOptions[index].dependent = true;
      this.updateOptionsInForm();
    }
  }

  public addNewValue(value?: string, selected?: boolean) {
    if('newValue' in this.picklistForm) {

      const alreadyPresent: boolean = this.picklistOptions.find((entry: any) => {

        const ignoreCaseCompare: Function = (x: string): string => x.trim().toLowerCase(); 
        const newVal: string = this.picklistForm.newValue || "";
        const label: string = entry?.label || "";

        return ignoreCaseCompare(label) === ignoreCaseCompare(newVal);
      });

      if(alreadyPresent) {
        this.alert.error("Option with same label already exists!<br/>Please provide a different value.");
        return;
      }

      this.picklistOptions.push(
        {
          label: value ?? this.picklistForm.newValue,
          value: (value ?? this.picklistForm?.newValue)?.toLowerCase()?.replaceAll(' ', '_'),
          selected: selected ? 'ON' : 'OFF',
          help_text: "",
          help_text_type: "INFO",
          is_help_text_enabled: true,
          ref_order: this.existingOptions?.length || 0
        }
      );
      this.picklistForm.newValue = [''];
      this.updateOptionsInForm();
    }
  }

  public onDropField(event) {
    const targetPosition = this.getOptionIndex(event.event.y, event.event.x);
    this.setOptionOnPosition(event.data, targetPosition);
  }

  public toggle(fieldName: string, value: boolean) {
    this.picklistForm[fieldName] = !value
    this.changeMultiselect.emit(!value);
  }

  public removeOption(idx: number) {
    if (this.picklistOptions.length > 1) {
      this.picklistOptions.splice(idx,1);
    } else {
      this.picklistOptions = [];
    }
    this.updateOptionsInForm();
  }

  public changeCheckbox(i, oldValue) {
    if(this.isMultiselect){
      this.picklistOptions[i].selected = oldValue === 'ON' ? 'OFF' : 'ON';
      this.updateOptionsInForm();
    } else {
      for(let index=0; index< this.picklistOptions.length ; index++){
        this.picklistOptions[index].selected = 'OFF';
        this.updateOptionsInForm();
      }
      this.picklistOptions[i].selected = oldValue === 'ON' ? 'OFF' : 'ON'
      this.updateOptionsInForm();
      this.selectedIndex = i;
      this.oldValue = oldValue
    }
  }

  public updateOptionsInForm() {
    this.changeOptions.emit(this.picklistOptions);
  }

  public editOption(event, i: number) {
    this.picklistOptions[i].value = event.target.value?.toLowerCase().replaceAll(' ', '_');
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
    const currentIdx = this.picklistOptions.findIndex(opt => opt.value === option);
    if (currentIdx >= 0) {
      const currentGroup = this.picklistOptions[currentIdx];
      this.picklistOptions.splice(currentIdx, 1);
      this.picklistOptions.splice(index, 0, currentGroup);
    }
    if(!this.isMultiselect){
      const selectedONIndex = this.picklistOptions.findIndex(opt => opt.selected == "ON");
      this.selectedIndex = selectedONIndex
    }

    this.picklistOptions = this.picklistOptions.map((data: any, it: number) => {
      return {
        ...data,
        ref_order: it+1
      }
    });
    this.updateOptionsInForm();
  }
}
