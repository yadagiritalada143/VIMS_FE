import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  EmitEvent,
  Events, EventStreamService
} from 'src/app/core/services/event-stream.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { UserService } from 'src/app/core/services/user.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { Usersetup } from '../../shared/enums';
import { ValidateTokenResponse } from './account.module';
import { AccountService } from './account.service';
import { UserDataObj } from '../../../app/shared/enums';
import { ThemeService } from 'src/app/core/services/theme.service';
import { mergeMap } from 'rxjs/operators';
import { ProgramService } from 'src/app/programs/program.service';

@Component({
  selector: 'app-account-setup',
  templateUrl: './account-setup.component.html',
  styleUrls: ['./account-setup.component.scss']
})
export class AccountSetupComponent implements OnInit {

  tokenValidate;
  navigation: any;
  userToken = '';
  orgId = '';
  userId = ''
  userEmail = '';

  passwordObj: any;
  userObj: any;
  secretQuestionObj: any;
  avatarColorObj: any;
  defaultColor: any;
  currentProgram: any;
  user: any;
  submitted = false;
  userTheme = UserDataObj;
  constructor(public eventStream: EventStreamService,
    private route: ActivatedRoute,
    private router: Router,
    public themeService: ThemeService,
    private storageService: StorageService, private loaderService: LoaderService,
    private accountService: AccountService, private alertService: AlertService, private userService: UserService,
    private programService: ProgramService) { }

  ngOnInit() {
    let id = this.storageService.get(Usersetup[0]);
    if (id != undefined && id != null) this.navigation = id;
    this.eventStream.emit(new EmitEvent(Events.LoggedIn, false));
    this.route.queryParams.subscribe(
      params => {
        this.orgId = params['orgId'];
        this.userToken = params['token']
      }
    )
    if (window.location.pathname) {
      this.navigation = window.location.pathname;
    }

    this.accountService.validateUserInvitationToken(this.orgId, this.userToken)
      .subscribe((res: ValidateTokenResponse) => {
        this.tokenValidate = "valid";
        this.userId = res.id
        this.userEmail = res.email
        this.storageService.set("userEmail", this.userEmail, true);
      }, (error) => {
        this.tokenValidate = 'invalid';
      });

    const theme = this.storageService.get(this.userTheme[2]);
    this.themeService.changeTheme(theme || this.user?.theme?.code);
  }

  onNavigationClick(id) {
    switch (id) {
      case 0:
        this.navigation = "/auth/invite"
        break;
      case 1:
        this.navigation = "/auth/setup-password"
        break;
      case 2:
        this.navigation = "/auth/basic-details"
        break;
      case 3:
        this.navigation = "/auth/security-questions"
        break;
      case 4:
        this.navigation = "/auth/avatar"
        break;
      case 5:
        this.navigation = "/auth/theme-color"
        break;
    }
  }

  setPasswordIntro() {
    this.navigation = '/auth/setup-password';
  }

  setPasswordObj(event) {
    this.navigation = '/auth/basic-details';
    this.storageService.set('password', event.password, true)
    this.passwordObj = event
    this.router.navigate(['auth/basic-details'], { queryParams: { orgId: this.orgId, token: this.userToken } });
  }

  setUserBasicDetails(event) {
    this.storageService.set(StorageKeys.CURRENT_USER, event, true);
    this.storageService.set('members', event, true);
    this.userObj = event;
    this.navigation = '/auth/avatar';
    this.router.navigate(['auth/avatar'], { queryParams: { orgId: this.orgId, token: this.userToken } });
    //Temporary disabling security questions section - TFSB PROD issue
    // this.navigation = '/auth/security-questions';
    // this.router.navigate(['auth/security-questions'], { queryParams: { orgId: this.orgId, token: this.userToken } });
  }

  setQuestionObj(event) {
    this.navigation = '/auth/avatar';
    let members = this.storageService.get('members');
    if (event.security_qa !== undefined) { members.security_qa = event.security_qa; }
    if (members.security_qa !== undefined || members.security_qa !== '') { this.storageService.set('members', members, true); }
    this.secretQuestionObj = event
    this.router.navigate(['auth/avatar'], { queryParams: { orgId: this.orgId, token: this.userToken } });
  }

