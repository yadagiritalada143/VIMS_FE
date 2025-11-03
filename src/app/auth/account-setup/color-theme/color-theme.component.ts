import { Component, OnInit, Output, EventEmitter, Input, ViewChild } from '@angular/core';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { AccountService } from '../account.service';
import { ActivatedRoute, Router } from '@angular/router';
import { SetPasswordComponent } from '../set-password/set-password.component';
import { AlertService } from '../../../core/components/alert/alert.service';
import {
  EventStreamService,
  EmitEvent,
  Events,
} from 'src/app/core/services/event-stream.service';
import { UserService } from 'src/app/core/services/user.service';
import { ThemeService } from 'src/app/core/services/theme.service';
import { ProgramService } from 'src/app/programs/program.service';
import { UserDataObj } from 'src/app/shared/enums';
@Component({
  selector: 'app-color-theme',
  templateUrl: './color-theme.component.html',
  styleUrls: ['./color-theme.component.scss']
})
export class ColorThemeComponent implements OnInit {
 
  programsList: any = null;
  themeId:string= undefined;
  @Output() onBack = new EventEmitter(false)
  @Output() onNext = new EventEmitter();
  @Input() disableSubmit = false; 
  defaultNavBg:string = undefined;
  defaultThemeColor:string = undefined;
  orgId: any;
  private currentProgram: any;
  private user: any;
  userToken: any;
  org_id: any;
  @ViewChild(SetPasswordComponent) passwordComponent: SetPasswordComponent;
  themes:any=[];
  userDataEnum= UserDataObj;

  setColor(e, theme) {
    if (e.target.checked) {
      this.themeId = theme?.id;
      this.defaultNavBg = this.themeService.theme[theme?.code]['--navigation-bg'];
      this.defaultThemeColor = this.themeService.theme[theme?.code]['--color-assets-primary'];
      this.storageService.set(this.userDataEnum[2], theme.code, true);
    }
  }

  constructor(private storageService: StorageService,
    public eventStream: EventStreamService,
    private router: Router,
    private accountService: AccountService,
    private themeService: ThemeService,
    public userService: UserService,
    private programService: ProgramService,
    private route: ActivatedRoute, private alertService: AlertService) { }


  ngOnInit(): void {
    this.getThemes();
    this.route.queryParams.subscribe(
      params => {
        this.orgId = params['orgId'];
        this.userToken = params['token']
      }
    )
  }

  getThemes(){
    let url = `/public/resources/themes`;
    this.themeService.get(url).subscribe({
      next: (data: any) => {
       if(data) {
        this.themes = data?.themes;
        if(this.themes?.length > 0){
          const themeCode= this.storageService.get(this.userDataEnum[2]);
          if(themeCode){
            const themeDetails= this.themes.find(t=> t.code === themeCode);
            this.setColor({target: {checked: true}}, themeDetails);
          }else{
            this.setColor({target: {checked: true}}, this.themes[0]);
          }
        }
       }
       
      }, error: (error: Error | any) => {
       // this.alertService.error(errorHandler(error), {});
      }
    }
  );
  }

  onBackClick() {
    this.onBack.emit(true);
    this.router.navigate(['auth/avatar'], { queryParams: { orgId: this.orgId, token: this.userToken } });
  }

  // onSkip() {
  //   let payload = { themeColor: this.defaultColor }
  //   let members = this.storageService.get('members');
  //   let userData = this.storageService.get('userEmail');
  //   let password = (this.storageService.get('password') || this.accountService.password);
  //   let authPayload = { username: userData, password: password };
  //   if (payload.themeColor !== undefined) members.theme_code = payload.themeColor;

  //   this.accountService.uploadMembers(this.orgId, this.userToken, members).subscribe((res) => {
  //     this.doLogin(authPayload, userData);
  //   }, (err) => {

  //   })
  // }



  onNextClick() {
    // let members = this.storageService.get('members');
    // let userData = this.storageService.get('userEmail');
    // let password = (this.storageService.get('password') || this.accountService.password);
    // let authPayload = { username: userData, password: password };
    // if (payload.themeColor !== undefined) { members.theme_code = payload.themeColor; }

    // this.accountService.uploadMembers(this.orgId, this.userToken, members).subscribe((res) => {
    //   this.doLogin(authPayload, userData);

    // }, (err) => {
    // })
    const themeDetails= this.themes.find(t=> t.id === this.themeId);
    this.onNext.emit({ themeId: this.themeId, themeCode: themeDetails?.code });

  }

  getPrimaryColor(t) {
    if(t){
      return this.themeService.theme[t?.code]['--color-assets-primary'];
    }
  
  }

  getNavColor(t) {
    if(t){
    return this.themeService.theme[t?.code]['--navigation-bg'];
    }
  }

  doLogin(authPayload, userData) {
    this.accountService.login(authPayload).subscribe({
      next: (res) => {
        let userObj = { email: userData, user_id: res?.user_id };
        this.eventStream.emit(new EmitEvent(Events.LoggedIn, true));
        this.storageService.set("Token", res['token'], true);
        if (userObj.email != ' ' && userObj.email != '' && userObj.email) this.storageService.set("userData", userObj, true);
  
        this.accountService.getUser(userObj.user_id).subscribe((data) => {
          if (data && data.user) {
            this.storageService.set(StorageKeys.CURRENT_USER, data?.user, true);
            this.user = data?.user;
            this.org_id = data?.user?.organization_id;
            // Commented beacause of this ticket : V2M-10641
            // this.getuserType(this.org_id)
            this.getMyPrograms();
  
          } else {
            this.alertService.warn('Invalid user information');
          }
        });
        userObj.email = this.removedPlus(userObj.email);
      },
      error: (err) => {
        console.error(err);
        this.alertService.error(err.error)
      }
    });
  }

  // Commented beacause of this ticket : V2M-10641
  // getuserType(org_id) {
  //   this.userService.get(`/configurator/organizations/${org_id}`).subscribe({
  //     next: (data: any) => {
  //       this.storageService.set('user_type', data.category, true);
  //     },
  //     error: error => {
  //       console.error(error);
  //     }
  //   });
  // }

  getMyPrograms() {
    this.userService.getAllPrograms().subscribe({
      next: data => {
        this.programsList = data?.programs;
        this.programService.setProgram(data?.programs[0], true);
        this.currentProgram = data?.programs[0];
        this.alertService.success(
          'Congratulations You have successfully set up your account.'
        );
        this.getMembershipDetailsAndRole();
      },
      error: err => {
        alert('Error');
        console.error(err);
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
        this.themeService.changeTheme(this.user?.theme?.code);
        if(this.programsList?.length >= 1){
          this.router.navigateByUrl('/auth/program-selection');
        }
        else{
          this.router.navigateByUrl('/dashboard');
        }
      },
      error: err => {
        console.error(err);
        if(this.programsList?.length >= 1){
          this.router.navigateByUrl('/auth/program-selection');
        }
        else{
          this.router.navigateByUrl('/dashboard');
        }
      }
    });
  }

}
