import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { StorageService } from 'src//app/core/services/storage.service';
import { ClonerService } from 'src/app/core/services/cloner.service';
import { EmitEvent, Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { UserService } from 'src/app/core/services/user.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { SearchAddressComponent } from 'src/app/shared/components/search-address/search-address.component';
import { AddressContactDetailsComponent } from 'src/app/shared/components/svms-tab-components/address-contact-details/address-contact-details.component';
import { SvmsUploadAvatarComponent } from 'src/app/shared/components/svms-upload-avatar/svms-upload-avatar.component';
import { ProgramConfig, StorageConfig } from 'src/app/shared/enums';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { BasicInfoComponent } from '../../../shared/components/svms-tab-components/basic-info/basic-info.component';
import { Subject, Subscription } from 'rxjs';
import { debounceTime} from 'rxjs/operators';

@Component({
  selector: 'app-create-users',
  templateUrl: './create-users.component.html',
  styleUrls: ['./create-users.component.scss']
})
export class CreateUsersComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {

  private roleSubject: Subject <string> = new Subject <string> ();
  private userSubject: Subject <string> = new Subject <string> ();
  private subscriptions: Subscription[] = [];
  public userForm: UntypedFormGroup;

  @Input() createManageUser = 'hidden';
  @Input() editData;
  @Input() viewData;
  @Input() isViewClicked;
  @Input() isEditClicked;
  @Output() onClose = new EventEmitter();
  selectedTreeArr = [];
  public countryShortName: string;
  isImagePresent: boolean = false;
  public status;
  public toggle = {
    title: 'active',
    value: true
  };
  isDisabled = true;
  tabIndex = 0;
  userBasic = true;
  label: string;
  UserType: string;
  UserIcon: string;
  rendererData: any;
  public addressForm: UntypedFormGroup;
  @ViewChild(BasicInfoComponent) basicInfo: BasicInfoComponent;
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
  public clientId: any;
  public basicFormEditData = [];
  public isEdit;
  public formTitle = 'Create New User';
  public userId;
  public isViewClicked1: any;
  public editAddress;
  public editAddressInfo = [];
  public fromBuilderOpen: string = 'hidden';
  public programRoles: Array<object>;
  public users: Array<object>;
  public selectedUser: any;
  public selectedEdit: any;
  public selectedUserName: any;
  public selectedUserData: any;
  public selectedRole: any;

  clickOutside: boolean;
  isSaveLoader: boolean = false;

  @Input()
  public set title(title: string) {
    this.label = title;

  }

  @Input()
  public set type(type: string) {
    this.UserType = type;

  }

  @Input()
  public set icon(icon: string) {
    this.UserIcon = icon;

  }

  orgId: string = ''
  show_org: boolean = false;
  selectedOrg: string = '';
  orgLists = [];
  showVendorDD: boolean = false;
  vendorLists: Array<object>;
  selectedVendor: string = '';
  selectedOrgType:string =''

  constructor(
    private eventStream: EventStreamService,
    private fb: UntypedFormBuilder, private zone: NgZone,
    private _storageService: StorageService,
    private _userService: UserService,
    private _alert: AlertService,
    private _loader: LoaderService,
    private router: Router,
    private _cloner: ClonerService
  ) {
  }

  ngOnInit(): void {
    let _orgId = this._storageService.get(StorageConfig[0]);
    let programId = this._storageService.get(ProgramConfig[0]);
    let user_type = this._storageService.get('user_type');
    if (user_type === 'SUPER_ORG' || user_type === 'MSP') { this.showSuperAdminConfig(); }
    this.orgId = _orgId
    if (programId && programId != null) {
      programId = JSON.parse(programId);
      this.programId = programId?.program_req_id;
      this.clientId = programId?.clientId;
    }

    this.userForm = this.fb.group({
      avatar: [],
      first_name: [null, Validators.required],
      middle_name: [null, ''],
      last_name: [null, Validators.required],
      title: [null, ''],
      name_prefix: [null, ''],
      supervisor_id: [null, ''],
      contact_person: ['', ''],
      is_enabled: [true, ''],
      name_suffix: [null, ''],
      role_id: ['', Validators.required],
      phone: ['', ''],
      email: ['', Validators.required],
      phoneFomat: ['', ''],
    });

    this.subscriptions.push(
      this.eventStream.on(Events.USER_CREATE)
        .subscribe((data: any) => {
          if (data) {
            this.createManageUser = 'visible';
          } else {
            this.createManageUser = 'hidden';
          }
        }
      )
    );

    this.subscriptions.push(
      this.roleSubject
      .asObservable()
      .pipe(debounceTime(800))
      .subscribe((res: any) => {
        this.getProgramRoles(res);
      })
    );

    this.subscriptions.push(
      this.userSubject
      .asObservable()
      .pipe(debounceTime(800))
      .subscribe((res: any) => {
        this.getUsers(res);
      })
    );

    this.getProgramRoles();
    this.getUsers();
    this.hierarchyList();
  }

  showSuperAdminConfig() {
    let _currentUser = this._storageService.get('user');
    let _currentProgram = this._storageService.get('CurrentProgram');
    let user_type = this._storageService.get('user_type');
    const { organization_id, first_name } = _currentUser;
    const { client, msp } = _currentProgram;
    const currentOrgType = user_type === 'SUPER_ORG'? 'SVMS': 'MSP'

    let data = [];
    // data[0] = { id: organization_id, name: first_name, type:currentOrgType}
     if(user_type === 'SUPER_ORG'){
       data.push({ id: organization_id, name: first_name, type: currentOrgType })
     }
     if (client) {
       data.push({ id: client.id, name: client.name, type:'CLIENT' });
     }
     if (msp) {
       data.push({ id: msp.id, name: msp.name, type:'MSP' });
     }
    this.show_org = true;
    this.orgLists = [...data, { id: 'vendor', name: 'Vendor', type:'VENDOR' }];
    this.selectedOrg = data[0].id;
    this.getUsers();
    this.selectedOrgType =  currentOrgType;
  }

  onChangeOrg() {
    let selectedOrg = this.selectedOrg;
    let selectedType = this.orgLists.find(elm => elm.id === selectedOrg);
    this.selectedOrgType = selectedType?.type;
    if (selectedOrg === 'vendor') {
      this.users = [];
      this.orgId = '';
      this.showVendorDD = true;
      this.getVendorLists();
    }
    else {
      this.orgId = selectedOrg;
      this.showVendorDD = false;
      this.getUsers();
    }
    this.selectedUser = '';
    this.getProgramRoles();
  }

  onChangeVendor() {
    this.orgId = this.selectedVendor;
    this.getUsers();

  }

  getVendorLists() {
    let programDetails = JSON.parse(this._storageService.get(ProgramConfig[0]));
    let programId = programDetails.program_req_id;
    this.subscriptions.push(
      this._userService.get(`/configurator/programs/${programId}/vendors?limit=99&active=true`)
        .subscribe((data: any) => {
          const { program_vendors = [] } = data || {};
          if (program_vendors.length) {
            this.vendorLists = program_vendors.map(elm => ({ ...elm.vendor }));
          }
        }
      )
    );
  }

  ngAfterViewInit() {
    this.subscriptions.push(
      this.basicInfo?.userForm?.valueChanges?.subscribe((data: any) => {
      this.basicFormstatus = this.basicInfo?.userForm.status;
    }));
    // this.addresscomponent?.addressForm?.valueChanges?.subscribe(data => {
    //   //this.addressFormStatus = this.addresscomponent?.addressForm.status;
    // });
  }

  ngOnChanges() {
    if (this.viewData && this.viewData.first_name) {
      this.formTitle = this.viewData.first_name + ' Detail View';
      this.selectedUser = { ...this.viewData };
      this.selectedUserName = `${this.viewData.first_name} ${this.viewData.last_name}`;
      this.selectedRole = this.viewData.role?.name;
      this.isDisabled = true;
      this.isViewClicked1 = true;
    }
    if (this.editData?.first_name) {
      this.formTitle = 'Edit ' + this.editData?.first_name;
      this.selectedUserData = `${this.editData.first_name} ${this.editData.last_name}`;
      this.selectedRole = this.editData?.role?.name;
      this.basicFormEditData = { ...this.editData };
      this.isDisabled = true;
      this.isEditClicked = true;
      if (this.isViewClicked && this.isEditClicked) {
        this.formTitle = this.editData?.first_name + ' Detail View';
        this.isViewClicked1 = true;
        this.clickOutside = true;
      } else {
        this.isViewClicked1 = false;
        this.clickOutside = false;
      }
      this.loadData();
      this.getProgramRoles()
    }
    if (!this.viewData && !this.editData) {
      this.formTitle = 'Add new user';
      this.basicFormEditData = [];
      this.isViewClicked1 = false;
      this.clickOutside = false;
    }
  }

  get confirmationMessage() {
    return `Are you sure you want to leave this page? ${this.editData?.id ? ('User ' + this.editData.first_name) : 'New User'} is not ${this.editData?.id ? 'updated' : 'created'} yet.`;
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
      if (this.selectedTreeArr?.length > 0) {
        this.hierarchyStatus = 'VALID';
      }
    }
  }

  onContinue() {
    if (this.tabIndex === 0) {
      this.tabIndex = 1 + this.tabIndex;
    } else if (this.tabIndex === 1) {
      this.tabIndex = 1 + this.tabIndex;
    } else {
      const basicInfo = this.basicInfo.userForm.value;
      const addressForm = this.addresscomponent?.addressForm.value;
      let payLoad;
      payLoad = {
        name_prefix: basicInfo.name_prefix,
        first_name: basicInfo.first_name,
        middle_name: basicInfo.middle_name,
        last_name: basicInfo.last_name,
        name_suffix: basicInfo.name_suffix,
        is_enabled: this.toggle.value,
        email: basicInfo.email,
        program_id: this.programId,
        role_id: basicInfo.role_id,
        supervisor_id: basicInfo.supervisor_id,
        title: basicInfo.title,
        avatar: this.basicInfo?.logoComponent?.croppedImage,
        addresses: [
          {
            type: 'PRIMARY',
            address_line_1: this.addresscomponent?.street_2[0] || '',
            address_line_2: this.addresscomponent?.address[0] || '',
            city: this.addresscomponent?.city[0] || '',
            state: this.addresscomponent?.state[0],
            zipcode: this.addresscomponent?.zipcode[0],
            country: addressForm?.country,
          },
          {
            type: 'SECONDARY',
            address_line_1: this.addresscomponent?.address[1] || '',
            address_line_2: this.addresscomponent?.street_2[1] || '',
            city: this.addresscomponent?.city[1] || '',
            state: this.addresscomponent?.state[1] || '',
            zipcode: this.addresscomponent?.zipcode[1] || '',
            country: addressForm?.secondarycountry,
          },
        ],
        hierarchy_units: this.selectedTreeArr
      };

      if (!payLoad.avatar.startsWith('data:image')) {
        delete payLoad.avatar;
      }
      
      this.isSaveLoader = true;
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
                this.isSaveLoader = false;
              }, error: (err: Error | any) => {
                this.isSaveLoader = false;
                this._alert.error(errorHandler(err));
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
                this.isSaveLoader = false;
              }, error: (err: Error | any) => {
                this.isSaveLoader = false;
                this._alert.error(errorHandler(err), {});
              }
            }
          )
        );
      }

      this.resetAddressField();
    }
  }

  resetAddressField() {
    if (this.addresscomponent.secondaryaddressOpen) {
      this.addresscomponent.showPrimarySecondaryAddress();
    }
  }

  onIndexChange(event) {
    this.tabIndex = event;
    if (this.tabIndex === 0) {
      this.userBasic = true;
    } else if (this.tabIndex === 1) {
      this.userBasic = false;
    } else if (this.tabIndex == 2) {
      this.userBasic = false;
    }
  }

  sidebarClose() {
    this.eventStream.emit(new EmitEvent(Events.USER_CREATE, false));
    this.onClose.emit(true);
    this.selectedUser = null;
    this.selectedRole = null;
    this.isViewClicked1 = false;
    this.isEditClicked = false;
    this.isDisabled = false;
    this.formTitle = 'Add New User';
    // this.editData = [];
    // this.basicFormEditData = [];
    // this.editAddressInfo = [];
    // this.basicInfo.userForm.reset();
    // this.addressForm.reset();
    // this.selectedTreeArr = [];
    // this.basicInfo.logoComponent.croppedImage = '';
    // this.tabIndex = 0;
    // this.basicInfo.logoComponent.logoUrl = '';
    // this.resetAddressField();
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
    this.googleAddressComponent?.writeValue('', true);
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

  hierarchyList() {
    let programDetails = JSON.parse(this._storageService.get('NewProgramData'));
    let programId = programDetails['program_req_id'];
    this.subscriptions.push(
      this._userService.get(`/configurator/programs/${programId}/hierarchy`)
        .subscribe((data: any) => {
          if (data) {
            this.rendererData = data?.result[0].hierarchies;
          }
        }
      )
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
          return level != data.levelData.id;
        });
      }
      if (this.selectedTreeArr?.length > 0) {
        this.hierarchyStatus = 'VALID';
      } else {
        this.hierarchyStatus = 'INVALID';
      }
    }
  }

  // push the hierarchy ids which is present inside the current selected level
  //(recursive call for hierarchies array)
  pushChildLevelSelected(currentData) {
    if (currentData?.hierarchies.length) {
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


  getProgramRoles(term = '') {

    const programDetails = JSON.parse(this._storageService.get(ProgramConfig[0]));
    const programId = programDetails.program_req_id;

    let orgType=this.selectedOrgType;
    if(this.isEditClicked) {
      orgType = this.editData?.role?.organization_category;
    }

    let url = `/configurator/programs/${programId}/roles?limit=200&org_category=${orgType}`;
    if(term !== '')
      url += `&k=${term}`;

    this.subscriptions.push(
      this._userService.get(url)
      .subscribe((data: any) => {
        this.programRoles = data?.roles;
      })
    );

  }

  searchUsers(event) {
    this.userSubject.next(event.term);
  }

  getUsers(term = '') {

    this._loader.show();
    const _orgId = this.orgId || this._storageService.get(StorageConfig[0]);
    const programDetails = JSON.parse(this._storageService.get(ProgramConfig[0]));
    const programId = programDetails.program_req_id;

    let url = `/configurator/organizations/${_orgId}/members?exclude_candidates=true&exclude_program=${programId}`;
    if (term !== '')
      url += `&k=${term.toLowerCase()}`;

    this._userService.get(url)
      .subscribe({
        next: (data: any) => {
          this.users = data?.members;
          this._loader.hide();
        },
        error: (err: Error) => {
          this._loader.hide();
          console.error(err);
        }
      }
    );
  }

  getCropImage(e) {
    if (e) {
      this.isImagePresent = true;
    } else {
      this.isImagePresent = false;
    }
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
    this.userForm.get('status')?.setValue(this.status);
    this.userForm.get('is_enabled')?.setValue(this.toggle.value);
    // console.log(this.userForm.get('is_enabled').value)
  }

  changeSelectedUser() {
    this.toggle.value = this.selectedUser ? this.selectedUser.is_enabled : true;
    if (this.toggle.value) {
      this.toggle.title = 'active';
    } else {
      this.toggle.title = 'inactive';
    }
  }

  onAdd() {
    const userId = this.selectedUser?.id;
    const roleId = this.selectedRole?.id;
    this._loader.show();
    const programDetails = JSON.parse(this._storageService.get(ProgramConfig[0]));
    const programId = programDetails?.program_req_id;
    const orgId = this.orgId || this._storageService.get(StorageConfig[0]);

    //editData
    if (this.isEditClicked) {
      const { organization: { id } } = this.editData;
      let payload = {
        program_id: programId,
        role_id: roleId,
        is_enabled: this.userForm.get('is_enabled').value
      };

      this.subscriptions.push(
        this._userService.put(`/configurator/organizations/${id}/members/${userId}`, payload)
          .subscribe({
            next: (data: any) => {
              this._alert.success(`The role has been updated successfully`);
              this._loader.hide();
              this.sidebarClose();
            }, error: (error: Error | any) => {
              this._loader.hide();
              this._alert.error(errorHandler(error));
            }
          }
        )
      );

    } else {

      let payload = {
        program_id: programId,
        members: [
          {
            user_id: userId,
            role_id: roleId,
            is_enabled: this.userForm.get('is_enabled').value
          }
        ]
      };

      this.subscriptions.push(
        this._userService.post(`/configurator/organizations/${orgId}/members/attach`, payload)
          .subscribe({
            next: (data: any) => {
              this._alert.success(`You have successfully added a user to program`);
              this._loader.hide();
              this.sidebarClose();
            }, error: (error: Error | any) => {
              this._loader.hide();
              this._alert.error(errorHandler(error));
            }
          }
        )
      );
    }
  }

  roleSearch(evt) {
    this.roleSubject.next(evt);
  }

  ngOnDestroy(): void {
    this.subscriptions?.forEach(sub => {
      if (sub) {
        sub.unsubscribe();
      }
    });
  }
}

