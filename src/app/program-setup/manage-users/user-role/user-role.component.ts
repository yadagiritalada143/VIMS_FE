import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import {  Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { VMSConfig } from 'src/app/library/table/table/table.model';
import { StorageService } from '../../../core/services/storage.service';
import { LoaderService } from '../../../core/components/loader/loader.service';
import { ProgramConfig } from '../../../shared/enums';
import { errorHandler } from '../../../shared/util/error-handler';
import { UserService } from './../../../core/services/user.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-user-role',
  templateUrl: './user-role.component.html',
  styleUrls: ['./user-role.component.scss']
})
export class UserRoleComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];
  @Input() viewUserRole = 'hidden';
  @Input() userAssignedRoleName: any = {};
  @Input() userAssignedListData: any = [];
  @Output() onClose = new EventEmitter();
  @Output() userUpdated = new EventEmitter();

  public clientId: string;
  public programId: string;
  dataLoading = true;
  public userRoleData: any;
  public tableConfig: VMSConfig;
  public isExpand = false;
  public totalPages = 0;
  public totalRecords = 0;
  public itemsPerPage: any;
  public role: any;
  public tableLoaded = false;
  pageNo = 0;
  limit = 10;
  constructor(
    private router: Router, private eventStream: EventStreamService,
    private localStorage: StorageService, public userService: UserService,
    private _loader: LoaderService) { }

  ngOnInit(): void {
    let programid = this.localStorage.get(ProgramConfig[0]);
    programid = JSON.parse(programid);
    if (programid) {
      this.clientId = programid['clientId'];
      this.programId = programid['program_req_id'];
    }
    this.subscriptions.push(this.eventStream.on(Events.VIEW_USER_ROLE)
    .subscribe((data: any) => {
      if (data) {
        this.viewUserRole = 'visible';
      } else {
        this.viewUserRole = 'hidden';
      }
    }));

    this.tableConfig = {
      title: 'User Roles',
      columnList: [
        { name: 'first_name', title: 'User', width: 25, isIcon: false, isImage: true, isContact: false, isNumberBadge: false },
        { name: 'supervisor.first_name', title: 'Supervisor', width: 25, isIcon: false, isImage: true, isContact: false, isNumberBadge: false },
        { name: 'modified_on', title: 'Updated Date', width: 25, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
        { name: 'is_enabled', title: 'Status', width: 25, isIcon: false, isImage: false, isContact: false, isNoOption: false, isVieworEdit: true, isVieworClone: false, isDisableorDelete: true, isDelete: false, isNumberBadge: false }
      ],
      hideHeader: true,
      hideResultCount: true,
      isExpand: false,
      isFilter: false,
      isSearch: false,
      isSetting: false,
      isTopPagination: false,
      isCreate: false,
      hideBottomPagination: true,
      density: 'COMFORTABLE'
    };
  }


  sidebarClose() {
    this.userAssignedListData = [];
    // this.eventStream.emit(new EmitEvent(Events.VIEW_USER_ROLE, false));
    this.onClose.emit(true);
  }

  deactivateClicked(user) {
    this._loader.show();
    user = { ...user, ...{ is_enabled: !user.is_enabled } };
    this.subscriptions.push(
      this.userService.updateUser(`/configurator/organizations/${this.clientId}/members/${user.id}`, user)
        .subscribe({
          next: (data: any) => {
            this._loader.hide();
            this.userUpdated.emit();
          }, error: (err: Error | any) => {
            this._loader.hide();
            errorHandler(err);
          }
        }
      )
    );
  }

  onEditClick(user) {
    this.router.navigate(['/users/list/' + user.id]);
  }

  onClickView(user) {
    this.router.navigate(['/users/list/view/' + user.id]);
  }

  ngOnDestroy(): void {
    this.subscriptions?.forEach(sub => sub.unsubscribe());
  }
}
