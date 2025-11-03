import { Component, OnInit, NgZone, ViewChild, Input, ChangeDetectorRef, Output, EventEmitter } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { SearchAddressComponent } from 'src/app/shared/components/search-address/search-address.component';
import { CandidateService } from 'src/app/candidates//service/candidate.service';
import { PhoneUtilityService } from 'src/app/shared/service/utility/phone-utility.service';
@Component({
  selector: 'address-and-contact-details',
  templateUrl: './address-and-contact-details.component.html',
  styleUrls: ['./address-and-contact-details.component.scss']
})
export class AddressAndContactDetailsComponent implements OnInit {

  constructor(private fb: UntypedFormBuilder, private zone: NgZone,
    private candidateService: CandidateService,
    private _changeDetectorRef: ChangeDetectorRef,
    private phoneUtilService: PhoneUtilityService,
  ) { }
  title = 'Primary Address';
  subtitle = 'Primary Contact';
  secondaryAddress = 'Add Secondary Address';
  secondaryContact = 'Add Secondary Contact';
  secondaryaddressOpen = false;
  secondaryContactOpen = false;
  public addressForm: UntypedFormGroup;
  public countryShortName: string;
  secondaryCountryShortName: string;
  @Input() countryList;
  @Input() showAdditionalContactFields = false;
  @Input() editAddress;
  @Input() isViewClicked;
  @Input() isCreate;
  @Input() orgType;
  @Output() isSecondaryAddressRemoved = new EventEmitter();
  @Output() isSecondaryContectRemoved = new EventEmitter();
  public address = [];
  public establishmentAddress = [];
  public phone = [];
  public formattedAddress = [];
  public street_2 = [];
  public city = [];
  public street_1 = [];
  public state = [];
  public zipcode = [];
  public selecteItem = [];
  public mobNumberPattern = "^((\\+1-?)|0)?[0-9]{9,10}$";
  public nameValidation = "^[a-zA-Z ]+$";
  // public nameValidation  = "^[A-Za-z_]*[A-Za-z][A-Za-z _]*$/"
  // emailvalidation = "^[A-Za-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$";
  // emailvalidation = /^[A-Za-z0-9._%+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/
  // public emailvalidation = '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+[.][a-zA-Z]{3,4}$'
  public emailvalidation  = '^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$'

  public phoneFormat = [];
  public isPrimaryAddress = '';
  public isSecondaryAddress = '';
  @ViewChild(SearchAddressComponent) googleAddressComponent: SearchAddressComponent;
  @ViewChild('address1') address1;
  @ViewChild('address2') address2;
  //public formattedAddress: string;

  ngOnInit(): void {

    this.addressForm = this.fb.group({
      country: [null, null],
      secondarycountry: [null, ''],
      address: ['', ''],
      secondary_address: ['', ''],
      contact_person: ['', ''],
      first_name: ['', [Validators.required, Validators.pattern(this.nameValidation)]],
      last_name: ['', [Validators.required, Validators.pattern(this.nameValidation)]],
      secondary_contact_person: ['', ''],
      secondary_first_name: ['', Validators.pattern(this.nameValidation)],
      secondary_last_name: ['', Validators.pattern(this.nameValidation)],
      designation: ['', Validators.pattern(this.nameValidation)],
      secondary_designation: ['', ''],
      phone: [null, [Validators.required, Validators.pattern(this.mobNumberPattern)]],
      secondary_phone: [null, [Validators. required,Validators.pattern(this.mobNumberPattern)]],
      email: ['', [Validators.required, Validators.pattern(this.emailvalidation)]],
      secondary_email: ['', [Validators.required,Validators.pattern(this.emailvalidation)]],
      id: [''],
      secondary_id: [''],
      phoneFormat: ['', ''],
      phoneFormatCountry: ['US', ''],
      secondary_phoneFormat: ['', ''],
      secondary_phoneFormatCountry: ['US', ''],
      secondary_open: ['0', ''],
    });
    this.phoneFormat = [
      { url: '../../../assets/images/flag/English (Canada).png', value: 'Canada',label:"+1" },
      { url: '../../../assets/images/flag/English (United States).png', value: 'USA',label:"+1"  },
      { url: '../../../assets/images/flag/हिन्दी.png', value: 'India',label:"+91" }]
    this.addressForm.get('phoneFormat').setValue("+1");
    this.addressForm.get('phoneFormatCountry').setValue("US");

    this.addressForm.get('secondary_phoneFormat').setValue("+1");
    this.addressForm.get('secondary_phoneFormatCountry').setValue("US");

    // let btntitle = this.isViewClicked ? "View" : (!this.isCreate && !this.isViewClicked) ? "Edit" : "Add";
    this.title = 'Primary Address';
    this.subtitle = 'Primary Contact';
  }

