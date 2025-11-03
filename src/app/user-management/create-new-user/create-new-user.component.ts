import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, throttleTime } from 'rxjs/operators';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { EmitEvent, Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { SearchAddressComponent } from 'src/app/shared/components/search-address/search-address.component';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { UserService } from 'src/app/core/services/user.service';
import { ProgramService } from 'src/app/programs/program.service';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { PhoneUtilityService } from 'src/app/shared/service/utility/phone-utility.service';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { DATE_FORMAT } from 'src/app/library/date-format/date-format.model';
import { AuthorizationService } from 'src/app/core/services/authorize.service';
import { SSOInfo } from 'src/app/organizations/components/sso-setting-info/sso-setting-info.component';
import { SvmsRouterService } from 'src/app/core/services/svms-router.service';
import { SortHelperPipe } from 'src/app/shared/pipe/sort-helper.pipe';
@Component({
  selector: 'vms-create-new-user',
  templateUrl: './create-new-user.component.html',
  styleUrls: ['./create-new-user.component.scss'],
})
export class CreateNewUserComponent implements OnInit, OnDestroy {
  /* Input Fields */
  @Input() hideSSO: boolean = false;
  @Input() createUser = 'visible';
  @Input() public list_or_create: boolean = false;
  @Input() reloadPage;
  @Input() public viewData: any = null;
  @Input() isViewClicked;
  @Input() category;
  @Input() org;
  allCountryList = [];
  socialProfileArr = [
    {
      type: null,
      link: 'https://',
    },
  ];
  social_links: any;
  start_date_options: any = {
    language: 'English',
    timepicker: true,
    format12h: true,
    range: false,
    enabledDateRanges: [],
  };
  addnewDisabled: boolean = false;
  isEdit: boolean = false;

  @Output() onUpdate: EventEmitter<number> = new EventEmitter();
  @ViewChild(SearchAddressComponent) googleAddressComponent: SearchAddressComponent;

  /* Component or Class Fields: START */
  // Private Fields
  private subscriptions: Subscription[] = [];
  private countrySub: Subject<string> = new Subject<string>();
  private SupervisorSub: Subject<string> = new Subject<string>();
  private UserRoleSub: Subject<string> = new Subject<string>();

  // Public Fields
  public orgId: string;
  public createUserForm: UntypedFormGroup;
  public countryShortName: any = 'any';
  public countrySecondaryShortName: any = 'any';
  public isVendorSelected: boolean = false;
  public searchTerm: string = '';

  fieldRqdMsg = 'This field is required.';
  emailValidation = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  phoneValidation = '^((\\+1-?)|0)?[0-9]{10}$';
  show_org: boolean = false;
  title = 'Create User';
  isViewMode = false;
  id = '';
  isEditMode = false;
  editData: any;
  supervisor_id: '';
  labor_categories: [];
  work_locations: [];
  roleEditId: string = null;
  ethnicRaces = [];
  roles: any = [];
  orgLists: any = [];
  selectedCatgrs: string = '';
  members: any = {};
  addressRespType = 'fullAddress';
  selectedOrg = null;
  show_org_error: boolean = false;
  isSaveLoader: boolean = false;
  isSubmited: boolean = false;
  org_catgrs = ['Client', 'MSP', 'Vendor', 'SimplifyVMS'];
  lastActiveCategory: {};
  countries = [
    { flag: '../../../assets/images/flag/English (Canada).png', name: 'Canada', extsn: '+1' },
    { flag: '../../../assets/images/flag/English (United States).png', name: 'USA', extsn: '+1' },
    { flag: '../../../assets/images/flag/हिन्दी.png', name: 'India', extsn: '+91' },
  ];
  emailSecondary: boolean = false;
  phoneSecondary: boolean = false;
  addressSecondary: boolean = false;
  onSuccess = false;
  profilePic = '';
  roleLoading: boolean = false;
  supervisorLoading: boolean = false;
  programDetails: any = {};

  public categoryListLoading: boolean = false;
  private categoryListSubject: Subject<string> = new Subject<string>();
  public isControl = this.router?.url?.includes('control-panel');
  hasSSOEditPermission:boolean = false;
  public support_text: any = { };
  showSupportingText:boolean = false;
  /* Component or Class Fields: END */

  constructor(
    public router: Router,
    private fb: UntypedFormBuilder,
    private programService: ProgramService,
    private _alertService: AlertService,
    private localStorage: StorageService,
    private eventStream: EventStreamService,
    public userService: UserService,
    private datePipe: LocalDateFormatPipe,
    private loaderService: LoaderService,
    private phoneUtilService: PhoneUtilityService,
    private authorizationService: AuthorizationService,
    private svmsRouter: SvmsRouterService,
    private sortPipe: SortHelperPipe
  )
  { }

  ngOnInit(): void {

    this.programDetails = this.localStorage.get(StorageKeys.CURRENT_PROGRAM);
    this.orgId = this.localStorage.get(StorageKeys.ORGANIZATION_ID);
    const _userType = this.localStorage.get(StorageKeys.USER_TYPE);

    if (_userType === 'SUPER_ORG' || _userType === 'MSP' || this.hasCreateUserPermission) {
      this.show_org = true;
    }

    if (_userType === 'MSP' || this.hasCreateUserPermission || !this.isControl) {
      this.org_catgrs = ['Client', 'MSP', 'Vendor'];
    }

    this.social_links = [
      { type: 'linkedin', title: 'Linked In', image_path: '/assets/images/linkedin.svg', disabled: false },
      { type: 'git', title: 'GitHub', image_path: '/assets/images/github.svg', disabled: false },
      { type: 'skype', title: 'Skype', image_path: '/assets/images/skype.svg', disabled: false },
      { type: 'instagram', title: 'Instagram', image_path: '/assets/images/instagram.svg', disabled: false },
      { type: 'facebook', title: 'Facebook', image_path: '/assets/images/facebook.svg', disabled: false },
    ];

    let date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate());

    this.getAllCountry();
    this.userFormCreation();
    this.subscribeCreateUser();
    this.subscribeEditUser();
    this.subscribeViewUser();
    this.subscribeDisableUser();
    this.subscribeDeleteUser();
    this.subscribeSidebarClose();
    this.getEthnicRace();

    if (this.isVendorSelected) {
      this.getLaborCategoriesList();
      this.getWorkLocations();
    } else {
      const formControls = this.form;
      formControls.labor_category.disable();
      formControls.region.disable();
    }

    this.getOrganizationList(this.selectedCatgrs);
    this.listUsers();

    this.subscriptions.push(
      this.countrySub.pipe(debounceTime(500)).subscribe(res => {
        this.getAllCountry(res);
      }),
    );

    this.subscriptions.push(
      this.SupervisorSub.pipe(debounceTime(500)).subscribe(res => {
        this.listUsers(res);
      }),
    );

   this.subscriptions.push(
      this.categoryListSubject.pipe(debounceTime(600), throttleTime(600)).subscribe(term => {
        this.getOrganizationList(this.selectedCatgrs, term);
      }),
    );
  }

  ngOnDestroy(): void {
    this.subscriptions?.forEach(sub => sub.unsubscribe());
  }

  showSSOField(ssoSetting: SSOInfo) {
    let showSSO: boolean = false;
    if (ssoSetting?.is_enabled) {
      this.hasSSOEditPermission = this.authorizationService.authorize('sso_manage');
      showSSO = this.authorizationService.authorize('sso_view') || this.hasSSOEditPermission;
    }
    return showSSO;
  }

  onCountryChange(): void {
    let ind = -1;
    for (let i = 0; i < this.allCountryList.length; i++) {
      if (this.form.country.value === this.allCountryList[i].id) {
        ind = i;
        this.countryShortName = this.allCountryList[i].iso_code_2;
        this.countrySecondaryShortName = this.allCountryList[i].iso_code_2;
        this.googleAddressComponent?.getPlaceAutocomplete(this.countryShortName);
        break;
      }
    }

    if (ind != -1) {
      if (this.isEditMode) {
        this.form.phoneFormatCountryPrimary.setValue(this.allCountryList[ind].iso_code_2);
        this.form.phoneFormatCountrySecondary.setValue(this.allCountryList[ind].iso_code_2);
        this.form.phone.enable();
        this.form.phone_secondary.enable();
      } else {
        this.form.phoneFormatCountryPrimary.setValue(this.allCountryList[ind].iso_code_2);
        this.form.phoneFormatCountrySecondary.setValue(this.allCountryList[ind].iso_code_2);
        this.form.phone.enable();
        this.form.phone_secondary.enable();
      }
      this.phoneLengthValidation();
    }
  }

  userFormCreation(): void {
    // The User Form will get created here
    this.createUserForm = this.fb.group({
      prefix: new UntypedFormControl(null),
      suffix: new UntypedFormControl(null),
      fname: new UntypedFormControl('', [Validators.required]),
      mname: new UntypedFormControl(''),
      lname: new UntypedFormControl('', [Validators.required]),
      title: new UntypedFormControl(''),
      user_mail: new UntypedFormControl('', [Validators.required, Validators.pattern(this.emailValidation)]),
      sso_id: new UntypedFormControl(''),
      user_mail_secondary: new UntypedFormControl(null, Validators.pattern(this.emailValidation)),
      supervisor: new UntypedFormControl(null),
      phone: new UntypedFormControl('', [Validators.pattern(this.phoneValidation)]),
      phone_secondary: new UntypedFormControl('', [Validators.pattern(this.phoneValidation)]),
      phoneFormatCountryPrimary: ['US', ''],
      phoneFormatCountrySecondary: ['USA', ''],
      country: new UntypedFormControl(null, [Validators.required]),
      address: new UntypedFormControl(''),
      address_secondary: new UntypedFormControl(''),
      labor_category: new UntypedFormControl(''),
      region: new UntypedFormControl(''),
      assign: new UntypedFormControl(''),
      avatar: [],
    });
  }

  setSSOSetting = (organisationId:string) => {
    if (organisationId) {
      const url = `/global-tms/ssoproviders/all?org_id=${organisationId}`;
      this.programService.get(url).subscribe((result: any) => {
         if(result){
          let orgType = this.localStorage.get(StorageKeys.PROFILE_ORG_CATEGORY);
          if(orgType == 'WORKER' || orgType == 'WORKERS' || orgType == 'Worker' || orgType == 'Workers' || orgType == 'worker' || orgType == 'workers')
          {
            const workerUrl = `/global-tms/ssoproviders/check-worker-sso/${organisationId}`;
            this.programService.get(workerUrl).subscribe((workerResult: any) => {
               if(result){
                this.hideSSO = !this.showSSOField(result) && !workerResult.worker_sso_update_allowed
               }
            });
          }else{
            this.hideSSO = !this.showSSOField(result);
          }

         }
      });
    }else{
      this.hideSSO = true;
    }
  }

  subscribeCreateUser(): void {
    // CREATE_USER Subscription
    this.subscriptions.push(
      this.eventStream.on(Events.CREATE_USER).subscribe(data => {
        if (data) {
          this.setSSOSetting(data.orgId);
          this.createUser = 'visible';
          this.title = 'Create User';
          this.isViewMode = false;
          this.category = this.category === 'CLIENT' ? 'Client' : this.category === 'VENDOR' ? 'Vendor' : this.category;
          this.selectedCatgrs = this.show_org ? (this.category ? this.category : '') : this.localStorage.get('user_type');
          this.selectedOrg = null;
          this.onSuccess = false;
          this.roles = [];
          this.form.user_mail.enable();
          if (this.show_org) {
            this.org_catgrs.forEach(e => document.getElementById('tab' + e).classList.remove('btn-selected'));
            if (this.category) {
              document.getElementById('tab' + this.category).classList.add('btn-selected');
              this.getOrganizationList(this.selectedCatgrs);
              this.selectedOrg = this.org;
            }
          } else {
            this.getOrganizationList(this.selectedCatgrs);
          }
          this.addnewDisabled = false;
          this.form.phoneFormatCountryPrimary.setValue('US');
          this.form.phoneFormatCountrySecondary.setValue(this.allCountryList[0].iso_code_2);
          this.form.phone.disable();
          this.form.phone_secondary.disable();
          this.countryShortName = 'all';
          this.countrySecondaryShortName = 'all';
          this.googleAddressComponent?.getPlaceAutocomplete(this.countryShortName);
        }
      }),
    );
  }

  subscribeEditUser(): void {
    // EDIT_USER Subscription
    this.isEdit = true;
    // let ethnic_race_ind: any = null;
    let phone_country_pri: any = null;
    let phone_country_sec: any = null;
    let country_ind: any = null;

    this.subscriptions.push(
      this.eventStream.on(Events.EDIT_USER).subscribe(data => {
        if (data) {
          this.editData = data;
          if (data?.role?.organization_category === 'VENDOR') {
            this.isVendorSelected = true;
          }

          // if (data.ethnic_race !== null) {
          //   for (let i = 0; i < this.ethnicRaces.length; i++) {
          //     if (this.ethnicRaces[i].id === data.ethnic_race.id) {
          //       ethnic_race_ind = i;
          //     }
          //   }
          // }

          this.countryShortName = 'all';
          this.countrySecondaryShortName = 'all';
          if (data.country) {
            for (let i = 0; i < this.allCountryList.length; i++) {
              if (this.allCountryList[i].id === data.country.id) {
                country_ind = i;
                this.countryShortName = this.allCountryList[i].iso_code_2;
                this.countrySecondaryShortName = this.allCountryList[i].iso_code_2;
                this.googleAddressComponent?.getPlaceAutocomplete(this.countryShortName);
              }
            }
          }

          for (let i = 0; i < this.allCountryList.length; i++) {
            if (data.contacts.length === 1) {
              if (this.allCountryList[i].iso_code_2 === data.contacts[0]?.iso2_code) {
                phone_country_pri = i;
              }
            }
            if (data.contacts.length === 2) {
              if (this.allCountryList[i].iso_code_2 === data.contacts[0]?.iso2_code) {
                phone_country_pri = i;
              }
              if (this.allCountryList[i].iso_code_2 === data.contacts[1]?.iso2_code) {
                phone_country_sec = i;
              }
            }
          }

          if (data.organization) {
            this.orgId = this.selectedOrg = data.organization.id;
          } else {
            this.orgId = this.selectedOrg = data.orgId;
          }
          let url = `/configurator/organizations/${data.organization ? data.organization.id : data.orgId}?program_id=${this.programId}`;
          if (this.isControl) {
            url = `/configurator/organizations/${data.organization ? data.organization.id : data.orgId}`;
          }
          this.loaderService.show();
          this.subscriptions.push(
            this.programService.get(url).subscribe((orgData: any) => {
              if (orgData) {
                this.setSSOSetting(this.orgId)
                this.selectedCatgrs = orgData.category === 'SUPER_ORG' ? orgData.name : orgData.category;
                this.orgId = orgData.id;
                this.selectedOrg = orgData.id;
                this.loaderService.hide();
                this.subscriptions.push(
                  this.programService.get(`/configurator/organizations/${this.orgId}/members`).subscribe((res: any) => {
                    if (res) {
                      this.members = res.members.filter(item => {
                        return item.id != data.id;
                      });
                    }
                  }),
                );
              }
            }),
          );
          this.id = data.id;
          this.isEditMode = true;
          if (data.social_profiles?.length === 5) {
            this.addnewDisabled = true;
          } else {
            this.addnewDisabled = false;
          }
          !!data.supervisor ? (this.supervisor_id = data.supervisor.id) : null;
          const formControls = this.form;
          formControls.prefix.setValue(data.name_prefix);
          phone_country_pri != null && phone_country_pri >= 0
            ? formControls.phoneFormatCountryPrimary.setValue(this.allCountryList[phone_country_pri].iso_code_2)
            : country_ind != null && country_ind >= 0
            ? formControls.phoneFormatCountryPrimary.setValue(this.allCountryList[country_ind].iso_code_2)
            : formControls.phoneFormatCountryPrimary.setValue(this.allCountryList[0].iso_code_2);
          phone_country_sec != null && phone_country_sec >= 0
            ? formControls.phoneFormatCountrySecondary.setValue(this.allCountryList[phone_country_sec].iso_code_2)
            : country_ind != null && country_ind >= 0
            ? formControls.phoneFormatCountrySecondary.setValue(this.allCountryList[country_ind].iso_code_2)
            : formControls.phoneFormatCountrySecondary.setValue(this.allCountryList[0].iso_code_2);
          if (!(this.list_or_create && this.isViewMode)) {
            this.phoneLengthValidation();
          }
          formControls.suffix.setValue(data.name_suffix);
          data.contacts.length ? formControls.phone.setValue(data.contacts[0].number) : null;
          formControls.sso_id.setValue(data?.sso_id ? data?.sso_id : null);
          formControls.fname.setValue(data.first_name);
          formControls.lname.setValue(data.last_name);
          formControls.mname.setValue(data.middle_name);
          formControls.user_mail.disable();
          formControls.title.setValue(data.title);
          formControls.user_mail.setValue(data.email);
          data.addresses.length ? formControls.address.setValue(data.addresses[0].address_line1) : null;
          if (data.addresses.length > 1) {
            if (data.addresses[0].label === 'PRIMARY') {
              formControls.address.setValue(data.addresses[0].address_line1);
              formControls.address_secondary.setValue(data.addresses[1].address_line1);
              this.addressSecondary = true;
            } else {
              formControls.address.setValue(data.addresses[1].address_line1);
              formControls.address_secondary.setValue(data.addresses[0].address_line1);
              this.addressSecondary = true;
            }
          }
         // let dateVal = data.dob ? this.datePipe.transform(new Date(data.dob), 'MM/dd', null, null, true) : null;
         // formControls.dob.setValue(dateVal ? dateVal : null);
          // if (ethnic_race_ind != null) {
          //   formControls.ethnicRace.setValue(this.ethnicRaces[ethnic_race_ind].id);
          // }
          if (country_ind != null) {
            formControls.country.setValue(this.allCountryList[country_ind].id);
          }
          // if (data.gender) {
          //   let first = data.gender.substr(0, 1).toUpperCase();
          //   formControls.gender.setValue(first + data.gender.substr(1));
          // }
          if (data.secondary_email) {
            this.emailSecondary = true;
          }
          formControls.user_mail_secondary.setValue(data.secondary_email ? data.secondary_email : null);
          if (data.contacts.length > 1) {
            formControls.phone_secondary.setValue(data.contacts[1].number);
            this.phoneSecondary = true;
          }
          formControls.supervisor.setValue(!!data.supervisor ? data.supervisor.full_name : null);
          this.profilePic = data.avatar;
          this.createUser = 'visible';
          this.title = 'Edit User';
          this.isViewMode = false;
          if (data?.social_profiles.length > 0) {
            this.socialProfileArr = data?.social_profiles;
          }
        }
      }),
    );
  }

  subscribeViewUser(): void {
    // VIEW_USER Subscription
    this.subscriptions.push(
      this.eventStream.on(Events.VIEW_USER).subscribe(data => {
        if (data) {
          const formControls = this.form;
          formControls.prefix.setValue(data.name_prefix);
          formControls.suffix.setValue(data.name_suffix);
          !!data.supervisor ? formControls.supervisor.setValue(data.supervisor.full_name) : null;
          data.contacts?.length ? formControls.phone.setValue(data.contacts[0].number) : null;
          formControls.fname.setValue(data.first_name);
          formControls.lname.setValue(data.last_name);
          formControls.mname.setValue(data.middle_name);
          formControls.title.setValue(data.title);
          formControls.user_mail.setValue(data.email);
          formControls.country.setValue(data.country);
          formControls.address.setValue(data.address);
          formControls.dob.setValue(data.dob);
          formControls.ethnicRace.setValue(data.ethnic_race);
          formControls.gender.setValue(data.gender);
          this.profilePic = data.avatar;
          this.createUser = 'visible';
          this.title = 'View User';
          this.isViewMode = true;
        }
      }),
    );
  }

  subscribeDisableUser(): void {
    // DISABLE_USER Subscription
    this.subscriptions.push(
      this.eventStream.on(Events.DISABLE_USER).subscribe((data: any) => {
        if (data) {
          const update_payload = {
            is_enabled: !data.is_enabled,
            first_name: data.first_name,
            email: data.email,
          };

          return new Promise(() => {
            this.loaderService.show();
            const url: string = `/configurator/organizations/${data.orgId}/members/${data.id}`;
            this.programService.put(url, update_payload).subscribe({
              next: (res: any) => {
                this._alertService.success(`User is ${data.is_enabled ? 'disabled' : 'enabled'}`);
                this.eventStream.emit(new EmitEvent(Events.USER_UPDATED, res));
              },
              error: (err: Error | any) => {
                this.loaderService.hide();
                this._alertService.error(errorHandler(err));
              },
            });
          });
        }
      }),
    );
  }

  subscribeDeleteUser(): void {
    // DELETE_USER Subscription
    this.subscriptions.push(
      this.eventStream.on(Events.DELETE_USER).subscribe(data => {
        if (data) {
          this.programService.delete(`/configurator/organizations/${data.orgId}/members/${data.id}`).subscribe(res => {
            if (res) {
              this._alertService.success(`The User has been successfully deleted.`);
            }
          });
        }
      }),
    );
  }

  subscribeSidebarClose(): void {
    // SIDEBAR_CLOSE Subscription
    let formControls = this.form;
    formControls.phone.enable();
    formControls.phone_secondary.enable();
    this.subscriptions.push(
      this.eventStream.on(Events.SIDEBAR_CLOSE).subscribe(data => {
        if (data) {
          this.sidebarClose();
        }
      }),
    );
  }

  get form() {
    return this.createUserForm.controls;
  }

  getEthnicRace() {
    this.loaderService.show();
    this.userService.get(`/configurator/resources/ethnic_races`).subscribe((data: any) => {
      this.loaderService.hide();
      this.ethnicRaces = data.ethnic_races.map((ethnicrace: any) => ({
        id: ethnicrace?.id,
        name: ethnicrace?.name,
      }));
    });
  }

  getAddress(place: any) {
    this.form?.address.setValue(place?.street);
  }

  getCustomAddress(place: any) {
    this.form?.address.setValue(place);
  }

  getSecondaryAddress(place: any) {
    this.form?.address_secondary.setValue(place?.street);
  }

  getSecondaryCustomAddress(place: any) {
    this.form?.address_secondary.setValue(place);
  }

  clearCountry() {
    this.countryShortName = 'all';
    this.countrySecondaryShortName = 'all';
    this.googleAddressComponent?.getPlaceAutocomplete(this.countryShortName);
  }

  sidebarClose() {
    this.createUserForm.reset();
    this.createUser = 'hidden';
    this.isEditMode = false;
    this.showSupportingText = false;
    this.profilePic = '';
    this.editData = null;
    this.socialProfileArr = [];
    this.id = '';
    this.supervisor_id = null;
    this.googleAddressComponent!.value = '';
    this.onCancel();
    this.onSuccess = false;
    this.emailSecondary = false;
    this.phoneSecondary = false;
    this.addressSecondary = false;
  }

  onCancel(event = null) {
    event ? event.preventDefault() : null;
    this.list_or_create ? (this.createUser = 'hidden') : this.router.navigateByUrl('/user-management');
  }

  redirectToProfile() {
    this.localStorage.set('PROFILE_ORG_ID', this.orgId, true);
    if (this.svmsRouter.fromSelfConfiguration()) {
      this.svmsRouter.navigate(['users', 'organization-users', 'profile-view', this.id, 'programs'], {
        queryParams: {
          hideProgram: true
        }
      });
      return;
    }

    this.router.navigate([`/user-management/profile-view/${this.id}/programs`]);
  }

  getLaborCategoriesList() {
    this.loaderService.show();
    this.subscriptions.push(
      this.programService.get('/configurator/resources/industries').subscribe((data: any) => {
        this.loaderService.hide();
        this.labor_categories = data.industries;
      }),
    );
  }

  getWorkLocations() {
    if (!this.programId) {
      return;
    }

    this.loaderService.show();
    this.subscriptions.push(
      this.programService.get(`/configurator/programs/${this.programId}/work-locations`).subscribe((data: any) => {
        this.loaderService.hide();
        this.work_locations = data?.work_locations;
      }),
    );
  }

   getOrganizationList(cat: string, name: string = '') {
    cat = cat === 'SimplifyVMS' ? cat : cat.toUpperCase();
    let _account = this.localStorage.get('account') || {};

    if (_account && cat === _account?.organization?.name) {
      this.orgLists = [_account?.organization];
      this.setDefaultOrg();
    } else {
      let url = `/configurator/organizations?category=${cat}&limit=10&active=true&program_id=${this.programId}`;

      if (cat && cat.toLowerCase() === 'vendor') url = `/configurator/programs/${this.programId}/vendors?limit=10&active=true`;
      if (this.isControl) {
        url = `/configurator/organizations?category=${cat}&limit=10&active=true`;
      }

      if (name) url += `&name=${name}`;

      this.categoryListLoading = true;
      this.subscriptions.push(
        this.programService.get(url).subscribe({
          next: (data: any) => {
            this.categoryListLoading = false;
            if ((cat && cat.toLowerCase() !== 'vendor') || !cat){
              this.orgLists = data.organizations;
            }
            else {
              if (!this.isControl) {
                data.program_vendors = data.program_vendors.map(node => node.vendor);
                this.orgLists = data.program_vendors;
              } else {
                this.orgLists = data.organizations;
              }
            }
            this.setDefaultOrg();
            let id_map: Array<any> = this.orgLists.map(node => node.id);
            if (!id_map.includes(this.selectedOrg)) this.fetchOrgEntry();

          },
          error: (err: Error | any) => {
            this.categoryListLoading = false;
            this._alertService.error(errorHandler(err));
          },
        }),
      );
    }
  }

  setDefaultOrg() {
    this.orgId = this.selectedOrg = this.org ? this.org : this.orgLists.length ? this.orgLists[0]?.id : null;
    if(this.orgId) {
      this.show_org_error = false;
    }
    this.setSSOSetting(this.orgId);
    this.roles = [];
    if (this.selectedOrg) {
      this.listUsers();
    }
  }

  fetchOrgEntry() {
    if (!this.selectedOrg) {
      return;
    }

    this.categoryListLoading = true;
    const url = `/configurator/organizations/${this.selectedOrg}`;
    this.userService.get(url).subscribe({
      next: (res: any) => {
        if (res) {
          if (res.organization) res = res.organization;

          this.categoryListLoading = false;
          this.orgLists.push(res);
        }
      },
      error: (err: Error | any) => {
        this.categoryListLoading = false;
        this._alertService.error(errorHandler(err));
      },
    });
  }

  listUsers(term: string = null) {
    let url = `/configurator/organizations/${this.orgId}/members?program_id=${this.programId}`;
    if (this.isControl) {
      url = `/configurator/organizations/${this.orgId}/members`;
    }
    if (term) {
      this.supervisorLoading = true;
      url += `&k=${term}`;
    }

    this.loaderService.show();
    this.programService.get(url).subscribe({
      next: (data: any) => {
        if (data) {
          this.loaderService.hide();
          this.members = data.members;
        }
      },
      error: (err: Error | any) => {
        this.loaderService.hide();
        this._alertService.error(errorHandler(err));
      },
    });

    this.supervisorLoading = false;
  }

  addSocialLink() {
    if (this.socialProfileArr && this.socialProfileArr.length < 5) {
      if (this.socialProfileArr && this.socialProfileArr.length > 0) {
        let last: any = this.socialProfileArr[this.socialProfileArr.length - 1];

        if (last.type != null) {
          this.socialProfileArr.push({ type: null, link: null });
        } else {
          this._alertService.error('Please select existing once');
        }
        this.socialProfileArr.forEach((currentValue, index) => {
          if (currentValue.type != null) {
            let index = this.social_links.findIndex(social => social.type === currentValue.type);
            if (index != -1) {
              this.social_links[index].disabled = true;
            }
          }
        });
      } else {
        this.socialProfileArr.push({ type: null, link: null });
      }
    } else {
      this.addnewDisabled = true;
    }
  }

  checkSocialApp(val) {
    let socialLink = val.link;
    if (socialLink.indexOf('linkedin') >= 0) {
      val.type = 'linkedin';
    } else if (socialLink.indexOf('facebook') >= 0) {
      val.type = 'facebook';
    } else if (socialLink.indexOf('git') >= 0) {
      val.type = 'git';
    } else if (socialLink.indexOf('skype') >= 0) {
      val.type = 'skype';
    } else if (socialLink.indexOf('instagram') >= 0) {
      val.type = 'instagram';
    }
  }

  deleteSocialLink(index) {
    let del_social = this.socialProfileArr[index];
    this.socialProfileArr.splice(index, 1);

    if (del_social.type) {
      var indx = this.social_links.findIndex(social => social.type === del_social.type);
      if (indx != 'undefined') {
        this.social_links[indx].disabled = false;
      }
    }
    if (this.socialProfileArr && this.socialProfileArr.length >= 0 && this.socialProfileArr.length <= 5) {
      this.addnewDisabled = false;
    }
  }

  selectSocialApp(app) {
    let socialType = app.type;
    if (socialType.indexOf('linkedin') >= 0) {
      app.link = 'https://linkedin.com/';
    } else if (socialType.indexOf('facebook') >= 0) {
      app.link = 'https://facebook.com/';
    } else if (socialType.indexOf('git') >= 0) {
      app.link = 'https://github.com/';
    } else if (socialType.indexOf('skype') >= 0) {
      app.link = 'https://skype.com/';
    } else if (socialType.indexOf('instagram') >= 0) {
      app.link = 'https://instagram.com/';
    }
    this.social_links.forEach((currentValue, index) => {
      if (currentValue.type) {
        let indx = this.socialProfileArr.findIndex(social => social.type === currentValue.type);
        if (indx === -1) {
          this.social_links[index].disabled = false;
        }
      }
    });
  }

  selectCategory(event) {
    if (this.lastActiveCategory) {
      this.lastActiveCategory['target'].classList.remove('btn-selected');
    } else {
      this.org_catgrs.forEach(e => document.getElementById('tab' + e).classList.remove('btn-selected'));
    }
    event.target.classList.add('btn-selected');
    this.lastActiveCategory = event;
    this.selectedCatgrs = event.target.innerHTML.trim();
    const formControls = this.form;
    this.org = this.selectedOrg = null;
    this.searchTerm = '';
    this.isVendorSelected = this.selectedCatgrs === 'Vendor';
    this.getOrganizationList(this.selectedCatgrs);
    if (this.isVendorSelected) {
      formControls.labor_category.enable();
      formControls.region.enable();
      this.getLaborCategoriesList();
      this.getWorkLocations();
    } else {
      formControls.labor_category.disable();
      formControls.region.disable();
    }
    formControls.supervisor.setValue(null);
  }

  selectOrganization() {
    this.show_org_error = !this.selectedOrg;
    const formControls = this.form;
    this.orgId = this.selectedOrg;
    this.listUsers();
    this.setSSOSetting(this.orgId);
    formControls.supervisor.setValue(null);
  }

  searchOrg({ term }) {
    this.searchTerm = term;
    this.categoryListSubject.next(term);
  }

  getAllCountry(term: string = null) {
    let url = `/configurator/resources/countries?limit=300`;
    if (term) {
      url += `?search_text=${term.toLowerCase()}`;
    }

    this.loaderService.show();
    this.programService.get(url).subscribe({
      next: (res: any) => {
        this.loaderService.hide();
        this.allCountryList = this.sortPipe.transform(res.countries, 'name');
      },
      error: (err: Error | any) => {
        this.loaderService.hide();
        this._alertService.error(errorHandler(err));
      },
    });
  }

  tabSelection(event) {
    if (!event.target.classList.contains('active-tab')) {
      event.target.parentElement.childNodes.forEach(e => e.classList.remove('active-tab'));
      event.target.classList.add('active-tab');
      document.getElementsByClassName('tab-contents')[0].childNodes.forEach(e => e['classList'].add('deactive-content'));
      document.getElementById('tabContent' + event.target.id.substring(3)).classList.remove('deactive-content');
    }
  }

  addSecondary(elem) {
    this[elem + 'Secondary'] = true;
  }

  removeSecondary(elem) {
    this[elem + 'Secondary'] = false;
  }

  getProfileImage(data) {
    this.profilePic = data ? data.raw : '';
  }
  checkSSOExist(){
    let url = `/profile-manager/users?k=${this.createUserForm?.value.sso_id}&sso=true&is_sso_exists=true`;
    this.loaderService.show();
    this.programService.get(url).subscribe({
      next: (res: any) => {
        this.loaderService.hide();
        this.support_text = {};
        if(res?.is_sso_exists){
          this.showSupportingText = true;
          this.support_text = {
            id: "view_sso_info",
            support_text: 'Entered SSO ID has been associated already to other user(s)',
            // close_icon: true
          }

        } else{
          this.showSupportingText =  false;
        }
      },
      error: (err: Error | any) => {
        this.loaderService.hide();
        this._alertService.error(errorHandler(err));
      },
    });
  }

  onSubmit() {
    // Submit for save
    if (this.show_org && !this.selectedOrg) {
      if (this.editData) {
        if (this.editData?.organization) {
          this.orgId = this.selectedOrg = this.editData.organization.id;
        } else {
          this.orgId = this.selectedOrg = this.editData.orgId;
        }
      } else {
        this.show_org_error = true;
        return;
      }
    }

    const formValues = this.createUserForm.value;
    // let roleID;
    // if (
    //   this.editData?.role?.organization_category !== 'CANDIDATE' ||
    //   this.editData?.role?.organization_category !== 'WORKER' ||
    //   this.editData?.role?.organization_category !== 'WORKERS' ||
    //   this.editData?.role?.organization_category !== 'Worker' ||
    //   this.editData?.role?.organization_category !== 'Workers' ||
    //   this.editData?.role?.organization_category !== 'worker' ||
    //   this.editData?.role?.organization_category !== 'workers'
    // ) {
    // try {
    //   if (/\d/.test(formValues.user_role)) {
    //     roleID = this.roles.filter(x => x['id'] == formValues.user_role)[0]['id'];
    //   } else {
    //     roleID = this.roles.filter(x => x['name'] == formValues.user_role)[0]['id'];
    //   }
    // } catch (e) {
    //   // console.error(e);
    //   roleID = '';
    // }
    // }

    let contactList = null;

    if (formValues.phone) {
      let phoneCountryExtensionp;
      for (let i = 0; i < this.allCountryList.length; i++) {
        if (formValues.phoneFormatCountryPrimary === this.allCountryList[i].iso_code_2) {
          phoneCountryExtensionp = '+' + this.allCountryList[i].isd_code;
          break;
        }
      }
      contactList = [
        {
          label: 'PRIMARY',
          isd_code: phoneCountryExtensionp,
          iso2_code: formValues.phoneFormatCountryPrimary,
          number: formValues.phone || null,
        },
      ];
    }
    if (formValues.phone_secondary) {
      let phoneCountryExtensions;
      for (let i = 0; i < this.allCountryList.length; i++) {
        if (formValues.phoneFormatCountrySecondary === this.allCountryList[i].iso_code_2) {
          phoneCountryExtensions = '+' + this.allCountryList[i].isd_code;
          break;
        }
      }
      contactList.push({
        label: 'SECONDARY',
        isd_code: phoneCountryExtensions,
        iso2_code: formValues.phoneFormatCountrySecondary,
        number: formValues.phone_secondary || null,
      });
    }
    let addressList = null;
    if (formValues.address) {
      addressList = [
        {
          label: 'PRIMARY',
          address_line_1: formValues.address,
          address_line_2: '',
          city: '',
          state: '',
          country: formValues.country,
          zipcode: '',
        },
      ];
    }

    if (formValues.address_secondary) {
      addressList.push({
        label: 'SECONDARY',
        address_line_1: formValues.address_secondary,
        address_line_2: '',
        city: '',
        state: '',
        country: formValues.country,
        zipcode: '',
      });
    }
    let gend = formValues.gender;
    if (formValues.gender) {
      gend = formValues.gender.toLowerCase();
    }

    let dob = formValues.dob;

    if (dob) {
      dob = new Date(Date.parse(this.datePipe.transform(dob + '/2020', DATE_FORMAT.FORMATMDY, null, null, true, DATE_FORMAT.FORMATMDY)));
      dob = dob.getTime();
    }
    let emailPri = this.form?.user_mail?.value;
    if (formValues.user_mail) {
      emailPri = formValues.user_mail;
    }

    if (this.isEditMode) {
      if (this.editData?.supervisor !== null) {
        if (formValues.supervisor === null) {
          formValues.supervisor = '';
          this.supervisor_id = '';
        }
      }
    }

    let payload: any = {
      name_prefix: formValues.prefix || '',
      first_name: formValues.fname,
      addresses: addressList,
      contacts: contactList,
      middle_name: formValues.mname || '',
      last_name: formValues.lname,
      name_suffix: formValues.suffix || '',
      email: emailPri,
      secondary_email: formValues.user_mail_secondary,
      sso_id: formValues.sso_id,
      supervisor_id: !!formValues.supervisor ? formValues.supervisor : this.supervisor_id,
      title: formValues.title || '',
      avatar: this.profilePic,
      is_enabled: !!this.id,
      // role_id: roleID,
      country_id: formValues.country,
      dob: dob,
      ethnic_race: formValues.ethnicRace,
      gender: gend
    };

    if (!!this.id) {
      delete payload.is_enabled;
    }

    if (!!this.id) {
      delete payload.is_enabled;
    }

    if (formValues.dob === '') {
      formValues.dob = null;
    }

    if (this.socialProfileArr?.length > 0) {
      let socialProfiles = [];
      this.socialProfileArr.forEach(socialProfile => {
        if (socialProfile?.type) {
          socialProfiles.push(socialProfile);
        }
      });
      if (socialProfiles?.length > 0) {
        payload.social_profiles = this.socialProfileArr;
      }
    } else {
      payload.social_profiles = [];
    }
    this.loaderService.show();
    this.onSave(payload, this.id);
    this.loaderService.hide();

  }
  
  

  onSave(payload, id) {
    this.isSaveLoader = true;
    this.isSubmited = true;
    if (payload.secondary_email === '') {
      payload.secondary_email = null;
    }
    if (payload.avatar) {
      if (!!id && payload.avatar.includes('https://')) delete payload.avatar;
    }

    if (payload.supervisor_id === '') {
      payload.supervisor_id = false;
    }

    if (this.isEditMode) {
      if (payload.supervisor_id === this.editData?.supervisor?.full_name) {
        payload.supervisor_id = this.editData?.supervisor?.id;
      }
    }
    // if(this.isVendorSelected){
    //   if(payload.addresses){
    //     delete payload.addresses;
    //   }
    // }

    if (payload.avatar === '') {
      delete payload.avatar;
      if (!!id) this.deleteProfile(id);
    }
    const url = !!id ? `/configurator/organizations/${this.orgId}/members/${id}` : `/configurator/organizations/${this.orgId}/members`;
    !!id
      ? this.subscriptions.push(
          this.programService.put(url, payload).subscribe({
            next: (data: any) => {
              if (data) {

                this.isSaveLoader = this.isSubmited = false;
                this._alertService.success(`User has been ${!!id ? 'updated' : 'created'} successfully`);
                this.sidebarClose();
                this.onUpdate.emit();
              }
            },
            error: (err: Error | any) => {
              this.isSaveLoader = this.isSubmited = false;
              this._alertService.error(errorHandler(err));
            },
          }),
        )
      : this.subscriptions.push(
          this.programService.post(url, payload).subscribe({
            next: (data: any) => {
              if (data) {
                this.id = data.member.id;
                this.isSaveLoader = this.isSubmited = false;
                this.onSuccess = true;
                this.localStorage.set('PROFILE_ORG_ID', this.orgId, true);
                this.localStorage.set('PROFILE_ORG_CATEGORY', this.selectedCatgrs, true);
              }
            },
            error: (err: Error | any) => {
              this.isSaveLoader = this.isSubmited = false;
              this._alertService.error(errorHandler(err));
            },
          }),
        );
  }

  changePrimaryEmail(evt) {
    if (this.selectedCatgrs === 'Client' || this.selectedCatgrs === 'CLIENT') {
      this.form.sso_id.setValue(evt);
    }
  }

  deleteProfile(id: any) {
    const user = id;
    const orgId = this.orgId;
    const url = `/profile-manager/organizations/${orgId}/members/${user}/remove-avatar`;
    this.programService.put(url, '').subscribe({
      next: (res: any) => {},
      error: (err: Error | any) => {
        this._alertService.error(errorHandler(err));
      },
    });
  }

  doLater() {
    this.sidebarClose();
    this.onUpdate.emit();
  }

  SearchSupervisor(name: any) {
    const { term } = name;
    this.SupervisorSub.next(term);
  }

  SearchUserRoles(name: any) {
    const { term } = name;
    this.UserRoleSub.next(term);
  }

  searchCountry(name: any) {
    const { term } = name;
    this.countrySub.next(term);
  }

  getPrefixSuffixFlag() {
    return this.localStorage.get('CurrentProgram')?.config?.hide_suffix_prefix;
  }

  get hasCreateUserPermission(): boolean {
    let permissions: Array<any> = this.localStorage.get(StorageKeys.USER_PERMISSION);
    return !!permissions?.includes('create_organization_user');
  }

  phoneLengthValidation() {
    const mobNumberPattern = this.phoneUtilService.phoneLengthValidation(
      this.createUserForm?.value?.phoneFormatCountryPrimary,
      this.allCountryList,
    );
    this.createUserForm?.get('phone')?.clearValidators();
    this.createUserForm?.get('phone')?.setValidators(Validators.pattern(mobNumberPattern));
    this.createUserForm?.get('phone')?.updateValueAndValidity();
  }

  get programId() {
    return this.localStorage.get(StorageKeys.PROGRAM_ID);
  }
}
