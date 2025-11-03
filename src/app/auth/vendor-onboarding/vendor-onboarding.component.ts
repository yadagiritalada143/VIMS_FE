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
import { ValidateTokenResponse } from './account.module';
import { AccountService } from './account.service';
import { UserDataObj } from '../../../app/shared/enums';
import { ThemeService } from 'src/app/core/services/theme.service';
import { ProgramService } from 'src/app/programs/program.service';

@Component({
  selector: 'app-vendor-onboarding',
  templateUrl: './vendor-onboarding.component.html',
  styleUrls: ['./vendor-onboarding.component.scss']
})
export class VendorOnboardingComponent implements OnInit {

  tokenValidate;
  navigation: any;
  userToken = '';
  orgId = '';
  userId = ''
  userEmail = '';
  userBasicInformation:any = {}
  passwordObj: any;
  userObj: any;
  secretQuestionObj: any;
  avatarColorObj: any;
  themeObj: any;
  defaultColor: any;
  currentProgram: any;
  user: any;
  submitted = false;
  userTheme = UserDataObj;
  constructor(public eventStream: EventStreamService,
    private route: ActivatedRoute,
    private router: Router,
    public theme: ThemeService,
    private storageService: StorageService, private loaderService: LoaderService,
    private accountService: AccountService, private alertService: AlertService, private userService: UserService,
    private programService: ProgramService) { }

  ngOnInit() {
    this.storageService.clear();
    this.eventStream.emit(new EmitEvent(Events.LoggedIn, false));
    this.route.queryParams.subscribe(
      params => {
        this.userBasicInformation.orgId = params['orgId']
        this.userBasicInformation.userToken = params['token']
      }
    )
    if (window.location.pathname) {
      this.navigation = window.location.pathname;
    }

    this.accountService.validateUserInvitationToken(this.userBasicInformation.orgId, this.userBasicInformation.userToken)
      .subscribe((res: ValidateTokenResponse) => {
        this.tokenValidate = "valid";
        this.userBasicInformation.userId = res.id
        this.userBasicInformation.userEmail = res.email
      }, (error) => {
        this.tokenValidate = 'invalid';
      });


  }

  onNavigationClick(id) {
    switch (id) {
      case 0:
        this.navigation = "/auth/vendor-onboarding/invite"
        break;
      case 1:
        this.navigation = "/auth/vendor-onboarding/setup-password"
        break;
    }
  }

  setPasswordIntro(event) {
    this.storageService.set("userBasicInformation",event.userBasicInformation,true)
    this.userBasicInformation = event.userBasicInformation
    this.navigation = '/auth/vendor-onboarding/setup-password';
  }

  finalStepCompleted() {
    //this.navigation = '/auth/vendor-onboarding/invite';

    this.userBasicInformation = this.storageService.get("userBasicInformation")
    let authPayload = { username: this.userBasicInformation.username, password: this.userBasicInformation.password }
    let userData = this.userBasicInformation.userEmail
    this.doLogin(authPayload,userData)
  }





  doLogin(authPayload, userData) {
    this.storageService.remove("userBasicInformation")
    this.storageService.remove("currentProgram")
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
          // this.getuserType(this.userBasicInformation.orgId)
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
