import { Component, OnDestroy, OnInit, ViewChildren } from '@angular/core';
import {
  UntypedFormControl, UntypedFormGroup, Validators
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  EmitEvent,
  Events, EventStreamService
} from 'src/app/core/services/event-stream.service';
import { ThemeService } from 'src/app/core/services/theme.service';
import { ProgramService } from 'src/app/programs/program.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { environment } from 'src/environments/environment';
import { StorageKeys, StorageService } from '../../../app/core/services/storage.service';
import { AlertService } from '../../core/components/alert/alert.service';
import { UserDataObj } from '../../shared/enums';
import { AccountService } from '../account-setup/account.service';
import { AuthLoginService } from '../auth-login.service';
import { UserService } from './../../core/services/user.service';
import { Subscription, firstValueFrom } from 'rxjs';
import { PopupService } from 'src/app/shared/service/popup.service';
import { BuildVersionService } from 'src/app/build-version.service';
import { LoginService } from './login.service';
import { ConfigurationLoader } from 'src/app/configuration/configuration-loader.service';
import { I18NextService } from 'angular-i18next';
import { GlobalLaunchService } from 'src/app/control-panel/configs/global-launches/global-launch.service';
const loginConfig = {
  name: "SimplifyVMS",
  supportText: "Simplify",
  backgroundImage: "assets/images/login-banner.jpg",
  logo: null,
  hideText: false,
  isOverlay: true,
  isPoweredBy: false,
  class: 'text-left'
}

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit, OnDestroy {
  public ssoUrl: string = undefined;
  public ssoRedirectUrl = '';
  private subscriptions = [];
  isLoggingViaSSO = false;
  loginForm: UntypedFormGroup;
  resetPasswordForm: UntypedFormGroup;
  emailvalidation = /^[A-Za-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/;
  condCheckerObj = {
    username: '',
    userid: '',
    resetsuccesslink: '',
    invalidUserCredentials: '',
    invalidResponse: '',
    user: '',
    formtype: 'defaultpage',
  };
  showLoader: boolean = false;
  defaultProgramId: any;
  password = '';
  userData;
  forgetemail = '';
  name: string;
  public userNotFound: any;
  public wrongCredentials: number;
  public reEnterPassword: string;
  public OTPForm: any;
  public passwordstrengthForm: any;
  public invalidEmail: any;
  public expireOTP: any;
  public invalidOTP = 0;
  public invalidOtp_cnt = 3;
  private user: any;
  public isStrong: any;
  public errorMessage = ''
  private currentProgram: any;
  org_id: any;
  formInput = ['input1', 'input2', 'input3', 'input4', 'input5', 'input6'];
  navigateTo: any;
  isSaveLoader: boolean = false;
  @ViewChildren('formRow') rows: any;
  forMfa: boolean = false;
  userId: any;
  showMFAResendButton: boolean = true;
  counter: string = undefined;
  refVal: string = null;
  emailVal: string = null;
  loginConfig: any;
  private ssoCode: any;
  private redirectToSSOArray = ["?redirectToSSO=true", "&redirectToSSO=true", "%26redirectToSSO%3Dtrue", "%3FredirectToSSO%3Dtrue"];

  public showSSOUrl: boolean = false
  public switchState: any = null;
  public customError: boolean = false;
  public ssoPos: string = 'bottom';

  constructor(
    public _i18nextService: I18NextService,
    public eventStream: EventStreamService,
    public router: Router,
    public storageservice: StorageService,
    private _http: AuthLoginService,
    public accountService: AccountService,
    private _alert: AlertService,
    public userService: UserService,
    public route: ActivatedRoute,
    public loader: LoaderService,
    private themeService: ThemeService,
    private programService: ProgramService,
    private popupService: PopupService,
    private buildVersionService:BuildVersionService,
    private loginService: LoginService,
    private ConfigurationLoader: ConfigurationLoader,
    private globalLaunchService:GlobalLaunchService
  ) {

    // Get state from router (if present)
    this.switchState = this.router.getCurrentNavigation()?.extras?.state;

    this.loginConfig = this.ConfigurationLoader?.getConfiguration()?.LOGIN_SETTING || loginConfig;
    this.ssoPos = this.loginConfig?.ssoButton?.position ?? 'bottom';
    this.loginForm = new UntypedFormGroup({
      email: new UntypedFormControl(' '),
      password: new UntypedFormControl(''),
    });
    this.resetPasswordForm = new UntypedFormGroup({
      password: new UntypedFormControl(''),
      confirmpassword: new UntypedFormControl(''),
    });
    this.userData = UserDataObj;
    this.subscriptions.push(this.eventStream.on(Events.HIDESPINNER).subscribe((data) => {
      if (data) {
        this.showLoader = false;
      }
    }));

    if(this.switchState) {
      this.postLogin(this.switchState);
      this.loader.launchPersistentLoader();
    }
  }

  ngOnDestroy() {
    this.subscriptions.forEach((subscription: Subscription) => {
      subscription.unsubscribe();
    });
  }

  ngOnInit(): void {
    // Reset application state in case of landing here
    if(this.fromImpersonationScreen) {
      this.loginService.exitImpersonation();
    }

    this.buildVersionService.checkAndUpdateClientVersion();
    this.invalidEmail = ''
    this.route.queryParamMap.subscribe(query => {
      this.ssoCode = query.get('code');
      this.navigateTo = query.get('navigate');
      if (this.navigateTo) {
        this.storageservice.set(StorageKeys.NAVIGATION_URL, this.navigateTo, true);
        this.navigateToSSOPage();
      }
      this.refVal = query.get('ref');
      this.emailVal = query.get('email');
      const otherQueries = Object.keys(query?.['params'])?.filter(x => x !== 'code' && x !== 'navigate' && x !== 'ref' && x !== 'email') ?? [];
      if (otherQueries?.length) {
        let data = {};
        otherQueries.forEach(x => (data[x] = query.get(x)));
        const payload = {
          action: 'LOGIN',
          entity_ref: 'UI',
          data: data,
        };
        this._http.post('/profile-manager/sso-login/log', payload).subscribe({
          next: (res: any) => {
            console.log('Error logged in the logger services');
          },
          error: err => {
            console.error('Unable to log Error in the logger services');
          },
        });
      }
    });
    this.preLogin();
    if (this.refVal && this.refVal === 'security-code-validation' && this.emailVal && this.emailVal !== '') {
      this.forgetemail = this.emailVal;
      this.condCheckerObj['formtype'] = 'securityCodeVerification';
    }
    this.wrongCredentials = this.storageservice.getWithExpiry(this.userData[4]);
    if (this.wrongCredentials == 0) {
      this.loginForm.controls['email'].disable();
      this.loginForm.controls['password'].disable();
    }
    this.OTPForm = this.otpFormGroup(this.formInput);
    this.getUserName();
    //checking the user login before or not
    setTimeout(() => {
      this.eventStream.emit(new EmitEvent(Events.LoggedIn, false));
      this.themeService.changeTheme(undefined);
    }, 300);
    this.resetPasswordForm.get('password').valueChanges.subscribe((data) => {
      this.password = data;
    });

    this.subscriptions.push(this.eventStream.on(Events.SET_PROGRAM).subscribe((data) => {
      if (data) {
          this.getMembershipDetailsAndRole();
      }
    }));
  }

  startTimer(duration: number) {
    let timer: any = duration;
    let minutes;
    let seconds;
    const interval = setInterval(() => {
      minutes = parseInt("" + (timer / 60), 10);
      seconds = parseInt("" + (timer % 60), 10);

      minutes = minutes < 10 ? "0" + minutes : minutes;
      seconds = seconds < 10 ? "0" + seconds : seconds;

      this.counter = minutes + ":" + seconds;

      if (--timer < 0) {
        clearInterval(interval);
        this.counter = undefined;
        this.showMFAResendButton = true;
        return;
        // timer = duration;
      }
    }, 1000);
  }

  sendMFAResetPasswordEmail() {
    this.counter = undefined;
    this.isSaveLoader = true;
    this.showMFAResendButton = false;
    this.OTPForm?.enable();
    this.OTPForm?.reset();
    this.invalidOTP = 0;
    this.invalidOtp_cnt = 3;
    this.passwordstrengthForm = "";
    this.expireOTP = "";
    let email = { email: this.forgetemail };
    this._http
      .post('/profile-manager/authentication/token-resend', email)
      .subscribe(
        (data) => {
          this._alert.success("We have sent an Security code to your registered email address.!");
          this.isSaveLoader = false;
          this.startTimer(90);
        },
        (err) => {
          this.showMFAResendButton = true;
          this.isSaveLoader = false;
          this._alert.error(err?.error?.error?.message);
        }
      );
  }

  loginViaSSO(code) {
    if (code) {
      this.isLoggingViaSSO = true;
      this.loader.show();
      let req = {
        "sso_token": code,
        "redirect_uri": this.ssoRedirectUrl
      }
      this.accountService.loginViaSSO(req).subscribe(data => {
        this.postLogin(data);
      }, err => {
        this._alert.error('Could not login via SSO');
        console.error(err);
        this.loader.hide();
      });
    } else {
      this.isLoggingViaSSO = false;
    }
  }

  getMyPrograms() {
    this.userService.getAllPrograms().subscribe({
      next: (data: any) => {
        this.storageservice.set('ProgramList', data?.programs, true);
          this.getDefaultProgram()
            .then(() => {
              if (this.defaultProgramId) {
                let program_ind = data?.programs?.findIndex((program: any) => program?.id == this.defaultProgramId);
                if (program_ind != -1) {
                  this.storageservice.set(StorageKeys.PROGRAM_ID, this.defaultProgramId, true)
                  this.programService.setProgram(data?.programs[program_ind], true, true);
                  this.currentProgram = data?.programs[program_ind];
                }
                else {
                  this.getProgramDetails(this.defaultProgramId)
                    .then(() => {
                      this.storageservice.set('ProgramList', [this.currentProgram, ...data?.programs], true);
                      this.storageservice.set(StorageKeys.PROGRAM_ID, this.defaultProgramId, true)
                      this.programService.setProgram(this.currentProgram, true, true);
                    })
                }
              }
              else {
                this.storageservice.set(StorageKeys.PROGRAM_ID, data?.programs[0]?.id, true)
                this.programService.setProgram(data?.programs[0], true, true);
                this.currentProgram = data?.programs[0];
              }
            })
      }, error: (err: any) => {
        this.loader.hide();
        this.showLoader = false;
        this.defaultProgramId = null;
      }
    });
  }

  async getDefaultProgram() {
    this.defaultProgramId = null;
    await firstValueFrom(this.userService.get(`/profile-manager/${this.user?.id}/preference`))
      .then((preferences_data: any) => {
        let programPref: any;
        preferences_data?.preference?.preferences?.forEach((pref: any) => {
          if (pref?.type == "PROGRAM") {
            programPref = pref?.data;
            this.storageservice.set(StorageKeys.PREFERENCE_LIST,programPref,true);

          }
        })
        programPref?.forEach((pref: any) => {
          if (pref?.default_selection) {
            this.defaultProgramId = pref?.entity_id;
            this.storageservice.set(StorageKeys.DEFAULT_PROGRAM_ID, this.defaultProgramId, true);
          }
        })
      }).catch((err: any) => {
        this.defaultProgramId = null;
      })
  }

  async getProgramDetails(programId: any) {
    await firstValueFrom(this.userService.get(`/configurator/programs/${programId}`))
      .then((programData: any) => {
        this.currentProgram = programData?.program;
      })
  }

  getMembershipDetailsAndRole() {
    let navigateTo = this.storageservice.get(StorageKeys.NAVIGATION_URL);
    this.redirectToSSOArray.forEach(sso => {
      navigateTo = navigateTo?.replace(sso, '');
    });
    if (this.currentProgram?.id && this.user?.id) {
      this.userService.getMembershipDetails(this.currentProgram?.id, this.user?.id).subscribe({
        next: (res: any) => {
          this.storageservice.set(StorageKeys.CURRENT_ACCOUNT, res?.member, true);
          const theme = this.storageservice.get(this.userData[2]);
          this.storageservice.set(StorageKeys.USER_TYPE, res?.member.role.organization_category, true);
          this.storageservice.set(UserDataObj[7], res?.member.preferred_time_zone, true);
          this.themeService.changeTheme(theme || this.user?.theme?.code);
          let permissionList = res?.member?.role?.permissions;
          let permissions = [];
          permissionList?.forEach(element => {
            permissions.push(element?.slug);
          });
          this.storageservice.set(StorageKeys.USER_PERMISSION, permissions, true);
          if(this.isSimplifyUser && !this.loginService.impersonationSession){
            this.router.navigate(['control-panel']);
          }
          else if (this.storageservice.get("ProgramList").length <= 1) {
            this.redirection(navigateTo);
          }
          else {
            if (this.defaultProgramId) {
              this.redirection(navigateTo);
            }
            else {
              this.router.navigate(['auth', 'program-selection']);
            }
          }
          this.showLoader = false;
        },
        error: err => {
          console.error(err);
          if(this.storageservice.get(StorageKeys.USER_TYPE) == "SUPER_ORG"){
            this.router.navigate(['dashboard']);
          }
          else if (this.storageservice.get("ProgramList").length <= 1) {
            this.redirection(navigateTo);
          }
          else {
            if (this.defaultProgramId) {
              this.redirection(navigateTo);
            }
            else {
              this.router.navigate(['auth', 'program-selection']);
            }
          }
          this.showLoader = false;
        }
      });
    } else {
      if(this.storageservice.get(StorageKeys.USER_TYPE) == "SUPER_ORG"){
        this.router.navigate(['dashboard']);
      }
      else if (this.storageservice.get("ProgramList").length <= 1) {
        if (navigateTo) {
          this.navigateToStoredUrl(navigateTo);
        } else {
          this.router.navigateByUrl('/dashboard');
        }
      }
      else {
        if (this.defaultProgramId) {
          if (navigateTo) {
            this.navigateToStoredUrl(navigateTo);
          } else {
            this.router.navigateByUrl('/dashboard');
          }
        }
        else {
          this.router.navigate(['auth', 'program-selection']);
        }
      }
    }
  }

  navigateToStoredUrl(navigateTo) {
    this.router.navigateByUrl(decodeURIComponent(navigateTo));
    this.storageservice.remove(StorageKeys.NAVIGATION_URL);
    this.loader.hide();
  }

  redirection(navigateTo: any) {
    if (navigateTo) {
      this.navigateToStoredUrl(navigateTo);
    } else if (this.navigateTo) {
      this.router.navigateByUrl(decodeURIComponent(this.navigateTo));
    } else {
      this.userService.setSideBarPrompt('open');
      if(this.user?.is_candidate){
        this.router.navigateByUrl('/auth/worker-dashboard');
      } else {
        this.router.navigateByUrl('/dashboard');
      }
    }
  }

  keyUpEvent(event, index, controlname) {
    let pos = index;
    if (event.keyCode === 8 && event.which === 8) {
      pos = index;
    } else {
      pos = index + 1;
    }
    let charcnt = this.OTPForm.get(controlname).value;
    if (pos > -1 && pos < this.formInput.length) {
      let currentpos = pos;
      if (parseInt(charcnt) >= 0 && parseInt(charcnt) <= 9) {
        pos = currentpos;
      }
      else {
        this.OTPForm.get(controlname).setValue('');
        pos = currentpos - 1;
      }
      this.rows._results[pos]?.nativeElement.focus();
    }
    else {
      if (parseInt(charcnt) >= 0 && parseInt(charcnt) <= 9) {
      }
      else {
        this.OTPForm.get(controlname).setValue('');
      }
    }
  }

  securityCode() {
    this.OTPForm?.reset();
    this.condCheckerObj['formtype'] = 'securityCodeVerification'
  }

  validateOTP() {
    let otp =
      this.OTPForm.value.input1.toString() +
      this.OTPForm.value.input2.toString() +
      this.OTPForm.value.input3.toString() +
      this.OTPForm.value.input4.toString() +
      this.OTPForm.value.input5.toString() +
      this.OTPForm.value.input6.toString();
    if (this.forMfa) {
      this.validateMFA(otp);
    } else {
      this._http
        .get(`/public/users/password-request/${otp}`)
        .subscribe(
          (data) => {
            this.passwordstrengthForm = '';
            this.condCheckerObj['formtype'] = 'resetPasswordComp';
          },
          (err) => {
            this.OTPForm?.reset();
            this.passwordstrengthForm = err?.error?.error?.message;
            this.invalidOTP += 1;
            this.invalidOtp_cnt -= 1;
            if (this.invalidOTP == 3) {
              this.OTPForm.disable()
            }
            else if (err?.status == 406) {
              this.expireOTP = err?.status;
            }
            else if (err?.status == 404) {
              this.expireOTP = "";
            }
            else {
              this.expireOTP = "";
            }
          }
        );
    }
  }

  reLogin() {
    let email = this.storageservice.get(this.userData[1]);
    email = email.email;
    if (email.email != '' && this.reEnterPassword != '') {
      let payLoad = { username: email, password: this.reEnterPassword };
      this.login(payLoad, true);
    }
  }

  getUserName() {
    let userObj = this.storageservice.get(this.userData[1]);
    if (userObj && userObj.email) {
      this.condCheckerObj['formtype'] = 'getUserName';
      this.condCheckerObj['username'] = userObj.email;
      let userid = userObj.email.split('@');
      this.condCheckerObj['userid'] = userid[0];
    }
    if (userObj && this.loginForm.value.email == userObj.email) {
      this.condCheckerObj['formtype'] = 'getUserName';
      let userid = userObj.email.split('@');
      this.condCheckerObj['userid'] = userid[0];
      this.condCheckerObj['invalidUserCredentials'] = '';
      this.condCheckerObj['invalidResponse'] = '';
    }
  }
  getBack() {
    this.condCheckerObj['formtype'] = 'defaultpage';
    this.condCheckerObj['resetPassword'] = '';
    this.condCheckerObj['invalidUserCredentials'] = '';
    this.condCheckerObj['invalidResponse'] = '';
    this.userNotFound = '';
  }
  sendResetPasswordMail() {
    this.isSaveLoader = true;
    this.OTPForm?.enable();
    this.OTPForm?.reset();
    this.invalidOTP = 0;
    this.invalidOtp_cnt = 3;
    this.passwordstrengthForm = "";
    this.expireOTP = "";
    let email = { email: this.forgetemail };
    this._http
      .post('/public/users/password-reset', email)
      .subscribe(
        (data) => {
          this.condCheckerObj['formtype'] = 'defaultsecurityCode';
          this.condCheckerObj['resetsuccesslink'] = 'Yes';
          this.condCheckerObj['formtype'] = 'defaultsecurityCode';
          this.isSaveLoader = false;
          this._alert.success('Please check your inbox to continue');
        },
        (err) => {
          this.isSaveLoader = false;
          this.userNotFound = err.error.error.message;
        }
      );
  }
  sendForgetUsernameMail() {
    this.OTPForm?.enable();
    this.invalidOTP = 0;
    this.invalidOtp_cnt = 3;
    this.passwordstrengthForm = "";
    this.expireOTP = "";
    let email = { email: this.forgetemail };
    this._http
      .post('/public/users/username', email)
      .subscribe(
        (data) => {
          this.condCheckerObj['formtype'] = 'EmailVerification';
          this.condCheckerObj['resetsuccesslink'] = 'Yes';
        },
        (err) => {
          if (err?.status === 404) {
            this.userNotFound = 'Please provide valid Email Address.';
          } else {
            this.userNotFound = err?.error?.error?.message;
          }
        }
      );
  }
  validateEmail(e) {
    this.userNotFound = '';
  }

  otpFormGroup(elements) {
    const group: any = {};
    elements.forEach((key) => {
      group[key] = new UntypedFormControl('', Validators.required);
    });
    return new UntypedFormGroup(group);
  }

  changePassword() {
    this.condCheckerObj['resetPassword'] == 'yes';
  }
  getPasswordStrength(event) {
    if (event) {
      this.isStrong = event;
      this.errorMessage = ''
    }
  }

  resetPassword() {
    this.invalidEmail = '';
    let password = this.resetPasswordForm.get('password').value;
    const validpassword = this.validatePassword();
    if (!validpassword) {
      return;
    }
    let otp =
      this.OTPForm.value.input1.toString() +
      this.OTPForm.value.input2.toString() +
      this.OTPForm.value.input3.toString() +
      this.OTPForm.value.input4.toString() +
      this.OTPForm.value.input5.toString() +
      this.OTPForm.value.input6.toString();
    let payLaod = {
      otp: otp,
      password: password,
    };
    this._http
      .put('/public/users/password-reset', payLaod)
      .subscribe(
        (data) => {
          this.invalidEmail = '';
          this._alert.success('Password Reset Succesfully..');
          this.errorMessage = ''
          this.isStrong = ''
          this.OTPForm.reset();
          this.resetPasswordForm.reset();
          this.forgetemail = '';
          this.condCheckerObj['formtype'] = 'defaultpage';
        },
        (err) => {
          this.invalidEmail = err.error.error.message;
        }
      );
  }
  validatePassword() {
    this.errorMessage = '';
    let password = this.resetPasswordForm.get('password').value;
    let confirmpwd = this.resetPasswordForm.get('confirmpassword').value;

    if ((password === undefined || password === '')) {
      this.errorMessage = 'Password field should not be blank';
      return false;
    }
    if ((password || '').match(/\s/g)) {
      this.errorMessage = 'Space in the password field is not allowed !'
      return false;
    }
    if ((confirmpwd === undefined || confirmpwd === '')) {
      this.errorMessage = 'Confirm Password field should not be blank';
      return false;
    }
    if ((confirmpwd || '').match(/\s/g)) {
      this.errorMessage = 'Space in confirm password field not allowed';
      return false;
    }
    if (password !== confirmpwd) {
      return false;
    }

    if (this.isStrong !== 'strong') {
      this.errorMessage = 'The password must satisfy all the above conditions'
      return false;
    }
    const passwordstrength = password?.length >= 7 ? true : false;
    if (!passwordstrength) {
      this.errorMessage = 'The password must be longer than 7 characters'
      return false;
    }
    return true;
  }
  resetMessage() {
    this.errorMessage = '';
    this.invalidEmail = '';
    this.userNotFound = false;
  }

  onSubmit(valid) { }
  getuserType(org_id) {
    if (org_id) {
      this.userService.get(`/configurator/organizations/${org_id}`).subscribe({
        next: (data: any) => {
          // Commented beacause of this ticket : V2M-10641
          // this.storageservice.set(StorageKeys.USER_TYPE, data.category, true);
        },
        error: error => {
          console.error(error);
          this.showLoader = false;
        }
      });
    }
  }

  preLogin() {
    this._http.get('/configurator/resources/sso-configurations?domain=' + window.location.hostname).subscribe((data: any) => {
      if (data?.sso_url) {
        this.showSSOUrl = true;
        this.ssoUrl = data.sso_url;
        this.ssoRedirectUrl = 'https://' + data.domain + '/auth/login';
        if (this.ssoCode) {
          this.loginViaSSO(this.ssoCode);
        }
        this.navigateToSSOPage();
      } else {
        this.showSSOUrl = false;
        this.ssoUrl = environment.SSO_URL;
        this.ssoRedirectUrl = environment.SSO_REDIRECT_URL;
        if (this.ssoCode) {
          this.loginViaSSO(this.ssoCode);
        }
      }
    });
  }

  navigateToSSOPage() {
    const redirectToSSO = this.redirectToSSOArray.some(e => this.navigateTo?.includes(e))
    if (redirectToSSO && this.ssoUrl) {
      window.location.href = this.ssoUrl;
    }
  }

  postLogin(data) {
    this.storageservice.remove(StorageKeys.INACTIVITY_START_TIME);
    this.showLoader = true;
    this.eventStream.emit(new EmitEvent(Events.LoggedIn, true));
    this.storageservice.set(this.userData[0], data['token'], true);
    this.globalLaunchService.updateGlobalLaunchConfiguration();
    if (data && data['user_id']) {
      this.accountService.getUser(data['user_id']).subscribe((data) => {

        if (data && data?.user) {
          this.storageservice.set(StorageKeys.CURRENT_USER, data?.user, true);
          this.user = data?.user;
          this.org_id = data?.user?.organization_id;
          this.getuserType(this.org_id);
          this.getMyPrograms();
          this.storageservice.setWithExpiry(this.userData[4], 3, 50000);
          // this.getMembershipDetailsAndRole();
          this.popupService.closeAlert('close');
        } else {
          this._alert.warn('Invalid user information');
          this.showLoader = false;
        }
      });

    }
  }

  login(val, type?) {
    this.showLoader = true;
    let data = {
      username: this.loginForm.value.email,
      password: this.loginForm.value.password,
    };

    if (type) data = val;
    this._http.post('/authenticate', data).subscribe({
      next: (res) => {
        this.customError = false;
        if (res && res['is_mfa_enabled']) {
          if (res['is_mfa_enabled']) {
            this.securityCode();
            this.forMfa = true;
            this.userId = res['user_id'];
            this.forgetemail = data.username;

          } else {
            this.postLogin(res);
          }
        } else {
          this.postLogin(res);
        }
      },
      error: (err) => {
        this.customError = !!this.loginConfig?.ssoButton?.customError?.message;
        if (this.customError && this.showSSOUrl) {
          this.showLoader = false;
          return;
        }
        let wrongcredentials = this.storageservice.getWithExpiry(
          this.userData[4]
        );
        if (!wrongcredentials && wrongcredentials != 0) wrongcredentials = 3;
        if (
          wrongcredentials != 'undefined' &&
          wrongcredentials != null &&
          wrongcredentials > 0
        ) {
          wrongcredentials -= 1;
          this.wrongCredentials = wrongcredentials;
        }
        this.storageservice.setWithExpiry(
          this.userData[4],
          wrongcredentials,
          50000
        );
        if (this.wrongCredentials == 0) {
          this.loginForm.controls['email'].disable();
          this.loginForm.controls['password'].disable();
        }
        this.condCheckerObj['invalidUserCredentials'] = err.status;
        this.condCheckerObj['invalidResponse'] = err.statusText;
        this.showLoader = false;
      }
    });
  }
  removedPlus(email) {
    return email?.replace('+', '%2B');
  }

  validateMFA(otp: any) {
    let data = {
      user_id: this.userId,
      otp: otp
    };

    this._http
      .post(`/profile-manager/authentication/token-verification`, data)
      .subscribe(
        (res) => {
          this.passwordstrengthForm = '';
          // this.condCheckerObj['formtype'] = 'resetPasswordComp';

          this.postLogin(res);
        },
        (err) => {
          if (err?.error?.error?.message) {
            this._alert.error(err?.error?.error?.message);
          }
          this.passwordstrengthForm = err?.error?.error?.message;
          this.invalidOTP += 1;
          this.invalidOtp_cnt -= 1;
          if (this.invalidOTP == 3) {
            this.OTPForm.disable()
          }
          else if (err?.status == 406) {
            this.expireOTP = err?.status;
          }
          else if (err?.status == 404) {
            this.expireOTP = "";
          }
          else {
            this.expireOTP = "";
          }
        }
      );
  }

  get fromImpersonationScreen() {
    return (
      !!this.storageservice.get(StorageKeys.IMPERSONATOR_ID) &&
      !!this.storageservice.get(StorageKeys.IMPERSONATOR_TOKEN)
    );
  }

  get isSimplifyUser() {
    return (this.storageservice.get(StorageKeys.USER_TYPE) === 'SUPER_ORG');
  }
}
