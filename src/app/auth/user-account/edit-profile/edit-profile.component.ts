import { ChangeDetectorRef, Component, EventEmitter, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { SearchAddressComponent } from 'src/app/shared/components/search-address/search-address.component';
import { AddressContactDetailsComponent } from 'src/app/shared/components/svms-tab-components/address-contact-details/address-contact-details.component';
import { ProgramService } from 'src/app/programs/program.service';
import { Subscription } from 'rxjs';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { GlobalConstants } from 'src/app/shared/globalconstants';
import { PhoneUtilityService } from 'src/app/shared/service/utility/phone-utility.service';
@Component({
  selector: 'app-edit-profile',
  templateUrl: './edit-profile.component.html',
  styleUrls: ['./edit-profile.component.scss']
})
export class EditProfileComponent implements OnInit, OnDestroy {
  clickOutside = false;
  editProfile = "hidden";
  countryShortName = 'IN'
  mobNumberPattern = "^((\\+1-?)|0)?[0-9]{9,10}$";
  socialProfileArr = [{
    type: null,
    link: null
  }];
  profileForm: UntypedFormGroup;
  clientBasicAddEditInfo: any[] = [];
  userObject: any;
  isEdit: boolean = true;
  timezoneData: any = [];
  languageData: any = [];
  allCountryList: any = [];
  hierarchyTimezoneData : any = [];
  @Output() submited = new EventEmitter<any>();
  @ViewChild(AddressContactDetailsComponent) AddressContactDetailsComponent: AddressContactDetailsComponent;
  @ViewChild(SearchAddressComponent) googleAddressComponent: SearchAddressComponent;
  @ViewChild('candidateAddress') candidateAddress;
  private subscrptions: Subscription[] = [];
  dateFormats = GlobalConstants.defaultDateFormat;
  isSubmitted: boolean = false;
  constructor(
    private eventStream: EventStreamService,
    private fb: UntypedFormBuilder,
    private changeDetectorRef: ChangeDetectorRef,
    private alertService: AlertService,
    private storageService: StorageService,
    public _programService: ProgramService,
    private loaderService: LoaderService,
    private phoneUtilService: PhoneUtilityService
  ) { }

  ngOnInit(): void {
    this.profileForm = this.fb.group({
      first_name: ['', Validators.required],
      middle_name: [],
      last_name: ['', Validators.required],
      name_prefix: [],
      name_suffix: [],
      title: [],
      email: [{ value: '', disabled: true }],
      contacts: [],
      country: [null, [Validators.required]],
      phoneFormat: ['US'],
      phone_number: [null, [Validators.pattern('^((\\+91-?)|0)?[0-9]{10}$')]],
      address: [],
      dateFormat: [null],
      preferred_time_zone: [null],
      preferred_language: ['en-US']
    });
    this.getTimeZone();
    this.getAllCountry();
    this.getLanguage();
    this.subscrptions.push(this.eventStream.on(Events.EDIT_PROFILE).subscribe((data) => {
      this.isSubmitted = true;
      if (data.value) {
        this.editProfile = 'visible';
        let phone_country_pri = -1;

        this.profileForm.patchValue({ ...data });
        this.profileForm.get('country').setValue(data.country?.id || null);
        this.profileForm.get('preferred_time_zone').setValue(data.preferred_time_zone?.id || null);

        if (data && data?.addresses && data?.addresses?.length > 0) {
          this.profileForm.patchValue({
            address: data?.addresses[0]?.address_line_1 || data?.addresses[0]?.address_line1 || '',
          });
        }

        if(data?.contacts && data.contacts.length > 0){
          for(let i=0;i<this.allCountryList.length;i++){
            if(this.allCountryList[i].iso_code_2 === data.contacts[0]?.iso2_code){
              phone_country_pri = i;
            }
          }
        }

        if(phone_country_pri === -1){
          if(data?.contacts && data.contacts.length > 0){
            for(let i=0;i<this.allCountryList.length;i++){
              if(this.allCountryList[i].isd_code === data.contacts[0]?.isd_code){
                  phone_country_pri = i;
              }
            }
          }
        }
        if (data && data?.contacts && data?.contacts?.length > 0) {
          this.profileForm.patchValue({
            email: data?.email,
            phoneFormat: this.allCountryList[phone_country_pri]?.iso_code_2,
            phone_number: data?.contacts[0]?.number,
          });
        }
        else{
          this.profileForm.patchValue({
            phoneFormat: this.allCountryList[0].iso_code_2,
          });
        }
        this.phoneLengthValidation();
        this.userObject = data;
        const editAddressInfo = data?.addresses?.length > 0 ? data?.addresses : '';
        const primaryAdress = editAddressInfo[0] !== undefined ? editAddressInfo[0] : '';
        const secondaryAdress = editAddressInfo[1] !== undefined ? editAddressInfo[1] : '';
        const editContactInfo = data?.contacts?.length > 0 ? data?.contacts : '';
        const primaryContact = editContactInfo[0] !== undefined ? editContactInfo[0] : '';
        const secondaryContact = editContactInfo[1] !== undefined ? editContactInfo[1] : '';
        this.clientBasicAddEditInfo.push({
          primary: {
            label: 'edit',
            address_line1: primaryAdress?.address_line_1 || primaryAdress?.address_line1 || '',
            address_line2: primaryAdress?.address_line_2 || primaryAdress?.address_line2 || '',
            address_type: primaryAdress?.address_type,
            city: primaryAdress?.city,
            country: primaryAdress?.country,
            state: primaryAdress?.state,
            zipcode: primaryAdress?.zipcode
          }
        },
          {
            secondary: {
              label: 'edit',
              address_line1: secondaryAdress?.address_line_1 || secondaryAdress?.address_line1 || '',
              address_line2: secondaryAdress?.address_line_2 || secondaryAdress?.address_line2 || '',
              address_type: secondaryAdress?.address_type,
              city: secondaryAdress?.city,
              country: secondaryAdress?.country,
              state: secondaryAdress?.state,
              zipcode: secondaryAdress?.zipcode
            }
          },
          {
            primarycontacts: {
              email: primaryContact?.contact_email,
              first_name: primaryContact?.first_name,
              last_name: primaryContact?.last_name,
              phone: primaryContact?.contact_phone,
              designation: primaryContact?.title
            }
          },
          {
            secondarycontacts: {
              email: secondaryContact?.contact_email,
              first_name: secondaryContact?.first_name,
              last_name: secondaryContact?.last_name,
              phone: secondaryContact?.contact_phone,
              designation: secondaryContact?.title
            }
          });

      } else {
        this.editProfile = 'hidden';
      }
      this.clickOutside = false;

    }));
  }
  getTimeZone() {
    this.subscrptions.push(this._programService.get(`/configurator/resources/time_zones`).subscribe(
      (data: any) => {
        if (data && data.time_zones && data.time_zones.length > 0) {
          this.timezoneData = data.time_zones;
        }
      }));
  }

  getLanguage() {
    this.subscrptions.push(this._programService.get(`/configurator/resources/languages`).subscribe(
      (data: any) => {
        if (data && data.languages && data.languages.length > 0) {
          this.languageData = data.languages;
        } else {
          this.languageData = [{ id: 1, name: 'EN-US' }]
        }
      }));
  }

  getAllCountry(term: string = null) {

    let url = `/configurator/resources/countries?limit=300`;
    if(term) {
      url += `?search_text=${term.toLowerCase()}`;
    }

    this.loaderService.show();
    this._programService.get(url)
    .toPromise()
    .then((res: any) => {
      this.phoneLengthValidation();
      this.loaderService.hide();
      this.allCountryList = res?.countries?.sort((c1, c2) => c1?.name?.localeCompare(c2?.name));;
    }, err => {
      this.loaderService.hide();
      this.alertService.error(errorHandler(err));
    })

  }

  get form() {
    return this.profileForm.controls;
  }

  sidebarClose() {
    this.editProfile = 'hidden';
  }

  getAddress(place: object) {
    // this.street_1[0] = this.getStreet(place);
    // this.city[0] = this.getCity(place);
    // this.zipcode[0] = this.getPostCode(place);
    // this.state[0] = this.getState(place);
  }

  keyPressNumbers(event) {
    var charCode = (event.which) ? event.which : event.keyCode;
    // Only Numbers 0-9
    if ((charCode < 48 || charCode > 57)) {
      event.preventDefault();
      return false;
    } else {
      return true;
    }
  }

  addSocialLink() {
    this.socialProfileArr.push({ type: null, link: null });
  }

  checkSocialApp(val) {
    let socialLink = val.link
    if (socialLink.indexOf("linkedin") >= 0) {
      val.type = "linkedin"
    }
    else if (socialLink.indexOf("facebook") >= 0) {
      val.type = "facebook"
    }
    else if (socialLink.indexOf("twitter") >= 0) {
      val.type = "twitter"
    }
    else if (socialLink.indexOf("git") >= 0) {
      val.type = "git"
    }
    else if (socialLink.indexOf("be") >= 0) {
      val.type = "be"
    }
    else if (socialLink.indexOf("dribbble") >= 0) {
      val.type = "dribbble"
    }
  }
  selectSocialApp(app) {
    let socialType = app.type;
    if (socialType.indexOf("linkedin") >= 0) {
      app.link = "https://linkedin.com/";
    }
    else if (socialType.indexOf("facebook") >= 0) {
      app.link = "https://facebook.com/"
    }
    else if (socialType.indexOf("twitter") >= 0) {
      app.link = "https://twitter.com/"
    }
    else if (socialType.indexOf("git") >= 0) {
      app.link = "https://github.com/"
    }
    else if (socialType.indexOf("be") >= 0) {
      app.link = "https://be.com/"
    }
    else if (socialType.indexOf("dribbble") >= 0) {
      app.link = "https://dribbble.com/"
    }
  }
  deleteSocialLink(index) {
    this.socialProfileArr.splice(index, 1);
  }


  submit() {
    let programDetails = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    let programId = programDetails['id'];
    let formValue = this.profileForm.value;
    let countryName: string = "";
    for(let i=0; i<this.allCountryList.length;i++){
      if(formValue?.country === this.allCountryList[i].id){
        countryName = this.allCountryList[i].name;
        break;
      }
    }
    let addressList: any = null;
    if(formValue?.address || formValue?.country){
      addressList = [
        {
          "label": "PRIMARY",
          "address_line_1": formValue?.address || "",
          "address_line_2": "",
          "city": "",
          "state": "",
          "country": countryName,
          "zipcode": "",
        },]
    }
    let contactList: any = null;
    if(formValue?.phone_number || formValue?.country){
      let phoneCountryExtensionp;
        for(let i=0; i<this.allCountryList.length;i++){
          if(formValue.phoneFormat === this.allCountryList[i].iso_code_2){
            phoneCountryExtensionp = '+'+this.allCountryList[i].isd_code;
            break;
          }
        }
      contactList = [
        {
          "label": "PRIMARY",
          "isd_code": phoneCountryExtensionp,
          "iso2_code": formValue.phoneFormat,
          "number": formValue?.phone_number,
        },]
    }
    let payload = {
      first_name: formValue?.first_name,
      middle_name: formValue?.middle_name,
      last_name: formValue?.last_name,
      country_id: formValue?.country,
      name_prefix: formValue?.name_prefix,
      name_suffix: formValue?.name_suffix,
      title: formValue?.title,
      email: this.profileForm.get('email').value,
      preferred_language: formValue.preferred_language,
      preferred_time_zone: formValue.preferred_time_zone,
      prefferd_date_format: formValue.dateFormat,
      // timezone:['UTC'],
      // language:['English(US)'],
      program_id: programId,
      addresses: addressList ,
      contacts: contactList,
    }
    this.submited.emit(payload);
  }

  setCountry() {
    if(this.candidateAddress){
      this.candidateAddress._value = '';
    }
    let country_id = this.profileForm.get('country').value;
    let countryData: Array <any> = this.allCountryList.filter(node => node.id === country_id);

    if(countryData && countryData.length) {
      this.profileForm.get('phoneFormat').setValue(countryData[0]?.iso_code_2);
      this.countryShortName = countryData[0]?.iso_code_2
    }
    this.googleAddressComponent?.getPlaceAutocomplete(this.countryShortName);
    this.changeDetectorRef.detectChanges();
  }
  ngOnDestroy(): void {
    this.subscrptions?.forEach(sub => sub.unsubscribe());
  }

  getPrefixSuffixFlag(){
    return this.storageService.get('CurrentProgram')?.config?.hide_suffix_prefix
  }

  phoneLengthValidation() {
    const mobNumberPattern = this.phoneUtilService.phoneLengthValidation(this.profileForm?.value?.phoneFormat, this.allCountryList);
    this.profileForm?.get('phone_number')?.clearValidators();
    this.profileForm?.get('phone_number')?.setValidators(Validators.pattern(mobNumberPattern));
    this.profileForm?.get('phone_number')?.updateValueAndValidity();
    this.mobNumberPattern = mobNumberPattern;
  }

}
