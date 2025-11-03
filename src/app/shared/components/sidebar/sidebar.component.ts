import { Component, OnInit, EventEmitter, Output, AfterViewInit, Input, OnDestroy } from '@angular/core';
import { ThemeService } from '../../../core/services/theme.service';
import { SidebarModule } from './sidebar.module';
import { SidebarService } from './sidebar.service';
import { StorageKeys, StorageService } from '../../../core/services/storage.service';
import { UserDataObj } from 'src/app/shared/enums';
import { NavigationEnd, Router } from '@angular/router';
import { EventStreamService, Events, EmitEvent } from '../../../core/services/event-stream.service';
import { ConfirmationDialogService } from 'src/app/shared/components/confirmation-dialog/confirmation-dialog.service';
import { UserService } from 'src/app/core/services/user.service';
import { Subscription, filter } from 'rxjs';
import { ProgramService } from 'src/app/programs/program.service';
import { AuthorizationService } from 'src/app/core/services/authorize.service';
import { LoginService } from 'src/app/auth/login/login.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { errorHandler } from '../../util/error-handler';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { TitleCasePipe } from '@angular/common';
import SidebarOptions from 'src/app/self-configuration/components/self-config-sidebar/self-config-sidebar.config';
import { UniqueKeyPipe } from '../../pipe/unique-key.pipe';
import { MasterTalentProfileService } from 'src/app/master-talent-profiles/master-talent-profile.service';
export enum type {
  account = 'account'
}
import {glv} from './genericPreference.config'

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  providers: [TitleCasePipe]
})
export class SidebarComponent implements OnInit, AfterViewInit, OnDestroy {

  private subscriptions: Subscription[] = [];
  public impersonateVisibility: boolean = false;
  public switchAccountVisibility: boolean = false;
  public userName: string;
  public userData = UserDataObj;
  public user: any;

  public userType: string = null;
  public serviceType: string = null;

  @Output()
  buttonClicked: EventEmitter<string> = new EventEmitter<string>();
  sidebarToggle = '';
  @Input()
  addZindexClass;
  tooltipvisible = 'hidden';
  currentUrl;
  account: any;
  activeSideBar: string = '';
  activeSideBarSub: string = '';
  isToggled: string = '';
  sideBarData: SidebarModule[];
  sideBar: SidebarModule;
  currentProgram: any;
  setAvtarColors: any;
  programs: any = [];
  accountDetails:any= undefined;
  supportEmail: any;
  linkedAccounts: Array<any> = [];
  constructor(
    private alert: AlertService,
    private loader: LoaderService,
    public themeService: ThemeService,
    private sidebarService: SidebarService,
    private router: Router,
    private _storageService: StorageService,
    private confirmService: ConfirmationDialogService,
    public eventStrems: EventStreamService,
    public userService: UserService,
    public programService: ProgramService,
    private authorization: AuthorizationService,
    public loginService: LoginService,
    private uniquePipe: UniqueKeyPipe,
    private masterTalentProfileService:MasterTalentProfileService
  ) { }

