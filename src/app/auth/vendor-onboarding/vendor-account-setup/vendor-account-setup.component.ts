import { Component, EventEmitter, OnDestroy, OnInit, Output,ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { StorageService } from 'src/app/core/services/storage.service';
import { AlertService } from '../../../core/components/alert/alert.service';
import { AbstractControl, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { Subscription, } from 'rxjs';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { UserService } from 'src/app/core/services/user.service';
import { ProgramService } from 'src/app/programs/program.service';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { AccountService } from '../account.service';
import { SortHelperPipe } from 'src/app/shared/pipe/sort-helper.pipe';
import { SearchAddressComponent } from 'src/app/shared/components/search-address/search-address.component';
@Component({
  selector: 'app-vendor-account-setup',
  templateUrl: './vendor-account-setup.component.html',
  styleUrls: [
    '../../../../assets/sass/self-config/config-main.scss',
    '../../../../assets/sass/self-config/config-main-2.scss',
    './vendor-account-setup.component.scss']
})
export class VendorAccountSetupComponent implements OnInit, OnDestroy {
  @Output() onNext = new EventEmitter();
  @Output() onBack = new EventEmitter(false);
  secretquestion = false;
  setpassword = false;
  key: any;
  clientNameAvailable = false;
  buttonDisable = false;
  isValidUserName: boolean = true;
  isClientValid = false;
  userMail: any;
  userNameAlreadyExist = false;
  validatingUserName = false;
  isFirstNameError = false;
  isLastNameError = false;
  isTitleError = false;
  isUserNameError = false;
  errorMassage = '';
  userToken: any;
  orgId: any;
  userInfo: any = {};
  userDetail: any = {};
  currentProgramId:any;
  public addressForm: UntypedFormGroup;
  public allCountryList: Array <any> = [];
  public zipcodePattern: RegExp = /^[a-zA-Z0-9 -]+$/gm;
  userBasicInformation:any;
  acceptedTC: boolean = false;
  countryShortName: string = '';
  public selectedPreAddress = false;
  modalVisibility: boolean = false;
  countryMap: Map <string, string> = new Map <string, string> ();
  @ViewChild('searchAddress') searchAddress: SearchAddressComponent;
  private subscriptions: Array <Subscription> = [];

  constructor(
    private storageService: StorageService,
    private router: Router,
    private route: ActivatedRoute,
    private alertService: AlertService,
    private loaderService: LoaderService,
    private programService: ProgramService,
    private sortPipe: SortHelperPipe,
    private accountService: AccountService,private userService: UserService
  ) { }

  ngOnInit() {
    this.userBasicInformation = this.storageService.get('userBasicInformation')
    this.initializeForm();
    this.getAllCountry();
    this.getVendorInviteSearch()

    this.route.queryParams.subscribe(
      params => {
        this.orgId = params['orgId'];
        this.userToken = params['token']
      }
    )
    if (this.storageService.get('userEmail')) {
      var email = this.storageService.get('userEmail');
      this.userMail = this.removedPlus(email);
    }

  }

  initializeForm() {
    this.addressForm = new UntypedFormGroup({
      'country': new UntypedFormControl(null, [Validators.required]),
      'state': new UntypedFormControl(null),
      'city': new UntypedFormControl(null),
      'county': new UntypedFormControl(''),
      'zipcode': new UntypedFormControl(''),
      'address': new UntypedFormControl(''),
      'address2': new UntypedFormControl(''),
    });

    if (this.isZipcodeMandatory) {
      this.addressForm.get('zipcode').addValidators([Validators.required]);
      this.addressForm.get('zipcode').updateValueAndValidity();
      this.addressForm.updateValueAndValidity();
    }
  }
  setPreferredLocation(place: object) {
    this.addressForm?.get('city').setValue((this.getCity(place) || '').trim());
    this.addressForm?.get('state').setValue((this.getState(place) || '').trim());
    this.addressForm?.get('county').setValue((this.getCounty(place) || '').trim());
    this.addressForm?.get('zipcode').setValue((this.getPostCode(place) || '').trim());
  }

  getCity(place) {
    const COMPONENT_TEMPLATE = { locality: 'long_name' };
    const city = this.getAddrComponent(place, COMPONENT_TEMPLATE);
    return city;
  }

  getStreet(place) {
    const COMPONENT_TEMPLATE = { route: 'long_name' };
    const street = this.getAddrComponent(place, COMPONENT_TEMPLATE);
    return street;
  }

  getArea(place) {
    const COMPONENT_TEMPLATE = { colloquial_area: 'long_name' };
    const street = this.getAddrComponent(place, COMPONENT_TEMPLATE);
    return street;
  }

  getPostCode(place) {
    const COMPONENT_TEMPLATE = { postal_code: 'long_name' };
    const postCode = this.getAddrComponent(place, COMPONENT_TEMPLATE);
    return postCode;
  }

  getState(place) {
    const COMPONENT_TEMPLATE = { administrative_area_level_1: 'short_name' };
    const state = this.getAddrComponent(place, COMPONENT_TEMPLATE);
    return state;
  }

  getCountry(place) {
    const COMPONENT_TEMPLATE = { country: 'long_name' };
    const country = this.getAddrComponent(place, COMPONENT_TEMPLATE);
    return country;
  }

  getCounty(place) {
    const COMPONENT_TEMPLATE = { administrative_area_level_2: 'long_name'};
    const county = this.getAddrComponent(place, COMPONENT_TEMPLATE);
    return county;
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


  removedPlus(email) {
    return email?.replaceAll('+', '%2B');
  }
  public onKeydown(event: KeyboardEvent) {
    this.key = event.keyCode;
    if ((this.key >= 15 && this.key <= 64) || (this.key >= 123) || (this.key >= 96 && this.key <= 105)) {
      event.preventDefault();
    }
  }
  clean(obj) {
    for (const propName in obj) {
      if (!obj[propName] || obj[propName] === null || obj[propName] === undefined) {
        delete obj[propName];
      }
    }
    return obj;
  }

  onBackClick() {
    this.router.navigate(['auth/vendor-onboarding/setup-password'], { queryParams: { orgId: this.orgId, token: this.userToken } });
  }

  finalSubmit() {
    this.buttonDisable = true;
    this.loaderService.show();
    this.addressForm.markAllAsTouched();

    this.accountService.setPasswordViaInvitaionToken(this.userBasicInformation.orgId, this.userBasicInformation.userToken, this.userBasicInformation.password).subscribe({
      next: (setPasswordResponse: any) => {
        this.accountService.updateAvatar(this.userBasicInformation.orgId, this.userBasicInformation.userToken,this.userBasicInformation.image).subscribe({
          next: (setAvatarResponse: any) => {
            this.accountService.uploadMembers(this.userBasicInformation.orgId, this.userBasicInformation.userToken,this.userBasicInformation).subscribe({
              next: (memberUpdateResponse: any) => {
                let authPayload = { username: this.userBasicInformation.username, password: this.userBasicInformation.password };
                this.accountService.login(authPayload).subscribe({
                  next: (res: any) => {
                    this.storageService.set("Token", res['token'], true);
                    this.userService.getAllPrograms().subscribe({
                      next: data => {
                        this.storageService.set("currentProgram", data?.programs[0], true);
                        this.currentProgramId =  data?.programs[0]?.id
                        let url: string = `/configurator/programs/${this.currentProgramId}/vendors/invite/${this.userInfo.vendorSearchInviteId}/accept/`;
                        let payload = {
                          address: {
                            country_obj:this.addressForm.value.country,
                            state:this.addressForm.value.state,
                            city:this.addressForm.value.city,
                            county:this.addressForm.value.county,
                            zipcode:this.addressForm.value.zipcode,
                            address_line1:this.addressForm.value.address,
                            address_line2:this.addressForm.value.address2
                          },
                          is_msa_signed:this.acceptedTC
                        }

                        this.programService.post(url,payload).subscribe(
                          (tncSignedRes: any) => {
                            if (tncSignedRes) {
                              this.onNext.emit(this.userInfo);
                            }
                          },
                          err => {
                            this.buttonDisable = false;
                            this.loaderService.hide();
                           this.alertService.error(errorHandler(err));
                          },
                        );
                      },
                      error: (err) => {
                        this.buttonDisable = false;
                        this.loaderService.hide();
                      }
                    })
                  },
                  error: (err) => {
                    console.error(err);
                    this.buttonDisable = false;
                    this.alertService.error(err.error?.error?.message ? err.error?.error?.message :  err.error, {})
                  }
                });
              },
              error: (err) => {
                this.loaderService.hide();
                this.buttonDisable = false;
                this.alertService.error(err.error?.error?.message ? err.error?.error?.message :  err.error, {})
                this.onBackClick();
              }
            });
          },
          error: (err) => {
            console.error(err);
            this.buttonDisable = false;
            this.loaderService.hide();
            this.alertService.error(err.error?.error?.message ? err.error?.error?.message :  err.error, {})
            this.onBackClick();
          }
        });
      },
      error: (err) => {
        console.error(err);
        this.buttonDisable = false;
        this.loaderService.hide();
        this.alertService.error(err.error?.error?.message ? err.error?.error?.message :  err.error, {})
        this.onBackClick();
      }
    });
    this.loaderService.hide();
  }




  resetError(fieldName) {
    if (this.userInfo[fieldName]) {
      if (fieldName === 'title') {
        this.isTitleError = false;
      } else if (fieldName === 'first_name') {
        this.isFirstNameError = false;
      } else if (fieldName === 'last_name') {
        this.isLastNameError = false;
      }
    }
  }
  getVendorInviteSearch() {
    let url: string = `/configurator/public/vendors/invite/search`;
    let payload = {
      "invite_token": this.userBasicInformation?.userToken
    }
    this.loaderService.show();
    this.programService.post(url,payload).subscribe(
      (data: any) => {
        if (data) {
          this.userInfo.vendorSearchInviteId = data?.vendor_invites[0]?.id
          this.userInfo.vendorName=data?.vendor_invites[0]?.vendor.name
          this.loaderService.hide();
        }
      },
      err => {
        this.loaderService.hide();
       // this.alertService.error(errorHandler(err));
      },
    );
    this.loaderService.hide();
  }
  getAllCountry() {
    let url: string = `/configurator/public/resources/countries?limit=300`;

    this.loaderService.show();
    this.programService.get(url).subscribe(
      (data: any) => {
        if (data) {
          this.loaderService.hide();
          this.allCountryList = (data?.countries || []);
          this.allCountryList = this.sortPipe.transform(this.allCountryList, 'name');
          if (Array.isArray(this.allCountryList)) {
            this.allCountryList = data?.countries?.sort((c1, c2) => c1?.name?.localeCompare(c2?.name));
            this.countryShortName = 'US';
          }
        }
      },
      err => {
        this.loaderService.hide();
       // this.alertService.error(errorHandler(err));
      },
    );
  }


  changeCountry(id: string) {
    this.countryShortName = this.allCountryList.filter(f=>f.id == id)[0].iso_code_2
    this.searchAddress.addresstext.nativeElement.value = ''
    this.addressForm?.get('address2').setValue('');
    this.addressForm?.get('city').setValue('');
    this.addressForm?.get('state').setValue('');
    this.addressForm?.get('county').setValue('');
    this.addressForm?.get('zipcode').setValue('');
  }




  ngOnDestroy(): void {
    this.subscriptions.forEach((sub: Subscription) => {
      sub?.unsubscribe();
    });
  }

  get isZipcodeMandatory() {
    return true;
  }

  get form(): AbstractControl {
    return this.addressForm as AbstractControl;
  }
}

