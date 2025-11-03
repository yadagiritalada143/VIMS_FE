import { Injectable, OnDestroy } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subject, Subscription, debounceTime, filter, interval, takeUntil, tap } from 'rxjs';
import { ProgramService } from '../programs/program.service';
import { StorageKeys, StorageService } from '../core/services/storage.service';
import { LoginService } from '../auth/login/login.service';
import { EventStreamService, Events } from '../core/services/event-stream.service';
// import { AlertService } from '../core/components/alert/alert.service';

/**
 * Service for maintaining session time of logged user
*/
@Injectable({
  providedIn: 'root'
})
export class SessionService implements OnDestroy {

  private lastProgramId: string = null;
  private warningTimeout: number = 30_000;
  private sessionTimeout: number = 120_000;

  private subscriptions: Array <Subscription> = [];
  private activityDetectionSub: Subject <void> = new Subject <void> ();

  private showModal: boolean = false;
  public modalStartTime: number = null;

  constructor(
    private router: Router,
    // private alert: AlertService,
    private storage: StorageService,
    private loginService: LoginService,
    private programService: ProgramService,
    private eventStream: EventStreamService,
  ) {

    console.log('Session Service Initialized!');
    this.subscriptions.push(
      this.eventStream.on(Events.PROGRAM_CONFIGURATION_UPDATED)
      .subscribe(() => {
        this.ngOnDestroyHelper();
        this.OnInit();
      })
    );
  
    this.OnInit();
  }

  public mouseActionDetected(): void {
    this.activityDetectionSub.next();
  }

  public keyboardEvtTriggered(): void {
    this.activityDetectionSub.next();
  }

  public preventEvent(evt: MouseEvent) {
    evt?.stopImmediatePropagation();
    evt?.preventDefault();
  }

  public closeModal(forced: boolean = false) {
    let expired: boolean = this.sessionModalExpired;
    this.showModal = false;
    this.modalStartTime = null;
    this.activityDetectionSub.next();
    if(expired || forced) {
      this.programService.userLogout(true);
    }
  }

  async OnInit() {

    // this.OnInitHelper();
    await this.APILockHolder();
    this.OnInitHelper();

    console.log(this.sessionTimeout, new Date());
    this.lastProgramId = this.programId;

    // Navigation Event Detection
    this.subscriptions.push(
      this.router.events.pipe(
        filter((evt: any) => evt instanceof NavigationEnd)
      ).subscribe(() => {
        this.activityDetectionSub.next();
      })
    );

    // Inactivity Detection
    this.subscriptions.push(
      this.activityDetectionSub.pipe(
        tap(() => { this.storage.set(StorageKeys.INACTIVITY_START_TIME, Date.now(), true) }),
        debounceTime(this.sessionTimeout - this.warningTimeout)
      ).subscribe(() => {
        if(this.programId && !this.showModal) {
          this.showModal = true;
          this.modalStartTime = Date.now();
        }
      })
    );

    this.initializeProgramChangeDetector();
    this.initializeTokenCleaner();
    setTimeout(() => {
      this.activityDetectionSub.next();
    }, 0);
  }

  private OnInitHelper() {

    let seconds: number = Number.parseInt(this.storage.get(StorageKeys.CURRENT_PROGRAM)?.config?.session_timeout || 0);
    if(seconds) {
      this.sessionTimeout = seconds * 1000;

      // User is logged within a program
      // if(this.sessionExpired) {
      //   this.alert.error('Your session has timed out due to inactivity');
      //   let destroySub$: Subject <void> = new Subject <void> ();
      //   this.launchPersistentLoader(destroySub$);
      //   setTimeout(() => {
      //     this.programService.userLogout(true);
      //     destroySub$.next();
      //     this.loader.hide();
      //   }, 4000);
      // }

    } else {
      this.sessionTimeout = 120_000;
    }
  }

  ngOnDestroy(): void {
    this.ngOnDestroyHelper();
  }

  private initializeProgramChangeDetector() {
    this.subscriptions.push(
      interval(900).subscribe(() => {
          if(this.programId) {
            if(this.programId !== this.lastProgramId) {
              this.ngOnDestroyHelper();
              this.OnInit();
            }
          }
        }
      )
    )
  }

  private initializeTokenCleaner() {
    let destroySub$: Subject <void> = new Subject <void> ();
    interval(200).pipe(takeUntil(destroySub$))
      .subscribe(() => {
        if(this.sessionModalExpired) {
          this.storage.clear();
          destroySub$.next();
        }
      })
  }

  private ngOnDestroyHelper() {
    this.subscriptions.forEach((sub: Subscription) => {
      sub?.unsubscribe();
    });

    this.subscriptions = [];
  }

  private get programId() {
    return this.storage.get(StorageKeys.PROGRAM_ID);
  }

  // private launchPersistentLoader(destroy$: Subject <void>) {
  //   this.subscriptions.push(
  //     interval(40).pipe(
  //       takeUntil(destroy$)
  //     ).subscribe(() => {
  //       this.loader.show();
  //     })
  //   );
  // }

  async APILockHolder() {
    let destroySub$: Subject <void> = new Subject <void> ();
    return new Promise((resolve: Function, reject: Function) => {

      // this.loader.show();
      interval(200).pipe(takeUntil(destroySub$)).subscribe(() => {
        if(this.loginService.APICallLock === 0) {
          setTimeout(()=> {
            // this.loader.hide();
            resolve();
          }, 1200);

          destroySub$.next();
        }
      })
    });
  }

  get modalVisibility(): boolean {
    return this.showModal;
  }

  get sessionModalTimerLeft(): string {
    let timeLeft: number = this.warningTimeout/1000 - (Date.now() - this.modalStartTime)/1000;
    let minutes: string = '0' + Number.parseInt((timeLeft/60) + '');
    let seconds: string | number = Number.parseInt((timeLeft%60) + '');
    if(seconds < 10) {
      seconds = '0' + seconds;
    }

    return minutes + ':' + seconds;
  }

  get sessionModalExpired(): boolean {
    if(this.modalStartTime) {
      return ((Date.now() - this.modalStartTime) > this.warningTimeout);
    }

    return false;
  }

  get sessionExpired(): boolean {
    let inactivity_start_time: number = Number.parseInt(this.storage.get(StorageKeys.INACTIVITY_START_TIME) || 0);
    if(!inactivity_start_time) {
      return false;
    }

    return (Date.now() - inactivity_start_time >= this.sessionTimeout);
  }

  get isSvmsUser(): boolean {
    return (this.storage.get(StorageKeys.USER_TYPE) === 'SUPER_ORG');
  }
}