  ngOnInit(): void {
    this.getMembers()
    this.initializeRouteChangeDetection();
    this.accountDetails= this._storageService.get(StorageKeys.CURRENT_ACCOUNT);
    this.user = this._storageService.get('user');
    this.setAvtarColors = this._storageService.get('setAvtarColors');

    this.userType = this._storageService.get(StorageKeys.USER_TYPE);
    this.serviceType = (this._storageService.get(StorageKeys.CURRENT_PROGRAM)?.service_type ?? '')?.toUpperCase();

    this.account = this._storageService.get('account');
    let tooltip = this._storageService.get(this.userData[6]);
    if (tooltip && tooltip == "visible") {
      this.tooltipvisible = "visible";
    }

    let sidebar = this._storageService.get(this.userData[5]);

    document.body.classList.add("collapse");
    setTimeout(() => {
      if (sidebar) {
        this.buttonClicked.emit((this.sidebarToggle = sidebar));
        if (sidebar == "mini-sidebar") {
          this.tooltipvisible = "visible";
        }
      }
      else {
        this.buttonClicked.emit((this.sidebarToggle = 'mini-sidebar'));
        this.tooltipvisible = "visible";
      }
    }, 0);
    let userObj = this._storageService.get(this.userData[1]);
    if (userObj && userObj.email) {
      let userid = userObj.email.split('@');
      this.userName = userid[0];
    }
    this.sideBarData = this.sidebarService.getSideMenu();
    const autoSelectSideBarData = this.getNamePerentAndSubByUrl(this.router.url, this.sideBarData)
    this.activeSideBar = autoSelectSideBarData.side
    this.activeSideBarSub = autoSelectSideBarData.sub

    this.subscriptions.push(this.eventStrems.on(Events.PROGRAM_SIDEBAR).subscribe((data) => {
      this.currentProgram = this._storageService.get(StorageKeys.CURRENT_PROGRAM);
      this.account = this._storageService.get(type?.account);
      // Hided sidebar whenever worker is logged in and changing the assignment
      if(!data && this.user?.is_candidate){
        this.isToggled = '';
      }
    }));

    this.currentProgram = this._storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.getPrograms();
    this.getSupportEmail();
    this.getSSOLinkedAccount();
  }

  ngAfterViewInit() {
    this.currentUrl = this.router.url
    this.themeService.changeTheme(this.user?.theme?.code || this._storageService?.get(this.userData[2]));
    setTimeout(() => {this.pathValidation({ url: this.router.url })}, 0);
  }

  getSSOLinkedAccount = () => {
    if (this.user) {
      const url = `/global-tms/global-persona/users/${this.user._id}/attached-users`;
      this.programService.get(url).subscribe((result: any) => {
        if (result && result?.linked_user_info?.length > 0) {
          this.linkedAccounts = result.linked_user_info?.filter(acc => acc.user_id !== this.user._id);
        } else {
          this.linkedAccounts = [];
        }
      });
    }
  };

  get logoUrl() {
    if (this.currentProgram?.client?.logo) {
      return this.currentProgram?.client?.logo;
    }

    switch (this.themeService.getCurrentTheme()?.startsWith('white') ? (this.sidebarToggle == '' ? 'dark' : 'light') : (this.sidebarToggle == '' ? 'light' : 'dark')) {
      case 'light':
        return './assets/images/white_logo.png';
      case 'dark':
        return './assets/images/black_blue_logo.png';
      default:
        return './assets/images/white_blue_logo.png';
    }
  }

  toggleSidebar() {
    if (this.sidebarToggle == '') {
      this.buttonClicked.emit((this.sidebarToggle = 'mini-sidebar'));
      this._storageService.set(this.userData[5], 'mini-sidebar', true);
      this._storageService.set(this.userData[6], "visible", true);
      this.tooltipvisible = "visible";
      document.body.classList.add("collapse");
    } else {
      this.buttonClicked.emit((this.sidebarToggle = ''));
      this._storageService.set(this.userData[5], '', true);
      this._storageService.set(this.userData[6], "", true);
      this.tooltipvisible = "hidden";
      document.body.classList.remove("collapse");
    }
  }

  actionForPowerBI(path) {
    if (path === '/view-reports') {
      this.router.onSameUrlNavigation = 'reload';
      this.router.routeReuseStrategy.shouldReuseRoute = function () {
        return false;
      }
    }

    // Reset tampered router configuration
    let oldPath: string = this.router.url;
    setTimeout(() => {
      let newPath: string = this.router.url;
      if((oldPath === '/view-reports') && (oldPath !== newPath)) {
        this.loader.show();
        window.location.reload();
      }
    }, 200);
  }

