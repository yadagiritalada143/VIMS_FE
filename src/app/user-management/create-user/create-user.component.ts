import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { EmitEvent, Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { StorageService } from 'src/app/core/services/storage.service';
import { UserService } from 'src/app/core/services/user.service';
import { ProgramService } from 'src/app/programs/program.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { of, Subject, Subscription } from 'rxjs';
import { debounceTime, exhaustMap } from 'rxjs/operators';
import { LoaderService } from 'src/app/core/components/loader/loader.service';

@Component({
  selector: 'app-create-user',
  templateUrl: './create-user.component.html',
  styleUrls: ['./create-user.component.scss'],
})
export class CreateUserComponent implements OnInit, OnDestroy {

  private subscriptions: Subscription[] = [];
  private memSubject: Subject <string> = new Subject <string> ();
  private roleSubject: Subject <void> = new Subject <void> ();

  @Input() createUser = 'visible';
  @Input() public list_or_create: boolean = false;
  @Input() reloadPage;
  @Input() public viewData: any = null;
  public orgId: string;
  public toggle = {
    title: 'active',
    value: true,
  };
  avatar = "";
  @Input() isViewClicked;
  invite_mail: '';
  invite_role: '';
  isViewMode = false;
  title = 'Add New User';
  members = [];
  work_locations: [];
  labor_categories: [];
  isEditMode = false;
  id = '';
  roles = [];
  supervisor_id: '';
  programs: [];
  isSaveLoader: boolean = false;
  isSubmited: boolean = false;
  public programId: any;
  public createUserForm: UntypedFormGroup;

  hideInvite_ui = false; // as discussed with Suresh we need to hide it
  show_org: boolean = false;
  orgLists: any = [];
  selectedorg: string = '';
  show_org_error: boolean = false;
  org_catgs = ['CLIENT', 'MSP', 'VENDOR'];
  selectedcatgs: string = '';
  showOrg_DD: boolean = false;
  public searchTerm: string = '';
  public isVendorSelected: boolean = false;
  public searchSubject: Subject<string> = new Subject<string>();
  public currAccount: any = {};

  constructor(
    private router: Router,
    private fb: UntypedFormBuilder,
    private programService: ProgramService,
    private _alertService: AlertService,
    private localStorage: StorageService,
    private eventStream: EventStreamService,
    public userService: UserService,
    private _loader: LoaderService
  ) {}

  ngOnInit(): void {

    this.programId = this.localStorage.get('PROGRAM_ID');
    this.orgId = this.localStorage.get('ORG_ID');

    this.createUserForm = this.fb.group({
      prefix: new UntypedFormControl(''),
      suffix: new UntypedFormControl(''),
      fname: new UntypedFormControl('', [Validators.required]),
      mname: new UntypedFormControl(''),
      lname: new UntypedFormControl('', [Validators.required]),
      title: new UntypedFormControl(''),
      user_mail: new UntypedFormControl('', [Validators.email, Validators.required]),
      supervisor: new UntypedFormControl('', [Validators.required]),
      phone: new UntypedFormControl('', [Validators.pattern('^((\\+91-?)|0)?[0-9]{10}$')]),
      user_role: new UntypedFormControl('', [Validators.required]),
      labor_category: new UntypedFormControl(''), //make not maindatory [Validators.required]
      region: new UntypedFormControl(''),
      assign: new UntypedFormControl(''),
      avatar: "",
    });
    const _userType = this.localStorage.get('user_type');
    if (_userType === 'SUPER_ORG' || _userType === 'MSP') {
      if (_userType === 'SUPER_ORG') {
        const { organization } = this.localStorage.get('account') || {};
        this.currAccount = organization;
        //console.log(organization.name,this.org_catgs.indexOf(organization.name))
        this.org_catgs = [organization.name, ...this.org_catgs];
        this.selectedcatgs = organization.name;
      } else if (_userType === 'MSP') {
        this.selectedcatgs = 'MSP';
      }
      this.show_org = true;
    }

    this.subscriptions.push(
      this.eventStream.on(Events.CREATE_USER)
        .subscribe(data => {

        if (data) {
          this.createUser = 'visible';
          this.title = 'Add New User';
          this.isViewMode = false;
          this.roles = [];
          this.members = [];
          this.selectedcatgs = data['category'];
          this.selectedorg = data['organization'];
          this.orgId = data['orgId'];
          if(this.selectedcatgs === 'VENDOR' && this.selectedorg !== null) {
            this.memSubject.next('');
            this.roleSubject.next();
          }
        }
        if (_userType === 'SUPER_ORG' || _userType === 'MSP') {
          this.show_org = true;
        }
        this.getOrganizationList(this.selectedcatgs);
        this.getFilteredOrganizationList(this.selectedcatgs);
      }),
    );
    this.subscriptions.push(
      this.eventStream.on(Events.EDIT_USER)
      .subscribe(data => {
        if (data) {
          if (data.role && !this.roles.some(r => r.id === data.role.id)) {
            this.roles = [...this.roles, data.role];
          }
          if (data.supervisor && !this.members.some(m => m.id === data.supervisor.id)) {
            this.members = [...this.members, data.supervisor];
          }
          this.id = data.id;
          this.orgId = data.orgId;
          this.isEditMode = true;
          !!data.supervisor ? (this.supervisor_id = data.supervisor.id) : null;
          const formControls = this.form;

          formControls.prefix.setValue(data.name_prefix);
          formControls.suffix.setValue(data.name_suffix);
          // !!data.supervisor ? formControls.supervisor.setValue(data.supervisor.id) : null;
          !!data.supervisor ? formControls.supervisor.setValue(data.supervisor.id) : null;
          !!data.role ? formControls.user_role.setValue(data.role.id) : null;
          data.contacts.length ? formControls.phone.setValue(data.contacts[0].number) : null;
          this.toggle.value = data.is_enabled;
          this.toggle.title = data.is_enabled ? 'active' : 'inactive';
          formControls.fname.setValue(data.first_name);
          formControls.lname.setValue(data.last_name);
          formControls.mname.setValue(data.middle_name);
          formControls.title.setValue(data.title);
          formControls.avatar.setValue(data.avatar);
          formControls.user_mail.setValue(data.email);
          this.createUser = 'visible';
          this.title = 'Edit User';
          this.isViewMode = false;
          this.show_org = false;
          this.memSubject.next('');
          this.roleSubject.next();
        }
      }),
    );
    this.subscriptions.push(
      this.eventStream.on(Events.VIEW_USER)
      .subscribe(data => {
        if (data) {
          if (data.role && !this.roles.some(r => r.id === data.role.id)) {
            this.roles = [...this.roles, data.role];
          }
          if (data.supervisor && !this.members.some(m => m.id === data.supervisor.id)) {
            this.members = [...this.members, data.supervisor];
          }
          const formControls = this.form;
          formControls.prefix.setValue(data.name_prefix);
          formControls.suffix.setValue(data.name_suffix);
          !!data.supervisor ? formControls.supervisor.setValue(data.supervisor.id) : null;
          !!data.role ? formControls.user_role.setValue(data.role.id) : null;
          data.contacts?.length ? formControls.phone.setValue(data.contacts[0].number) : null;
          this.toggle.value = data.is_enabled;
          this.toggle.title = data.is_enabled ? 'active' : 'inactive';
          formControls.fname.setValue(data.first_name);
          formControls.lname.setValue(data.last_name);
          formControls.mname.setValue(data.middle_name);
          formControls.title.setValue(data.title);
          formControls.avatar.setValue(data.avatar);
          formControls.user_mail.setValue(data.email);
          this.createUser = 'visible';
          this.title = 'View User';
          this.isViewMode = true;
        }
      }),
    );
    this.subscriptions.push(
      this.eventStream.on(Events.DISABLE_USER)
      .subscribe(data => {
        if (data) {
          const update_payload = {
            is_enabled: !data.is_enabled,
            // 'role_id': !!data.role ? data.role.id : '',
            first_name: data.first_name,
            email: data.email,
          };
          return new Promise(() => {
            this.programService
              .put(`/configurator/organizations/${data.orgId}/members/${data.id}`, update_payload)
              .subscribe((res: any) => {
                this._alertService.success(`User is ${data.is_enabled ? 'disabled' : 'enabled'}`);
                this.eventStream.emit(new EmitEvent(Events.USER_UPDATED, res));
              });
          });
        }
      }),
    );
    this.subscriptions.push(
      this.eventStream.on(Events.DELETE_USER)
      .subscribe(data => {
        if (data) {
          this.programService.delete(`/configurator/organizations/${data.orgId}/members/${data.id}`)
          .subscribe(res => {
            if (res) {
              this._alertService.success(`The User has been successfully deleted.`);
              this._loader.show();
              this.eventStream.emit(new EmitEvent(Events.LIST_USER, true));
            }
          });
        }
      }),
    );
    this.subscriptions.push(
      this.eventStream.on(Events.SIDEBAR_CLOSE)
      .subscribe(data => {
        if (data) {
          this.sidebarClose();
        }
      }),
    );

    this.subscriptions.push(
      this.memSubject
      .asObservable()
      .pipe(debounceTime(500))
      .subscribe(res => this.listUsers(res))
    );

    this.subscriptions.push(
      this.roleSubject
      .asObservable()
      .pipe(debounceTime(500))
      .subscribe(() => this.getRoleList())
    );

    if (this.isVendorSelected) {
      this.getLaborCategoriesList();
      this.getWorkLocations();
    } else {
      const formControls = this.form;
      formControls.labor_category.disable();
      formControls.region.disable();
    }

    this.roleSubject.next();
    this.memSubject.next('');

    //this.getProgramList();
  }

  get form() {
    return this.createUserForm.controls;
  }

  onClickToggle() {
    if (this.toggle.value) {
      this.toggle.value = false;
      this.toggle.title = 'inactive';
    } else {
      this.toggle.value = true;
      this.toggle.title = 'active';
    }
  }

  onSubmit(allowed) {

    if(!allowed)
      return;

    //only for Super Admin
    if (this.show_org && !this.selectedorg) {
      this.show_org_error = true;
      return;
    }

    const formValues = this.createUserForm.value;
    // let roleID;
    let vendor_payload = {};
    // if (/\d/.test(formValues.user_role)) {
    //   roleID = this.roles.filter(x => x['id'] == formValues.user_role)[0]['id'];
    // } else {
    //   roleID = this.roles.filter(x => x['name'] == formValues.user_role)[0]['id'];
    // }

    if (this.isVendorSelected) {

      const activeWLs = this.work_locations.filter(wl => wl['is_enabled'] == true);
      let data = {
        labor_categories: this.labor_categories.filter(labor => labor['id'] === this.createUserForm.value.labor_category),
        contacts: [
          {
            label: 'PRIMARY',
            isd_code: '+1',
            number: formValues.phone || null,
          },
        ],
        work_locations: activeWLs.filter(wl => wl['id'] === this.createUserForm.value.region ),
      };

        data.labor_categories = data.labor_categories.map(val => val['id']);
        data.work_locations = data.work_locations.map(val => val['id']);
        vendor_payload = { ...data };

    }

    const payload = {
      name_prefix: '',
      first_name: formValues.fname,
      middle_name: formValues.mname,
      last_name: formValues.lname,
      name_suffix: '',
      email: formValues.user_mail,
      sso_id: '',
      supervisor_id: !!formValues.supervisor ? formValues.supervisor : this.supervisor_id,
      title: formValues.title,
      avatar: formValues.avatar,
      is_enabled: !!this.id ? this.toggle.value : true,
      role_id: formValues.user_role,
      ...vendor_payload
    };

    this.onSave(payload, this.id);
  }

  onSave(payload, id) {

    this.isSaveLoader = true;
    this.isSubmited = true;

    if (!!id && payload.avatar !== '')
      delete payload.avatar;

    const url = !!id ? `/configurator/organizations/${this.orgId}/members/${id}` : `/configurator/organizations/${this.orgId}/members`;
    !!id
      ? this.subscriptions.push(
        this.programService.put(url, payload)
          .subscribe({
            next: (data: any) => {
              if (data) {
                this.isSaveLoader = false;
                this._alertService.success(`User has been ${!!id ? 'updated' : 'created'} successfully`);
                this.isSubmited = false;
                this.sidebarClose();
                this.eventStream.emit(new EmitEvent(Events.LIST_USER, true));
              }
            }, error: (err: Error | any) => {
              this.isSaveLoader = false;
              this.isSubmited = false;
              this._alertService.error(errorHandler(err));
            },
          }),
      ) : this.subscriptions.push(
        this.programService.post(url, payload)
          .subscribe({
            next: (data: any) => {
              if (data) {
                this._alertService.success(`User has been created successfully`);
                this.sidebarClose();
                this.isSaveLoader = false;
                this.isSubmited = false;
                this.eventStream.emit(new EmitEvent(Events.LIST_USER, true));
              }
            }, error: (err: Error | any) => {
              this.isSaveLoader = false;
              this.isSubmited = false;
              this._alertService.error(errorHandler(err));
            },
          }
        ),
      );
  }

  onCancel(event = null) {
    event ? event.preventDefault() : null;
    this.list_or_create ? (this.createUser = 'hidden') : this.router.navigateByUrl('/user-management');
  }

  inviteValidator(email: string): boolean {
    var email_regexp = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,6})+$/;
    return !email_regexp.test(email) || !this.invite_role ? false : true;
  }

  sendEmail() {
    // send email functionality, user role - assign to profile
  }
  hideError(event){
    this.createUserForm.get('avatar').setValue(event);
  }

  sidebarClose() {
    this.createUserForm.reset();
    this.createUser = 'hidden';
    this.isEditMode = false;
    this.id = '';
    this.supervisor_id = '';
    this.onCancel();
  }

  getRoleList() {

    if(this.selectedorg === null || this.selectedorg === '') {
      return;
    }

    this.userService.getAllOrganizationRoles(this.orgId, 1, 10, '')
      .subscribe((data: any) => {

        if (this.selectedorg === '') {
          this.roles = [];
          this.members = [];
          return;
        }

        this.roles = data.roles.map(node => {
          return {
            name: node?.name,
            id: node?.id
          }
        });
      }
    );
  }

  getProgramList() {
    this.subscriptions.push(
      this.programService.get(`/configurator/programs`)
        .subscribe((data: any) => {
          this.programs = data?.programs?.map((prog: any) => ({
            program_id: prog?.id,
            name: prog?.name
          }));
        }
      ),
    );
  }

  getLaborCategoriesList() {
    this.subscriptions.push(
      this.programService.get('/configurator/resources/labor-categories')
      .subscribe((data: any) => {
        this.labor_categories = data?.labor_categories;
      }),
    );
  }

  getWorkLocations() {
    this.subscriptions.push(
      this.programService.get(`/configurator/programs/${this.programId}/work-locations`)
      .subscribe((data: any) => {
        this.work_locations = data?.work_locations;
      }),
    );
  }

  listUsers(term = '') {

      if(this.selectedorg === null || this.selectedorg === '') {
        return;
      }

      let url = `/configurator/organizations/${this.orgId}/members?limit=99`;
      if(term !== '')
        url += `&k=${term}`;

    this._loader.show();
    this.programService.get(url)
      .subscribe({
        next: (data: any) => {
          this._loader.hide();
          if (this.selectedorg === '') {
            this.roles = [];
            this.members = [];
          }
          else if (data) {
            this.members = data.members;
          }
        },
        error: (err: Error | any) => {
          console.error(err);
          this._loader.hide();
        }
      });

  }

  defaultSetter() {
    // Select as default if only one option provided
    if (this.orgLists?.length === 1) {
      this.orgId = this.orgLists[0]?.id;
      this.selectedorg = this.orgLists[0]?.name;
      this.form.user_role.setValue('');
      this.form.supervisor.setValue('');
      this.members = [];
      this.roles = [];
      this.memSubject.next('');
      this.roleSubject.next();
    }
  }

  getOrganizationList(cat: string) {
    let _account = this.currAccount;
    if (_account && cat === _account.name) {
      this.orgLists = [_account];
      this.defaultSetter();
    } else {
      this.subscriptions.push(
        this.programService.get(`/configurator/organizations?category=${cat}&limit=25&active=true&program_id=${this.programId}`)
        .subscribe((data: any) => {
          this.orgLists = data?.organizations;
          this.defaultSetter();
        }),
      );
    }
  }

  getFilteredOrganizationList(cat: string) {
    this.subscriptions.push(
      this.searchSubject
        .pipe(
          exhaustMap(res => of(res)),
          debounceTime(400),
        )
        .subscribe((res: any) => {
          this.programService.get(`/configurator/organizations?category=${this.selectedcatgs}&limit=25&active=true&program_id=${this.programId}&name=${this.searchTerm}`)
            .subscribe((data: any) => {
              this.orgLists = data?.organizations;
            }
          );
        }
      ),
    );
  }

  selectCategory() {
    const formControls = this.form;
    this.form.user_role.setValue('');
    this.form.supervisor.setValue('');
    this.selectedorg = null;
    this.searchTerm = '';
    this.members = [];
    this.roles = [];
    this.isVendorSelected = this.selectedcatgs === 'VENDOR';
    this.getOrganizationList(this.selectedcatgs);
    if (this.isVendorSelected) {
      //formControls.user_role.enable()
      formControls.labor_category.enable();
      formControls.region.enable();
      this.getLaborCategoriesList();
      this.getWorkLocations();
    } else {
      //formControls.user_role.disable();
      formControls.labor_category.disable();
      formControls.region.disable();
    }
  }

  selectOrganization() {
    this.show_org_error = !this.selectedorg;
    const formControls = this.form;
    this.orgId = this.selectedorg;
    this.roleSubject.next();
    this.memSubject.next('');
    formControls.user_role.setValue('');
    formControls.supervisor.setValue('');
  }

  lcSearch(event, field) {
    //console.log(field);
    //console.log(event.target.value);
  }

  searchOrg({ term }) {
    this.searchTerm = term;
    this.searchSubject.next('');
  }

  clearAvatar() {
    this.createUserForm.get('avatar').setValue('');
  }

  memberSearch(term) {
    this.memSubject.next(term);
  }

  ngOnDestroy(): void {
    this.subscriptions?.forEach(sub => sub.unsubscribe());
  }

  getPrefixSuffixFlag(){
    return this.localStorage.get('CurrentProgram')?.config?.hide_suffix_prefix;
  }
}
