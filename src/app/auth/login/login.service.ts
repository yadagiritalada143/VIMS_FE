import { Injectable, OnDestroy } from '@angular/core';
import { EmitEvent, EventStreamService, Events } from 'src/app/core/services/event-stream.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { UserDataObj } from 'src/app/shared/enums';
import { AccountService } from '../account-setup/account.service';
import { UserService } from 'src/app/core/services/user.service';
import { Subject, Subscription, interval, takeUntil } from 'rxjs';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { PopupService } from 'src/app/shared/service/popup.service';
import { ProgramService } from 'src/app/programs/program.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { SvmsRouterService } from 'src/app/core/services/svms-router.service';
import * as _ from 'lodash';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { Router } from '@angular/router';
import { DashboardDataService } from 'src/app/dashboard/services/dashboard.data.service';


@Injectable({
  providedIn: 'root'
})
export class LoginService implements OnDestroy {

  private org_id: string = null;
  private userData: any = UserDataObj;
  private defaultProgramId: string = null;

  private subscriptions: Array <Subscription> = [];
  private userTypeLock: boolean = false;
  private programListLock: boolean = false;
  private lockAbort$: Subject <void> = new Subject <void> ();

  public impersonationSession: boolean = false;
  public impersonationAPILock: boolean = false;
  public impersonationExitLock: boolean = false;
  public APICallLock: number = 0;

  private loaderDestroyer$: Subject <void> = new Subject <void> ();

  constructor(
    private storageService: StorageService,
    private eventStream: EventStreamService,
    private accountService: AccountService,
    private userService: UserService,
    private alert: AlertService,
    private popupService: PopupService,
    private programService: ProgramService,
    private loader: LoaderService,
    private svmsRouter: SvmsRouterService,
    private router: Router,
    private dashboardDataService: DashboardDataService,
  ) {

    // Loader unlock listener
    this.subscriptions.push(
      interval(1200)
      .subscribe(() => {

        if(this.userTypeLock && this.programListLock) {
          
          // Reset locks
          this.userTypeLock = false;
          this.programListLock = false;

          // Hide loader          
          this.initializeLockListener();
        }
      })
    );

    this.impersonationSession = !!this.storageService.get(StorageKeys.IMPERSONATOR_TOKEN);
  }

  switchLinkedAccount(data: any) {
    this.storageService.clear();
    this.dashboardDataService.emptyDashboardData();
    this.router.navigate(['auth', 'login'], {
      state: { ...data }
    });
  }

  startImpersonation(data: any) {

    let currentUserToken: any = this.storageService.get(StorageKeys.TOKEN);
    let currentUserId: any = this.storageService.get(StorageKeys.CURRENT_USER)?.id;
    let program_id: string = this.storageService.get(StorageKeys.PROGRAM_ID);

    this.storageService.clear();
    this.storageService.set(StorageKeys.IMPERSONATOR_TOKEN, currentUserToken, true);
    this.storageService.set(StorageKeys.IMPERSONATOR_ID, currentUserId, true);
    this.impersonationSession = !this.impersonationSession;
    this.postLogin({ ...data, program_id });
  }

  exitImpersonation() {

    if(this.impersonationExitLock) {
      return;
    }

    this.impersonationLogout().subscribe({
      next: (res: any) => {
        this.revertToOriginalUser();
      }, error: (err: Error | any) => {
        console.error(err);
        this.alert.error(errorHandler(err));
      }
    });
  }

  // Switch to original user if it's data persists
  revertToOriginalUser() {
    if(this.impersonationExitLock) {
      return;
    }

    this.impersonationAPILock = true;
    this.impersonationExitLock = true;
    this.launchPersistentLoader();
    setTimeout(() => {
      this.impersonationAPILock = false;
      let userToken: any = this.storageService.get(StorageKeys.IMPERSONATOR_TOKEN);
      let userId: any = this.storageService.get(StorageKeys.IMPERSONATOR_ID);
      let program_id: any = this.storageService.get(StorageKeys.PROGRAM_ID);

      this.impersonationSession = !this.impersonationSession;
      this.storageService.clear();
      if(userToken && userId) {
        this.postLogin({
          user_id: userId,
          token: userToken,
          program_id
        });
      }
    }, 1600);
  }

