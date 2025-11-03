import { Component, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { EventEmitter } from '@angular/core';
import { PerfectScrollbarComponent, } from 'ngx-perfect-scrollbar';
import { forkJoin, Observable, of, Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { LoginService } from 'src/app/auth/login/login.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { ProgramService } from 'src/app/programs/program.service';
import { errorHandler } from 'src/app/shared/util/error-handler';

type UserEvent = { term: string, page: number };

@Component({
  selector: 'svms-impersonate-dialog',
  templateUrl: './impersonate-dialog.component.html',
  styleUrls: ['./impersonate-dialog.component.scss']
})
export class ImpersonateDialogComponent implements OnInit, OnDestroy {

  private subscriptions: Array <Subscription> = [];
  private userSubject: Subject <UserEvent> = new Subject <UserEvent> ();
  private prevUserEvent: UserEvent = { page: null, term: null };

  private userType: string = null;
  private serviceType: string = null;

  public userList: Array <any> = [];
  public userListLoading: boolean = false;
  public selectedIndex: number = -1;
  public totalRecords: number = Number.POSITIVE_INFINITY;
  public searchInput: string = '';

  public visibility: boolean = false;
  @Input('visibility') set Visibility(data: boolean) {
    if(data) {
      this.userSubject.next({ term: '', page: 1 });
    } else {
      this.prevUserEvent = { page: null, term: null };
      this.userList = [];
      this.selectedIndex = -1;
      this.totalRecords = 0;
      this.searchInput = '';
    }

    this.visibility = data;
  };

  @Output() visibilityChange: EventEmitter <boolean> = new EventEmitter <boolean> ();
  @ViewChild('impersonate', { static: false }) scrollbar?: PerfectScrollbarComponent;

  constructor (
    private programService: ProgramService,
    private storage: StorageService,
    private alert: AlertService,
    private loader: LoaderService,
    private loginService: LoginService
  ) { }

  ngOnInit(): void { 

    this.userType = this.storage.get(StorageKeys.USER_TYPE) ?? '';
    this.serviceType = (this.storage.get(StorageKeys.CURRENT_PROGRAM)?.service_type ?? '');

    // Program User search
    this.subscriptions.push(
      this.userSubject.pipe(
        debounceTime(400),
        distinctUntilChanged((prev: UserEvent, curr: UserEvent) => {
          return ((prev?.term === curr?.term) && (prev?.page === curr?.page));
        }),
        switchMap(({ term, page }) => {

          if (this.prevUserEvent.term !== term) {
            this.selectedIndex = -1;
          }

          this.userListLoading = true;
          return forkJoin([this.userSearchObservable(term, page), of(page), of(term)]);
        })
      ).subscribe({
        next: (res: any) => {
          if (Array.isArray(res)) {

            let page: number = res?.[1];
            let term: string = res?.[2];
            res = res?.[0];

            this.totalRecords = res.total_records;

            if ('members' in res) {
              if (page === 1) {
                this.userList = res.members;
              } else {
                this.userList = [...this.userList, ...res.members];
                if (this.scrollbar) {
                  document.body.click();
                  this.scrollbar?.directiveRef?.update();
                }
              }
            }

            this.prevUserEvent = { page, term };
            this.userListLoading = false;
          }
        }, error: (err: Error | any) => {
          this.alert.error(errorHandler(err));
          this.userListLoading = false;
        }
      })
    );

  }

  userSearchObservable(term: string, page: number): Observable <any> {

    let programId: string = this.storage.get(StorageKeys.PROGRAM_ID);
    if(!programId) {
      console.error('No selected program found');
      return of([]);
    }

    let url: string = `/configurator/programs/${programId}/impersonate_members?limit=10`;
    if(term) {
      url += `&k=${encodeURIComponent(term)}`;
    }
    if(page) {
      url += `&page=${page}`;
    }

    url += this.addOrgCategory();
    return this.programService.get(url);
  }
  
  searchMember(event: KeyboardEvent) {
    let target: any = event.target;
    let value: string = target?.value;
    this.userSubject.next({ term: value, page: 1 });
  }

  toggleVisibility(flag?: boolean) {
    this.visibilityChange.emit(flag);
  }

  showMore(evt: any) {
    if(this.visibility && !this.userListLoading) {
      if(this.userList.length < this.totalRecords) {
        this.userSubject.next({
          ...this.prevUserEvent,
          page: ((this.prevUserEvent.page || 0) + 1)
        });
      }
    }
  }

  addOrgCategory() {

    let result: Array<string> = [];
    if (this.userType === 'SUPER_ORG') {
      result = ['SUPER_ORG', 'MSP', 'CLIENT', 'VENDOR'];
    }

    if ((this.userType === 'MSP') && (this.serviceType?.startsWith('MSP'))) {
      result = ['MSP', 'CLIENT', 'VENDOR'];
    }

    if ((this.userType === 'CLIENT') && (this.serviceType?.startsWith('SELF'))) {
      result = ['VENDOR', 'CLIENT'];
    }

    // Only allow own user type if not specified
    return `&org_category=${(result?.length) ? result : [this.userType]}`;
  }

  impersonateUser() {
    if (this.selectedIndex !== -1) {

      let userData: any = this.userList?.[this.selectedIndex];
      let url: string = `/profile-manager/users/impersonate`;
      let payload: any = {
        target_user_id: userData?.['user_id']
      };

      this.loader.show();
      this.programService.post(url, payload).subscribe({
        next: (data: any) => {
          if (data) {
            this.loader.hide();
            this.loginService.startImpersonation(data);
            this.visibilityChange.emit(false);
          }
        }, error: (err: Error | any) => {
          this.loader.hide();
          console.error(err);
          this.alert.error(errorHandler(err));
        }
      });

    }
  }

  getUserName(entry: any) {
    if(entry?.first_name && entry?.last_name) {
      return ((entry?.first_name ?? "") + " " + (entry?.last_name ?? ""))?.trim();
    }

    if(entry?.username) {
      return entry?.username;
    }

    return 'Undefined';
  }

  shortHand(name: string) {
    let parts: Array <string> = name.split(/\s+/g);
    if(parts.length <= 2) {
      return parts.join(' ');
    }

    return [parts[0], parts[parts.length - 1]].join(' ');
  }

  get isTermSearch() {
    return (this.searchInput !== this.prevUserEvent?.term);
  }

  get dialogHeight(): number {
    let calcHeight: number = Math.min((window.innerHeight - 100), 560);
    return (calcHeight > 320) ? calcHeight : 320;
  }

  get scrollHeight(): number {
    let calcHeight: number = (this.dialogHeight - 264);
    return (this.dialogHeight > 72) ? calcHeight : 72;
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub: Subscription) => {
      sub?.unsubscribe();
    });
  }
}
