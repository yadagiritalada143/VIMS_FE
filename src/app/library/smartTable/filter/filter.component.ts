import { ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { AbstractControl, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, ValidatorFn, Validators } from '@angular/forms';
import { debounceTime } from 'rxjs/operators';
import { AdvanceFiltter } from '../table/table.model';
import { SearchAddressComponent } from 'src/app/shared/components/search-address/search-address.component';
import { EmitEvent, Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'program-filter',
  templateUrl: './filter.component.html',
  styleUrls: ['./filter.component.scss']
})

export class FilterComponent implements OnInit, OnChanges, OnDestroy {

  // rangeDate: Date;
  advanceFilterForm: UntypedFormGroup;

  @Input() filter = [];
  @Input() isDisableFilter;
  @Input() set isFilterCleard(data) {
    if (data) {
      this.filterDataPresent = false;
      this.advanceFilterForm.reset();
    }
  }

  @ViewChild('refdate1') datePicker;
  @Output() advanceSearchFilter = new EventEmitter();
  @Output() closeSearchFilter = new EventEmitter();
  public filterDataPresent: boolean = false;
  private multiSelectSubscription: Subscription;
  public createdDate: any = {
    language: 'English',
    timepicker: true,
    format12h: true,
    range: true
  };
  public effectiveDate: any = {
    language: 'English',
    timepicker: true,
    format12h: true,
    range: true
  };

  constructor (
    private fb: UntypedFormBuilder,
    private eventStream: EventStreamService,
    private alert: AlertService,
    private cdk: ChangeDetectorRef,
  ) {
  }
  public street_1 = [];
  public street_2 = [];
  public selected_socail_apps = [];
  public city = [];
  public state = [];
  public zipcode = [];
  public country = [];

  @ViewChild(SearchAddressComponent) googleAddressComponent: SearchAddressComponent;

  ngOnInit(): void {
    this.multiSelectSubscription = this.eventStream.filterMultiSelect.subscribe((res) => {
      if(res) this.cdk.detectChanges();
    });
    this.advanceFilterForm = this.fb.group({});
    if (this.filter) {
      this.filter.forEach((filter: AdvanceFiltter) => {

        if (filter.filterType === 'TEXT') {
          this.advanceFilterForm.addControl(filter.name, this.fb.control(null));
        } else if (filter.filterType === 'NUMBER') {
          this.advanceFilterForm.addControl(filter.name, this.fb.control(null));
        } else if (filter.filterType === 'GOOGLEADDRESS') {
          this.advanceFilterForm.addControl(filter.name, this.fb.control(null));
        } else if (filter.filterType === 'MULTISELECT') {

          let validatorArray: Array <ValidatorFn> = [];
          if (filter?.mandatory == true)
            validatorArray.push(Validators.required);

          this.advanceFilterForm.addControl(filter.name, new UntypedFormControl('', validatorArray));
          if (filter.eventEmiiter && filter.changeHandler) {
            filter.eventEmiiter.pipe(debounceTime(1000)).subscribe((newTerm) => {
              filter.changeHandler(newTerm);
            });
          }
        
        } else if (filter.filterType === 'SELECT') {
          this.advanceFilterForm.addControl(filter.name, this.fb.control(null));

          if (filter.eventEmiiter && filter.changeHandler) {
            filter.eventEmiiter.pipe(debounceTime(1000)).subscribe((newTerm) => {
              filter.changeHandler(newTerm);
            });
          }
        } else if (filter.filterType === 'DATERANGE') {
          this.advanceFilterForm.addControl(filter.name, this.fb.control(null));
        } else if (filter.filterType === 'RANGE') {
          this.advanceFilterForm.addControl('min', this.fb.control(null));
          this.advanceFilterForm.addControl('max', this.fb.control(null));
        }
      });
    }
    Object.keys(this.advanceFilterForm?.value).forEach(ele => {
      if(this.advanceFilterForm?.value?.[ele]){
        this.filterDataPresent = true;
      }
    })
  }

  ngOnChanges(data) {
    if (data.filter && data.filter.previousValue) {
      if (data.filter.previousValue[0].title !== data.filter.currentValue[0].title) {
        this.ClearFilter();
        this.advanceSearchFilter.emit();
      }
    }
  }

  ClearFilter() {
    this.filterDataPresent = false;
    if (this.advanceFilterForm) {
      this.advanceFilterForm.reset();
      this.advanceSearchFilter.emit();
    }
  }
  closeFilter() {
    Object.keys(this.advanceFilterForm?.value).forEach(ele => {
      if(this.advanceFilterForm?.value?.[ele]){
        this.filterDataPresent = true;
      }
    })
    this.closeSearchFilter.emit(true);
    this.filterDataPresent = false;
    if (this.advanceFilterForm) {
      this.advanceFilterForm.reset();
    }
  }


