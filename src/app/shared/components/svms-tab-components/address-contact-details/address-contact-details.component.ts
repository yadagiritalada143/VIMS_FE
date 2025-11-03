import { Component, OnInit, NgZone, ViewChild, Input } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { SearchAddressComponent } from '../../search-address/search-address.component';
import { CandidateService } from 'src/app/candidates//service/candidate.service';
import { PhoneUtilityService } from 'src/app/shared/service/utility/phone-utility.service';
@Component({
  selector: 'app-address-contact-details',
  templateUrl: './address-contact-details.component.html',
  styleUrls: ['./address-contact-details.component.scss']
})
export class AddressContactDetailsComponent implements OnInit {

  constructor(private fb: UntypedFormBuilder,
     private zone: NgZone,
     private candidateService: CandidateService,
     private phoneUtilService: PhoneUtilityService
     ) { }
  title = 'Primary Address';
  subtitle = 'Primary Contact';
  secondaryAddress = 'Add Secondary Address';
  secondaryContact = 'Add Secondary Contact';
  secondaryaddressOpen = false ;
  secondaryContactOpen = false;
  public addressForm: UntypedFormGroup;
  public countryShortName: string;
  secondaryCountryShortName: string;

  @Input() editAddress;
  @Input() isViewClicked;
  @Input() isCreate;
  @Input() showSecondaryAddress = true;
  @Input() showSecondaryContact = true;
  @Input() hideContact = false;
  @Input() countryList;
  @Input() showAdditionalContactFields = false;
  public address = [];
  public establishmentAddress = [];
  public phone = [];
  public formattedAddress = [];
  public street_2 = [];
  public city = [];
  public state = [];
  public zipcode = [];
  public selecteItem = [];
  public getAllCountry = [];
  public mobNumberPattern = "^((\\+91-?)|0)?[0-9]{10}$";
  public nameValidation = "^[a-zA-Z ]+$";
  @ViewChild(SearchAddressComponent) googleAddressComponent: SearchAddressComponent;
  @ViewChild('address1') address1;
  @ViewChild('address2') address2;

  ngOnInit(): void {
    this.addressForm = this.fb.group({
      country: [null, ''],
      secondarycountry: [null, ''],
      address: ['', ''],
      secondary_address: ['', ''],
      contact_person: ['', ''],
      secondary_contact_person: ['', ''],
      designation: ['', [Validators.pattern(this.nameValidation)]],
      secondary_designation: ['', [Validators.pattern(this.nameValidation)]],
      phone: ['', ''],
      secondary_phone: ['', ''],
      email: ['', ''],
      secondary_email: ['', ''],
      phoneFomat: ['US', ''],
      secondary_phoneFomat: ['US', ''],
      city1: ['', ''],
      city2: ['', ''],
      state1: ['', ''],
      state2: ['', ''],
      zipcode1: ['', ''],
      zipcode2: ['', ''],
    });
    this.title = 'Primary Address';
    this.subtitle = 'Primary Contact';

}
  ngOnChanges() {
    this.secondaryAddress = 'Add Secondary Address';
    this.secondaryContact = 'Add Secondary Contact';
    this.loadData();
    this.isViewClicked = this.isViewClicked;
    if (this.isCreate && this.editAddress?.length > 0) this.addressForm.reset();

  }