  openSideMenu(name: string, open = false) {

    if(open  && (this.isToggled !== name)) {
      this.sideBar = this.sideBarData.find((s) => s.name === name);
      this.isToggled = name;
      document.body.classList.add("nav-overflow");
      return;
    }

    this.isToggled = '';
    this.sideBar = this.sideBarData.find((s) => s.name === this.activeSideBar);
    document.body.classList.remove("nav-overflow");
  }

  openMenuItem(menu) {
    this.eventStrems.emit(new EmitEvent(Events.SIDE_MENU_CLICKED, menu));
    this.router.navigateByUrl(menu?.path);
  }

  getPrograms() {
    let PromptFlag: any;
    this.subscriptions.push(this.userService.currentSideBarPrompt.subscribe(data => (PromptFlag = data)));
    if (PromptFlag == "open") {
      const programList = this._storageService.get('ProgramList');
      if (programList) {
        this.programs = programList;
        this.setupProgram();
        this.userService.checkProgramModification();
      } else {
        this.subscriptions.push(this.sidebarService.getAllPrograms().subscribe(data => {
          this.programs = data.programs;
          this.setupProgram();
        }, err => {
          console.error(err);
        }));
      }
    }
  }

  setupProgram() {
    if (this.programs.length > 1) {
      let name = "current-program";
      this.sideBar = this.sideBarData.find((s) => s.name === name);
      this.isToggled = name;
      this.userService.setSideBarPrompt('close');
    }
  }

  toActiveSideBar(submenu, name: string, is_sub = false) {
    const glv = this._storageService.get(StorageKeys.GLV_PREFERENCE);
    this._storageService.remove(StorageKeys.FILTER_PRESERVE)
    Object.keys(glv).forEach(ele => {
      if(glv[ele]['newUrl'] == submenu?.path || glv[ele]['oldUrl'] == submenu?.path){
        submenu.path =  glv[ele]['glv'] ? glv[ele]['newUrl'] : glv[ele]['oldUrl']
      }
    })
    if (is_sub) {
      this.activeSideBarSub = name
    } else {
      this.activeSideBar = name
    }
    if (!submenu?.isSideMenu) {
      let url = submenu.path;
      if (submenu.params) {
        for (let param of submenu?.params) {
          const localData = this._storageService.get(param) || '';
          url = url.replace(`{${param}}`, localData)
        }
      }
      if (submenu?.queryParam) {
        url += '?' + this.serialize(submenu?.queryParam);
      }
      // this.router.navigateByUrl(url);
      this.router.navigateByUrl('', { skipLocationChange: true }).then(() => {
        this.router.navigate([url]);
      });
    }
  }

  serialize = (obj) => {
    var str = [];
    for (var p in obj)
      if (obj.hasOwnProperty(p)) {
        str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
      }
    return str.join("&");
  }

  // redirectByUrl(url) {
  //   this.isToggled = '';
  //   this.sideBar = undefined;
  //   this.router.navigateByUrl(url);
  // }

  logout() {
    this.programService.userLogout();
  }

  closeSidebar() {
    this.isToggled = '';
    this.sideBar = undefined;
  document.body.classList.remove("nav-overflow");
    this.buttonClicked.emit((this.sidebarToggle = 'mini-sidebar'));
    document.body.classList.add("collapse");
  }

  getNamePerentAndSubByUrl(url: string, data) {
    let mainMenuName = ''
    let submenuName = ''
    for (let d of data) {
      if (d?.isSideMenu) {
        for (let c of d?.sideBarSubMenu) {
          for (let cl of c?.subMenuItem) {
            if (cl?.path === url) {
              mainMenuName = d?.name
              submenuName = cl?.title
              break;
            }
          }
        }
      } else {
        if (d?.path && d?.path === url) {
          mainMenuName = d?.name
          break;
        }
      }
    }
    return { side: mainMenuName, sub: submenuName }
  }

  public supportVisibility: string = 'hidden';
  toggleVisibility() {
      this.getSupportEmail();
    if(this.supportVisibility === 'hidden')
      this.supportVisibility = 'visible';
    else
      this.supportVisibility = 'hidden';
  }