  setAvatarColor(event) {
    this.navigation = '/auth/theme-color';
    this.storageService.set('setAvtarColors', event, true)
    this.avatarColorObj = event
    this.router.navigate(['auth/theme-color'], { queryParams: { orgId: this.orgId, token: this.userToken } });
  }

  onThemeSave(event) {
    this.submitted = true;
    const members = this.storageService.get('members');
    const userData = this.storageService.get('userEmail');
    const password = (this.storageService.get('password') || this.accountService.password);
    const authPayload = { username: userData, password: password };
    if(event?.themeId){
        members["theme"]= event.themeId;
        this.themeService.changeTheme(event?.themeCode);
    }
    const httpPassword = this.accountService.setPasswordViaInvitaionToken(this.orgId, this.userToken, password);
    const uploadMemer = this.accountService.uploadMembers(this.orgId, this.userToken, members);
    httpPassword.pipe(mergeMap(res => uploadMemer))
      .subscribe(res => {
        this.doLogin(authPayload, userData);
      }, (err) => {
        this.submitted = false;
        this.loaderService.hide();
        this.alertService.error(errorHandler(err));
      });
  }


  doLogin(authPayload, userData) {
    this.accountService.login(authPayload).subscribe((res) => {
      let userObj = { email: userData, user_id: res?.user_id };
      this.eventStream.emit(new EmitEvent(Events.LoggedIn, true));
      this.storageService.set("Token", res['token'], true);
      if (userObj.email != ' ' && userObj.email != '' && userObj.email) this.storageService.set("userData", userObj, true);

      this.accountService.getUser(userObj.user_id).subscribe((data) => {
        if (data && data.user) {
          this.storageService.set(StorageKeys.CURRENT_USER, data?.user, true);
          this.user = data?.user;
          // this.org_id = data?.user?.organization_id;
          // Commented beacause of this ticket : V2M-10641
          // this.getuserType(this.orgId)
          this.getMyPrograms();

        } else {
          this.alertService.warn('Invalid user information');
        }
      });
      userObj.email = this.removedPlus(userObj.email);
    }, (err) => {
      this.loaderService.hide();
      this.alertService.error(errorHandler(err));
    });
  }

  // Commented beacause of this ticket : V2M-10641
  // getuserType(org_id) {
  //   this.userService.get(`/configurator/organizations/${org_id}`).subscribe({
  //     next: (data: any) => {
  //       this.storageService.set('user_type', data.category, true);
  //     },
  //     error: (err) => {
  //       this.loaderService.hide();
  //       this.alertService.error(errorHandler(err));
  //     }
  //   });
  // }

  getMyPrograms() {
    this.userService.getAllPrograms().subscribe({
      next: data => {
        this.programService.setProgram(data?.programs[0], true);
        this.currentProgram = data?.programs[0];
        this.alertService.success(
          'Congratulations! You have successfully set up your account.'
        );
        this.submitted = true;
        this.loaderService.show()
        this.getMembershipDetailsAndRole();
      },
      error: (err) => {
        this.loaderService.hide();
        this.alertService.error(errorHandler(err));
      }
    })
  }

  removedPlus(email) {
    return email?.replace('+', '%2B');
  }

  getMembershipDetailsAndRole() {
    this.userService.getMembershipDetails(this.currentProgram?.id, this.user.id).subscribe({
      next: (res: any) => {
        this.storageService.set(StorageKeys.CURRENT_ACCOUNT, res?.member, true);
        this.storageService.set(StorageKeys.USER_TYPE, res?.member.role.organization_category, true);
        let permissionList = res?.member?.role?.permissions;
        let permissions = [];
        permissionList?.forEach(element => {
          permissions.push(element?.slug);
        });
        this.storageService.set(StorageKeys.USER_PERMISSION, permissions, true);
        this.router.navigateByUrl('/dashboard');
        this.loaderService.hide();
        this.submitted = false;
      },
      error: err => {
        this.submitted = false;
        this.loaderService.hide()
        console.error(err);
        this.router.navigateByUrl('/dashboard');
      }
    });
  }

}