  loadData() {
    if (this.editAddress?.length > 0 && !this.isCreate) {
      let primaryAddress = this.loadAddress(this.editAddress[0]?.primary);
      let secondaryAddress = this.loadAddress(this.editAddress[1]?.secondary);
      if (primaryAddress) {
        this.setCountry('primary')
        this.secondaryContactOpen = false;
        this.secondaryaddressOpen = false;
      }
      if(secondaryAddress != ""){
        this.setCountry('secondary');
        this.secondaryContactOpen = true;
        this.secondaryContact = 'Remove Secondary Contact';
        this.secondaryaddressOpen = true;
        this.secondaryAddress = 'Remove Secondary Address';
      }
      //totalAdress = totalAdress !== undefined ? totalAdress : '';
      this.addressForm.patchValue({
        country: this.editAddress[0]?.primary.country !== '' ? this.editAddress[0]?.primary.country : '',
        secondarycountry: this.editAddress[1]?.secondary.country !== null ? this.editAddress[1]?.secondary.country : '',
        address: primaryAddress,
        secondary_address: secondaryAddress,
        contact_person: this.editAddress[2]?.primarycontacts?.first_name !== '' ? this.editAddress[2]?.primarycontacts?.first_name : '',
        secondary_contact_person: this.editAddress[3]?.secondarycontacts?.first_name !== '' ? this.editAddress[3]?.secondarycontacts?.first_name : '',
        designation: this.editAddress[2]?.primarycontacts?.designation !== '' ? this.editAddress[2]?.primarycontacts?.designation : '',
        secondary_designation: this.editAddress[3]?.secondarycontacts?.designation !== '' ? this.editAddress[3]?.secondarycontacts?.designation : '',
        phone: this.editAddress[2]?.primarycontacts?.phone !== '' ? this.editAddress[2]?.primarycontacts?.phone : '',
        secondary_phone: this.editAddress[3]?.secondarycontacts?.phone !== '' ? this.editAddress[3]?.secondarycontacts?.phone : '',
        phoneFomat : this.editAddress[2]?.primarycontacts?.phoneFomat !== '' ? this.editAddress[2]?.primarycontacts?.phoneFomat : '',
        secondary_phoneFomat : this.editAddress[3]?.secondarycontacts?.secondary_phoneFomat !== '' ? this.editAddress[3]?.secondarycontacts?.secondary_phoneFomat : '',
        email: this.editAddress[2]?.primarycontacts?.email !== '' ? this.editAddress[2]?.primarycontacts?.email : '',
        secondary_email: this.editAddress[3]?.secondarycontacts?.email !== '' ? this.editAddress[3]?.secondarycontacts?.email : '',
      });
      this.address[0] = this.checkAddress(this.editAddress[0]?.primary)?.address_line1 || '';
      this.address[1] = this.checkAddress(this.editAddress[1]?.secondary)?.address_line1 || '';
      this.street_2[0] = this.checkAddress(this.editAddress[0]?.primary)?.address_line2;
      this.street_2[1] = this.checkAddress(this.editAddress[1]?.secondary)?.address_line2;
      this.zipcode[0] = this.checkAddress(this.editAddress[0]?.primary)?.zipcode || null;
      this.zipcode[1] = this.checkAddress(this.editAddress[1]?.secondary)?.zipcode || null;
      this.phone[0] = this.editAddress[0]?.primary?.phone || null;
      this.phone[1] = this.editAddress[1]?.secondary?.phone || null;
      this.city[0] = this.checkAddress(this.editAddress[0]?.primary)?.city || null;
      this.city[1] = this.checkAddress(this.editAddress[1]?.secondary)?.city || null;
      this.state[0] = this.checkAddress(this.editAddress[0]?.primary)?.state || null;
      this.state[1] = this.checkAddress(this.editAddress[1]?.secondary)?.state || null;
    } else {
      this.addressForm = this.fb.group({
        country: [null,''],
        secondarycountry: [null, ''],
        address: [null,''],
        secondary_address: ['', ''],
        contact_person: ['', ''],
        secondary_contact_person: ['', ''],
        designation: ['', [Validators.pattern(this.nameValidation)]],
        secondary_designation: ['', [Validators.pattern(this.nameValidation)]],
        phone: ['', ''],
        secondary_phone: ['', ''],
        email: ['', ''],
        secondary_email: ['', ''],
        phoneFomat: ['US', ''],
        secondary_phoneFomat: ['US', ''],
        city1: ['', ''],
        city2: ['', ''],
        state1: ['', ''],
        state2: ['', ''],
        zipcode1: ['', ''],
        zipcode2: ['', ''],
      });
    }
    if (this.addressForm.get('secondarycountry').value) {
      this.secondaryaddressOpen = true;
      this.secondaryAddress = 'Remove Secondary Address';
    }
    else {
      this.secondaryaddressOpen = false;
      this.secondaryAddress = 'Add Secondary Address';
    }
    if (this.addressForm.get('secondary_contact_person').value || this.addressForm.get('secondary_phone').value || this.addressForm.get('secondary_email').value || this.addressForm.get('secondary_designation').value) {
      this.secondaryContactOpen = true;
      this.secondaryContact = 'Remove Secondary Contact';
    }
    else {
      this.secondaryContactOpen = false;
      this.secondaryContact = 'Add Secondary Contact';
    }
  }