  public selectedLinkedUser: string = null;
  confirmLinkedAccountSwitch(userId: any) {

    if (!userId)
      return;

    let linkedUser: any = this.linkedAccounts.find((entry: any) => (entry?.user_id === userId));
    if (linkedUser) {

      const { first_name, middle_name, last_name, user_type } = linkedUser;
      let full_name: string = [first_name, middle_name || '', last_name].join(' ').replace('  ', ' ');

      let confirmationMsg: string = `Switch to Linked User: ${full_name} (${user_type})`;
      this.confirmService.confirm('', confirmationMsg, 'Yes', 'No')
        .then((flag: boolean) => {
          if (flag) {
            this.switchToLinkedUser(userId);
          } else {
            this.selectedLinkedUser = null;
          }
        }
      )
    }
  }

  private switchToLinkedUser(userId: string) {
    let currUserId: string = this._storageService.get(StorageKeys.CURRENT_USER)?.id;
    let url: string = `/global-tms/global-persona/users/${currUserId}/switch/${userId}`;
    this.loader.show();
    this.userService.get(url).subscribe({
      next: (data: any) => {
        this.loader.hide();
        this.loginService.switchLinkedAccount(data);
      }, error: (err: any) => {
        this.loader.hide();
        this.alert.error(errorHandler(err));
      }
    })
  }

  getSupportEmail() {
    const programId = this._storageService.get(StorageKeys.PROGRAM_ID);
    let url = `/configurator/programs/${programId}/config?entity_code=support`;
    this.programService.get(`${url}`)
      .subscribe({next:(res:any) => {
        let response = JSON.parse(JSON.stringify(res));
        this.supportEmail = response?.config?.email || 'info@talentiqvms.com';
      },error: err => {
        this.supportEmail = 'info@talentiqvms.com';
        // console.error(errorHandler(err));
      }});

  }

  createFullName(users) {
    const user = this._storageService.get('user');
    if (user?.full_name) {
      return user?.full_name;
    } else {
      if (user?.middle_name) {
        return user?.first_name + ' ' + user?.middle_name + ' ' + user?.last_name
      } else {
        return user?.first_name + ' ' + user?.last_name
      }
    }
  }

  validatePermission(sidebar: SidebarModule): boolean {
    /** DO NOT uncomment the below section w/o discussion with Granthik Kundu */
    // if(sidebar?.path === '/self-configuration') {
    //   return !!this.selfConfigSidebarPermissions()?.length;
    // }

    // Checking permission only if master talent profile module is enabled
    if(sidebar?.permission?.includes('master_talent')){
       return this.masterTalentProfileService.hasPermission(sidebar?.permission);
    }

    if(!sidebar?.permission) {
      return true;
    }

    return this.authorization.authorize(sidebar?.permission);
  }

  impersonateVisibilityToggle(flag: boolean) {
    this.impersonateVisibility = flag;
  }

  switchAccountVisibilityToggle(flag: boolean) {
    this.switchAccountVisibility = flag;
    console.log(flag);
  }

  // Permission restrictions
  get hasImpersonateAuthority() {

    if(this.isSuperAdmin) {
      return true;
    }

    return this.authorization.authorize('allow_impersonation');
  }

  get userAvatar() {
    let data: any = this._storageService.get(StorageKeys.CURRENT_USER);
    let name: string = (data?.first_name ?? "") + " " + (data?.last_name ?? "")?.trim();
    return name || "NA";
  }

  get isSuperAdmin() {
    return (
      (this._storageService.get(StorageKeys.USER_TYPE) === 'SUPER_ORG') &&
      (this._storageService.get(StorageKeys.CURRENT_USER)?.is_superuser)
    );
  }

  get isSVMSUser() {
    return (this._storageService.get(StorageKeys.USER_TYPE) === 'SUPER_ORG');
  }

