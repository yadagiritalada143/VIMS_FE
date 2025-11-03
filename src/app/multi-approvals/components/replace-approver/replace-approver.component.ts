import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { EventStreamService, Events } from 'src/app/core/services/event-stream.service';
import { Subject, Subscription, debounceTime, distinctUntilChanged, map, switchMap, tap } from 'rxjs'
import { JobDetailsService } from 'src/app/jobs/job-details/job-details.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
@Component({
  selector: 'app-replace-approver',
  templateUrl: './replace-approver.component.html',
  styleUrls: ['./replace-approver.component.scss']
})

export class ReplaceApproverComponent implements OnInit {
  public isSidebarVisible = 'hidden';
  public clickOutside: boolean;
  private subscrptions: Subscription[] = [];
  @Input() profile: any;
  @Input() role: string;
  @Input() replaceUsersList = [];
  @Input() set replaceType(value) {
    if (value == 'review') {
      this.selectLabel = 'Select The Reviewer';
      this.selectPlaceholder = 'Select New Reviewer'
      this.replaceHeaderLabel = 'Replace Reviewer'
    }
  }
  @Output() replaceApprover = new EventEmitter<any>();
  @Output() closeSidebar = new EventEmitter<any>();
  selectedApprover: any;
  existingUserId: string;
  programId: string;
  approverList: any[];
  approverSearch = new Subject<any>();
  approverLoading: boolean = false;
  notes;
  selectLabel = 'Select The Approver';
  selectPlaceholder = 'Select New Approver';
  replaceHeaderLabel = 'Replace Approver'
  constructor(private jobService: JobDetailsService,
    private storage: StorageService,
    private eventStream: EventStreamService
    ) {
    if(this.replaceUsersList?.length == 0) {
    this.approverSearch
      .pipe(
        map((v: any) => v?.term),
        debounceTime(300),
        distinctUntilChanged(),
        tap(() => {
          this.approverLoading = true;
        }),
        switchMap((value: any) =>
          this.jobService.getApproverMembers(this.programId, 'CLIENT,MSP', value),
        ),
      ).subscribe((res: any) => {
        if (res && 'total_records' in res) {
          // sort users by name
          if (res.members && res.members.length > 0) {
            res.members.forEach(
              e => (e.full_name = `${e.first_name ? e.first_name + ' ' : ''}${e.middle_name ? e.middle_name + ' ' : ''}${e.last_name ? e.last_name : ''
                }`),
            );
            this.approverList = res.members.sort((mem1, mem2) => mem1?.full_name.localeCompare(mem2?.full_name));
            this.filterSelectedUser();
          }
        }
        this.approverLoading = false;
      });
    } else {
      this.approverList = this.replaceUsersList;
    }
  }

  ngOnChanges() { }

  ngOnInit(): void {
    const currentProgram = this.storage.get(StorageKeys.CURRENT_PROGRAM);
    this.programId = currentProgram?.id;
    if (this.profile) {
      this.existingUserId = this.profile.id;
    }

    this.subscrptions.push(this.eventStream.on(Events.REPLACE_APPROVER).subscribe((data) => {
      if (data) {
        if(this.replaceUsersList?.length > 0) {
          this.approverList = this.replaceUsersList;
          this.approverList?.sort((a,b)=>a?.full_name?.localeCompare(b?.full_name));
        } else {
          this.approverSearch.next(true);
        }
        this.isSidebarVisible = "visible";
      } else {
        this.isSidebarVisible = "hidden"
      }
    }));
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

  replace() {
    const data = {
      selectedApprover: this.selectedApprover,
      existingUserId: this.existingUserId,
      notes: this.notes
    };
    this.replaceApprover.emit(data);
    this.sidebarClose();
  }
  resetData = () => {
    this.selectedApprover = null;
    this.notes = null;
  };

  sidebarClose() {
    this.resetData();
    this.isSidebarVisible = 'hidden';
    this.closeSidebar.emit(true);
  }

  searchReplacers(event) {
    if(this.replaceUsersList?.length == 0) {
      this.approverSearch.next(event)
    }
  }
  
}