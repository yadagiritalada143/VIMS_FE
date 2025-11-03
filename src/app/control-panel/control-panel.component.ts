import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthorizationService } from '../core/services/authorize.service';
import { StorageKeys, StorageService } from '../core/services/storage.service';
import { SvmsRouterService } from '../core/services/svms-router.service';
import sideBar from './components/control-panel-sidebar/control-panel-sidebar.config';
import { LoginService } from '../auth/login/login.service';


@Component({
  selector: 'app-control-panel',
  templateUrl: './control-panel.component.html',
  styleUrls: ['../../assets/sass/self-config/config-main.scss', '../../assets/sass/self-config/config-main-2.scss']
})
export class ControlPanelComponent implements OnInit, OnDestroy {

  private subscriptions: Array <Subscription> = [];
  public showSidebarMenu: boolean = true;

  constructor(
    private router: Router,
    private svmsRouter: SvmsRouterService,
    private authorizer: AuthorizationService,
    private storageService: StorageService,
    private loginService: LoginService
  ) { }

  ngOnInit(): void {

    if (!this.isSVMSUser || this.loginService.impersonationSession) {
      this.storageService.clear();
      this.router.navigate(['auth', 'login']);
      return;
    } else if (!this.storageService.get(StorageKeys.CONTROL_PANEL_VISITED)) {
      this.storageService.remove(StorageKeys.PROGRAM_ID);
      this.storageService.remove(StorageKeys.CURRENT_PROGRAM);
      this.storageService.set(StorageKeys.CONTROL_PANEL_VISITED, true, true);
    }

    let orgId = this.storageService.get(StorageKeys.CURRENT_ACCOUNT)?.organization?.id || this.storageService.get('user')?.organization_id;
    this.storageService.set(StorageKeys.ORGANIZATION_ID, orgId, true);

    this.redirectFirstOption(this.router);

    this.subscriptions.push(
      this.router.events.subscribe((data: any) => {
        if (data instanceof NavigationEnd) {
          this.redirectFirstOption(data);
        }
      }
      ));
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub: Subscription) => sub?.unsubscribe());
  }

  toggleSidebarMenu() {
    this.showSidebarMenu = !this.showSidebarMenu;
  }

  get isSVMSUser() {
    return (this.storageService.get(StorageKeys.USER_TYPE) === "SUPER_ORG");
  }

  redirectFirstOption(data: any) {
    if (data?.url?.endsWith('/control-panel')) {

      let navigationUrl: string = null;
      let sideBarLength: number = sideBar?.length;
      for (let it: number = 0; it < sideBarLength; it++) {

        let found: boolean = false;
        let options: Array <any> = sideBar?.[it]?.submenuItem;

        if (Array.isArray(options)) {
          options.forEach((opt: any) => {
            const { permission, path } = opt;
            if (!found && (this.isSVMSUser || this.authorizer.authorize(permission))) {
              found = true;
              navigationUrl = path;
            }
          });
        }

        if (found)
          break;
      }

      if (navigationUrl) {
        let navParams: Array <string> = navigationUrl?.split('/')?.filter((str: string) => str);
        if (Array.isArray(navParams)) {
          this.svmsRouter.navigate(navParams);
        }
      }
    }
  }
}