  selfConfigSidebarPermissions(): Array <string> {

    let permissions: Array <string> = [];
    if(Array.isArray(SidebarOptions)) {
      SidebarOptions.forEach((navItem: any) => {

          // At link level
          const links: Array <any> = navItem?.submenuItem || [];
          if(Array.isArray(links)) {
            links.forEach((link: any) => {
              let userType: Array <string> = link?.users;
              const userAllowed: boolean = !userType || userType.includes(this._storageService.get(StorageKeys.USER_TYPE));
              const permission: string = link?.permission || '';
              if(userAllowed && permission) {
                permissions.push(permission);
              }
            })
          }
        }
      )
    }

    return this.uniquePipe.transform(permissions).filter((perm: string) => {
      return this.authorization.authorize(perm);
    });
  }

  get outsidePathsExcluded() {
    const url: string = this.router.url;
    let paths: Array <string> = [
      '/auth/user-account/account-settings',
      '/notification/config/user-based-settings'
    ];

    return !paths.includes(url);
  }

  initializeRouteChangeDetection() {
    this.subscriptions.push(
      this.router.events.pipe(
        filter((evt: any) => (evt instanceof NavigationEnd))
      ).subscribe((evt: NavigationEnd) => {
        this.pathValidation(evt);
      })
    )
  }

  pathValidation(evt: NavigationEnd | any) {
    this.activeSideBar = '';
    if (Array.isArray(this.sideBarData)) {
      this.sideBarData.forEach((entry: any) => {
        let allPaths: Array <string> = this.allMenuPaths(entry);
        let pathFound: boolean = allPaths.some((path: string) => {
          return evt.url.startsWith(path);
        });
        if (pathFound) {
          this.activeSideBar = entry?.name;
        }
      })
    }
  }

  private allMenuPaths(menu: any) {
    let paths: Array <string> = [];
    if(menu?.path) {
      paths.push(menu?.path);
    }

    if(Array.isArray(menu?.['sideBarSubMenu'])) {
      paths.push(...menu?.['sideBarSubMenu'].reduce((prev: Array <string>, curr: any) => {
        if(Array.isArray(curr?.subMenuItem)) {
          return [...curr?.subMenuItem?.map((submenu: any) => submenu?.path), ...prev]
        }

        return prev;
      }, []));
    }

    const hasTimesheet: boolean = paths.includes('/timesheet/list/all');
    const hasExpense: boolean = paths.includes('/expense/general/all');
    if(hasTimesheet && hasExpense) {
      paths.push('/timesheet', '/expense');
    }

    return paths;
  }

  checkActiveMenuState(name: string) {
    if(this.isToggled) {
      return (this.isToggled === name);
    }

    return (this.activeSideBar === name);
  }

  get currentURL() {
    return this.router.url?.split('?')?.[0];
  }

  getMembers(){
    const programId = this._storageService.get(StorageKeys.PROGRAM_ID);
    const memberId = JSON.parse(localStorage.getItem(StorageKeys.ACCOUNT))?.['id']
    let url = `/configurator/programs/${programId}/members/${memberId}`;
    this.programService.get(`${url}`)
      .subscribe({next:(res:any) => {
        // this._storageService.set(StorageKeys.GLV_PREFERENCE, res?.member?.glv_preferences,true);
        const glvData = this._storageService.get(StorageKeys.GLV_PREFERENCE);
        if(!glvData || Object.keys(glvData).length == 0){
        const glv_preferences = res?.member?.glv_preferences
        const glv_preference = !glv_preferences || Object.keys(glv_preferences).length == 0 ? glv :  res?.member?.glv_preferences
        this._storageService.set(StorageKeys.GLV_PREFERENCE, res?.member?.glv_preferences,true);
        this._storageService.set(StorageKeys.GLV_PREFERENCE, glv_preference,true);
        }
        
      },error: err => {
        
      }});
  }

  ngOnDestroy(): void {
    this.subscriptions?.forEach(sub => sub.unsubscribe());
  }
}
