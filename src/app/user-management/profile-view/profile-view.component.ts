import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { StorageService } from 'src/app/core/services/storage.service';
import { ProgramService } from 'src/app/programs/program.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { EventStreamService, EmitEvent, Events } from 'src/app/core/services/event-stream.service';
import * as _ from 'lodash';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { errorHandler } from 'src/app/shared/util/error-handler';

@Component({
  selector: 'vms-profile-view',
  templateUrl: './profile-view.component.html',
  styleUrls: ['./profile-view.component.scss'],
})
export class ProfileViewComponent implements OnInit, OnDestroy {
  orgId: string = '';
  id: string = '';
  programId: string = '';
  viewData: any;
  isActive: boolean = true;
  toProgram: string = '';
  isProgram: boolean = false;
  public reloadPage: boolean = true;
  public hideSSO: boolean = false;
  openAddToProgram: boolean = false;
  public createUser = 'hidden';
  public list_or_create: boolean = true;
  showProgramTab: boolean = true;
  public resetPasswordForm: UntypedFormGroup;

  //for reset password
  basicdetails = false;
  password = '';
  rePassword = ''
  isPasswordError = false;
  isRePasswordError = false;
  errorMessage = '';
  userToken = '';
  passwordstrength = '';
  passwordstrength1 = false;
  passwordstrength2 = false;
  passwordstrength3 = false;
  passwordstrength4 = false;
  isAddHirerachy = 'hidden';
  isInvalid: boolean = true;

  constructor(
    private programService: ProgramService,
    private localStorage: StorageService,
    private route: ActivatedRoute,
    private loader: LoaderService,
    private alert: AlertService,
    private eventStream: EventStreamService,
    private fb: UntypedFormBuilder,
  ) {}

  // @Route /configurator/organizations/${this.orgId}/members/${this.id}
  // get organisation member Data if url contains user-management in it
  // or
  // @Route /configurator/programs/${this.programId}/members/${this.id}
  // get program data if url contains users in it
  ngOnInit(): void {
    this.ngInit();
    this.resetPasswordForm = this.fb.group({
      password: new UntypedFormControl('', [Validators.required]),
      confirmPassword: new UntypedFormControl('', [Validators.required]),
    })
    let reload = this.localStorage.get("IsReloaded");
    if(reload === null || reload){
      if (this.toProgram === 'programs') {
        // Selecting Programs Tab
        this.openAddToProgram = true;
        this.isProgram = true;
        this.localStorage.set("IsReloaded", false, true);
      }
    }

  }

  ngInit() {

    this.isProgram = false;
    this.openAddToProgram = false;
    this.loader.show();
    this.showProgramTab = true;
    this.orgId = this.localStorage.get('PROFILE_ORG_ID');
    this.programId = this.localStorage.get('PROFILE_PROGRAM_ID');
    this.id = this.route.snapshot.paramMap.get('id');
    this.toProgram = this.route.snapshot.paramMap.get('toProgram');
    if (window.location.href.includes('user-management')) {

      const url: string = `/configurator/organizations/${this.orgId}/members/${this.id}`;
      this.programService.get(url)
        .subscribe({
          next: (data: any) => {
            if (data) {
              this.setviewData(data.member);
            } else {
              this.alert.error('Could not get User data');
            }
          }, error: (err: Error | any) => {
            this.loader.hide();
            window.history.back();
          }
        }
        );
    } else if (window.location.href.includes('users')) {
      this.orgId = this.localStorage.get('PROFILE_ORG_ID');
      let category = this.localStorage.get('PROFILE_ORG_CATEGORY');
      if (category === 'CANDIDATE' || category === 'WORKER' || category === 'WORKERS' || category === 'Workers' || category === 'Worker') {
        this.showProgramTab = false;
        this.programService.get(`/configurator/programs/${this.programId}/members/${this.id}?show_candidate_as_worker=true`)
          .subscribe({
            next: (data: any) => {
              if (data) this.setviewData(data.member);
              else this.alert.error('Could not get User data');
            }, error: (err: Error | any) => {
              this.loader.hide();
              window.history.back();
            },
          }
          );
      }
      else {
        const url: string = `/configurator/organizations/${this.orgId}/members/${this.id}`;
        this.programService.get(url)
          .subscribe({
            next: (data: any) => {
              if (data) {
                this.setviewData(data.member);
              } else {
                this.alert.error('Could not get User data');
              }
            }, error: (err: Error | any) => {
              this.loader.hide();
              window.history.back();
            },
          });
      }
    }
  }

  // Set View Data getting from api
  setviewData(data: any) {
    if(data) {
      data.dob = new Date(data?.dob);
    }
    this.viewData = data;
    this.isActive = data.is_enabled;
    if(data?.organization?.category?.toUpperCase() === 'WORKER') {
      this.hideSSO = true;
    }
    this.loader.hide();
  }

  // Going Back in History
  goBack() {
    window.history.back();
  }

