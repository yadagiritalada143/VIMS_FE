import { Component, LOCALE_ID, Inject, OnInit, ChangeDetectorRef, Renderer2, OnDestroy, DoCheck } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { EventStreamService, Events, EmitEvent } from '../core/services/event-stream.service';
import { StorageKeys, StorageService } from '../core/services/storage.service';
import { UserService } from '../core/services/user.service';
import { ProgramService } from '../programs/program.service';
import { SessionService } from './main.service';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss'],
})
export class MainComponent implements OnInit, DoCheck, OnDestroy {
  title = 'Simplify VMS 2.0';
  showBackdrop = false;
  valueEmittedFromChildComponent = '';
  toggleProgramPanel = false;
  programs: any = [];
  logged_In = false;
  currentProgrumId = '';
  user: any;
  subscription: Subscription[] = [];

  public showRouter = true;
  public isSelfConfig = false;

  constructor(
    public sessionService: SessionService,
    private changeDetection: ChangeDetectorRef,
    private eventStream: EventStreamService,
    private _render: Renderer2,
    private userService: UserService,
    public storageService: StorageService,
    private programService: ProgramService,
    private router: Router,
    @Inject(LOCALE_ID) protected localeId: string,
  ) {
    if (localeId) {
      //translate.setDefaultLang(localeId.split('-')[0] ? localeId.split('-')[0] : 'English (United States)');
    }
  }

  ngOnDestroy(): void {
    this.subscription?.forEach(sub => sub.unsubscribe());
  }

  ngOnInit() {
    if (this.storageService.get(StorageKeys.CURRENT_PROGRAM)) {
      this.currentProgrumId = this.storageService.get(StorageKeys.CURRENT_PROGRAM)['id'];
    }

    this.subscription.push(
      this.eventStream.on(Events.LoggedIn).subscribe(data => {
        this.logged_In = data;
      }),
    );

    this.subscription.push(
      this.eventStream.on(Events.DO_SHOW_CLIENT_FORM).subscribe(data => {
        this.showBackdrop = data;
        if (data) {
          this._render.addClass(document.body, 'overflow-hidden');
        } else {
          this._render.removeClass(document.body, 'overflow-hidden');
        }
        this.changeDetection.detectChanges();
      }),
    );

    this.subscription.push(
      this.eventStream.on(Events.DO_SHOW_USER_FORM).subscribe(data => {
        this.showBackdrop = data;
        if (data) {
          this._render.addClass(document.body, 'overflow-hidden');
        } else {
          this._render.removeClass(document.body, 'overflow-hidden');
        }
        this.changeDetection.detectChanges();
      }),
    );

    this.subscription.push(
      this.eventStream.on(Events.DO_SHOW_USER_FORM).subscribe(data => {
        this.showBackdrop = data;
        if (data) {
          this._render.addClass(document.body, 'overflow-hidden');
        } else {
          this._render.removeClass(document.body, 'overflow-hidden');
        }
        this.changeDetection.detectChanges();
      }),
    );

    this.subscription.push(
      this.eventStream.on(Events.PROGRAM_SIDEBAR).subscribe(data => {
        this.toggleProgramPanel = data;
      }),
    );

    this.subscription.push(
      this.eventStream.on(Events.SET_PROGRAM).subscribe(data => {
        if (data) {
          this.showRouter = false;
          this.getMembershipDetailsAndRole();
          this.showRouter = true;
        }
      }),
    );
    this.user = this.storageService.get(StorageKeys.CURRENT_USER);
    this.storageService.set(StorageKeys.ORGANIZATION_ID, this.user?.organization_id, true);
    this.isSelfConfig = this.router.url === '/self-configuration' || false;
  }

  ngDoCheck() {
    this.isSelfConfig = this.router?.url?.startsWith('/self-configuration') || false;
    if (this.isSelfConfig) {
      // For temporary use in self-configuration
      const divArea = document.querySelector('.total-result-box');
      if (divArea) divArea?.classList?.replace('total-result-box', 'temp-total-result-box');
    }
  }

  togglePrograms(e) {
    this.toggleProgramPanel = !this.toggleProgramPanel;
  }

  parentEventHandlerFunction(valueEmitted) {
    this.valueEmittedFromChildComponent = valueEmitted;
  }

  getMyPrograms() {
    const programList = this.storageService.get('ProgramList');
    if (programList) {
      this.programs = programList;
      this.setupProgram();
      this.userService.checkProgramModification();
    } else {
      this.subscription.push(
        this.userService.getAllPrograms().subscribe({
          next: (data: any) => {
            this.programs = data.programs;
            this.setupProgram();
          },
          error: err => {
            console.error(err);
          },
        }),
      );
    }
  }

  setupProgram() {
    if (Boolean(this.programs.length)) {
      if (!this.currentProgrumId && this.programs.some(p => p.id !== this.currentProgrumId)) {
        this.programService.setProgram(this.programs[0], true);
        this.currentProgrumId = this.programs[0]?.id;
        this.storageService.set(StorageKeys.PROGRAM_ID, this.currentProgrumId, true);
      } else {
        let currentProgram = this.programs.filter(p => p.id === this.currentProgrumId)[0];
        this.programService.setProgram(currentProgram, true);
        this.storageService.set(StorageKeys.PROGRAM_ID, currentProgram?.id, true);
      }
      let account = this.storageService.get(StorageKeys.CURRENT_ACCOUNT);
      if (account === null || account === undefined) {
        this.getMembershipDetailsAndRole();
      }
      this.eventStream.emit(new EmitEvent(Events.PROGRAM_SIDEBAR, false));
    }
  }

  getMembershipDetailsAndRole() {
    this.subscription.push(
      this.userService.getMembershipDetails(this.currentProgrumId, this.user.id).subscribe({
        next: (res: any) => {
          this.storageService.set(StorageKeys.CURRENT_ACCOUNT, res?.member, true);
          this.storageService.set(StorageKeys.USER_TYPE, res?.member.role.organization_category, true);
          let permissionList = res?.member?.role?.permissions;
          let permissions = [];
          permissionList?.forEach(element => {
            permissions.push(element?.slug);
          });
          this.storageService.set(StorageKeys.USER_PERMISSION, permissions, true);
        },
        error: err => {
          console.error(err);
        },
      }),
    );
  }
}
