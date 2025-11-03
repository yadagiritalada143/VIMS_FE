import { Component, OnInit, Input, Output, EventEmitter, NgZone, ViewChild, OnDestroy } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { EventStreamService, EmitEvent, Events } from 'src/app/core/services/event-stream.service';
import { SearchAddressComponent } from 'src/app/shared/components/search-address/search-address.component';
import { StorageKeys, StorageService } from 'src//app/core/services/storage.service';
import { UserService } from 'src/app/core/services/user.service';
import { SvmsUploadAvatarComponent } from 'src/app/shared/components/svms-upload-avatar/svms-upload-avatar.component';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { ProgramService } from 'src/app/programs/program.service';
import { AddressContactDetailsComponent } from 'src/app/shared/components/svms-tab-components/address-contact-details/address-contact-details.component';
import { ClonerService } from 'src/app/core/services/cloner.service';
import { Router } from '@angular/router';
import { VendorBasicInfoComponent } from './basic-info/basic-info.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-add-user',
  templateUrl: './add-user.component.html',
  styleUrls: ['./add-user.component.scss']
})
export class createVendorUserComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];
  @Input() createManageUser = 'hidden';
  @Input() editData;
  @Input() viewData;
  @Input() isViewClicked;
  @Output() onClose = new EventEmitter();
  selectedTreeArr = [];
  public countryShortName: string;
  tabIndex = 0;
  userBasic = true;
  label: string;
  UserType: string;
  UserIcon: string;
  rendererData: any;
  public addressForm: UntypedFormGroup;
  @ViewChild(VendorBasicInfoComponent) basicInfo: VendorBasicInfoComponent;
  @ViewChild(SearchAddressComponent) googleAddressComponent: SearchAddressComponent;
  @ViewChild(SvmsUploadAvatarComponent) logoComponent: SvmsUploadAvatarComponent;
  @ViewChild(AddressContactDetailsComponent) addresscomponent: AddressContactDetailsComponent;
  public address: string;
  public establishmentAddress: string;
  public phone: any;
  public formattedAddress: string;
  public street_2: string;
  public city: string;
  public state: string;
  public zipcode: string;
  public selecteItem: string;
  public mobNumberPattern = '^((\\+91-?)|0)?[0-9]{10}$';
  public programId: any;
  public basicFormstatus = 'INVALID';
  public addressFormStatus = 'VALID';
  public hierarchyStatus = 'INVALID';
  public clientId: string=undefined;
  public basicFormEditData = [];
  public isEdit;
  public formTitle = 'Create New User';
  public userId;
  public isViewClicked1;
  public editAddress;
  public editAddressInfo = [];
  public fromBuilderOpen: string = 'hidden';
  clickOutside: boolean;

  @Input() public set title(title: string) {
    this.label = title;

  }
  @Input() public set type(type: string) {
    this.UserType = type;

  }
  @Input() public set icon(icon: string) {
    this.UserIcon = icon;

  }
  constructor(
    private eventStream: EventStreamService,
    private fb: UntypedFormBuilder, private zone: NgZone,
    private _storageService: StorageService,
    private _userService: UserService,
    private _alert: AlertService,
    private _loader: LoaderService,
    private _programService: ProgramService,
    private router: Router,
    private _cloner: ClonerService
  ) { }

  ngOnInit(): void {
    let programDetails = this._storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.programId = programDetails['id'];
    this.clientId =  this._storageService.get("ORG_ID");
    /* let programId = this._storageService.get(ProgramConfig[0]);
    if (programId && programId != null) {
      programId = JSON.parse(programId);
      this.programId = programId?.program_req_id;
      this.clientId =  this._storageService.get("ORG_ID");
    } */

    this.addressForm = this.fb.group({
      country: [null, ''],
      address_line_1: ['', ''],
      address_line_2: ['', ''],
      city: ['', ''],
      state: ['', ''],
      zipcode: ['', ''],
    });
    this.subscriptions.push(this.eventStream.on(Events.USER_CREATE).subscribe((data: any) => {
      if (data) {
        this.createManageUser = 'visible';
      } else {
        this.createManageUser = 'hidden';
      }
    }));
    // this.hierarchyList();
  }
  ngAfterViewInit() {
    this.subscriptions.push(this.basicInfo?.userForm?.valueChanges?.subscribe(data => {
      this.basicFormstatus = this.basicInfo?.userForm.status;
    }));
    this.subscriptions.push(this.addresscomponent?.addressForm?.valueChanges?.subscribe(data => {
      this.addressFormStatus = this.addresscomponent?.addressForm.status;
    }));
  }

  ngOnChanges() {
    if (this.editData && this.editData?.first_name) {
      this.formTitle = 'Edit details for ' +this.editData?.first_name;
      this.basicFormEditData = this.editData;
      if (this.isViewClicked) {
        this.formTitle = this.editData?.first_name +' Detail view ';
        this.isViewClicked1 = true;
        this.clickOutside = true;
      }
      else {
        this.isViewClicked1 = false;
        this.clickOutside = false;
      }
      this.loadData();
    }
    if (!this.viewData && !this.editData) {
      this.formTitle = 'Create User';
      this.basicFormEditData = [];
      this.isViewClicked1 = false;
      this.clickOutside = false;
    }
  }

  loadData() {
    if (this.editData && this.editData?.addresses) {
      const editAddressInfo1 = this.editData?.addresses?.length > 0 ? this.editData?.addresses : '';
      const primaryAdress = editAddressInfo1[0] !== undefined ? editAddressInfo1[0] : '';
      const secondaryAdress = editAddressInfo1[1] !== undefined ? editAddressInfo1[1] : '';
      this.editAddressInfo.push({
        primary: {
          label: 'edit',
          address_line1: primaryAdress.address_line_1 || '',
          address_line2: primaryAdress.address_line_2 || '',
          address_type: primaryAdress.address_type || '',
          city: primaryAdress.city || '',
          country: primaryAdress.country || '',
          state: primaryAdress.state || '',
          zipcode: primaryAdress.zipcode || ''
        },
      },
        {
          secondary: {
            label: 'edit',
            address_line1: secondaryAdress.address_line_2 || '',
            address_line2: secondaryAdress.address_line_2 || '',
            address_type: secondaryAdress.address_type || '',
            city: secondaryAdress.city || '',
            country: secondaryAdress.country || '',
            state: secondaryAdress.state || '',
            zipcode: secondaryAdress.zipcode || ''
          }
        });
      this.editAddressInfo = this._cloner.deepClone(this.editAddressInfo);
      this.userId = this.editData?.id;
      this.isEdit = false;
      this.editAddress = [];
      this.selectedTreeArr = this.basicFormEditData['hierarchy_units'];
      if(this.selectedTreeArr?.length>0){
        this.hierarchyStatus = 'VALID';
      }
    }
  }

  onContinue() {
    if (this.tabIndex === 0) {
      this.tabIndex += 1 
    }
    else {
      const basicInfo = this.basicInfo.userForm.value;
      const addressForm = this.addresscomponent?.addressForm.value;
      let payLoad;
      payLoad = {
        name_prefix: basicInfo.name_prefix,
        first_name: basicInfo.first_name,
        middle_name: basicInfo.middle_name,
        last_name: basicInfo.last_name,
        name_suffix: basicInfo.name_suffix,
        is_enabled: true,
        email: basicInfo.email,
        role_id: basicInfo.role_id,
        program_id: this.programId,
        supervisor_id: basicInfo.supervisor_id,
        title: basicInfo.title,
        avatar: this.basicInfo?.logoComponent?.croppedImage
      };

      if(addressForm?.country ){
        payLoad.addresses= [];
        payLoad.addresses?.push( {
          type: 'PRIMARY',
          address_line_1: this.addresscomponent?.street_2[0] || '',
          address_line_2: this.addresscomponent?.address[0] || '',
          city: this.addresscomponent?.city[0] || '',
          state: this.addresscomponent?.state[0],
          zipcode: this.addresscomponent?.zipcode[0],
          country: addressForm?.country,
        })        
      }
      if(payLoad?.avatar?.includes("http")){
        delete payLoad.avatar;
      }
      if(addressForm?.secondarycountry ){
        payLoad.addresses?.push({
          type: 'SECONDARY',
          address_line_1: this.addresscomponent?.address[1] || '',
          address_line_2: this.addresscomponent?.street_2[1] || '',
          city: this.addresscomponent?.city[1] || '',
          state: this.addresscomponent?.state[1] || '',
          zipcode: this.addresscomponent?.zipcode[1] || '',
          country: addressForm?.secondarycountry,
        })        
      }
      // const orgId = environment.SIMPLIFY_ORG_ID;
      this._loader.show();
      if (this.editData) {
        this.userId = this.editData?.id;
        this.subscriptions.push(
          this._userService.updateUser(`/configurator/organizations/${this.clientId}/members/${this.userId}`, payLoad)
            .subscribe({
              next: (data: any) => {
                if (data?.member?.id) {
                  this._alert.success('User Updated Succesfully', {
                    color: 'white',
                    bgColor: 'lightgreen',
                    type: { INTERVAL_TIME: 3000 }
                  });
                  this.addressForm.reset();
                  this.basicInfo.userForm.reset();
                  this.sidebarClose();
                  this.editData = [];
                  this.isEdit = false;
                  this.selectedTreeArr = [];
                }
                this._loader.hide();
              }, error: (err: Error | any) => {
                this._loader.hide();
                this._alert.error(errorHandler(err), {});
              }
            }
          )
        );
      } else {
        this.subscriptions.push(
          this._userService.saveUser(`/configurator/organizations/${this.clientId}/members`, payLoad)
            .subscribe({
              next: (data: any) => {
                if (data?.member?.id) {
                  this._alert.success('New User Created Succesfully', {
                    color: 'white',
                    bgColor: 'lightgreen',
                    type: { INTERVAL_TIME: 3000 }
                  });
                  this.addressForm.reset();
                  this.basicInfo.userForm.reset();
                  this.sidebarClose();
                  this.selectedTreeArr = [];
                }
                this._loader.hide();
              }, error: (err: Error | any) => {
                this._loader.hide();
                this._alert.error(errorHandler(err), {});
              }
            }
          )
        );
      }
    }
  }

  onIndexChange(event) {
    this.tabIndex = event;
    if (this.tabIndex === 0) {
      this.userBasic = true;
    }
    else if (this.tabIndex === 1) {
      this.userBasic = false;
    }

    else if (this.tabIndex == 2) {
      this.userBasic = false;
    }
  }

  sidebarClose() {
    this.eventStream.emit(new EmitEvent(Events.USER_CREATE, false));
    this.onClose.emit(true);
    this.formTitle = 'Create New User';
    this.editData = [];
    this.basicFormEditData = [];
    this.editAddressInfo = [];
    this.basicInfo.userForm.reset();
    this.addressForm.reset();
    this.selectedTreeArr = [];
    this.basicInfo.logoComponent.croppedImage = '';
    this.tabIndex = 0;
    this.basicInfo.logoComponent.logoUrl = '';
  }

  setCountry() {
    const val = this.addressForm.get('country').value;
    if (val) {
      switch (val) {
        case 'India':
          this.countryShortName = 'IN';
          //this.addressForm.get('phoneFomat').setValue("<img src='../../../assets/images/flag/हिन्दी.png' width='20px' /> +91");
          break;
        case 'USA':
          this.countryShortName = 'US';
          // this.addressForm.get('phoneFomat').setValue("<img src='../../../assets/images/flag/us.png' width='20px' /> +1");
          break;
        case 'Australia':
          this.countryShortName = 'AU';
          //this.addressForm.get('phoneFomat').setValue("<img src='../../../assets/images/flag/au.png' width='20px' /> +12");
          break;
      }
    }
    this.googleAddressComponent?.writeValue('', true)
    this.googleAddressComponent?.getPlaceAutocomplete(this.countryShortName);
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
    const phone = this.getPhone(place);
    this.city = this.getCity(place);
    this.state = this.getState(place);
    if (phone) {
      this.addressForm.controls.phone.setValue(phone);
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
    const COMPONENT_TEMPLATE = { locality: 'long_name' }
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
  hierarchyList() {
    let programDetails = JSON.parse(this._storageService.get('NewProgramData'));
    let programId = programDetails['program_req_id'];
    this.subscriptions.push(this._programService.get(`/configurator/programs/${programId}/hierarchy`)
    .subscribe((data: any) => {
        if (data) {
          this.rendererData = data.result[0].hierarchies;
        }
      })
    );
  }

  // if level is not present in selectedTreeArr then push it , else  remove it 
  selectHierarchy(data) {
    if (data) {
      if (data.currentState) {
        if (this.selectedTreeArr.indexOf(data.levelData.id) == -1) {
          this.selectedTreeArr.push(data.levelData.id);
        }
        this.pushChildLevelSelected(data.levelData);
      } else {
        this.selectedTreeArr = this.selectedTreeArr.filter((level) => {
          return level != data.levelData.id
        });
      }
      if(this.selectedTreeArr?.length>0){
        this.hierarchyStatus = 'VALID';
      } 
      else {
        this.hierarchyStatus = 'INVALID'
      }
    }
  }
  // push the hierarchy ids which is present inside the current selected level 
  //(recursive call for hierarchies array)
  pushChildLevelSelected(currentData) {
    if (currentData.hierarchies.length) {
      for (let i = 0; i < currentData.hierarchies.length; i++) {
        const child = currentData.hierarchies[i];
        if (this.selectedTreeArr.indexOf(child.id) == -1) {
          this.selectedTreeArr.push(child.id);
        }
        this.pushChildLevelSelected(child);
      }
    }
  }
  onCreateHierarchy() {
    this.router.navigate(['/hierarchy/hierarchy-configuraton']);
  }
  ngOnDestroy(): void {
    this.subscriptions?.forEach(sub => sub?.unsubscribe());
  }
}