  onEditClick() {
    if (this.viewData) {
      this.eventStream.emit(new EmitEvent(Events.EDIT_USER, { orgId: this.orgId, ...this.viewData }));
    }
  }

  onResetClick() {
    if (this.viewData) {
      this.isAddHirerachy = 'visible';
      this.password = '';
      this.rePassword = '';
    }
  }

  // Doing things on Component Destruction
  ngOnDestroy() {
    this.localStorage.remove('PROFILE_ORG_ID');
    this.localStorage.remove('PROFILE_PROGRAM_ID');
    this.localStorage.remove('PROFILE_ORG_NAME');
    this.localStorage.remove("PROFILE_ORG_CATEGORY");
    this.localStorage.remove("IsReloaded");
  }

  handleUpdate() {
    this.ngInit();
  }

  getFullName(name){
    if(!name) return;
    if(this.localStorage.get('CurrentProgram')?.config?.hide_suffix_prefix){
      if(this.viewData.name_prefix && this.viewData.name_prefix !== '')
        name = name.replace(this.viewData.name_prefix , '')
      if(this.viewData.name_suffix && this.viewData.name_suffix !== '')
        name = name.replace(this.viewData.name_suffix , '');
      return _.toLower(name);
    }
    return _.toLower(name);
  }
  //- for Reset password functionality
  sidebarClose() {
    this.isAddHirerachy = 'hidden';
  }

  get invalidPassword() {
    let isValid = !/(?=.*?[a-z])(?=.*?[A-Z])/.test(this.password) ||
    !/[ !"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]/.test(this.password) ||
    !/[0-9]/.test(this.password) ||
    this.password.toUpperCase()?.includes('PASSWORD') ||
    !((this.password || '').trim().length > 7) || this.isRePasswordError;
    this.isInvalid = isValid;
    return isValid;
  }
  basicDetail() {
    this.isPasswordError = false;
    this.isRePasswordError = false;
    if ((this.password || '').match(/\s/g)) {
      this.isPasswordError = true
      this.errorMessage = 'Space in password field not allow'
      return;
    } else if (this.password === '') {
      this.isPasswordError = true
      this.errorMessage = 'Password field should not be blank'
      return;
    } else if (this.password !== this.rePassword) {
      this.errorMessage = 'The passwords entered do not match. Passwords must match in order to continue.'
      this.isRePasswordError = true
      return;
    }
    this.loader.show();
    this.programService.put(`/profile-manager/user/${this.viewData.id}/update`, {password: this.password})
    .subscribe({
      next: (data: any) => {
        this.loader.hide();
        this.alert.success("Reset password successful");
        this.sidebarClose();
      }, error: (err: Error | any) => {
        this.loader.hide();
        this.alert.error("Reset password failed");
      },
    });
  }

  checkPassword(password) {
    if (this.password == password) {
      this.isRePasswordError = this.isInvalid = false
      this.errorMessage = '';
    } else {
      this.isRePasswordError = this.isInvalid = true;
      this.errorMessage = 'The passwords entered do not match. Passwords must match in order to continue.'
    }

  }

  passwordChange(eve) {
    let pattern1 = /(?=.*?[a-z])(?=.*?[A-Z])/;
    let special = /[ !"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]/;
    let number = /[0-9]/;
    this.passwordstrength1 = eve.length >= 7 ? true : false;
    this.passwordstrength2 =
      pattern1.test(eve) && this.passwordstrength1 ? true : false;
    this.passwordstrength3 =
      special.test(eve) &&
        this.passwordstrength1 &&
        number.test(eve) &&
        this.passwordstrength2
        ? true
        : false;
    this.passwordstrength4 =
      this.passwordstrength1 && this.passwordstrength2 && this.passwordstrength3
        ? true
        : false;
    this.passwordstrength =
      ((eve && eve.length > 0) || this.passwordstrength1) &&
        !this.passwordstrength2 &&
        !this.passwordstrength3 &&
        !this.passwordstrength4
        ? 'weak'
        : this.passwordstrength1 &&
          this.passwordstrength2 &&
          !this.passwordstrength3 &&
          !this.passwordstrength4
          ? 'fair'
          : this.passwordstrength1 &&
            this.passwordstrength2 &&
            this.passwordstrength3 &&
            !this.passwordstrength4
            ? 'good'
            : this.passwordstrength1 &&
              this.passwordstrength2 &&
              this.passwordstrength3 &&
              this.passwordstrength4
              ? 'strong'
              : '';

  }

  deleteProfile() {
    const orgId = this.orgId;
    const user = this.id;
    const url = `/profile-manager/organizations/${orgId}/members/${user}/remove-avatar`
    this.programService.put(url, '')
      .subscribe({
        next: (data: any) => {
          if (data) {
            this.alert.success(`Profile image deleted successfully.`);
            this.ngInit();
          }
        }, error: (err: Error | any) => {
          this.alert.error(errorHandler(err));
        }
      }
    );
  }

  changePassword(password) {
    if(password !== this.rePassword)
      this.isInvalid = true;
  }
}