  private postLogin(data) {
    this.dashboardDataService.emptyDashboardData();
    this.loader.show();
    this.eventStream.emit(new EmitEvent(Events.LoggedIn, true));
    this.storageService.set(this.userData[0], data['token'], true);

    if(data?.program_id) {
      this.defaultProgramId = data?.program_id;
    }

    if (data?.user_id) {
      this.accountService.getUser(data['user_id']).subscribe({
        next: (data) => {

        if(this.storageService.get(StorageKeys.IMPERSONATOR_TOKEN)) {
          this.storageService.set(StorageKeys.IMPERSONATION_START, '' + Date.now(), true);
        }

        if (data && data?.user) {
          this.storageService.set(StorageKeys.CURRENT_USER, data?.user, true);
          this.org_id = data?.user?.organization_id;
          this.getuserType(this.org_id);
          this.getMyPrograms();
          this.storageService.setWithExpiry(this.userData[4], 3, 50000);
          // this.getMembershipDetailsAndRole();
          this.popupService.closeAlert('close');
        } else {
          this.alert.warn('Invalid user information');
        }
        }, error: (err: Error | any) => {
          console.error(err);
          this.alert.error('ERR: Failed to retrieve user data');
          this.forceLogout();
        }
      });
    }
  }

  private getuserType(org_id: string) {
    if (org_id) {
      this.userService.get(`/configurator/organizations/${org_id}`).subscribe({
        next: (data: any) => {
          // Commented beacause of this ticket : V2M-10641
          // this.storageservice.set(StorageKeys.USER_TYPE, data.category, true);
          this.userService?.['sendMessagetoIframe']?.();
          this.userTypeLock = true;
        },
        error: (err: Error | any) => {
          console.error(err);
          this.alert.error('ERR: Failed to retrieve user data');
          this.forceLogout();
        }
      });
    }
  }

  private getMyPrograms() {
    this.userService.getAllPrograms().subscribe({
      next: (data: any) => {

        this.storageService.set(StorageKeys.PROGRAM_LIST, data?.programs, true); 
        this.getProgramDetails(this.defaultProgramId)
          .then((res: any) => {
            
            let programData: any = res?.program ?? res;
            if(programData && Array.isArray(data?.programs)) {
              data.programs = _.uniqBy([programData, ...data.programs], 'unique_id');
              this.storageService.set(StorageKeys.PROGRAM_ID, this.defaultProgramId, true)
              this.programService.setProgram(data?.programs[0], true, true, true);
            }

            this.programListLock = true;

          }).catch((err: Error | any) => {
            console.error(err);
            this.alert.error('ERR: Failed to retrieve program details');
            this.forceLogout();
        });
      }, error: (err: any) => {
        console.error(err);
        this.alert.error('ERR: Failed to retrieve program list');
        this.forceLogout();
      }
    });
  }

  private getProgramDetails(programId: any) {
    return this.userService.get(`/configurator/programs/${programId}`).toPromise();
  }

  private initializeLockListener() {
    this.subscriptions.push(
      interval(800)
      .pipe(takeUntil(this.lockAbort$))
      .subscribe(() => {
        if(this.APICallLock === 0) {
          this.svmsRouter.navigate(['dashboard']);
          this.lockAbort$.next();
          setTimeout(() => {
            this.impersonationExitLock = false;
            this.loaderDestroyer$.next();
            window.location.reload();
          }, 100);
        } else {
          this.loader.show();
        }
      })
    );
  }

  private forceLogout() {
    this.svmsRouter.navigate(['auth', 'login']);
    this.storageService.clear();
    this.loader.hide();
  }

  private impersonationLogout() {
    return this.userService.delete(`/profile-manager/stop-impersonation`, {}); 
  }

  private launchPersistentLoader() {
    interval(200).pipe(takeUntil(this.loaderDestroyer$))
    .subscribe(() => {
      this.loader.show();
    });
  }

  get isAPILockResolved(): boolean {
    return (this.APICallLock === 0);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((entry: Subscription) => {
      entry?.unsubscribe();
    });
  }
}
