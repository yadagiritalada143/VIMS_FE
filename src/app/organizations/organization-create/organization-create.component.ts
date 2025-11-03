import {
  ChangeDetectorRef, Component, Input,
  OnChanges, OnInit, ViewChild
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  debounceTime, distinctUntilChanged
} from 'rxjs/operators';
import { EmitEvent, Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { OrgTypes } from 'src/app/shared/enums';
import { ProgramService } from '../../programs/program.service';
import { AlertService } from '../../core/components/alert/alert.service';
import { LoaderService } from '../../core/components/loader/loader.service';
import { errorHandler } from '../../shared/util/error-handler';
import { AddressAndContactDetailsComponent } from '../components/address-and-contact-details/address-and-contact-details.component';
import { ClientBasicInfoComponent } from '../components/client-basic-info/client-basic-info.component';
import { MspBasicInfoComponent } from '../components/msp-basic-info/msp-basic-info.component';
import { VendorBasicInfoComponent } from '../components/vendor-basic-info/vendor-basic-info.component';
import { EmailService } from 'src/app/shared/service/email.service';
import { SortHelperPipe } from 'src/app/shared/pipe/sort-helper.pipe';

@Component({
  selector: 'app-organization-create',
  templateUrl: './organization-create.component.html',
  styleUrls: ['./organization-create.component.scss'],
})
export class OrganizationCreateComponent implements OnInit, OnChanges {
  private subscriptions = [];
  createOrganizationType = 'hidden';
  editOrganizationType = 'hidden';
  tabIndex = 0;
  label: string;
  orgType: string;
  orgIcon: string;
  editDataRow: any;
  clientBasicEditInfo: any;
  clientBasicAddEditInfo: any;
  isViewClicked = false;
  removeSecondaryContect : boolean = true;
  removeSecondaryAddress : boolean = false;
  isPrimaryContactTrue:boolean = false;
  removeSecondaryContectId = '';
  removeSecondaryAddressId = '';
  public createTitle: string;
  public editTitle: string;
  public viewTitle: string;
  clickOutside: boolean;
  isSaveLoader: boolean = false;

  @Input() public set title(title: string) {
    this.label = title;
    this.createTitle = this.label;
    this.isCreate = true;
    this.changeDetection.detectChanges();
  }
  @Input() public set type(type: string) {
    this.orgType = type;
    this.changeDetection.detectChanges();
  }
  @Input() public set icon(icon: string) {
    this.orgIcon = icon;
    this.changeDetection.detectChanges();
  }
  public addresValidation;
  public addres1Validation;
  public cityValidation;
  public zipcodeValidation;
  public address2Validation;
  public stateValidation;
  public chekvalidations = undefined;
  public isCreate = false;
  public validAddressForm = 'INVALID';
  public validForm = 'INVALID';
  public orgFormData: any;
  public orgId: any;
  public existOrgId: string;
  public logoComponent: any;
  public editAddressForm: any;
  public nameIsValid: boolean = true;
  public allCountryList = [];
  @ViewChild(AddressAndContactDetailsComponent)
  addresscomponent: AddressAndContactDetailsComponent;
  @ViewChild(MspBasicInfoComponent) mspcomponent: MspBasicInfoComponent;
  @ViewChild(VendorBasicInfoComponent)
  vendorcomponent: VendorBasicInfoComponent;
  @ViewChild(ClientBasicInfoComponent)
  clientcomponent: ClientBasicInfoComponent;
  // @ViewChild(SvmsUploadAvatarComponent) logocomponent: SvmsUploadAvatarComponent;

  constructor(
    private eventStream: EventStreamService,
    private router: Router,
    private changeDetection: ChangeDetectorRef,
    private _programService: ProgramService,
    private _loadService: LoaderService,
    private _alert: AlertService,
    private _activatedRoute: ActivatedRoute,
    private emailService: EmailService,
    private sortHelper: SortHelperPipe
  ) { }

  ngOnInit(): void {
    this.getAllCountry();
    this.subscriptions.push(this.eventStream.on(Events.ORG_CREATE).subscribe((data:any) => {
      if (data) {
        this.clientBasicEditInfo = [];
        this.clientBasicAddEditInfo = []
        this.editDataRow = [];
        this.existOrgId = '';
        this.isViewClicked = false;
        this.isCreate = true;
        if (this.label.search('Create') <= 0) {
          this.label = this.createTitle;
        }
        this.createOrganizationType = 'visible';
      } else {
        this.createOrganizationType = 'hidden';
      }
      this.clickOutside = false;
    }));

    this.subscriptions.push(this.eventStream.on(Events.ORG_VIEW).subscribe((data:any) => {
      if (data.event) {
        this.isViewClicked = true;
        this.isCreate = false;
        this.editDataRow = data?.data;
        this.existOrgId = data?.data?.id;
        this.orgType = this.editDataRow.category === 'CLIENT' ? 'TYPE_CLIENT' : this.editDataRow.category === 'MSP' ? 'TYPE_MSP' : this.editDataRow.category === 'VENDOR' ? 'TYPE_VENDOR' : '';
        let labelName = this.editDataRow.category === 'CLIENT' ? this.editDataRow?.name + ' detail view' : this.editDataRow.category === 'MSP' ? this.editDataRow?.name + ' detail view' : this.editDataRow.category === 'VENDOR' ? this.editDataRow?.name + ' detail view' : '';
        this.label = labelName;
        this.clientBasicEditInfo = [];
        this.clientBasicEditInfo.push({
          label: 'edit',
          logo: this.editDataRow?.logo,
          status: this.editDataRow?.status,
          name: this.editDataRow?.name,
          type: this.editDataRow?.category,
          vendor_industry: this.editDataRow?.industries,
          inactive_reason: this.editDataRow?.inactive_reason || undefined
        });
        this.editTitle = labelName;
        this.clientBasicAddEditInfo = [];

        const editAddressInfo = data.data.addresses.length > 0 ? data.data.addresses : '';
        const primaryAdress = editAddressInfo[0] !== undefined ? editAddressInfo[0] : '';
        const secondaryAdress = editAddressInfo[1] !== undefined ? editAddressInfo[1] : '';

        // const editContactInfo = data.data.contacts?.length > 0 ? data.data?.contacts : '';
        const primaryContact = data.data.contacts?.filter(f=>f.member_type == "PRIMARY")[0] || ''
        const secondaryContact = data.data.contacts?.filter(f=>f.member_type == "SECONDARY")[0] || ''

        this.clientBasicAddEditInfo.push({
          primary: {
            label: 'edit',
            address_line1: primaryAdress.address_line1,
            address_line2: primaryAdress.address_line2,
            address_type: primaryAdress.address_type,
            city: primaryAdress.city,
            country: primaryAdress.country,
            state: primaryAdress.state,
            zipcode: primaryAdress.zipcode
          }
        },
          {
            secondary: {
              label: 'edit',
              address_line1: secondaryAdress.address_line1,
              address_line2: secondaryAdress.address_line2,
              address_type: secondaryAdress.address_type,
              city: secondaryAdress.city,
              country: secondaryAdress.country,
              state: secondaryAdress.state,
              zipcode: secondaryAdress.zipcode
            }
          },
          {
            primarycontacts: {
              id: primaryContact?.id,
              email: primaryContact?.email,
              first_name: primaryContact?.first_name,
              last_name: primaryContact?.last_name,
              phone: ( primaryContact?.contact_numbers && primaryContact?.contact_numbers?.length > 0 && primaryContact?.contact_numbers[0]?.number ) || '' ,
              designation: primaryContact?.title,
              phoneFomat:  (primaryContact?.contact_numbers && primaryContact?.contact_numbers?.length > 0 && primaryContact?.contact_numbers[0]?.iso2_code ) || ''

            }
          },
          {
            secondarycontacts: {
              id:secondaryContact?.id,
              email: secondaryContact?.email,
              first_name: secondaryContact?.first_name,
              last_name: secondaryContact?.last_name,
              phone: (secondaryContact?.contact_numbers && secondaryContact?.contact_numbers?.length > 0 && secondaryContact?.contact_numbers[0]?.number) || '',
              designation: secondaryContact?.title,
              secondary_phoneFomat: (secondaryContact?.contact_numbers && secondaryContact?.contact_numbers?.length > 0 && secondaryContact?.contact_numbers[0]?.iso2_code) || ''
            }
          });
        this.createOrganizationType = 'visible';
      } else {
        this.createOrganizationType = 'hidden';
      }
      this.clickOutside = true;
    }));

    this.subscriptions.push(this.eventStream.on(Events.ORG_EDIT).subscribe((data:any) => {
      if (data.event) {
        this.isViewClicked = false;
        this.isCreate = false;
        this.editDataRow = data?.data;
        this.existOrgId = data?.data?.id
        this.orgType = this.editDataRow.category === 'CLIENT' ? 'TYPE_CLIENT' : this.editDataRow.category === 'MSP' ? 'TYPE_MSP' : this.editDataRow.category === 'VENDOR' ? 'TYPE_VENDOR' : '';
        let labelName = this.editDataRow.category === 'CLIENT' ? ' Edit ' + this.editDataRow?.name : this.editDataRow.category === 'MSP' ? ' Edit ' + this.editDataRow?.name : this.editDataRow.category === 'VENDOR' ? ' Edit ' + this.editDataRow?.name : '';
        this.label = labelName;
        this.editTitle = labelName;
        this.clientBasicEditInfo = [];
        this.clientBasicEditInfo.push({ "label": "edit", "logo": this.editDataRow.logo, "status": this.editDataRow.status, "name": this.editDataRow.name, "type": this.editDataRow.category, "vendor_industry": this.editDataRow?.industries, "inactive_reason": this.editDataRow?.inactive_reason, "total_program": data?.data?.total_programs });
        this.clientBasicAddEditInfo = [];

        const editAddressInfo = data.data.addresses.length > 0 ? data.data.addresses : '';
        const primaryAdress = editAddressInfo[0] !== undefined ? editAddressInfo[0] : '';
        const secondaryAdress = editAddressInfo[1] !== undefined ? editAddressInfo[1] : '';
        // const editContactInfo = data.data.contacts?.length > 0 ? data.data?.contacts : '';
        const primaryContact = data.data.contacts?.filter(f=>f.member_type == "PRIMARY")[0] || ''
        const secondaryContact = data.data.contacts?.filter(f=>f.member_type == "SECONDARY")[0] || ''
        this.removeSecondaryAddressId = secondaryAdress.id;
        this.removeSecondaryContectId = secondaryContact.id;
        this.clientBasicAddEditInfo.push({
          primary: {
            label: 'edit',
            address_line1: primaryAdress.address_line1,
            address_line2: primaryAdress.address_line2,
            address_type: primaryAdress.address_type,
            city: primaryAdress.city,
            country: primaryAdress.country,
            state: primaryAdress.state,
            zipcode: primaryAdress.zipcode
          }
        },
          {
            secondary: {
              label: 'edit',
              address_line1: secondaryAdress.address_line1,
              address_line2: secondaryAdress.address_line2,
              address_type: secondaryAdress.address_type,
              city: secondaryAdress.city,
              country: secondaryAdress.country,
              state: secondaryAdress.state,
              zipcode: secondaryAdress.zipcode
            }
          },
          {
            primarycontacts: {
              id: primaryContact?.id,
              email: primaryContact?.email,
              first_name: primaryContact?.first_name,
              last_name: primaryContact?.last_name,
              phone: (primaryContact?.contact_numbers && primaryContact?.contact_numbers?.length > 0 && primaryContact?.contact_numbers[0]?.number)|| ''  ,
              designation: primaryContact?.title,
              phoneFomat:  (primaryContact?.contact_numbers && primaryContact?.contact_numbers?.length > 0 && primaryContact?.contact_numbers[0]?.iso2_code) || ''
            }
          },
          {
            secondarycontacts: {
              id: secondaryContact?.id,
              email: secondaryContact?.email,
              first_name: secondaryContact?.first_name,
              last_name: secondaryContact?.last_name,
              // phone: secondaryContact?.contact_phone,
              phone: secondaryContact?.contact_numbers && secondaryContact?.contact_numbers?.length > 0 && secondaryContact?.contact_numbers[0]?.number,
              designation: secondaryContact?.title,
              secondary_phoneFomat: secondaryContact?.contact_numbers && secondaryContact?.contact_numbers?.length > 0 && secondaryContact?.contact_numbers[0]?.iso2_code,
            }
          });
        this.createOrganizationType = 'visible';
      } else {
        this.createOrganizationType = 'hidden';
      }

      this.clickOutside = false;
    }));
  }

  ngOnChanges() {
    this.changeDetection.detectChanges();
    if (this.orgType === OrgTypes.TYPE_VENDOR) {
      let vendorValue;
      this.subscriptions.push(this.vendorcomponent?.vendorCreate?.valueChanges?.pipe(debounceTime(400),
        distinctUntilChanged()
      ).subscribe((data:any) => {

        if (vendorValue != data?.org_name) {
          if (this.editDataRow?.name != data?.org_name) {

            this.checkOrgName(data?.org_name, 'Vendor');
          }
          vendorValue = data?.org_name;
        }
        this.validForm = this.vendorcomponent.vendorCreate.status;
        this.orgFormData = this.vendorcomponent.vendorCreate.value;
        this.logoComponent = this.vendorcomponent.logoComponent;
      }));
    }
    if (this.orgType === OrgTypes.TYPE_MSP) {
      let mspValue;
      this.subscriptions.push(this.mspcomponent?.orgCreate?.valueChanges?.pipe(debounceTime(400),
        distinctUntilChanged()
      ).subscribe((data:any) => {

        if (mspValue != data?.org_name) {
          if (this.editDataRow?.name != data?.org_name) {
            this.checkOrgName(data?.org_name, 'MSP');
          }
          mspValue = data?.org_name;
        }
        this.validForm = this.mspcomponent.orgCreate.status;
        this.orgFormData = this.mspcomponent?.orgCreate.value;
        this.logoComponent = this.mspcomponent.logoComponent;
      }));
    }
    if (this.orgType === OrgTypes.TYPE_CLIENT) {

      let clientValue;
      this.subscriptions.push(this.clientcomponent?.clientCreate?.valueChanges.pipe(debounceTime(400),
        distinctUntilChanged()
      ).subscribe((data:any) => {

        if (clientValue != data?.org_name) {
          if (this.editDataRow?.name != data?.org_name) {
            this.checkOrgName(data?.org_name, 'Client');
          }
          clientValue = data?.org_name;
        }
        this.validForm = this.clientcomponent.clientCreate.status;
        this.orgFormData = this.clientcomponent.clientCreate.value;
        this.logoComponent = this.clientcomponent.logoComponent;
      }));
    }

    this.subscriptions.push(this.addresscomponent?.addressForm?.valueChanges?.subscribe((data:any) => {
      this.validAddressForm = this.addresscomponent.addressForm.status;
    }));
  }

  isSecondaryAddressRemoved(event) {
    this.removeSecondaryAddress = event.remove
  }

  isSecondaryContectRemoved(event) {
    this.removeSecondaryContect = event.remove
    this.isPrimaryContactTrue = event.remove;
  }

  getAllCountry(){
    this.subscriptions.push(this._programService.get(`/configurator/resources/countries?limit=300`).subscribe(
      (data:any) => {
        this.allCountryList = this.sortHelper.transform(data.countries, 'name');
      }
    ));
  }

  checkOrgName(term, type) {
    let org_Type;
    this.subscriptions.push(this._activatedRoute.params.subscribe((param:any) => {
      org_Type = param['term']
    }));
    if (term) {
      const params = (org_Type ? `category=${org_Type}&` : '') + `name_exact=${term}`;
      this.subscriptions.push(this._programService.get(`/configurator/organizations?${params}`).subscribe(
        (data: any) => {
          if (data.organizations.length > 0) {
            this.nameIsValid = false;
          }
          else {
            this.nameIsValid = true;
          }
          this.setValidtoOrg(type);
        }
      ));
    }
    else {
      this.nameIsValid = true;
      this.setValidtoOrg(type);
    }
  }

  getFieldValidation(field, fieldName) {
    // if(fieldName == 'phone') {
    //   return field ? field.toString()?.length < 10 ? true : false : false
    // }
    // else if (fieldName == 'email') {
    if (fieldName == 'email') {
      return !this.emailService.emailValidator(field);
    }
  }

  setValidtoOrg(type) {
    switch (type) {
      case 'Vendor':
        this.vendorcomponent.isNameValid = this.nameIsValid;
        break;
      case 'Client':
        this.clientcomponent.isNameValid = this.nameIsValid;
        break;
      case 'MSP':
        this.mspcomponent.isNameValid = this.nameIsValid;
    }
  }

  onContinue() {
    let chekvalidations = false;
    if (this.tabIndex === 0) {
      this.tabIndex = 1 + this.tabIndex;
    } else {
      const addressForm = this.addresscomponent.addressForm.value;

      let contactssecondary: any = {};
      if (addressForm?.secondary_contact_person) {
        contactssecondary.contact_name = addressForm?.secondary_contact_person;
      }
      if (addressForm?.secondary_designation) {
        contactssecondary.title = addressForm?.secondary_designation;
      }
      if (addressForm?.secondary_email) {
        contactssecondary.email = addressForm?.secondary_email;
      }
      if (addressForm?.secondary_phone) {
        contactssecondary.phone = addressForm?.secondary_phone;
      }
      let primarySelectedISD =  this.allCountryList.filter((v)=> v.iso_code_2 == addressForm?.phoneFormatCountry)
      let secondarySelectedISD =  this.allCountryList.filter((v)=> v.iso_code_2 == addressForm?.secondary_phoneFormatCountry)
      const payLoad = this.existOrgId ? {
        name: this.orgFormData.org_name,
        category: this.orgFormData.org_type,
        industries: this.orgFormData.vendor_industry,
        is_enabled: this.orgFormData?.status,
        inactive_reason: this.orgFormData?.client_inactivereason,
        logo: this.logoComponent?.logoUrl || null,
        addresses: [
          {
            type: 'PRIMARY',
            street_1: this.addresscomponent.address[0] == null ? '' : this.addresscomponent.address[0],
            street_2: this.addresscomponent.street_2[0] == null ? '' : this.addresscomponent.street_2[0],
            city: this.addresscomponent.city[0] == null ? '' : this.addresscomponent.city[0],
            state: this.addresscomponent.state[0] == null ? '' : this.addresscomponent.state[0],
            zipcode: this.addresscomponent.zipcode[0] == null ? '' : this.addresscomponent.zipcode[0],
            country: addressForm.country == null ? '' : addressForm.country,
          },
          {
            type: 'SECONDARY',
            street_1: this.addresscomponent.address[1]  == null ? '' : this.addresscomponent.address[1],
            street_2: this.addresscomponent.street_2[1] == null ? '' : this.addresscomponent.street_2[1],
            city: this.addresscomponent.city[1] == null ? '' : this.addresscomponent.city[1],
            state: this.addresscomponent.state[1] == null ? '' : this.addresscomponent.state[1],
            zipcode: this.addresscomponent.zipcode[1] == null ? '' : this.addresscomponent.zipcode[1],
            country: addressForm.secondarycountry == null ? '' : addressForm.secondarycountry,
          },
          {
            "remove":this.removeSecondaryAddress,
            "id":this.removeSecondaryAddressId ? this.removeSecondaryAddressId : ''
          }
        ],
        contacts: [
          {
            type: 'PRIMARY',
            id: addressForm.id || '',
            first_name: addressForm.first_name || '',
            last_name: addressForm.last_name || '',
            title: addressForm.designation || '',
            email: addressForm.email || '',
            phone: addressForm.phone || '',
            isd_code:primarySelectedISD[0]?.isd_code,
            iso2_code:primarySelectedISD[0]?.iso_code_2,
            phone_numbers: [
              {
                label: "PRIMARY",
                number:  addressForm.phone || null,
                isd_code: primarySelectedISD[0]?.isd_code,
                iso2_code:primarySelectedISD[0]?.iso_code_2,
              },
            ]
          },
          {
            type: 'SECONDARY',
            // contact_name: addressForm?.secondary_contact_person || '',
            id: addressForm.secondary_id || '',
            first_name: addressForm.secondary_first_name || '',
            last_name: addressForm.secondary_last_name || '',
            title: addressForm?.secondary_designation,
            email: addressForm?.secondary_email || '',
            phone: addressForm?.secondary_phone || '',
            isd_code:secondarySelectedISD[0]?.isd_code,
            phone_numbers: [
              {
                label: "SECONDARY",
                number:  addressForm.secondary_phone || null,
                isd_code:secondarySelectedISD[0]?.isd_code,
                iso2_code:secondarySelectedISD[0]?.iso_code_2,
              }
            ]
          },
          {
            "remove":this.removeSecondaryContect,
            "id":this.removeSecondaryContectId ? this.removeSecondaryContectId : ''
          }
        ],
      } : {
        name: this.orgFormData.org_name,
        category: this.orgFormData.org_type,
        industries: this.orgFormData.vendor_industry,
        is_enabled: this.orgFormData?.status,
        inactive_reason: this.orgFormData?.client_inactivereason,
        logo: this.logoComponent?.logoUrl || null,
        addresses: [
          {
            type: 'PRIMARY',
            street_1: this.addresscomponent.address[0] == null ? '' : this.addresscomponent.address[0],
            street_2: this.addresscomponent.street_2[0] == null ? '' : this.addresscomponent.street_2[0],
            city: this.addresscomponent.city[0] == null ? '' : this.addresscomponent.city[0],
            state: this.addresscomponent.state[0] == null ? '' : this.addresscomponent.state[0],
            zipcode: this.addresscomponent.zipcode[0] == null ? '' : this.addresscomponent.zipcode[0],
            country: addressForm.country == null ? '' : addressForm.country,
          },
          {
            type: 'SECONDARY',
            street_1: this.addresscomponent.address[1]  == null ? '' : this.addresscomponent.address[1],
            street_2: this.addresscomponent.street_2[1] == null ? '' : this.addresscomponent.street_2[1],
            city: this.addresscomponent.city[1] == null ? '' : this.addresscomponent.city[1],
            state: this.addresscomponent.state[1] == null ? '' : this.addresscomponent.state[1],
            zipcode: this.addresscomponent.zipcode[1] == null ? '' : this.addresscomponent.zipcode[1],
            country: addressForm.secondarycountry == null ? '' : addressForm.secondarycountry,
          }
        ],
        contacts: [
          {
            type: 'PRIMARY',
            id: addressForm.id || '',
            first_name: addressForm.first_name || '',
            last_name: addressForm.last_name || '',
            title: addressForm.designation || '',
            email: addressForm.email || '',
            phone: addressForm.phone || '',
            isd_code:primarySelectedISD[0]?.isd_code,
            iso2_code:primarySelectedISD[0]?.iso_code_2,
            phone_numbers: [
              {
                label: "PRIMARY",
                number:  addressForm.phone || null,
                isd_code: primarySelectedISD[0]?.isd_code,
                iso2_code:primarySelectedISD[0]?.iso_code_2,
            },
            ]
          },
          {
            type: 'SECONDARY',
            // contact_name: addressForm?.secondary_contact_person || '',
            id: addressForm.secondary_id || '',
            first_name: addressForm.secondary_first_name || '',
            last_name: addressForm.secondary_last_name || '',
            title: addressForm?.secondary_designation,
            email: addressForm?.secondary_email || '',
            phone: addressForm?.secondary_phone || '',
            isd_code:secondarySelectedISD[0]?.isd_code,
            phone_numbers: [
              {
                label: "SECONDARY",
                number:  addressForm.secondary_phone || null,
                isd_code:secondarySelectedISD[0]?.isd_code,
                iso2_code:secondarySelectedISD[0]?.iso_code_2,
              }
            ]
          }
        ],
      };
      if(!this.isPrimaryContactTrue){
        payLoad?.contacts.splice(2,1);
      }
     if (!payLoad.contacts[0]?.phone_numbers[0]?.number){
      payLoad.contacts[0].phone_numbers[0].number = null;
     }
     if (!payLoad.contacts[1]?.phone_numbers[0]?.number){
      payLoad.contacts[1].phone_numbers[0].number = null;
     }
     if(payLoad.is_enabled === 'Active'){
       payLoad.is_enabled = true;
     }
     if(payLoad.is_enabled === 'Inactive'){
       payLoad.is_enabled = false;
     }
     if(this.existOrgId) {
      payLoad.addresses = payLoad.addresses.filter(add => (add.country && add.type) || (add.id && add.remove));
      payLoad.contacts = payLoad.contacts.filter(cont => (cont.first_name && cont.last_name && cont.email) || (cont.id && cont.remove) );
     } else {
      payLoad.addresses = payLoad.addresses.filter(add => add.country && add.type);
      payLoad.contacts = payLoad.contacts.filter(cont => cont.first_name && cont.last_name && cont.email);
      payLoad.contacts.forEach(element => {
        delete element.id
      });
     }
      if (this.logoComponent?.logoSize !== '' && this.logoComponent?.logoSize !== undefined) {
        chekvalidations = true;
      }
      if (chekvalidations) {
        this.chekvalidations = true;
      } else { this.chekvalidations = false; }
      if (!this.chekvalidations || this.chekvalidations === 'undefined') {
        // this._loadService.show();

        if(!payLoad?.inactive_reason) {
          delete payLoad?.inactive_reason;
        }

        if (this.existOrgId) {
          this.isSaveLoader = true;
          payLoad?.industries?.length == 0 ? payLoad.industries = null : payLoad?.industries
          payLoad?.contacts?.length  == 0 ? payLoad.contacts = null : payLoad?.contacts;
          this.subscriptions.push(this._programService.put(`/configurator/organizations/${this.existOrgId}`, payLoad).subscribe((data:any) => {
            this.UpdateFormData(data, 'Updated');
            this.isSaveLoader = false;
            this.tabIndex = 0;
            this.isPrimaryContactTrue = false;
            this.eventStream.emit(new EmitEvent(Events.ORG_EDIT, false));
            this.eventStream.emit(new EmitEvent(Events.ORG_CREATE, false));
          }, err => {
            // this._loadService.hide();
            this.isSaveLoader = false;
            this.isPrimaryContactTrue = false;
            this._alert.error(errorHandler(err));
          }));
        }
        else {
          this.isSaveLoader = true;
          payLoad?.contacts?.length  == 0 ? payLoad.contacts = null : payLoad?.contacts;
          this.subscriptions.push(
            this._programService.post('/configurator/organizations', payLoad).subscribe({
              next: (data: any) => {
                if (data?.organization?.id) {
                  this.orgId = data?.organization?.id;
                  this.isSaveLoader = false;
                  this.isPrimaryContactTrue = false;
                  this.UpdateFormData(data, 'Created');
                  this.tabIndex = 0;
                  let param = { key: false, name: payLoad.name };
                  this.eventStream.emit(new EmitEvent(Events.ORG_CREATE, param));
                  this.sidebarClose();
                }
              },
              error: (err: Error | any) => {
                // this._loadService.hide();
                this.isSaveLoader = false;
                this.isPrimaryContactTrue = false;
                this._alert.error(errorHandler(err));
              },
            }),
          );
        }
      }
    }
  }

  UpdateFormData(data, type) {
    let orgType;
    if (this.orgType === 'TYPE_CLIENT') {
      orgType = 'Client';
      this.clientcomponent.clientCreate.reset();
    }
    if (this.orgType === 'TYPE_VENDOR') {
      orgType = 'Vendor';
      this.vendorcomponent.vendorCreate.reset();
    }
    if (this.orgType === 'TYPE_MSP') {
      orgType = 'MSP';
      this.mspcomponent.orgCreate.reset();
    }
    this.addresscomponent.addressForm.reset();
    this.addresscomponent.street_2[0] = '';
    this.addresscomponent.address[0] = '';
    this.addresscomponent.city[0] = '';
    this.addresscomponent.state[0] = '';
    this.addresscomponent.zipcode[0] = '';
    this.addresscomponent.street_2[1] = '';
    this.addresscomponent.address[1] = '';
    this.addresscomponent.city[1] = '';
    this.addresscomponent.state[1] = '';
    this.addresscomponent.zipcode[1] = '';

    this.logoComponent.croppedImage = '';
    let msg;
    if (type === 'Create') {
      msg = ` New ${orgType} ${type} Successfully`;
    }
    else {
      msg = `${orgType} ${type} Successfully`;
    }

    this._alert.success(msg, {
      color: 'white',
      bgColor: 'lightgreen',
      type: { INTERVAL_TIME: 3000 }
    });
    this._loadService.hide();
    this.sidebarClose()
  }

  onIndexChange(event) {
    this.tabIndex = event;
  }

  createOrg() {
    this.eventStream.emit(new EmitEvent(Events.IsNoOrg, false));
    this.router.navigate(['/settings/list']);
  }

  cancelOrgCreate() {
    this.eventStream.emit(new EmitEvent(Events.DO_SHOW_CLIENT_FORM, false));
  }

  sidebarClose() {
    this.eventStream.emit(new EmitEvent(Events.ORG_CREATE, false));
    this.validAddressForm = 'INVALID'
    this.clientBasicEditInfo = [];
    this.clientBasicAddEditInfo = [];
    this.existOrgId = null;
    this.addresscomponent.addressForm.reset();
    if (this.orgType === 'TYPE_CLIENT') {
      this.clientcomponent.logoComponent.croppedImage = '';
      this.clientcomponent.logoComponent.logoUrl = '';

    } else if (this.orgType === 'TYPE_MSP') {
      this.mspcomponent.logoComponent.croppedImage = '';
      this.mspcomponent.logoComponent.logoUrl = '';
    } else if (this.orgType === 'TYPE_VENDOR') {
      this.vendorcomponent.logoComponent.croppedImage = '';
      this.vendorcomponent.logoComponent.logoUrl = '';
    }
    this.tabIndex = 0;
  }

  get isVendorStepValid(): boolean {

    // Initial validations
    let invalid: boolean = (this.validForm == 'INVALID') || !this.nameIsValid;

    // Primary validations
    invalid = invalid || (
      !this.addresscomponent?.addressForm?.value.first_name ||
      !this.addresscomponent?.addressForm?.value.last_name ||
      !this.addresscomponent?.addressForm?.value.phone ||
      !this.addresscomponent?.addressForm?.value?.email ||
      this.getFieldValidation(this.addresscomponent?.addressForm?.value?.email, 'email') ||
      this.addresscomponent?.addressForm?.get('phone')?.invalid
    );

    // Secondary validations
    if(!!Number(this.addresscomponent?.addressForm?.value.secondary_open)) {
      invalid = invalid || (
        (
          !this.addresscomponent?.addressForm?.value.secondary_first_name ||
          !this.addresscomponent?.addressForm?.value.secondary_last_name ||
          !this.addresscomponent?.addressForm?.value?.secondary_email ||
          !this.addresscomponent?.addressForm?.value?.secondary_phone ||
          this.getFieldValidation(this.addresscomponent?.addressForm?.value?.secondary_email, 'email') ||
          this.addresscomponent?.addressForm?.get('secondary_phone')?.invalid
        )
      )
    }

    return invalid;
  }
}