  onSearch() {
    let noOfFilter = 0;
    let isValid = true;
    const filterData = {};

    if(this.advanceFilterForm.invalid) {

      let errorList: Array<string> = [];
      let formFields: Array<string> = Object.keys(this.advanceFilterForm.controls);
      for (let field of formFields) {
        const form: AbstractControl = this.advanceFilterForm.get(field);
        if (form?.invalid && form?.errors) {
          let errors: Array <string> = Object.keys(form?.errors);
          errors.forEach((err: string) => {
            if (!errorList.includes(err)) {
              errorList.push(err);
            }
          });
        }
      }

      if(errorList.includes('required')) {
        this.alert.error('Please fill all the required fields');
      }

      isValid = false;
      return;
    }

    this.filter.forEach((filter: AdvanceFiltter) => {
      const formField: AbstractControl = this.advanceFilterForm.get(filter.name);
      if (!!formField?.value) {
        
        if(filter?.mandatory) {
          const val: any = this.advanceFilterForm.get(filter.name).value;
          let emptyArray: boolean = Array.isArray(val) && !val.length;
          if(emptyArray || !val) {
            this.alert.error("Please fill all the mandatory fields");
            isValid = false;
          }          
        }

        if (Array.isArray(this.advanceFilterForm.get(filter.name).value) && this.advanceFilterForm.get(filter.name).value.length > 0) {
          noOfFilter += 1;
        } else if (!Array.isArray(this.advanceFilterForm.get(filter.name).value)) {
          noOfFilter += 1;
        }
        if (filter.filterType === 'DATERANGE') {
          const dateRange = (this.advanceFilterForm.get(filter.name).value).split('-');
          let fromDate = new Date(dateRange[0])
          fromDate.setHours(0)
          fromDate.setMinutes(0)
          fromDate.setSeconds(0)
          let toDate = new Date(dateRange[1])
          toDate.setHours(23)
          toDate.setMinutes(59)
          toDate.setSeconds(59)
          filterData[filter.name] = [fromDate.getTime(), toDate.getTime()];
        } else if (filter.filterType === 'RANGE') {
          filterData['min'] = this.advanceFilterForm.get('min').value;
          filterData['max'] = this.advanceFilterForm.get('max').value;
        } else if (filter.filterType === 'GOOGLEADDRESS') {
          filterData[filter.name] = {
            street_1: this.street_1 ? this.street_1[0] : null,
            city: this.city ? this.city[0] : null,
            state: this.state ? this.state[0] : null,
            zipcode: this.zipcode ? this.zipcode[0] : null,
            country: this.country ? this.country[0] : null
          };
        } else {
          filterData[filter.name] = this.advanceFilterForm.get(filter.name).value;
        }
      }
    });

    if(isValid) {
      this.advanceSearchFilter.emit({ filterData, noOfFilter });
    }
  }

  throwEventEmitter(evt: any, name: string) {
    this.eventStream.emit(new EmitEvent(Events[name], evt));
  }

  getAddress(place: object) {
    this.street_1[0] = this.getStreet(place);
    this.city[0] = this.getCity(place);
    this.zipcode[0] = this.getPostCode(place);
    this.state[0] = this.getState(place);
    this.country[0] = this.getCountry(place);
  }

  getCity(place) {
    const COMPONENT_TEMPLATE = { locality: 'long_name' };
    const city = this.getAddrComponent(place, COMPONENT_TEMPLATE);
    return city;
  }
  getStreet(place) {
    const COMPONENT_TEMPLATE = { route: 'long_name' };
    const street = this.getAddrComponent(place, COMPONENT_TEMPLATE);
    return street;
  }

  getArea(place) {
    const COMPONENT_TEMPLATE = { colloquial_area: 'long_name' };
    const street = this.getAddrComponent(place, COMPONENT_TEMPLATE);
    return street;
  }
  getPostCode(place) {
    const COMPONENT_TEMPLATE = { postal_code: 'long_name' };
    const postCode = this.getAddrComponent(place, COMPONENT_TEMPLATE);
    return postCode;
  }
  getState(place) {
    const COMPONENT_TEMPLATE = { administrative_area_level_1: 'short_name' };
    const state = this.getAddrComponent(place, COMPONENT_TEMPLATE);
    return state;
  }
  getCountry(place) {
    const COMPONENT_TEMPLATE = { country: 'long_name' };
    const country = this.getAddrComponent(place, COMPONENT_TEMPLATE);
    return country;
  }

  getAddrComponent(place, componentTemplate) {
    let result;
    for (let i = 0; i < place.address_components.length; i++) {
      const addressType = place.address_components[i].types[0];
      if (componentTemplate[addressType]) {
        result = place.address_components[i][componentTemplate[addressType]];
        return result;
      }
    }
    return;
  }

  onChange(filterItem: any, output: any) {
    if(filterItem.hasDependency) {
      filterItem.changeOutput(output);
      this.advanceFilterForm.controls[filterItem.dependentFieldName]?.setValue(null);
    }
  }
  valueChange(){
    this.filterDataPresent = false;
    Object.keys(this.advanceFilterForm?.value).forEach(ele => {
      if(this.advanceFilterForm?.value?.[ele]){
        this.filterDataPresent = true;
      }
    })
  }

  ngOnDestroy() {
    if (this.multiSelectSubscription) {
      this.multiSelectSubscription.unsubscribe();
    }
  }
}
