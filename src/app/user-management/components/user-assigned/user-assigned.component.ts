import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { VMSConfig } from 'src/app/library/table/table/table.model';
import { Router } from '@angular/router';
import { UserService } from 'src/app/core/services/user.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { Observable, Subject } from 'rxjs';
import { debounceTime, switchMap, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-user-assigned',
  templateUrl: './user-assigned.component.html',
  styleUrls: ['./user-assigned.component.scss']
})
export class UserAssignedComponent implements OnInit, OnDestroy {

  @Output() public onClose = new EventEmitter();
  @Input() usersAssigned: string = 'hidden';
  @Input() roleName: string = null;

  public roleId: string = null;
  @Input('roleId') set fetchRoles(roleId: string) {
    if (roleId) {
      this.roleId = roleId;
      this.roleSubject.next();
    }
  }

  public tableConfig: VMSConfig;
  public tableLoading: boolean = false;
  public vmsData: Array<any> = [];
  public totalRecords: number = 0;
  public itemsPerPage: number = 10;
  public currentPage: number = 1;
  public resetTrigger: boolean = true;

  private roleSubject: Subject<void> = new Subject<void>();
  private $destroy: Subject<void> = new Subject<void>();

  constructor (
    private router: Router,
    private userService: UserService,
    private storageService: StorageService,
    private alert: AlertService
  ) { }

  ngOnInit(): void {

    this.tableConfig = {
      title: 'Associated Users',
      columnList: [
        {
          name: 'first_name', title: 'User',
          width: 25, isIcon: false,
          icon: 'expand_more', isImage: true,
          isContact: false, isNumberBadge: false
        },
        {
          name: 'supervisor.full_name', title: 'Supervisor',
          width: 25, isIcon: false, isImage: false,
          isContact: false, isNumberBadge: false
        },
        {
          name: 'is_enabled', title: 'Status',
          width: 20, isIcon: false, isImage: false,
          isContact: false, isNumberBadge: false,
          isNoOption: false, isVieworEdit: true,
          isDisableorDelete: false, isDelete: false
        }
      ],
      hideHeader: false,
      showTabs: false,
      isExpand: false,
      isFilter: false,
      isSearch: false,
      isSetting: false,
      isTopPagination: true,
      isCreate: false,
      hideResultCount: true,
      hideBottomPagination: true,
      density: 'COMFORTABLE',
    };

    this.roleSubject
      .pipe(
        takeUntil(this.$destroy),
        debounceTime(400),
        switchMap(() => this.fetchUsersByRole())
      ).subscribe({
        next: (res: any) => {
          if (res) {
            const {
              items_per_page,
              total_records,
            } = res;

            this.itemsPerPage = items_per_page;
            this.totalRecords = total_records;
            this.vmsData = res?.members;
            this.tableLoading = false;
          }
        }, error: (err: Error | any) => {
          this.alert.error(errorHandler(err));
          this.tableLoading = false;
        }
      }
    );
  }

  onPaginationClick(page: number) {
    this.currentPage = page;
    this.roleSubject.next();
  }

  sidebarClose() {
    this.currentPage = 1;
    this.totalRecords = 0;
    this.usersAssigned = 'hidden';
    this.onClose.emit(true);
    this.resetTrigger = false;
    setTimeout(() => {
      this.resetTrigger = true;
    }, 200);
  }

  onEditClick(user) {
    this.router.navigate(['/users/list/' + user.id]);
  }

  onClickView(user) {
    this.router.navigate(['/users/list/view/' + user.id]);
  }

  onDisableClicked(event) { }

  onDeleteClick(event) { }

  fetchUsersByRole(): Observable<any> {

    let programId = this.storageService.get(StorageKeys.PROGRAM_ID);
    let url = `/configurator/programs/${programId}/members?limit=${this.itemsPerPage}&page=${this.currentPage}&role_ids=${this.roleId}`;

    this.tableLoading = true;
    return this.userService.get(url);

  }

  ngOnDestroy(): void {
    this.$destroy.next();
  }
}
