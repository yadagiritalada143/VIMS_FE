import { Component, Renderer2, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { ProgramService } from 'src/app/programs/program.service';
import navigation from '../self-config-sidebar/self-config-sidebar.config';
import { LoginService } from 'src/app/auth/login/login.service';


@Component({
  selector: 'app-self-config-header',
  templateUrl: './self-config-header.component.html',
  styleUrls: ['./self-config-header.component.scss'],
})
export class SelfConfigHeaderComponent {
  appDropdown: boolean = false;
  userDropdown: boolean = false;

  @ViewChild('appsLink', { read: ElementRef, static: false }) appsLink: ElementRef;
  @ViewChild('appsDropdown', { read: ElementRef, static: false }) appsDropdown: ElementRef;
  @ViewChild('userLink', { read: ElementRef, static: false }) userLink: ElementRef;
  @ViewChild('userDropdownMenu', { read: ElementRef, static: false }) userDropdownMenu: ElementRef;

  constructor(
    private render: Renderer2,
    private storageService: StorageService,
    private router: Router,
    private programService:ProgramService,
    public loginService: LoginService
  ) {
    this.render.listen('window', 'click', (e: Event) => {
      if (
        (this.appsLink && this.appsLink.nativeElement.contains(e.target)) ||
        (this.appsDropdown && this.appsDropdown.nativeElement.contains(e.target) && this.appDropdown)
      ) {
        this.appDropdown = true;
      } else {
        this.appDropdown = false;
      }

      if (
        (this.userLink && this.userLink.nativeElement.contains(e.target)) ||
        (this.userDropdownMenu && this.userDropdownMenu.nativeElement.contains(e.target) && this.userDropdown)
      ) {
        this.userDropdown = true;
      } else {
        this.userDropdown = false;
      }
    });
  }

  userLogout() {
    this.programService.userLogout();
  }

  redirectToDashboard() {
    if(this.router){
      this.router.navigate(['/']);
    }
  }

  openControlPanel() {
    this.router.navigate(['control-panel']);
  }

  get currentPageName(): Array <string> {

    let name: Array <string> = [];
    if (Array.isArray(navigation)) {

      let controlPanelItems: Array <any> = navigation.reduce((acc: Array <any>, item: any) => {
        return [...acc, ...item?.submenuItem];
      }, []);

      if (Array.isArray(controlPanelItems)) {

        controlPanelItems.forEach((item: any) => {
          if (this.router?.url?.includes(item?.path)) {
            name = [item?.name]
          }
        });

        /**
         * Define/Override extra paths for navigation if required
         * Format: [[path: RegExp, name: string[]],...]
         */
        let extraPaths: Array <Array <any>> = [
          [new RegExp(/vendor\/compliance-list\/[a-zA-Z0-9-]{1,}\/[a-zA-Z0-9-]{1,}$/), ['Vendors', 'Compliance']],
          [new RegExp(/vendor-managment\/compliance-list\/[a-zA-Z0-9-]{1,}\/[a-zA-Z0-9-]{1,}$/), ['Vendors', 'Compliance']],
          [new RegExp(/hierarchy\/list-foundational-data/), ['Master Data Types', 'Master Data']],
          [new RegExp(/flows-management\/flow-list/), ['Workflows', 'Flow List']],
          [new RegExp(/flows-management\/create/), ['Workflows', 'Create Workflow']],
          [new RegExp(/flows-management\/edit\/[a-zA-Z0-9-]{1,}/), ['Workflows', 'Edit Workflow']],
          [new RegExp(/flows-management\/view\/[a-zA-Z0-9-]{1,}/), ['Workflows', 'View Workflow']],
          [new RegExp(/config\/fees-configuration\/create-new$/), ['Fee Configuration', 'Create / Edit Fee Configuration']],
          [new RegExp(/config\/fees-configuration\/detail-page$/), ['Fee Configuration', 'View Fee Configuration']],
          [new RegExp(/timesheet\/config$/), ['Timesheet Configurations', 'Create Timesheet Configuration']],
          [new RegExp(/timesheet\/config\S+&mode=view$/), ['Timesheet Configurations', 'View Timesheet Configuration']],
          [new RegExp(/timesheet\/config\S+&mode=edit$/), ['Timesheet Configurations', 'Edit Timesheet Configuration']],
          [new RegExp(/invoice\/config$/), ['Invoice Configurations', 'Create Invoice Configuration']],
          [new RegExp(/invoice\/config\S+&mode=view$/), ['Invoice Configurations', 'View Invoice Configuration']],
          [new RegExp(/invoice\/config\S+&mode=edit$/), ['Invoice Configurations', 'Edit Invoice Configuration']],
          [new RegExp(/expense-config\/details$/), ['Expense Configurations', 'Create Expense Configuration']],
          [new RegExp(/expense-config\/details\S+&status=view$/), ['Expense Configurations', 'View Expense Configuration']],
          [new RegExp(/expense-config\/details\S+&status=edit$/), ['Expense Configurations', 'Edit Expense Configuration']],
          [new RegExp(/user-management\/profile-view\/[a-zA-Z0-9-]{1,}$/), ['Organization Users', 'View Profile']],
          [new RegExp(/users\/profile-view\/[a-zA-Z0-9-]{1,}$/), ['Program Users', 'View Profile']],
          [new RegExp(/rate-card\/details\/[a-zA-Z0-9-]{1,}$/), ['Rate Cards', 'Rate Card Detail']],
          [new RegExp(/qualificationsList\/list-qualifications\?/), ['Qualifications', 'Qualification Items']],
          [new RegExp(/job-template\/create\/[a-zA-Z0-9-]{1,}\/isview$/), ['Job Templates', 'View Job Template']],
          [new RegExp(/job-template\/create\/[a-zA-Z0-9-]{1,}\/isedit$/), ['Job Templates', 'Edit Job Template']],
          [new RegExp(/job-template\/create$/), ['Job Templates', 'Create Job Template']],
          [new RegExp(/notification\/config\/preferences$/), ['Manage Notifications', 'Preferences']],
          [new RegExp(/notification\/config\/domain-based-settings\/Blacklist$/), ['Manage Notifications', 'Preferences', 'Domains']],
          [new RegExp(/notification\/config\/email-based-settings\//), ['Manage Notifications', 'Preferences', 'Emails']],
          [new RegExp(/notification\/config\/role-based-settings$/), ['Manage Notifications', 'Preferences', 'Emails', 'User Role Preferences']],
          [new RegExp(/notification\/config\/event\/template\/[0-9]{1,}$/), ['Manage Notifications', 'Manage Template']],
          [new RegExp(/notification\/config\/event\/templatekeys\/[0-9]{1,}$/), ['Manage Notifications', 'Template Keys']],
          [new RegExp(/notification\/config\/event\/templatekey$/), ['Manage Notifications', 'Template Keys', 'Create Template Key']],
          [new RegExp(/notification\/config\/event\/templatekey\/[a-zA-Z0-9-]{1,}$/), ['Manage Notifications', 'Template Keys', 'Edit Template Key']],
        ];

        for (let it: number = 0; it < extraPaths.length; it++) {
          const item: Array <any> = extraPaths[it];
          let url: string = this.router.url;
          if (url.match(item[0])) {
            name = item[1];
            break;
          }
        }
      }
    }

    return name;
  }

  get userAvatar() {
    let data: any = this.storageService.get(StorageKeys.CURRENT_USER);
    let name: string = (data?.first_name ?? "") + " " + (data?.last_name ?? "")?.trim();
    return name || "NA";
  }

  get user() {
    return this.storageService.get(StorageKeys.CURRENT_USER) || {};
  }

  get getProgramTitle() {
    let program: any = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    return (program?.client?.name || 'Program');
  }

  get userProfile() {
    const user: any = this.storageService.get(StorageKeys.CURRENT_USER);
    return user?.avatar;
  }

  get userName() {
    const user: any = this.storageService.get(StorageKeys.CURRENT_USER);
    if(user?.first_name && user?.last_name) {
      return (user?.first_name + " " + user?.last_name);
    }

    return user?.full_name;
  }

  get isSVMSUser() {
    return (this.storageService.get(StorageKeys.USER_TYPE) === 'SUPER_ORG');
  }
}