  loadAddress(data) {
    let street1 = (data?.address_line1?.trim() != '' && data?.address_line1 != undefined && data?.address_line1 != null) ? (data?.address_line1 + ' ,') : "";
    const find_add_line_1 = String(street1).split(',');
    let street2 = (data?.address_line2?.trim() != '' && data?.address_line2 != undefined && data?.address_line2 != null) ? (data?.address_line2 + ' ,') : "";
    const city = (data?.city?.trim() !== '' && data?.city != undefined && data?.city != null) ? (data?.city + ' ,') : "";
    let country = (data?.country?.trim() !== '' && data?.country != undefined && data?.country != null) ? (data?.country + ' ,') : "";
    const zip = (data?.zipcode?.trim() !== '' && data?.zipcode != undefined && data?.zipcode != null) ? data?.zipcode : "";
    const state = (data?.state?.trim() !== '' && data?.state != undefined && data?.state != null) ? (data?.state + ' ,') : "";
    if (country && zip == '') {
      country = country.slice(0, -1);
    }
    if(find_add_line_1[0].trim() == city || find_add_line_1[0].trim() == state || find_add_line_1[0].trim() == country){
      street1 = '';
    } else{
      street1 = find_add_line_1[0];
    }
    if(street1 == city || street1 == country || street1 == state){
      street1 = '';
    }
    return street1 + street2 + city + state + zip;

  }
  checkAddress(address) {
    return address ? address : '';
  }

  setCountry(type) {
    let val = (type === 'primary') ? this.addressForm.get('country').value : this.addressForm.get('secondarycountry').value;
    let short:any;
    for(let i=0;i<this.countryList.length; i++){
      if(val === this.countryList[i].name){
        short = this.countryList[i].iso_code_2;
      }
    }


    if (val) {
      if (type === 'primary') {
          if(this.address1){
            this.address1._value = '';
          }


        let pres=this.candidateService.getCountryShorNameAndCode(val,false);

        if(pres){
          this.countryShortName = short;
          this.addressForm.get('phoneFomat').setValue(short);
          this.addressForm.get('secondary_phoneFomat').setValue(short);
          this.googleAddressComponent?.getPlaceAutocomplete(short);
          this.phoneLengthValidation();
        }
      } else {
        if(this.address2){
          this.address2._value = '';
        }
        let res=this.candidateService.getCountryShorNameAndCode(val,false);

        if(res){
          this.secondaryCountryShortName = res?.short_name;
          this.addressForm.get('secondary_phoneFomat').setValue(res?.short_name);
          this.googleAddressComponent?.getPlaceAutocomplete(this.secondaryCountryShortName);
        }


      }
    }

  }

  getAddress(place: object) {
    //this.phone = this.getPhone(place);
    this.formattedAddress[0] = place['formatted_address'];
    this.zone.run(() => this.formattedAddress[0] = place['formatted_address']);
    this.address[0] = this.getStreetNumber(place);
    this.street_2[0] = this.getStreet(place);
    this.city[0] = this.getCity(place);
    this.zipcode[0] = this.getPostCode(place);
    let phone = this.getPhone(place);
    this.city[0] = this.getCity(place);
    this.state[0] = this.getState(place);
    if (phone){
      this.addressForm.controls.phone.setValue(phone);
    }
    if (this.city[0]) {
      this.addressForm.controls.city1.setValue(this.city[0]);
    }
    if (this.state[0]) {
      this.addressForm.controls.state1.setValue(this.state[0]);
    }
    if (this.zipcode[0]) {
      this.addressForm.controls.zipcode1.setValue(this.zipcode[0]);
    }


  }

