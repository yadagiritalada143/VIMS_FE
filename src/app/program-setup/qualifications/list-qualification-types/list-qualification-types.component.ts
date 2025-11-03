import { Component, OnInit, ViewChild } from '@angular/core';
import { VMSTableComponent } from 'src/app/library/table/table/table.component';
import { VMSConfig } from 'src/app/library/table/table/table.model';
import { EventStreamService, Events, EmitEvent } from 'src/app/core/services/event-stream.service';
import { ProgramService } from 'src/app/programs/program.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { errorHandler } from '../../../shared/util/error-handler';
import { SvmsRouterService } from 'src/app/core/services/svms-router.service';
import { AuthorizationService } from 'src/app/core/services/authorize.service';
import { AccessControlService } from 'src/app/core/services/access-control.service';
import { debounceTime, Subject, Subscription, switchMap } from 'rxjs';

@Component({
  selector: 'app-list-qualification-types',
  templateUrl: './list-qualification-types.component.html',
  styleUrls: ['./list-qualification-types.component.scss']
})
export class ListQualificationTypesComponent implements OnInit {

  @ViewChild(VMSTableComponent) vmsTable: VMSTableComponent;

  public isCreateRole: ('visible' | 'hidden') = 'hidden';
  public vmsData: any;
  public tableLoading: boolean = true;
  public tableConfig: VMSConfig = {
    title: 'Qualification Type(s)',
    columnList: [
      { name: 'name', title: 'Qualification Type', width: 27, isIcon: false, isImage: true, isContact: false, isNumberBadge: false, enableClick: false },
      { name: 'total_qualifications', title: 'Count', width: 20, isIcon: false, isImage: false, isContact: false, isNumberBadge: true, enableClick: false },
      { name: 'type_label', title: 'Defined By', width: 20, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
      { name: 'modified_on', title: 'Updated Date', width: 15, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
      {
        name: 'is_enabled',
        title: 'Status',
        width: 13,
        isIcon: true,
        isImage: false,
        isContact: false,
        isDetails: true,
        isVieworEdit: this.editQualificationAllowed,
        isDisableorDelete: this.accessControlService.accessControl(),
        isDelete: false,
        isNumberBadge: false
      }
    ],
    isExpand: false,
    isFilter: true,
    isSearch: true,
    isSetting: true,
    isTopPagination: true,
    isDownload: false,
    density: 'COMFORTABLE',
    isCreate: this.addQualificationAllowed,
    advanceFilter: [
      { name: 'name', title: 'Qualification Type', filterType: 'TEXT' }
    ]
  };

  public itemPerPage: number = 10;
  public totalRecords: number = 10;
  public isAdvanceFilter: boolean = false;

  private programId: string;
  private subscriptions: Array<Subscription> = [];
  private qualSubject: Subject<any> = new Subject<any>();
  private prevQuery: any = { term: '', page: 1 };

  constructor(
    private eventStream: EventStreamService,
    private router: SvmsRouterService,
    private programService: ProgramService,
    private loader: LoaderService,
    private storageService: StorageService,
    private alert: AlertService,
    private accessControlService: AccessControlService,
    private authorizeService: AuthorizationService) { }

  ngOnInit(): void {

    this.programId = this.storageService.get(StorageKeys.PROGRAM_ID);
    this.subscriptions.push(
      this.qualSubject.pipe(
        debounceTime(600),
        switchMap((query: any) => {

          let { page, term } = (query ?? {});
          page = page ?? 1;
          term = term ?? '';
          this.prevQuery = { page, term };
          if (this.vmsTable?.currentPage) {
            this.vmsTable.currentPage = page;
          }

          let url: string = `/configurator/programs/${this.programId}/qualification-types?limit=${this.itemPerPage}&page=${page}&type_all=true`;
          this.tableConfig.isSearch = !this.isAdvanceFilter;
          if (term) {
            if (this.isAdvanceFilter) {
              url += `&k=${term}`;
            } else {
              url += `&name=${term}`;
            }
          }

          this.tableLoading = true;
          return this.programService.get(url);
        })
      )
        .subscribe({
          next: (data: any) => {
            if (data) {
              if(Array.isArray(data?.qualification_types)) {
                data.qualification_types = data.qualification_types?.map((entry: any) => {
                  return {
                    ...entry,
                    type_label: (entry?.['type'] === 'CUSTOM')?'Program':'Predefined'
                  }
                });
              }

              this.vmsData = data;
              this.tableLoading = false;
              this.totalRecords = data?.total_records;
            }
          }, error: (err: any) => {
            console.error(err);
            this.tableLoading = false;
            this.alert.error(errorHandler(err));
          }
        })
    );

    this.qualSubject.next(this.prevQuery);
  }

  onSearch(term: string) {
    this.qualSubject.next({ term, page: 1 });
  }

  onPaginationClick(page: number) {
    this.qualSubject.next({ ...this.prevQuery, page });
  }

  onDisableClicked(evt: any) {
    if (evt) {

      if(evt?.type !== 'CUSTOM') {
        this.alert.error('Editing Predefined Qualification Types are not allowed');
        return;
      }

      let url: string = `/configurator/programs/${this.programId}/qualification-types/${evt?.id}`;
      let payload: any = {
        is_enabled: !evt?.is_enabled
      };

      this.loader.show();
      this.programService.put(url, payload).subscribe({
        next: (data: any) => {
          if (data) {
            this.loader.hide();
            this.alert.success(`You have updated qualification successfully.`);
            evt.is_enabled = !evt.is_enabled;
          }
        }, error: (err: any) => {
          this.loader.hide();
          console.error(err);
          this.alert.error(errorHandler(err));
        }
      });
    }
  }

  columnClicked(columnData: any) {
    if (columnData?.name === 'name') {
      this.router.navigate(['qualifications', 'list-qualifications'], {
        queryParams: {
          name: columnData.vmsData.name,
          id: columnData.vmsData.id
        }
      });
    }
  }

  onCreateClick(evt: any) {
    if (evt) {
      this.isCreateRole = 'visible';
    }
  }

  onViewClick(evt: any) {
    if (evt?.id) {
      this.router.navigate(['qualificationsList', 'list-qualifications'], {
        queryParams: {
          name: evt?.name,
          id: evt?.id
        }
      });
    }
  }

  onDetailClick(evt: any) {
    if (evt?.id) {
      this.isCreateRole = 'visible';
      let obj: any = { "event": true, "data": evt };
      this.eventStream.emit(new EmitEvent(Events.QUALIFICATION_DATA_VIEW, obj));
    }
  }

  onEditClick(evt: any) {
    if (evt?.id) {

      if(evt?.type !== 'CUSTOM') {
        this.alert.error('Editing Predefined Qualification Types are not allowed');
        return;
      }

      this.isCreateRole = 'visible';
      let obj: any = { "event": true, "data": evt };
      this.eventStream.emit(new EmitEvent(Events.QUALIFICATION_DATA_EDIT, obj));
    }
  }

  onCloseCreateRole(evt: any) {
    this.isCreateRole = 'hidden';
    if (evt) {
      this.qualSubject.next(this.prevQuery);
    }
  }

  onListFilter(payload: any) {
    if (payload?.name) {
      this.isAdvanceFilter = true;
      this.qualSubject.next({ term: payload?.name, page: 1 });
    } else {
      this.isAdvanceFilter = false;
      this.qualSubject.next({ term: '', page: 1 });
    }
  }

  get addQualificationAllowed() {
    return this.authorizeService.authorize('create_qualification_type');
  }

  get editQualificationAllowed() {
    return this.authorizeService.authorize('update_qualification_type');
  }
}
