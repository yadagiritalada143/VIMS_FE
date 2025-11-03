import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AbstractControl, UntypedFormGroup } from '@angular/forms';
import { NgSelectComponent } from '@ng-select/ng-select';
import moment from 'moment-timezone';
import { IAdvanceFilterConfig, FilterType, ITableHeaderConfig } from '../svms-table.model';
import { Subject, debounceTime, distinctUntilChanged, of, switchMap } from 'rxjs';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';

@Component({
  selector: 'app-svms-coloumn-filter',
  templateUrl: './svms-coloumn-filter.component.html',
  styleUrls: ['./svms-coloumn-filter.component.scss'],
})
export class SvmsColoumnFilterComponent implements OnInit {
  @Input() filterFormGroup: UntypedFormGroup;
  @Input() field: any;
  @Input() headerConfig: ITableHeaderConfig;
  @Output() onLoading: EventEmitter<void> = new EventEmitter<void>();
  @Output() onApplyFilter: EventEmitter<any> = new EventEmitter<any>();
  filterApplied: boolean = false;
  allowValue
  typeahead = new EventEmitter<string>();
  public datepickerOptions: any = {
    language: 'English',
    timepicker: true,
    format12h: true,
    range: true,
  };

  multiSelectTypeaheadInput$ = new Subject<string>();
  multiSelectSearchTerm: string = '';
    constructor(private _storageService:StorageService ) {}

  ngOnInit(): void {
    this.typeahead.pipe(
      debounceTime(500),
      switchMap(term => {
        if (term?.length > 0) {
          if (this.field?.onSearch) {
            this.field.loading = true;
            this.field.onSearch({ term: term }, this.field);
            return term;
          }
        }
        return of([]);
      }),
    );

    this.multiSelectTypeaheadInput$.pipe(
      distinctUntilChanged(),
      debounceTime(500),
      switchMap(term => {
        if (term?.length > 0) {
          if (this.field?.onSearch) {
            this.field.loading = true;
            this.field.onSearch({ term: term }, this.field);
            return term;
          }
        }
        return of([]);
      }),
    ).subscribe(() => {
    }
    );
    if(window.location.href.includes('jobs/genericlist/')){
    const filter = this._storageService.get(StorageKeys.FILTER_PRESERVE);
    if( filter && Object.keys(filter).length > 0){
      Object.keys(filter).forEach(ele => {
      this.filterFormGroup.value[ele] = filter[ele]
    this.filterFormGroup.get(ele).setValue(filter[ele])

      // this.filterFormGroup.get(field?.name).setValue([numberValue]);

      })
      this.filterData()
    }
  }

  }

  get FilterType() {
    return FilterType;
  }

  onChangeEvent = (evt: any, field: IAdvanceFilterConfig) => {
    this.filterData();
    this.filterApplied = true;
    if (field?.onChange) {
      field.onChange(evt);
    }
  };

  clearSelect(name: string, evt: any) {
    const formControl: AbstractControl = this.filterFormGroup.controls[name];
    formControl?.setValue(null);
    if (this.filterApplied) {
      this.filterData();
      this.removePreserveData(name)

    }
    // Regardless of whether the API was called or not, reset the flag to false
    this.filterApplied = false;
  }

  onOpenEvent = (evt: any, field: IAdvanceFilterConfig) => {
    if (field?.onOpen) {
      field.loading = true;
      field.onOpen(evt, field);
    }
  };

  onScrollEvent = (field: IAdvanceFilterConfig) => {
    if (field?.scrolledToEnd) {
      field.scrolledToEnd();
    }
  };

  onCloseDropdown = (field: IAdvanceFilterConfig) => {
    if(field){
      field.loading = false;
    }
  }

  clearInput(field: any, evt?: any) {

    if(evt) {
      let preVal: string = evt?.target?.value;
      setTimeout(() => {
        let currVal: string = evt?.target?.value;
        if(preVal !== '' && currVal === '') {
          // Clear event
          this.clearInputHelper(field);
        }
      })

      return;
    }

    this.clearInputHelper(field);
  }