  getSecondaryAddress(place: object) {
    this.address[1] = place['formatted_address'];
    //this.phone = this.getPhone(place);
    this.formattedAddress[1] = place['formatted_address'];
    this.zone.run(() => this.formattedAddress[1] = place['formatted_address']);
    this.address[1] = this.getStreetNumber(place);
    this.street_2[1] = this.getStreet(place);
    this.city[1] = this.getCity(place);
    this.zipcode[1] = this.getPostCode(place);
    let phone = this.getPhone(place);
    this.city[1] = this.getCity(place);
    this.state[1] = this.getState(place);
    if (phone) {
      this.addressForm.controls.secondary_phone.setValue(phone);
    }
    if (this.city[1]) {
      this.addressForm.controls.city2.setValue(this.city[1]);
    }
    if (this.state[1]) {
      this.addressForm.controls.state2.setValue(this.state[1]);
    }

    if (this.zipcode[1]) {
      this.addressForm.controls.zipcode2.setValue(this.zipcode[1]);
  }
  }

  // getEstablishmentAddress(place: object) {
  //   this.establishmentAddress = place['formatted_address'];
  //   this.phone = this.getPhone(place);
  //   this.formattedEstablishmentAddress = place['formatted_address'];
  //   this.zone.run(() => {
  //     this.formattedEstablishmentAddress = place['formatted_address'];
  //     this.phone = place['formatted_phone_number'];
  //   });
  // }

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

  public showPrimarySecondaryAddress() {
    let type = 'secondary';
    this.secondaryaddressOpen = !this.secondaryaddressOpen;
    if (this.secondaryAddress === 'Add Secondary Address') {
      this.setCountry(type);
      this.secondaryAddress = 'Remove Secondary Address';
    } else if ( this.secondaryAddress === 'Remove Secondary Address') {
       this.secondaryAddress = 'Add Secondary Address';
       this.addressForm.controls.secondary_address.patchValue('');
       this.addressForm.controls.secondarycountry.patchValue(null);
    }
  }



  showPrimarySecondaryContact() {
    this.secondaryContactOpen = !this.secondaryContactOpen;
    if (this.secondaryContact === 'Add Secondary Contact') {
      this.secondaryContact = 'Remove Secondary Contact';
    } else if ( this.secondaryContact === 'Remove Secondary Contact') {
       this.secondaryContact = 'Add Secondary Contact';
       this.addressForm.controls.secondary_contact_person.patchValue('');
       this.addressForm.controls.secondary_designation.patchValue('');
       this.addressForm.controls.secondary_email.patchValue('');
       this.addressForm.controls.secondary_phone.patchValue('');
    }
  }

  clearEmail(value) {
    if(value === 'primary') {
      this.addressForm.controls.email.patchValue('');
     } else {
      this.addressForm.controls.secondary_email.patchValue('');
     }
  }

  phoneLengthValidation() {
    const mobNumberPattern = this.phoneUtilService.phoneLengthValidation(this.addressForm?.value?.phoneFomat, this.countryList);
    this.addressForm?.get('phone')?.clearValidators();
    this.addressForm?.get('phone')?.setValidators([Validators.pattern(mobNumberPattern)]);
    this.addressForm?.get('phone')?.updateValueAndValidity();
  }

  keyPressNumbers(event) {
    const charCode = (event.which) ? event.which : event.keyCode;
    if ((charCode < 48 || charCode > 57)) {
      event.preventDefault();
      return false;
    } else {
      return true;
    }
  }
}
