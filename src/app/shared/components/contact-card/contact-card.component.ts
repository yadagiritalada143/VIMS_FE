import { Component, OnInit, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';

@Component({
  selector: 'app-contact-card',
  templateUrl: './contact-card.component.html',
  styleUrls: ['./contact-card.component.scss']
})
export class ContactCardComponent implements OnInit, OnChanges {
  countryShortName: any;
  addressForm: UntypedFormGroup = this.fb.group({
    address: '',
  });
  @Input() subtitle: string;
  @Input() description: string;
  @Input() CountrySelectBox: boolean=false;
  @Input() countryList: any = [];
  @Input() textArea: boolean=false;
  @Input() contactPersonInput: boolean=false;
  @Input() DesignationInput: boolean=false;
  @Input() PhoneNumberInput: boolean=false;
  @Input() EmailInput: boolean=false;
  @Input() selectedCountry: any;
  @Input() address: any;
  @Input() readonly: boolean = false;
  @Input() contactDetails: any = {
    name: null,
    title: null,
    email: null,
    phone: null,
    isd_code: null,
    iso_code2: null
  };
  @Output() emitSelectedCountry = new EventEmitter();
  @Output() emitAddress = new EventEmitter();
  @Output() emitContactDetails = new EventEmitter();

  public mobNumberPattern = "^((\\+91-?)|0)?[0-9]{10}$";

  constructor(
    private fb: UntypedFormBuilder
  ) { }

  ngOnInit(): void {
    this.addressForm.get('address').setValue(this.address);
  }

  ngOnChanges() {
    for(let i=0;i<this.countryList?.length;i++){
      if(this.countryList[i]?.id == this.selectedCountry){
        this.contactDetails.iso_code2 = this.countryList[i]?.iso_code_2;
      }
    }
    this.addressForm.get('address').setValue(this.address);
  }

  selectCountry(country: any) {
    for(let i=0;i<this.countryList?.length;i++){
      if(this.countryList[i]?.id == country){
        this.countryShortName = this.countryList[i]?.iso_code_2;
      }
    }
    this.emitSelectedCountry.emit(country);
  }

  changeAddress(address: any) {
    this.address = address['formatted_address'];
    this.emitAddress.emit(this.address);
  }

  changeValue(name: any) {
    if(this.isCompleteContactDetails()) {
      this.emitContactDetails.emit(this.contactDetails);
    }
  }

  isCompleteContactDetails() {
    if(this.contactDetails.name && this.contactDetails.email && this.contactDetails.iso_code2 && this.contactDetails.title && this.contactDetails.phone) {
      return true;
    }
  }



}
