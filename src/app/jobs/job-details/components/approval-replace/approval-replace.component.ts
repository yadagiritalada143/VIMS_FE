import { PopoverComponent } from './../../../../shared/components/popover/popover.component';
import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { IUser } from '../../interfaces/IUser';
import { JobDetailsService } from '../../job-details.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { Subject } from 'rxjs';
import { OrgCategories } from '../../enumerations/orgCategories';
import { debounceTime, distinctUntilChanged, map, switchMap, tap } from 'rxjs/operators';

@Component({
  selector: 'app-approval-replace',
  templateUrl: './approval-replace.component.html',
  styleUrls: ['./approval-replace.component.scss'],
})
export class ApprovalReplaceComponent implements OnInit {
  @Input() profile: any;
  @Input() role: string;

  @Output() replaceApprover = new EventEmitter<any>();

  @ViewChild(PopoverComponent) ngPobOver: PopoverComponent;

  selectedApprover: IUser;
  existingUserId: string;
  programId: string;
  approverList: IUser[];

  approverSearch = new Subject<string>();
  approverLoading: boolean = false;

  constructor(private jobService: JobDetailsService, private storage: StorageService) {
    this.approverSearch
      .pipe(
        map((v: any) => v?.term),
        debounceTime(200),
        distinctUntilChanged(),
        tap(() => {
          this.approverLoading = true;
        }),
        switchMap((value: any) =>
          this.jobService.getApproverMembers(this.programId, this.role === 'PMO' ? OrgCategories.MSP : OrgCategories.CLIENT, value),
        ),
      )
      .subscribe((res: any) => {
        if (res && 'total_records' in res) {
          // sort users by name
          if (res.members && res.members.length > 0) {
            res.members.forEach(
              e =>
                (e.full_name = `${e.first_name ? e.first_name + ' ' : ''}${e.middle_name ? e.middle_name + ' ' : ''}${
                  e.last_name ? e.last_name : ''
                }`),
            );
            this.approverList = res.members.sort((mem1, mem2) => mem1?.full_name.localeCompare(mem2?.full_name));
            this.filterSelectedUser();
          }
        }
        this.approverLoading = false;
      });
  }

  ngOnInit(): void {
    const currentProgram = this.storage.get(StorageKeys.CURRENT_PROGRAM);
    this.programId = currentProgram?.id;
    if (this.profile) {
      this.existingUserId = this.profile.id;
    }
  }

  filterSelectedUser = () => {
    if (this.profile && this.approverList && this.approverList.length > 0) {
      // remove user that is already selected in profile
      const index = this.approverList.findIndex(a => a.id === this.profile.id);
      if (index != -1) {
        this.approverList.splice(index, 1);
      }
    }
  };

  onClickPopOver = ($event: any) => {
    this.approverSearch.next($event);
  };

  replace() {
    const data = {
      selectedApprover: this.selectedApprover,
      existingUserId: this.existingUserId,
    };
    this.replaceApprover.emit(data);
  }

  onCancelReplaceApproval = () => {
    this.ngPobOver.closeOpenedPopOvers();
    this.resetData();
  };

  onClosingPopOver = () => {
    this.resetData();
  };

  resetData = () => {
    this.selectedApprover = null;
  };
}
