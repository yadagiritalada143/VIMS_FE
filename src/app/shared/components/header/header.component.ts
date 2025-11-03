import { Component, OnInit, EventEmitter, Output, OnDestroy } from '@angular/core';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { ThemeService } from '../../../core/services/theme.service';
import { ProgramService } from 'src/app/programs/program.service';
import { SvmsRouterService } from 'src/app/core/services/svms-router.service';
import {
  EventStreamService,
  Events,
  EmitEvent,
} from '../../../core/services/event-stream.service';
import { environment } from 'src/environments/environment';
import { Subscription } from 'rxjs';
import { LoginService } from 'src/app/auth/login/login.service';
@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  providers: []
})
export class HeaderComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];
  environmentName = environment?.NAME;

  @Output()
  notificationClick: EventEmitter<string> = new EventEmitter<string>();
  programClick: EventEmitter<string> = new EventEmitter<string>();
  currentProgram: any;
  user: any = { name: '' };
  helpSection: any = {
    is_show: false
  };
  bannerBackgroundColor: string = '#FFFFFF';
  showDropDown: boolean = false;

  showAllPrograms() {
    this.eventStrems.emit(new EmitEvent(Events.PROGRAM_SIDEBAR, true));
  }

  searchToggle = false;

  openSearch() {
    this.searchToggle = true;
  }
  helpClicked() {
    this.showDropDown = !this.showDropDown
  }
  navigateToLibrary() {
    this.showDropDown = false;
    this.route.navigate(['my-library', 'folder-list']);
  }
  closeSearch() {
    this.searchToggle = false;
  }

  constructor(
    public eventStrems: EventStreamService,
    public storageService: StorageService,
    public themeService: ThemeService,
    public programService: ProgramService,
    public loginService: LoginService,
    private route: SvmsRouterService,
  ) { }

  ngOnInit(): void {
    this.subscriptions.push(this.eventStrems.on(Events.LoggedIn).subscribe((data) => {
      this.user.name = data;
    }));

    this.subscriptions.push(this.eventStrems.on(Events.PROGRAM_SIDEBAR).subscribe((data) => {
      this.currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    }));

    this.currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.getHelpDetails();
  }
  get logoUrl() {
    if (this.currentProgram?.client?.logo) {
      return this.currentProgram?.client?.logo;
    }

    switch (this.themeService.getCurrentTheme()?.startsWith('white') ? 'light' : 'dark') {
      case 'light':
        return './assets/images/white_logo.png';
      case 'dark':
        return './assets/images/black_blue_logo.png';
      default:
        return './assets/images/white_blue_logo.png';
    }
  }
  getHelpDetails() {
    const activeProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.programService.get(`/configurator/programs/${activeProgram?.id}/config?entity_code=help_documentation`)
      .subscribe(
        (result: any) => {
          if (result?.config) {
            let urls = Object.keys(result?.config?.urls)?.reduce((c, k) => (c[k?.toLowerCase()] = result?.config?.urls[k], c), {});
            this.helpSection = result?.config;
            this.helpSection.is_show = false;
            this.helpSection.urls = urls;
            const account = this.storageService.get('account');
            const roleName = account?.role?.name?.toLowerCase();
            if (this.helpSection?.is_enabled && this.helpSection?.urls?.hasOwnProperty(account?.role?.organization_category?.toLowerCase())) {
              this.helpSection.is_show = true;
            } else if (this.helpSection?.is_enabled && roleName === 'hiring manager' && this.helpSection?.urls?.hasOwnProperty('client_hiring_manager')) {
              this.helpSection.is_show = true;
            }
          }
        },
        // err => {} commenting out since not in use
      )
  }

  exitImpersonation() {
    this.loginService.exitImpersonation();
  }

  downloadPdf() {
    var link = document.createElement('a');
    const account = this.storageService.get('account');
    const roleName = account?.role?.name?.toLowerCase();
    if (roleName === 'hiring manager' && this.helpSection?.urls?.hasOwnProperty('client_hiring_manager')) {
      link.href = this?.helpSection?.urls['client_hiring_manager'];
    } else {
      link.href = this?.helpSection?.urls[account?.role?.organization_category?.toLowerCase()];
    }
    link.target = "_blank";
    link.download = 'help_section.pdf';
    link.dispatchEvent(new MouseEvent('click'));
  }

  get showLocalStorageData() {
    return localStorage.getItem('show_local_data');
  }

  ngOnDestroy(): void {
    this.subscriptions?.forEach(sub => sub.unsubscribe());
  }
}
