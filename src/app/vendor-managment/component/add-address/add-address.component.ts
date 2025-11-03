import { Component, EventEmitter, Input, NgZone, OnInit, Output, ViewChild } from '@angular/core';
import { UntypedFormBuilder, Validators } from '@angular/forms';
import { SearchAddressComponent } from 'src/app/shared/components/search-address/search-address.component';
import { CandidateService } from 'src/app/candidates//service/candidate.service';
@Component({
  selector: 'app-add-address',
  templateUrl: './add-address.component.html'
})
export class AddAddressComponent implements OnInit {
  isBillingExist=false
  @Input() visiblity = 'hidden';
  @Input() isEditAddress;
  @Input() isBillingLength;
  @Input() allCountryList;
  @Input() dataToEditAddressList;
  @Output() onClose = new EventEmitter();
  public addressForm = this.fb.group({
    country: [null, [Validators.required]],
    address: [''],
    city: [''],
    address_line1: [''],
    address_line2: [''],
    zipcode: [''],
    state: [''],
    is_billing: [false]
  });
  @ViewChild(SearchAddressComponent) googleAddressComponent: SearchAddressComponent;
  @ViewChild('address') address;
  @Output() onSubmit = new EventEmitter<any>();
  index = -1;

  public countryShortName: string;
  constructor(private fb: UntypedFormBuilder, private zone: NgZone, private candidateService: CandidateService) { }

  ngOnInit(): void {
    // this.addressForm = this.fb.group({
    //   country: [null, [Validators.required]],
    //   address: [''],
    //   city: [''],
    //   address_line1: [''],
    //   address_line2: [''],
    //   zipcode: [''],
    //   state: [''],
    //   is_billing: [false]
    // })
  }

  ngOnChanges(): void {
    if (this.isEditAddress) {
      this.addressForm.patchValue({
        country: this.dataToEditAddressList?.country,
        address: this.dataToEditAddressList?.address,
        city: this.dataToEditAddressList?.city,
        address_line1: this.dataToEditAddressList?.street_1,
        address_line2: this.dataToEditAddressList?.street_2,
        zipcode: this.dataToEditAddressList?.zipcode,
        state: this.dataToEditAddressList?.state,
        is_billing: this.dataToEditAddressList.billing
      })
      this.index = this.dataToEditAddressList?.editedIndex
      if (this.dataToEditAddressList?.street_2 || this.dataToEditAddressList?.street_1 || this.dataToEditAddressList?.city || this.dataToEditAddressList?.state) {
        let addressString = [];
        let addressString2 = [];
        if (this.dataToEditAddressList?.street_1 !== "" ) {
          addressString.push(this.dataToEditAddressList?.street_1)
        }
        if (this.dataToEditAddressList?.street_2 !== "") {
          addressString.push(this.dataToEditAddressList?.street_2)
        }
        if (this.dataToEditAddressList?.city !== "") {
          addressString.push(this.dataToEditAddressList?.city)
        }
        if (this.dataToEditAddressList?.state !== "") {
          addressString.push(this.dataToEditAddressList?.state)
        }
        if (this.dataToEditAddressList?.zipcode) {
          addressString2.push(this.dataToEditAddressList?.zipcode)
        }
        if (this.dataToEditAddressList?.country) {
          addressString2.push(this.dataToEditAddressList?.country)
        }
        if (this.dataToEditAddressList?.street_2 == "" && this.dataToEditAddressList?.city == "" && this.dataToEditAddressList?.state == "" && this.dataToEditAddressList?.zipcode == "") {
          this.addressForm?.get('address')?.setValue(this.dataToEditAddressList?.street_1);
        } else {
          this.addressForm?.get('address')?.setValue(addressString.join(", ") + ' ' +  addressString2.join(", "));
        }
      }
    }
    if (!this.isEditAddress) {
      this.addressForm?.controls.address.setValue(' ');
      //this.address._value = '';
      this.addressForm = this.fb.group({
        country: [null, [Validators.required]],
        address: [''],
        city: [''],
        address_line1: [''],
        address_line2: [''],
        zipcode: [''],
        state: [''],
        is_billing: [false]
      })


    }
  }

