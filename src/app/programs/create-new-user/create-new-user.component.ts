import { AfterViewInit, ChangeDetectorRef, Component, Input, NgZone, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { EmitEvent, EventStreamService, Events } from 'src/app/core/services/event-stream.service';
import { StorageService } from 'src/app/core/services/storage.service';
import { SearchAddressComponent } from 'src/app/shared/components/search-address/search-address.component';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { AddressContactDetailsComponent } from '../../shared/components/svms-tab-components/address-contact-details/address-contact-details.component';
import { BasicInfoComponent } from '../../shared/components/svms-tab-components/basic-info/basic-info.component';
import { ProgramService } from "../program.service";
@Component({
  selector: 'app-create-new-user',
  templateUrl: './create-new-user.component.html',
  styleUrls: ['./create-new-user.component.scss']
})
export class CreateNewUserComponent implements OnInit, AfterViewInit, OnDestroy {
  private subscriptions: Subscription[] = [];
  tabIndex = 0;
  @Input() addnewUser = "hidden";
  userBasic = true;
  userAddressTab = false;
  viewMode;
  public createUser: UntypedFormGroup;
  @Input() showUserCreate = false;
  public status: boolean = true;
  public toggle = {
    title: 'active',
    value: true
  };
  @ViewChild(SearchAddressComponent) googleAddressComponent: SearchAddressComponent;
  @ViewChild(BasicInfoComponent) basicInfoComponent: BasicInfoComponent;
  @ViewChild(AddressContactDetailsComponent) AddressContactDetailsComponent: AddressContactDetailsComponent;
  public countryShortName = "IN";
  public orgId: string;
  public userToken: any;
  public fileName: any;
  public logoUrl: any;
  public logoValidations: any;
  public logoSize: any;
  public mobNumberPattern = "^((\\+91-?)|0)?[0-9]{10}$";
  public address: string;
  public establishmentAddress: string;
  public phone: any;
  public formattedAddress: string;
  public street_2: string;
  public city: string;
  public state: string;
  public zipcode: string;
  public selecteItem: string;
  public BasicInfoForm = "INVALID";
  public addressForm ='VALID';
  public allCountryList = [];
  public preferredTimeZone : string;

  constructor(private eventStream: EventStreamService, private storageService: StorageService,private fb: UntypedFormBuilder, private _programService: ProgramService, private zone: NgZone, private changeDetection: ChangeDetectorRef, private _alert: AlertService, private _loader: LoaderService) {
  }

  ngAfterViewInit() {
    this.changeDetection.detectChanges();
    this.subscriptions.push(
      this.basicInfoComponent?.userForm.valueChanges
        .subscribe((data: any) => {
          this.BasicInfoForm = this.basicInfoComponent.userForm.status;
        }
      ));

    this.subscriptions.push(
      this.AddressContactDetailsComponent?.addressForm.valueChanges
      .subscribe((data: any) => {
        this.addressForm = this.AddressContactDetailsComponent.addressForm.status;
      }
    ));
  }

  ngOnInit(): void {

    this.createUser = this.fb.group({
      additionalphone: ['', ''],
      additional_phone: ['', '']
    });

    this.createUser.get('additional_phone').setValue("<img src='../../../assets/images/flag/ca.png' width='20px' /> +1");
    this.viewMode = "basicInfo";

    this.subscriptions.push(
      this.eventStream.on(Events.CREATE_NEW_USER)
        .subscribe((data: any) => {
          if (data && data.show) {
            this.orgId = data.orgId;
            this.addnewUser = "visible";
            document.body.style.overflow = "hidden";

          } else {
            this.addnewUser = 'hidden';
          }
        }
      )
    );

    this.getAllCountry();
    this.preferredTimeZone = this.storageService?.get('UserPreferredTimeZone')?.id;
  }

  getAllCountry(){
    this.subscriptions.push(
      this._programService.get(`/configurator/resources/countries?limit=300`)
      .subscribe((data: any) => {
        this.allCountryList = data?.countries;
      }
    ));
  }

  sidebarClose() {
    this.addnewUser = "hidden";
    document.body.style.overflow = "";
  }

  onIndexChange(event) {
    this.tabIndex = event;
    if (this.tabIndex == 0) {
      this.userAddressTab = false;
      this.userBasic = true;
    }
    else if (this.tabIndex == 1) {
      this.userAddressTab = true;
      this.userBasic = false;
    }
  }

  saveUsers() {
    this.createUser.value.orgId = this.orgId;
    let basicForm = this.basicInfoComponent?.userForm?.value;
    let primaryAddress = {} ;
    let secondaryAddres = {} ;
    let primaryContact = {} ;
    let secondaryContact = {} ;
    let addressForm = this.AddressContactDetailsComponent?.addressForm?.value;
    let payLoad: any  = {
      name_prefix: basicForm.name_prefix,
      first_name: basicForm.first_name,
      middle_name: basicForm.middle_name,
      last_name: basicForm.last_name,
      name_suffix: basicForm.name_suffix,
      email: basicForm.email,
      // program_id: "<PROGRAM_UUID>",
      is_enabled: this.status,
      role_id: basicForm.role_id,
      supervisor_id: basicForm.supervisor_id,
      title: basicForm.title,
      avatar: this.basicInfoComponent?.logoComponent?.croppedImage,
      preferred_language: "en-US",
      preferred_time_zone: this.preferredTimeZone,
    }
    if(addressForm?.country) {
      primaryAddress =  {
        label: "PRIMARY",
        address_line_1: addressForm?.address,
        address_line_2: addressForm?.address,
        city: addressForm?.city1,
        state: addressForm?.state1,
        country: addressForm?.country,
        zipcode: addressForm?.zipcode1,
      }
      if(!payLoad.addresses) {
        payLoad.addresses = new Array();
      }
      payLoad?.addresses?.push(primaryAddress);
    }
    if(addressForm?.secondarycountry) {
      secondaryAddres = {
        label: 'SECONDARY',
        address_line_1: addressForm?.secondary_address,
        address_line_2: addressForm?.secondary_address,
        city: addressForm?.city2,
        state: addressForm?.state2,
        country: addressForm?.secondarycountry,
        zipcode: addressForm?.zipcode2,
      }
      if(!payLoad.addresses) {
        payLoad.addresses = new Array();
      }
      payLoad?.addresses?.push(secondaryAddres);
    }

    if(addressForm?.phone) {
     let selectedISD =  this.allCountryList.filter((v)=> v.iso_code_2 == addressForm?.phoneFomat)
      primaryContact =  {
        label: "PRIMARY",
        isd_code: "+"+selectedISD[0]?.isd_code,
        number: addressForm?.phone,
        iso2_code:selectedISD[0]?.iso_code_2,
      }
      if(!payLoad.contacts) {
        payLoad.contacts = new Array();
      }
      payLoad?.contacts?.push(primaryContact);
    }
    if(addressForm?.secondary_phone) {
      let selectedISD =  this.allCountryList.filter((v)=> v.iso_code_2 == addressForm?.secondary_phoneFomat)
      secondaryContact =  {
        label: "SECONDARY",
        isd_code: "+"+selectedISD[0]?.isd_code,
        number: addressForm?.secondary_phone,
        iso2_code:selectedISD[0]?.iso_code_2,
      }
      if(!payLoad.contacts) {
        payLoad.contacts = new Array();
      }
      payLoad?.contacts?.push(secondaryContact);
    }

    this._loader.show();
    this.subscriptions.push(
      this._programService.post(`/configurator/organizations/${this.orgId}/members`, payLoad)
        .subscribe({
          next: (data: any) => {
            if (data?.member?.id) {
              this._alert.success('New User Created Successfully', {
                color: 'white',
                bgColor: 'lightgreen',
                type: { INTERVAL_TIME: 3000 }
              });
              this.basicInfoComponent.userForm.reset();
              this.AddressContactDetailsComponent?.addressForm.reset();
              this.createUser.reset();
              this.sidebarClose();
              this._loader.hide();
              let newUserData = {
                id: data?.member?.id,
                role_id: payLoad.role_id,
                email: payLoad.email,
                user_id:data?.member?.id
              }
              this.eventStream.emit(new EmitEvent(Events.USER_ADDED, newUserData));
            }
          }, error: (err: Error | any) => {
            this._loader.hide();
            this._alert.error(errorHandler(err), {});
          }
        }
      )
    );
  }

  onClickToggle() {
    if (this.toggle.value) {
      this.toggle.value = false;
      this.toggle.title = 'inactive';
    } else {
      this.toggle.value = true;
      this.toggle.title = 'active';
    }
    this.status = this.toggle.value;
  }

  nexttab() {
    if (this.tabIndex == 0) {
      this.tabIndex = 1 + this.tabIndex;
      this.userAddressTab = true;
      this.userBasic = false;
    }
  }

  getAddress(place: object) {
    this.address = place['formatted_address'];
    //this.phone = this.getPhone(place);
    this.formattedAddress = place['formatted_address'];
    this.zone.run(() => this.formattedAddress = place['formatted_address']);
    this.address = this.getStreetNumber(place);
    this.street_2 = this.getStreet(place);
    this.city = this.getCity(place);
    this.zipcode = this.getPostCode(place);
    let phone = this.getPhone(place);
    this.city = this.getCity(place);
    this.state = this.getState(place);
    if (phone)
      this.createUser.controls.phone.setValue(phone);
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

  getStreetNumber(place) {
    const COMPONENT_TEMPLATE = { street_number: 'short_name' },
      streetNumber = this.getAddrComponent(place, COMPONENT_TEMPLATE);
    return streetNumber;
  }

  getStreet(place) {
    const COMPONENT_TEMPLATE = { route: 'long_name' },
      street = this.getAddrComponent(place, COMPONENT_TEMPLATE);
    return street;
  }

  getCity(place) {
    const COMPONENT_TEMPLATE = { locality: 'long_name' },
      city = this.getAddrComponent(place, COMPONENT_TEMPLATE);
    return city;
  }

  getState(place) {
    const COMPONENT_TEMPLATE = { administrative_area_level_1: 'short_name' },
      state = this.getAddrComponent(place, COMPONENT_TEMPLATE);
    return state;
  }

  getDistrict(place) {
    const COMPONENT_TEMPLATE = { administrative_area_level_2: 'short_name' },
      state = this.getAddrComponent(place, COMPONENT_TEMPLATE);
    return state;
  }

  getCountryShort(place) {
    const COMPONENT_TEMPLATE = { country: 'short_name' },
      countryShort = this.getAddrComponent(place, COMPONENT_TEMPLATE);
    return countryShort;
  }

  getCountry(place) {
    const COMPONENT_TEMPLATE = { country: 'long_name' },
      country = this.getAddrComponent(place, COMPONENT_TEMPLATE);
    return country;
  }

  getPostCode(place) {
    const COMPONENT_TEMPLATE = { postal_code: 'long_name' },
      postCode = this.getAddrComponent(place, COMPONENT_TEMPLATE);
    return postCode;
  }

  getPhone(place) {
    const COMPONENT_TEMPLATE = { formatted_phone_number: 'formatted_phone_number' },
      phone = this.getAddrComponent(place, COMPONENT_TEMPLATE);
    return phone;
  }

  ngOnDestroy(): void {
    if(this.subscriptions)
      this.subscriptions?.forEach(sub => sub?.unsubscribe());
  }
}

