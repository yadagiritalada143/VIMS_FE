import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { AuthorizationService } from 'src/app/core/services/authorize.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import sideBarOptions from './self-config-sidebar.config';
import { Subscription, filter } from 'rxjs';
import { Location } from '@angular/common';
import { CredentialingService } from 'src/app/shared/service/credentialing.service';

@Component({
  selector: 'app-self-config-sidebar',
  templateUrl: './self-config-sidebar.component.html',
  styleUrls: ['./self-config-sidebar.component.scss'],
})
export class SelfConfigSidebarComponent implements OnInit, AfterViewInit, OnDestroy {

  private subscriptions: Array <Subscription> = [];

  public navigationList: Array<any> = [];
  public sideBarOptionsLocal: Array <any> = [...sideBarOptions];
  public firstIterablePath: string = null;

  constructor(
    private storageService: StorageService, 
    private authService: AuthorizationService, 
    private location: Location,
    private router: Router, 
    private credentialingService: CredentialingService,
  ) {}

  ngOnInit(): void {
    // By using the reload, we maintain the list items, that is needed to be kept open

    /* Below section is used for the following:
     * - Exclude the list items that are not permissible
     * - Set the default/first path/reload path from the list item to
     *   highlight the selected list item and keep the accordian panel open
     ********************************************************** */
    this.getAuthorization(); 
  }

  ngAfterViewInit(): void {
    this.subscriptions.push(
      this.router.events
        .pipe(
          filter((evt: any) => (evt instanceof NavigationEnd))
        ).subscribe(() => {
          if(this.router.url === '/self-configuration') {
            this.location.forward();
          } else {
            this.updateSidebar();
          }
        })
    );
  }

  getAuthorization() {
    this.sideBarOptionsLocal?.forEach(option => {
      const submenuItems = [];
      let options: Array <any> = option?.submenuItem;
      options.forEach(ele => {
        let count = 0
        ele.menuActive.forEach(data => {
          if(this.router.url.includes(data)){
            count++
          }
        })
        if(count > 0){
          ele['isActive'] = true
        }else{
          ele['isActive'] = false
        }
      })
      if(Array.isArray(options)) {
        for(let it: number = 0; it < options?.length; it++) {

          const submenu: any = options[it];
          const userRestricted: Array <string> = submenu?.users;
          
          // User Type Restriction
          let userAllowed: boolean = true;
          if(Array.isArray(userRestricted)) {
            userAllowed = userRestricted.includes(this.storageService.get(StorageKeys.USER_TYPE));
          }

          // Permission Restriction
          let permissionPresent: boolean = this.authService?.authorize(submenu?.permission) || !submenu?.permission;
          if(submenu?.permission.includes('credentialing')){
            permissionPresent = permissionPresent && this.credentialingService.isEnable()
          }


          // Configuration Restriction
          let configAllowed: boolean = this.navigationCheck(submenu?.name?.toLowerCase());

          if (userAllowed && permissionPresent && configAllowed) {
            submenuItems?.push(submenu);
            if(!this.firstIterablePath) {
              this.triggerInitialNavigation(submenu);
            }
          }
        }
      }

      if (submenuItems?.length) {
        this.navigationList.push({
          name: option?.name,
          icon: option?.icon,
          submenuItem: submenuItems,
          active : this.isActive(submenuItems,this.router.url)
          //     ? true
          //     : false
          // active: isReload
          //   ? submenuItems.find(submenu => this.router?.url?.includes(submenu?.path || submenu?.path?.split('/')?.[1]))
          //     ? true
          //     : false
          //   : !this.navigationList?.length,
        });
      }
    });
   if(this.router.url == "/self-configuration"){
    this.navigationList[0].active = true
    this.navigationList[0].submenuItem[0]['isActive'] = true
   } 
  }

  isActive(submenuItems,url){
    let count =0
    submenuItems.find(submenu => {
      submenu.menuActive.forEach(ele => {
        if(url?.includes(ele)){
        count++
        }
      })
    })
    if(count > 0){
      return true
    }else {
      return false
    }
  }

  getPath(path: string): string {
    return path?.split('?')?.[0];
  }

  getQueryParams(path: string): any {

    if(!path?.includes('?'))
      return {};

    let result: any = {};
    let params: string = path?.split('?')?.[1];
    let paramStrings: Array <string> = params?.split('&');

    paramStrings?.forEach((str: string) => {
      if(str) {
        let paramKeyValue: Array <string> = str?.split('=');
        const key: string = paramKeyValue?.[0];
        const value: string = paramKeyValue?.[1];
        if(key) {
          result[key] = value;
        }
      }
    });

    return result;
  }

  toggleSubmenu(navitem: any) {
    this.navigationList.forEach(ele => {
      if(ele?.name == navitem.name){
        ele.active =!navitem.active
      }else{
        ele.active = false
      }
    })
    // if(navitem) {
    //   navitem.active = !navitem.active;
    // }
    // this.navigationList.filter(n => n.active = false)
  }

  toggleChildmenu(item: any) {
    if(item) {
      item.active = !item.active
    }
  }

  // Active navigation check to intercept visibility
  navigationCheck(name: string) {
    if(name === 'account code') {
      return this.showAccountCode;
    }

    return true;
  }

  triggerInitialNavigation(submenu: any) {
    this.firstIterablePath = submenu?.path;
    if(this.router.url === '/self-configuration'){
      this.router.navigateByUrl(`/self-configuration${this.firstIterablePath}`);
    }
  }

  updateSidebar() {
    this.navigationList = this.navigationList.map((option: any) => {
      
      option.active = false;
      const options: Array <any> = option?.submenuItem || [];
      options.forEach((link: any) => {

        let currentURL: string = this.getPath(this.router.url)
        const activeMenus: Array <string> = link?.menuActive;

        if (activeMenus.some((url: string) => currentURL.includes(url))) {
          link.isActive = true;
          option.active = true;
        } else {
          link.isActive = false;
        }
      })

      return option;
    });
  }

  get showAccountCode(): any {
    return this.storageService.get(StorageKeys.CURRENT_PROGRAM)?.config?.account_code?.enabled || false;
  }

  get getLogoUrl() {
    let url: string = '/assets/images/black_blue_logo.png';
    const program: any = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    if(program?.client?.logo) {
      url = program?.client?.logo;
    }

    return url;
  }

  get isNotificationPath() {
    return this.router.url.includes('notification/config/')?true:false;
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub: Subscription) => sub?.unsubscribe());
  }
}