  setCountry() {
    let val = this.addressForm?.get('country')?.value
    if (val) {

      let pres = this.candidateService.getCountryShorNameAndCode(val, true);

      if (pres) {
        this.countryShortName = pres?.short_name;
        this.addressForm?.get('phoneFomat')?.setValue(pres?.phoneFormat);
        this.googleAddressComponent?.getPlaceAutocomplete(this.countryShortName);
      }

    }

  }

  checkBilling(event){
    let isCurrentAddress = this.dataToEditAddressList?.billing
    if(!this.isEditAddress && this.isBillingLength >=1){
      event.target.checked ? this.isBillingExist = true : this.isBillingExist = false
    } else {
      if(isCurrentAddress){
        this.isBillingExist = false
      } else {
        if(this.isBillingLength >= 1 && event.target.checked){
          this.isBillingExist = true;
        } else {
          this.isBillingExist = false
        }
      }
    }
  }

  getAddress(place: object) {
    //this.phone = this.getPhone(place);
    let formattedAddress = place['formatted_address'];
    this.zone.run(() => formattedAddress = place['formatted_address']);
    this.address = this.getStreetNumber(place);
    const street_2 = this.getStreet(place);
    const city = this.getCity(place);
    const zipcode = this.getPostCode(place);
    let phone = this.getPhone(place);
    const state = this.getState(place);
    if (phone) {
      this.addressForm?.controls.phone.setValue(phone);
    }
    if (street_2) {
      this.addressForm?.controls.address_line1.setValue(street_2);
    }
    if (city) {
      this.addressForm?.controls.city.setValue(city);
    }
    if (zipcode) {
      this.addressForm?.controls.zipcode.setValue(zipcode);
    }
    if (state) {
      this.addressForm?.controls.state.setValue(state);
    }
    if (this.address) {
      this.addressForm?.controls.address_line2.setValue(this.address);
    }
  }

  setaddres(value) {
    if (this.address) {
      this.address._value = '';
    }
  }

  sideBaClose() {
    this.isBillingExist = false
    this.addressForm.reset();
    this.onClose.emit();
  }

  getStreetNumber(place) {
    const COMPONENT_TEMPLATE = { street_number: 'short_name' };
    const streetNumber = this.getAddrComponent(place, COMPONENT_TEMPLATE);
    return streetNumber;
  }

  getStreet(place) {
    const COMPONENT_TEMPLATE = { route: 'long_name' };
    const street = this.getAddrComponent(place, COMPONENT_TEMPLATE);
    return street;
  }

  getCity(place) {
    const COMPONENT_TEMPLATE = { locality: 'long_name' };
    const city = this.getAddrComponent(place, COMPONENT_TEMPLATE);
    return city;
  }

  getState(place) {
    const COMPONENT_TEMPLATE = { administrative_area_level_1: 'short_name' };
    const state = this.getAddrComponent(place, COMPONENT_TEMPLATE);
    return state;
  }

  getDistrict(place) {
    const COMPONENT_TEMPLATE = { administrative_area_level_2: 'short_name' };
    const state = this.getAddrComponent(place, COMPONENT_TEMPLATE);
    return state;
  }

  getCountryShort(place) {
    const COMPONENT_TEMPLATE = { country: 'short_name' };
    const countryShort = this.getAddrComponent(place, COMPONENT_TEMPLATE);
    return countryShort;
  }

  getCountry(place) {
    const COMPONENT_TEMPLATE = { country: 'long_name' };
    const country = this.getAddrComponent(place, COMPONENT_TEMPLATE);
    return country;
  }

  getPostCode(place) {
    const COMPONENT_TEMPLATE = { postal_code: 'long_name' };
    const postCode = this.getAddrComponent(place, COMPONENT_TEMPLATE);
    return postCode;
  }

  getPhone(place) {
    const COMPONENT_TEMPLATE = { formatted_phone_number: 'formatted_phone_number' };
    const phone = this.getAddrComponent(place, COMPONENT_TEMPLATE);
    return phone;
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
  addressSubmit(index) {
    // this.address._value = '';
    let json = this.addressForm.value
    json["sampleindex"] = index
    this.index = -1
    this.isBillingExist = false
    this.onSubmit.emit(json);
    this.addressForm.reset();
    // this.setaddres(null);
  }

}