  private clearInputHelper(field: any) {
    this.filterFormGroup.get(field.name)?.setValue(null);
    // this.filterData();
    if (this.filterApplied) {
      this.removePreserveData(field?.name)
      this.filterData();
    }

    if (field?.onSearch) {
      field.loading = true;
      field.onSearch({ target: { value: null } } as any, field);
    }

    // Regardless of whether the API was called or not, reset the flag to false
    this.filterApplied = false;
  }

  numericOnly(event: any): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    return true;
  }

  onChangeMultiSelectEvent = (evt: any, field: IAdvanceFilterConfig, multiSelect: NgSelectComponent) => {
    multiSelect.close();
    let multiSelectValue = this.filterFormGroup.value[field?.name] ?? [];
    if (multiSelectValue.length == 0) {
      this.filterFormGroup.get(field?.name).patchValue(null);
    }
    this.filterData();
    this.filterApplied = true;

    if (field?.onChange) {
      field.onChange(evt);
    }
  };

  clearMultiSelect(name: string, evt: any) {
    const formControl: AbstractControl = this.filterFormGroup.controls[name];
    formControl?.setValue(null);
    const filterPreserve = this._storageService.get(StorageKeys.FILTER_PRESERVE)
    if (this.filterApplied || (filterPreserve && Object.keys(filterPreserve).length > 0)) {
      this.removePreserveData(name)
      this.filterData();
    }
    // Regardless of whether the API was called or not, reset the flag to false
    this.filterApplied = false;
  }

  onSearchEvent = (evt?: any, field?: IAdvanceFilterConfig) => {
    const input = event.target as HTMLInputElement;
    const trimmedValue = input.value.trim();
    let firstNumber;
    let secondNumber;
    if(field?.type === FilterType.NUMBER || field?.type == FilterType.NORANGENUMBER) {
      if(trimmedValue?.includes("-")){
       firstNumber = input.value.trim()?.split('-')[0].trim()
      secondNumber = input.value.trim()?.split('-')[1].trim()
      const number = [Number(firstNumber),Number(secondNumber)]
      this.filterFormGroup.get(field?.name).setValue(number);
    this.allowValue = number
      }else if(trimmedValue?.includes("<=")){
        firstNumber = null;
        secondNumber = input.value.trim()?.split('<=')[1].trim()
        const number = [null,Number(secondNumber)]
      this.filterFormGroup.get(field?.name).setValue(number);
      this.allowValue = number
      }else if(trimmedValue?.includes(">=")){
        firstNumber = input.value.trim()?.split('>=')[1].trim();
        secondNumber = null
        const number = [Number(firstNumber),null]
      this.filterFormGroup.get(field?.name).setValue(number);
      this.allowValue = number
      }else {
        if (trimmedValue !== '') {
          const numberValue = Number(trimmedValue);
          if (!isNaN(numberValue)) {
            this.filterFormGroup.get(field?.name).setValue([numberValue]);
          }
        }
      }
    }
    

    // check if value is number then make the input value as number
    // if (field?.type === FilterType.NUMBER || field?.type == FilterType.NORANGENUMBER) {
    //   if (trimmedValue !== '') {
    //     const numberValue = Number(trimmedValue);
    //     if (!isNaN(numberValue)) {
    //       this.filterFormGroup.get(field?.name).setValue([numberValue]);
    //     }
    //   }
    // }

    if (trimmedValue !== '') {
      this.filterData();
      this.filterApplied = true;
      if (field?.onSearch) {
        field.loading = true;
        field.onSearch(evt, field);
      }
    }
  };
 

  onSearchDropdown = (evt?: any, field?: IAdvanceFilterConfig) => {
    if (field?.onSearch) {
      field.loading = true;
      field.onSearch({ term: evt }, field);
    }
  };

  onInputChange(event: InputEvent, field: IAdvanceFilterConfig) {
    const input = event.target as HTMLInputElement;
    const trimmedValue = input.value.trim();

    if (trimmedValue === '') {
      // Field has been cleared, make API call
      this.filterApplied = true; // Reset the filterApplied status
      this.clearInput(field);
      this.filterApplied = false; // Reset the filterApplied status
    } else {
      // If user has entered a value, consider the filter as not yet applied
      this.filterApplied = false;
    }
  }

  filterData(event?: any) {
    if (this.filterFormGroup.valid) {
      const fields: any = this.filterFormGroup.value;
      let result: any = {};

      for (let key in fields) {
        let value = fields[key];
        value = value ? value : value == 0 ? value : null;

        if (typeof value === 'string') {
          value = value.trim();
        }

        if (value !== null && value !== undefined) {
          // Checking if value is not null or undefined
          if (this.isDateField(key, value)) {
            let dates: Array<string> = value.split('-');
            let startDate: Date = new Date(dates?.[0]);
            let endDate: Date = new Date(dates?.[1]);
            endDate.setDate(endDate.getDate() + 1);

            let startInterval: number = startDate.getTime();
            let endInterval: number = endDate.getTime();

            result[key] = [startInterval, endInterval];
          } else if (this.isTimeField(value) && event?.target?.valueAsNumber) {
            // Time in milliseconds
            let timeAsNumber = event?.target?.valueAsNumber;
            result[key] = timeAsNumber;
          } else {
            result[key] = value;
          }
        }
      }
      if(window.location.href.includes('jobs/genericlist/') && result && Object.keys(result).length > 0){
         this._storageService.set(StorageKeys.FILTER_PRESERVE, result,true);
      }
      this.onApplyFilter.emit(result);
    }
  }

  endDateChange(event: any, field: any) {
    this.filterData();
    // Set the flag to true since the filter has been applied
    this.filterApplied = true;
  }

  timeChanged(event: any, field: IAdvanceFilterConfig) {
    this.filterData(event);
    const timeAsNumber = event?.target?.valueAsNumber;
    const timeAsString = event?.target?.value;
    if (timeAsNumber) {
      if (field?.timeChanged) {
        field.timeChanged(timeAsNumber);
      }
      // Updating the form control value
      this.filterFormGroup.get(field?.name).setValue(timeAsString);
    }
  }

  isTimeField(value: any): boolean {
    // Check if the value is a string that matches the time format
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
    return typeof value === 'string' && timeRegex.test(value);
  }

  isDateField(key: string, data: any) {
    
    let config: IAdvanceFilterConfig = this.headerConfig.advanceFilterConfig.find((val: IAdvanceFilterConfig) => {
      return val?.name === key;
    })

    if(config?.type !== FilterType.DATEPICKER) {
      return false;
    }

    let dates: Array<string> = (data?.toString() || '')?.split('-');
    let startValid: boolean = moment(dates?.[0] ?? 'start').isValid();
    let endValid: boolean = moment(dates?.[1] ?? 'end').isValid();
    return startValid && endValid;
  }

  dateChanged(evt: any) {
    if (evt && this.field?.dateChanged) {
      this.field.dateChanged(evt);
    }
  }

  clearDateFilter(event: any, field: IAdvanceFilterConfig) {
    this.filterFormGroup.get(field?.name).patchValue(null);
    const filterPreserve = this._storageService.get(StorageKeys.FILTER_PRESERVE)
    if (this.filterApplied || (filterPreserve && Object.keys(filterPreserve)?.length > 0 && Object.keys(filterPreserve)?.filter(n => n == field?.name)?.length > 0)) {
      this.removePreserveData(field?.name)
      this.filterData();
    }
    // Regardless of whether the API was called or not, reset the flag to false
    this.filterApplied = false;
  }

  showMultiSelectEntry = (entry: string) => {
    let regExp: RegExp = new RegExp(`${this.multiSelectSearchTerm}`, 'i');
    return entry.search(regExp) !== -1;
  }

  onValueChange(event){
    this.filterFormGroup.get(event?.fieldName).setValue(event?.value)
    this.filterApplied = true
    this.filterData()
  }

  removePreserveData(field){
    const filter = this._storageService.get(StorageKeys.FILTER_PRESERVE);
     if(filter){
      delete filter[field]
      this._storageService.set(StorageKeys.FILTER_PRESERVE, filter,true);
     }
  }
}
