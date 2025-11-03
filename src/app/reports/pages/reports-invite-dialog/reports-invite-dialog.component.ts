import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { debounceTime, distinctUntilChanged, map, Subject, switchMap, tap } from 'rxjs';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { UserService } from 'src/app/core/services/user.service';
import { ReportService } from '../../services/report.service';

@Component({
  selector: 'app-reports-invite-dialog',
  templateUrl: './reports-invite-dialog.component.html',
  styleUrls: ['./reports-invite-dialog.component.scss'],
})
export class ReportsInviteDialogComponent implements OnInit {
  @Input() showDialog: boolean;
  @Input() reportId: string;
  @Input() reportName: string;
  @Output() closeInviteDialog = new EventEmitter();

  public programId: string;
  public userLoading: boolean = false;
  public userSearch = new Subject<string>();
  public userList: any = [];
  public selectedUsers: any;
  public message: string = 'Loading...';
  public sharedTo: any = [];

  constructor(
    private localStorage: StorageService,
    private userService: UserService,
    private reportService: ReportService,
    private _alert: AlertService,
    private loader: LoaderService,
  ) {
    this.programId = this.localStorage.get(StorageKeys.CURRENT_PROGRAM)?.id;
    this.userSearch
      .pipe(
        map((v: any) => v.term),
        debounceTime(300),
        distinctUntilChanged(),
        tap(() => {
          this.userLoading = true;
        }),
        switchMap((value: any) => this.reportService.getMembers(value)),
      )
      .subscribe((value: any) => {
        const sharedIds = this.sharedTo?.map(mem => mem.id);
        value.members = value?.members?.filter(({ id }) => !sharedIds?.includes(id));
        this.userList = this.setMembers(value.members);
        this.userLoading = false;
      });
  }

  ngOnInit(): void {
    this.loader.show();
    this.getSharedReportAPIDetails(this.reportId);
  }

  close(): void {
    this.closeInviteDialog.emit(false);
  }

  searchUsers(term?: string): void {
    if (!term) {
      this.userList = [];
    }
  }

  getSharedReportAPIDetails(reportId: string): void {
    if (this.reportId) {
      this.reportService.get(`/report/programs/${this.programId}/reportshare/getSharedReports/${reportId}`).subscribe({
        next: (data: any) => {
          data?.data?.shared_to_user_ids;
          if (data?.data?.shared_to_user_ids?.length) this.getUsersList(data?.data?.shared_to_user_ids);
          else {
            this.message = 'No one has access to this!';
            this.loader.hide();
          }
        },
        error: err => {
          this.message = 'Error in loading the data!';
          this._alert.error('Failed to load the shared report details! Please try after sometime!');
          this.loader.hide();
        },
      });
    } else {
      this.message = 'Error in loading the data!';
      this._alert.error('Report ID is missing. Failed to load the details!');
      this.loader.hide();
    }
  }

  getUsersList(uIds: any): void {
    this.userService.getListOfUsersByIds(uIds, this.programId, true).subscribe({
      next: (data: any) => {
        if (data?.members?.length) {
          data.members.forEach(mem => {
            mem.name = `${mem.first_name} ${mem.last_name}`;
          });
          this.sharedTo = this.sortMembers(data.members);
        } else {
          this.sharedTo = data?.members;
        }
        this.loader.hide();
      },
      error: err => {
        this._alert.error('Failed to load list of users and their details related to job history.');
        this.loader.hide();
      },
    });
  }

  share(): void {
    this.loader.show();
    const payload = {
      report_id: this.reportId,
      saved_report: this.reportName,
      user_id: this.selectedUsers.map(user => user?.id),
    };
    this.reportService.post(`/report/programs/${this.programId}/reportshare/create`, payload).subscribe({
      next: (data: any) => {
        this._alert.success(data?.message || 'Report has been shared successfully');
        this.loader.hide();
        this.close();
      },
      error: (err: any) => {
        this._alert.error('Failed to share the report. Please try after sometime!');
        this.loader.hide();
      },
    });
  }

  remove(member: any): void {
    this.loader.show();
    const payload = {
      body: {
        report_id: this.reportId,
        user_id: member.id,
      },
    };
    this.reportService.delete(`/report/programs/${this.programId}/reportshare/delete`, payload).subscribe({
      next: (data: any) => {
        this._alert.success(data?.message);
        this.loader.hide();
        this.close();
      },
      error: (err: any) => {
        this._alert.error('Failed to remove the user from report access. Please try after sometime!');
        this.loader.hide();
      },
    });
  }

  setMembers(members) {
    const userType = this.localStorage.get(StorageKeys.USER_TYPE)?.toLowerCase();
    return members
      ?.map(mem => ({
        id: mem?.id,
        full_name:
          userType === 'client' || userType === 'vendor'
            ? `${mem?.first_name} ${mem?.middle_name ? mem?.middle_name + ' ' : ''}${mem?.last_name}`
            : `${mem?.first_name} ${mem?.middle_name ? mem?.middle_name + ' ' : ''}${mem?.last_name} - ${mem?.organization?.category} - ${
                mem?.organization?.name
              }`,
        first_name: mem?.first_name,
        last_name: mem?.last_name,
        email: mem?.email,
        is_enabled: mem?.is_enabled,
      }))
      .sort((mem1, mem2) => mem1?.full_name?.localeCompare(mem2?.full_name));
  }

  sortMembers(members) {
    return members.sort((mem1, mem2) => (mem1.first_name + ' ' + mem1.last_name).localeCompare(mem2.first_name + ' ' + mem2.last_name));
  }
}