  ngOnChanges() {
    this.secondaryAddress = 'Add Secondary Address';
    this.secondaryContact = 'Add Secondary Contact';
    if (this.isCreate && this.editAddress?.length >= 0)
    {
      this.addressForm?.reset();
      this.addressForm?.patchValue({
        address: " ",
        secondary_address: " ",
      });
    }

    if(this.addressForm) {
      if(this.orgType?.toLowerCase() == 'type_msp' || this.orgType?.toLowerCase() == 'type_client'){
        this.addressForm.get('first_name').clearValidators();
        this.addressForm.get('last_name').clearValidators();
        this.addressForm.get('secondary_email').clearValidators();
        this.addressForm.get('email').clearValidators();
        this.addressForm.get('secondary_phone').clearValidators();
        this.addressForm.get('phone').clearValidators();
      }
    }

    this.loadData();
    //this.secondaryaddressOpen = this.isViewClicked ? true : false;
    //this.secondaryContactOpen = this.isViewClicked ? true : false;
    // let btntitle = this.isViewClicked ? "View" : (!this.isCreate && !this.isViewClicked) ? "Edit" : "Add";
    this.isViewClicked = this.isViewClicked;
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
      if(secondaryAddress.toString().trim() != ""){
        this.setCountry('secondary');
        this.secondaryContactOpen = true;
        this.secondaryContact = 'Remove Secondary Contact';
        this.secondaryaddressOpen = true;
        this.secondaryAddress = 'Remove Secondary Address';
      }
      //totalAdress = totalAdress !== undefined ? totalAdress : '';
      this.addressForm.patchValue({
        country: this.editAddress[0]?.primary.country !== '' ? this.editAddress[0]?.primary.country : '',
        secondarycountry: this.editAddress[1]?.secondary.country !== '' ? this.editAddress[1]?.secondary.country : '',
        address: primaryAddress,
        secondary_address: secondaryAddress,
        first_name: this.editAddress[2]?.primarycontacts?.first_name !== '' ? this.editAddress[2]?.primarycontacts.first_name : '',
        last_name: this.editAddress[2]?.primarycontacts?.last_name !== '' ? this.editAddress[2]?.primarycontacts.last_name : '',
        secondary_first_name: this.editAddress[3]?.secondarycontacts?.first_name !== '' ? this.editAddress[3]?.secondarycontacts.first_name : '',
        secondary_last_name: this.editAddress[3]?.secondarycontacts?.secondary_last_name !== '' ? this.editAddress[3]?.secondarycontacts.last_name : '',
        designation: this.editAddress[2]?.primarycontacts.designation !== '' ? this.editAddress[2]?.primarycontacts.designation : '',
        secondary_designation: this.editAddress[3]?.secondarycontacts.designation !== '' ? this.editAddress[3]?.secondarycontacts.designation : '',
        phone: this.editAddress[2]?.primarycontacts.phone !== '' ? this.editAddress[2].primarycontacts.phone : '',
        secondary_phone: this.editAddress[3]?.secondarycontacts.phone !== '' ? this.editAddress[3].secondarycontacts.phone : '',
        email: this.editAddress[2]?.primarycontacts.email !== '' ? this.editAddress[2]?.primarycontacts.email : '',
        secondary_email: this.editAddress[3]?.secondarycontacts.email !== '' ? this.editAddress[3]?.secondarycontacts.email : '',
        id: this.editAddress[2]?.primarycontacts.id !== '' ? this.editAddress[2]?.primarycontacts.id : '',
        secondary_id: this.editAddress[3]?.secondarycontacts.id !== '' ? this.editAddress[3]?.secondarycontacts.id : '',
        phoneFormatCountry: this.editAddress[2]?.primarycontacts.phoneFomat !== '' ? this.editAddress[2]?.primarycontacts.phoneFomat : '',
        secondary_phoneFormatCountry: this.editAddress[3]?.secondarycontacts.email !== '' ? this.editAddress[3]?.secondarycontacts.secondary_phoneFomat : '',
      });
      let shortName = this.countryList.filter(x => x.name == this.editAddress[0]?.primary.country)[0]?.iso_code_2
      this.googleAddressComponent?.getPlaceAutocomplete(shortName)
      this.address[0] = this.checkAddress(this.editAddress[0].primary)?.address_line1 || '';
      this.address[1] = this.checkAddress(this.editAddress[1].secondary)?.address_line1 || '';
      this.street_2[0] = this.checkAddress(this.editAddress[0].primary)?.address_line2;
      this.street_2[1] = this.checkAddress(this.editAddress[1].secondary)?.address_line2;
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
        country: [null, null],
        secondarycountry: [null, ''],
        address: ['', ''],
        secondary_address: ['', ''],
        contact_person: ['', ''],
        first_name: ['', [Validators.required, Validators.pattern(this.nameValidation)]],
        last_name: ['', [Validators.required, Validators.pattern(this.nameValidation)]],
        secondary_contact_person: ['', ''],
        secondary_first_name: ['', Validators.pattern(this.nameValidation)],
        secondary_last_name: ['', Validators.pattern(this.nameValidation)],
        designation: ['', Validators.pattern(this.nameValidation)],
        secondary_designation: ['', ''],
        phone: ['', [Validators.pattern(this.mobNumberPattern)]],
        secondary_phone: ['', [Validators.pattern(this.mobNumberPattern)]],
        email: ['', [Validators.required, Validators.pattern(this.emailvalidation)]],
        secondary_email: ['', [Validators.pattern(this.emailvalidation)]],
        id: [''],
        secondary_id: [''],
        phoneFormat: ['', ''],
        phoneFormatCountry: ['US', ''],
        secondary_phoneFormat: ['', ''],
        secondary_phoneFormatCountry: ['US', ''],
        secondary_open: ['0', ''],
      });
    }
    if (this.addressForm.get('secondarycountry').value) {
      this.secondaryaddressOpen = true;
    }
    else {
      this.secondaryaddressOpen = false;
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
  emailValidator(control) {
    if (control.value) {
      const matches = control.value.match(/[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/);
      return matches ? null : { 'invalidEmail': true };
    } else {
      return null;
    }
  }

  loadAddress(data) {
    let addressString = [];
    let addressString2 = [];
    (data?.address_line1?.trim() != '' && data?.address_line1 != undefined && data?.address_line1 != null) ? addressString.push(data?.address_line1) : "";
    (data?.address_line2?.trim() != '' && data?.address_line2 != undefined && data?.address_line2 != null) ? addressString.push(data?.address_line2) : "";
    (data?.city?.trim() !== '' && data?.city != undefined && data?.city != null) ? addressString.push(data?.city) : "";
    (data?.state?.trim() !== '' && data?.state != undefined && data?.state != null) ? addressString.push(data?.state) : "";
    (data?.zipcode?.trim() !== '' && data?.zipcode != undefined && data?.zipcode != null) ? addressString2.push(data?.zipcode) : "";
    (data?.country?.trim() !== '' && data?.country != undefined && data?.country != null) ? addressString2.push(data?.country) : "";

    return addressString.join(', ') + ' ' + addressString2.join(', ');
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
          this.addressForm.get('phoneFormatCountry').setValue(short);
          this.addressForm.get('secondary_phoneFormatCountry').setValue(short);
          this.googleAddressComponent?.getPlaceAutocomplete(short);
          this._changeDetectorRef.detectChanges();
        }
      } else {
        if(this.address2){
          this.address2._value = '';
        }
        let res=this.candidateService.getCountryShorNameAndCode(val,false);
        if(res){
          this.secondaryCountryShortName = short;
          this.addressForm.get('secondary_phoneFormatCountry').setValue(short);
          this.googleAddressComponent?.getPlaceAutocomplete(this.secondaryCountryShortName);
          this._changeDetectorRef.detectChanges();
        }
      }
      this.phoneLengthValidation();
    }
  }

  setaddres(value) {
    if (value == 'primary') {
      if (this.address1) {
        this.address1._value = '';
        this.resetAddress(0);
      }
    }
    else {
      if (this.address2) {
        this.address2._value = '';
        this.resetAddress(1);
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
    this.state[0] = this.getState(place);
    if (phone) {
      this.addressForm.controls.phone.setValue(phone);
    }
    this._changeDetectorRef.detectChanges();
  }

  resetAddress(index) {
    this.address[index] = '';
    this.street_2[index] = '';
    this.zipcode[index] = '';
    this.phone[index] = '';
    this.state[index] = '';
    this.city[index] = '';
  }

  getCustomAddress(place: any){
    let addressValue = place;
    this.address[0] = addressValue;
  }

  getCustomSecondaryAddress(place: any) {
    let addressValue = place;
    this.address[1] = addressValue;
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
    this.state[1] = this.getState(place);
    if (phone) {
      this.addressForm.controls.secondary_phone.setValue(phone);
    }
    this._changeDetectorRef.detectChanges();
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

  showPrimarySecondaryAddress() {
    let type = 'secondary';
    this.secondaryaddressOpen = !this.secondaryaddressOpen;
    this.setCountry(type);
    if (this.secondaryAddress === 'Add Secondary Address') {
      this.setCountry(type);
      this.secondaryAddress = 'Remove Secondary Address';
      this.isSecondaryAddressRemoved.emit({remove : false})
    } else if (this.secondaryAddress === 'Remove Secondary Address') {
      this.secondaryAddress = 'Add Secondary Address';
      this.addressForm.controls.secondary_address.patchValue('');
      this.addressForm.controls.secondarycountry.patchValue(null);
      this.isSecondaryAddressRemoved.emit({remove : true});
    }
  }

  showPrimarySecondaryContact() {
    this.secondaryContactOpen = !this.secondaryContactOpen;
    if (this.secondaryContact === 'Add Secondary Contact') {
      this.addressForm.controls.secondary_open.patchValue('1');
      this.secondaryContact = 'Remove Secondary Contact';
      this.addressForm.controls['secondary_first_name'].setValidators([Validators.required, Validators.pattern(this.nameValidation)]);
      this.addressForm.controls['secondary_last_name'].setValidators([Validators.required, Validators.pattern(this.nameValidation)]);
      this.addressForm.controls['secondary_email'].setValidators([Validators.required, Validators.pattern(this.emailvalidation)]);
      this.addressForm.controls['secondary_first_name'].updateValueAndValidity();
      this.addressForm.controls['secondary_last_name'].updateValueAndValidity();
      this.addressForm.controls['secondary_email'].updateValueAndValidity();
      this.isSecondaryContectRemoved.emit({remove : false});
      this.phoneLengthValidation();
    } else if (this.secondaryContact === 'Remove Secondary Contact') {
      this.addressForm.controls.secondary_open.patchValue('0');
      this.secondaryContact = 'Add Secondary Contact';
      this.addressForm.controls['secondary_first_name'].setValidators(null);
      this.addressForm.controls['secondary_last_name'].setValidators(null);
      this.addressForm.controls['secondary_email'].setValidators(null);
      this.addressForm.controls['secondary_first_name'].updateValueAndValidity();
      this.addressForm.controls['secondary_last_name'].updateValueAndValidity();
      this.addressForm.controls['secondary_email'].updateValueAndValidity();
      this.addressForm.controls.secondary_contact_person.patchValue('');
      this.addressForm.controls.secondary_designation.patchValue('');
      this.addressForm.controls.secondary_email.patchValue('');
      this.addressForm.controls.secondary_id.patchValue('');
      this.addressForm.controls.secondary_phone.patchValue('');
      this.addressForm.controls.secondary_first_name.patchValue('');
      this.addressForm.controls.secondary_last_name.patchValue('');
      this.isSecondaryContectRemoved.emit({remove : true});
    }
  }

  phoneLengthValidation() {
    let mobNumberPattern = this.phoneUtilService.phoneLengthValidation(this.addressForm?.value?.phoneFormatCountry, this.countryList);
    this.addressForm?.get('phone')?.clearValidators();
    this.addressForm?.get('phone')?.setValidators([Validators.required, Validators.pattern(mobNumberPattern)]);
    this.addressForm?.get('phone')?.updateValueAndValidity();
    if (this.secondaryContactOpen) {
      mobNumberPattern = this.phoneUtilService.phoneLengthValidation(this.addressForm?.value?.secondary_phoneFormatCountry, this.countryList);
      this.addressForm?.get('secondary_phone')?.clearValidators();
      this.addressForm?.get('secondary_phone')?.setValidators([Validators.required, Validators.pattern(mobNumberPattern)]);
      this.addressForm?.get('secondary_phone')?.updateValueAndValidity();
    }
  }
}
