import { Component, Input, OnInit, Output } from '@angular/core';
import { EventEmitter } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { FilterType, IAdvanceFilterConfig } from '../svms-table.model';

type Visibility = ('visible' | 'hidden');

@Component({
  selector: 'app-svms-table-filter',
  templateUrl: './svms-table-filter.component.html',
  styleUrls: ['./svms-table-filter.component.scss']
})
export class SvmsTableFilterComponent implements OnInit {

  private fieldMap: Map <string, FilterType> = new Map <string, FilterType> ();

  public filterForm: UntypedFormGroup = null;
  public datepickerOptions: any = {
    language: 'English',
    timepicker: true,
    format12h: true,
    range: true
  };

  @Input() visibility: Visibility = 'hidden';
  @Output() visibilityChange: EventEmitter <Visibility> = new EventEmitter <Visibility> ();

  public advanceFilterConfig: Array <IAdvanceFilterConfig> = [];
  @Input('filterConfig') set filterConfig(data: Array <IAdvanceFilterConfig>) {
    this.advanceFilterConfig = data;
    this.initializeForm();
  }

  @Output() filterParams: EventEmitter <any> = new EventEmitter <any> ();

  constructor(
    private alert: AlertService
  ) { }

  ngOnInit(): void { }

  initializeForm() {

    this.fieldMap.clear();
    let keys: Array <string> = this.advanceFilterConfig.map((entry: IAdvanceFilterConfig) => entry.name);
    let formFields: any = {};
    
    // TODO: Initialize form data as per config provided
    keys.forEach((key: string, it: number) => {

      const type: FilterType = this.advanceFilterConfig[it].type;
      this.fieldMap.set(key, type);

      formFields = {
        ...formFields,
        [key]: new UntypedFormControl(null, [])
      };
    })

    this.filterForm = new UntypedFormGroup(formFields);
  }

  filterData() {
    if(this.filterForm.valid) {

      const fields: any = this.filterForm.value;
      let result: any = {};

      for(let key in fields) {
        
        let type: FilterType = this.fieldMap.get(key);
        let value: string = fields[key];    
        if(value || (typeof(value) === 'boolean')) {
          
          // Send data only if params are supplied properly
          if(type === FilterType.DATEPICKER) {

            let dates: Array <string> = value?.split('-');
            if(dates.length === 2) {
  
              let startDate: Date = (new Date(dates?.[0]));
              startDate.setHours(0)
              startDate.setMinutes(0)
              startDate.setSeconds(0)
              let endDate: Date = (new Date(dates?.[1]));
              endDate.setHours(23)
              endDate.setMinutes(59)
              endDate.setSeconds(59)

              let startInterval: number = startDate.getTime();
              let endInterval: number = endDate.getTime();
  
              result = {
                ...result,
                [key]: [startInterval, endInterval]
              }
            }
          } else {
            result = {
              ...result,
              [key]: fields[key]
            }
          }
        }
      }

      this.filterParams.emit(result);
      this.sidebarClose();
      return;
    }

    this.alert.error('Validation errors found in submitted data');
  }

  onSearchEvent = (evt: any, field: IAdvanceFilterConfig) => {
    const term: string = evt?.term;
    if(field?.onSearch) {
      field.onSearch(term);
    }
  }

  onChangeEvent = (evt: any, field: IAdvanceFilterConfig) => {
    if(field?.onChange) {
      field.onChange(evt);
    }
  }

  onScrollEvent = (field: IAdvanceFilterConfig) => {
    if(field?.scrolledToEnd) {
      field.scrolledToEnd();
    }
  }

  clearAllFilters() {
    this.filterParams.emit({});
    this.filterForm.reset();
    this.sidebarClose();
  }

  sidebarClose() {
    this.visibilityChange.emit('hidden');
  }

  get FilterType() {
    return FilterType;
  }

  showAdvanceFilter(field: any) {

    if(!field)
      return true;

    if('advanceFilter' in field)
      return !!field['advanceFilter'];

    return true;
  }
}
