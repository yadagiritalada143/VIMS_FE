import { Component, Renderer2, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { ProgramService } from 'src/app/programs/program.service';
import navigation from '../control-panel-sidebar/control-panel-sidebar.config';

@Component({
  selector: 'app-control-panel-header',
  templateUrl: './control-panel-header.component.html',
  styleUrls: ['./control-panel-header.component.scss']
})
export class ControlPanelHeaderComponent {

  userDropdown: boolean = false;
  @ViewChild('userLink', { read: ElementRef, static: false }) userLink: ElementRef;
  @ViewChild('userDropdownMenu', { read: ElementRef, static: false }) userDropdownMenu: ElementRef;

  constructor(
    private render: Renderer2,
    private router: Router,
    private programService: ProgramService,
    private storageService: StorageService
  ) {
    this.render.listen('window', 'click', (e: Event) => {
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

  ngOnInit(): void { }

  userLogout() {
    this.programService.userLogout();
  }

  redirectToDashboard() {
    this.router.navigate(['dashboard']);
  }

  get currentPageName() {

    let name: string = null;
    if (Array.isArray(navigation)) {

      let controlPanelItems: Array <any> = navigation.reduce((acc: Array <any>, item: any) => {
        return [...acc, ...item?.submenuItem];
      }, []);

      if (Array.isArray(controlPanelItems)) {

        controlPanelItems.forEach((item: any) => {
          if (this.router?.url?.includes(item?.path)) {
            name = item?.name
          }
        });

        /**
         * Define extra paths for navigation if required
         * Format: [[path: string, name: string],...]
         */
         let extraPaths: Array <Array <string>> = [
          ['/control-panel/user-management/profile-view/', 'profile_view'],
          ['/control-panel/program-setup/program-detail', 'program_detail']
        ];

        extraPaths.forEach((item: Array <string>) => {
          if (this.router.url?.includes(item[0])) {
            name = item[1];
          }
        });
      }
    }

    return name;
  }

  get userAvatar() {
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
}
