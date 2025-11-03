
import {Component, OnInit, AfterViewInit, ViewChild, Input, Output, EventEmitter, forwardRef, ViewEncapsulation} from '@angular/core';
import {google} from 'google-maps'; //Don't remove import
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';


@Component({
  selector: 'search-address',
  template: `
    <input
      type="text"
      [value]="value" [id]="id" [(ngModel)]="value" (ngModelChange)="getInputValue()"
      #addresstext class="form-control" placeholder="{{'Enter Address'|i18next}}" [readonly]="readonlyMode">
  `,
  styleUrls: ['./search-address.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SearchAddressComponent),
      multi: true
    }
  ],
  encapsulation: ViewEncapsulation.None,
})

export class SearchAddressComponent implements OnInit, AfterViewInit, ControlValueAccessor {
  @Input() set adressType(data) {
    if(data) {
      this._adressType = data;
    }
 }

 @Input() set country(data) {
    this._country = data;
    this.getPlaceAutocomplete(this._country);
}

@Input() set respType(data) {
  if(data) {
    this._respType = data;
  }
}

  @Input() readonlyMode: false;
  @Output() selectedPreAddressUpdate: EventEmitter<any> = new EventEmitter();

  @Input() set selectedPreAddress(value: boolean) {
    this.selectedPreAddressUpdate.emit(false);
    this._value = '';
    this.onChange(value);
    this.onTouched();
  };

  @Output() customAddress: EventEmitter<any> = new EventEmitter();
  @Output() setAddress: EventEmitter<any> = new EventEmitter();
  @ViewChild('addresstext') addresstext: any;

  public currentZipCode: string = '';
  public autocompleteInput: string;
  public queryWait: boolean;
  public _adressType: any ;
  public _country: any ;
  public _respType = "place" ;

  @Input() set id(value: string) {
    this._ID = value;
  }

  get id() {
    return this._ID;
  }

  private _ID = '';
  @Input('value') _value = '';
  onChange: any = () => {
  };
  onTouched: any = () => {
  };

  get value() {
    return this._value;
  }

  set value(val) {
    this._value = val;
    this.onChange(val);
    this.onTouched();
  }

  getInputValue(){
    this.customAddress.emit(this.value);
  }

  registerOnChange(fn) {
    this.onChange = fn;
  }

  registerOnTouched(fn) {
    this.onTouched = fn;
  }

  writeValue(value, hardreset = false) {
    if (value || hardreset == true) {
      this.value = value.trim();
    }
  }

  constructor() {
  }

  ngOnInit() {

  }

  ngAfterViewInit(): void {
    this.getPlaceAutocomplete(this._country);
  }

  getPlaceAutocomplete(countryName?) {
    if (!countryName && !this._country) {
      countryName = 'all';
    }
   if(countryName && this.addresstext){
    if (!countryName && this._country) {
      countryName = this._country;
    }
    if (countryName === 'all') {
      countryName = [];
    }
    const autocomplete = new google.maps.places.Autocomplete(this.addresstext?.nativeElement,
      {
        componentRestrictions: {country: countryName},
        types: [this._adressType]  // 'establishment' / 'address' / 'geocode'
      });
    google.maps.event.addListener(autocomplete, 'place_changed', () => {
      const place = autocomplete.getPlace();
      let zipcodeComponent: any = place.address_components.find(cmp => cmp.types[0] === 'postal_code');
      if(zipcodeComponent) {
        this.currentZipCode = zipcodeComponent.long_name;
      } else {
        this.currentZipCode = '';
      }
      this.writeValue(this.addresstext?.nativeElement.value);
      this.invokeEvent(place);
    });
    this.removePreviousMapListner();
   }
   else{
    this.removePreviousMapListner();
   }
  }
  removePreviousMapListner(){
    var existingDom=document.querySelector(".pac-container");
    if(existingDom){
      document.querySelector(".pac-container").remove();
    }
  }

  invokeEvent(place: Object) {
    if(this._respType == "fullAddress"){
      let data={
        place:place,
        street: this.addresstext?.nativeElement.value
      }
      this.setAddress.emit(data);
    }else{
      this.setAddress.emit(place);
    }
  }


}
