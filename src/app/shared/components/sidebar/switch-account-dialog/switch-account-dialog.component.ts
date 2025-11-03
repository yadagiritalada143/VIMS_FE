import { Component, OnInit, Input, Output } from '@angular/core';
import { EventEmitter } from '@angular/core';
import { StorageKeys, StorageService } from '../../../../core/services/storage.service';
import { ProgramService } from 'src/app/programs/program.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { LoginService } from 'src/app/auth/login/login.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { UserService } from 'src/app/core/services/user.service';
import { errorHandler } from '../../../util/error-handler';
import { SortHelperPipe } from 'src/app/shared/pipe/sort-helper.pipe';
@Component({
  selector: 'app-switch-account-dialog',
  templateUrl: './switch-account-dialog.component.html',
  styleUrls: ['./switch-account-dialog.component.scss'],
})
export class SwitchAccountDialogComponent implements OnInit {
  public visibility: boolean = false;
  @Input('visibility') set Visibility(data: boolean) {
    this.visibility = data;
  }

  @Output() visibilityChange: EventEmitter<boolean> = new EventEmitter<boolean>();

  selectAccount: boolean = false;
  linkedAccounts: Array<any> = [];
  originalLinkedAccounts: Array<any> = [];
  public user: any;
  public selectedLinkedUser: string = null;
  public searchInput: string = '';
  enableSwitch: boolean = true;
  hideSearchbar = true;
  showClear = false;
  currentAccount: any;

  constructor(
    private _storageService: StorageService,
    public programService: ProgramService,
    public userService: UserService,
    private alert: AlertService,
    private loader: LoaderService,
    public loginService: LoginService,
    public sortHelper: SortHelperPipe,
  ) {
    this.currentAccount = this._storageService.get(StorageKeys.CURRENT_ACCOUNT);
  }

  ngOnInit(): void {
    this.user = this._storageService.get('user');

    this.getSSOLinkedAccount();
  }

  switchToLinkedUser() {
    let userId = '';
    this.linkedAccounts.forEach(element => {
      if (element.selectAccount == true) {
        userId = element.user_id;
      }
    });
    var currUserId: string = this._storageService.get(StorageKeys.CURRENT_USER)?.id;
    if (userId) {
      let url: string = `/global-tms/global-persona/users/${currUserId}/switch/${userId}`;
      let putUrl: string = `/global-tms/global-persona/users/${userId}`;
      this.loader.show();
      this._storageService.remove(StorageKeys.CURRENT_ACCOUNT);
      this.userService.put(putUrl, { is_preferred: true }).subscribe({
        next: (data: any) => {
          this.userService.get(url).subscribe({
            next: (data: any) => {
              this.loader.hide();
              this.loginService.switchLinkedAccount(data);
            },
            error: (err: any) => {
              this._storageService.set(StorageKeys.CURRENT_ACCOUNT, this.currentAccount);
              this.loader.hide();
              this.alert.error(errorHandler(err));
            },
          });
        },
        error: (err: any) => {
          this._storageService.set(StorageKeys.CURRENT_ACCOUNT, this.currentAccount);
          this.loader.hide();
          this.alert.error(errorHandler(err));
        },
      });
    } else {
      let switchUserId = '';
      this.linkedAccounts.forEach(element => {
        if (element?.selectedSwitchAcount == true) {
          switchUserId = element.user_id;
        }
      });
      if (switchUserId) {
        var switchUrl: string = `/global-tms/global-persona/users/${currUserId}/switch/${switchUserId}`;
        this._storageService.remove(StorageKeys.CURRENT_ACCOUNT);
        this.userService.get(switchUrl).subscribe({
          next: (data: any) => {
            this.loader.hide();
            this.loginService.switchLinkedAccount(data);
          },
          error: (err: any) => {
            this._storageService.set(StorageKeys.CURRENT_ACCOUNT, this.currentAccount);
            this.loader.hide();
            this.alert.error(errorHandler(err));
          },
        });
      }
    }
  }

  getSSOLinkedAccount = () => {
    if (this.user) {
      const url = `/global-tms/global-persona/users/${this.user._id}/attached-users`;
      this.programService.get(url).subscribe((result: any) => {
        if (result && result?.linked_user_info?.length > 0) {
          this.linkedAccounts = this.sortHelper.transform(
            result?.linked_user_info?.filter(acc => acc.user_id !== this.user._id),
            'contact_email',
          );
          this.linkedAccounts.forEach(element => {
            element.selectAccount = false;
            element.selectedSwitchAcount = false;
          });
          this.linkedAccounts.forEach(element => {
            if (element.is_preferred) {
              element.selectAccount = true;
            }
          });
        } else {
          this.linkedAccounts = [];
          if (this.linkedAccounts?.length == 0) {
            this.hideSearchbar = false;
          } else {
            this.hideSearchbar = true;
          }
        }
        this.originalLinkedAccounts = [...this.linkedAccounts];
      });
    }
  };

  getDefaultSsoAccount = () => {
    if (this.user) {
      const url = `/global-tms/global-persona/users/${this.user._id}/attached-users`;
      this.programService.get(url).subscribe((result: any) => {
        this.linkedAccounts.forEach(element => {
          if (element.user_id == result?.user_id) {
            element.selectAccount = true;
          }
        });
      });
    }
  };

  searchAccount(event: KeyboardEvent) {
    if (event?.target?.['value'] && event?.target?.['value'] != '') {
      this.showClear = true;
      this.linkedAccounts = [
        ...this.originalLinkedAccounts.filter(
          acc =>
            acc?.contact_email?.toLowerCase()?.includes(event?.target?.['value']?.toLowerCase()) ||
            acc?.user_type?.toLowerCase()?.includes(event?.target?.['value']?.toLowerCase()),
        ),
      ];
    } else {
      this.showClear = false;
      this.linkedAccounts = [...this.originalLinkedAccounts];
    }
  }

  toggleVisibility(flag?: boolean) {
    this.visibilityChange.emit(flag);
  }

  toggleAccount(index) {
    this.linkedAccounts.forEach((element, i) => {
      if (index != i) {
        element.selectedSwitchAcount = false;
      }
    });
    this.linkedAccounts[index].selectedSwitchAcount = !this.linkedAccounts[index].selectedSwitchAcount;
    this.enableSwitch = true;
    this.linkedAccounts.forEach((element, i) => {
      if (element?.selectedSwitchAcount) {
        this.enableSwitch = false;
      }
    });
  }

  toggleStar(index, event) {
    event.stopPropagation();
    this.linkedAccounts.forEach((element, i) => {
      if (index != i) {
        element.selectAccount = false;
      }
    });
    this.linkedAccounts[index].selectAccount = !this.linkedAccounts[index].selectAccount;
    // this.enableSwitch = true;
    // this.linkedAccounts.forEach((element, i) => {
    //   if (element?.selectAccount) {
    //     this.enableSwitch = false;
    //   }
    // });
  }

  get dialogHeight(): number {
    let calcHeight: number = Math.min(window.innerHeight - 100, 560);
    return calcHeight > 320 ? calcHeight : 320;
  }

  get scrollHeight(): number {
    let calcHeight: number = this.dialogHeight - 264;
    return this.dialogHeight > 72 ? calcHeight : 72;
  }
}
