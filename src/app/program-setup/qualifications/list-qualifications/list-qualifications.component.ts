import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { AccessControlService } from 'src/app/core/services/access-control.service';
import {
  EmitEvent,
  EventStreamService,
  Events,
} from 'src/app/core/services/event-stream.service';
import { StorageService } from 'src/app/core/services/storage.service';
import { SvmsRouterService } from 'src/app/core/services/svms-router.service';
import { VMSTableComponent } from 'src/app/library/table/table/table.component';
import { VMSConfig } from 'src/app/library/table/table/table.model';
import { ProgramService } from 'src/app/programs/program.service';
import { QualificationFilterModel } from 'src/app/qualification/qualification.model';
import { ConfirmationDialogService } from 'src/app/shared/components/confirmation-dialog/confirmation-dialog.service';
import { ProgramConfig } from '../../../shared/enums';
import { errorHandler } from '../../../shared/util/error-handler';

@Component({
  selector: 'app-list-qualifications',
  templateUrl: './list-qualifications.component.html',
  styleUrls: ['./list-qualifications.component.scss']
})
export class ListQualificationsComponent implements OnInit, OnDestroy {
  isCreateQualificationItem = 'hidden';
  isExpand = false;
  vmsData: any;
  description: any;
  @ViewChild(VMSTableComponent) vmsTable: VMSTableComponent;
  private subscriptions: Subscription[] = [];

  tableConfig: VMSConfig = {
    title: '',
    columnList: [
      { name: 'name', title: 'Qualification', width: 27, isIcon: false, isImage: true, isContact: false, isNumberBadge: false },
      { name: 'code', title: 'Code', width: 20, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
      { name: 'source', title: 'Type', width: 20, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
      { name: 'modified_on', title: 'Updated Date', width: 15, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
      { name: 'is_enabled', title: 'Status', width: 13, isIcon: false, isImage: false, isContact: false, isVieworEdit: true, isDisableorDelete: this.accessControlService.accessControl(), isDelete: this.accessControlService.accessControl(), isNumberBadge: false }
    ],
    isBack: true,
    isExpand: false,
    isFilter: true,
    isSearch: true,
    isSetting: true,
    isTopPagination: true,
    isDownload: false,
    isCreate: true,
    density: 'COMFORTABLE',
    advanceFilter: [
    { name: 'name', title: 'Qualification', filterType: 'TEXT'},
    { name: 'is_enabled', title: 'Status', filterType: 'SELECT', multiSelectData: [
      {name: 'ACTIVE', value: true },
      {name: 'INACTIVE', value: false }
    ]},
    { name: 'modified_on', title: 'Date Updated range', filterType: 'DATERANGE'},
   ]
  }
  public tableLoaded = false
  public itemPerpage = 10;
  public totalRecords = 30;
  searchTerm: '';
  filterDataPage: number;
  isAdvanceSearch = false;
  filterpayLoad: any;

  constructor(private eventStream: EventStreamService,
    private router: SvmsRouterService,
    private _programService: ProgramService,
    private _loader: LoaderService,
    private storageService: StorageService,
    private route: ActivatedRoute,
    private _alert: AlertService,
    private accessControlService: AccessControlService,
    private _confirmService : ConfirmationDialogService
    ) { }

  ngOnInit(): void {
    this.getQualificationItems();
    this.subscriptions.push(this.eventStream.on(Events.CREATE_QUALIFICATION_ITEM).subscribe((data:any) => {
      if (!data) {
        this.getQualificationItems();
      }
    }));
  }

  onBackClick() {
    this.router.navigate(["qualificationsList", "list"]);
  }

  onSearch(term) {
    this.searchTerm = term;
    this.getQualificationItems();
  }
  onPaginationClick(event) {
    if (this.isAdvanceSearch) {
      this.filterDataPage = event;
      this.filterQualification(null, event);
    }
    else {
      this.getQualificationItems(event);
    }
  }
  getQualificationItems(pageNo = 1) {
    let qualificationTypeId;
    this.subscriptions.push(this.route.queryParams.subscribe((param:any) => {
      qualificationTypeId = param['id'];
      this.tableConfig.title = param['name'];
    }));
    let programDetails = JSON.parse(this.storageService.get('NewProgramData'));
    let programId = programDetails?.['program_req_id'];
    this._loader.show();
    this._programService.get(`/configurator/programs/${programId}/qualification-types/${qualificationTypeId}/qualifications?limit=10&page=${pageNo}${this.searchTerm ? ('&k=' + this.searchTerm) : ''}`).subscribe(
      (data:any) => {
        if (data) {
          this.vmsData = data;
          this.itemPerpage = data.items_per_page;
          this.totalRecords = data.total_records;
          this.tableLoaded = true;
          this.isAdvanceSearch = false;
          this._loader.hide();
        }
      },
      (err) => {
        this._loader.hide();
        this._alert.error(errorHandler(err));
      });
  }
  onCreateClick(e) {
    if (e) {
      this.eventStream.emit(new EmitEvent(Events.CREATE_QUALIFICATION_ITEM, true));
    }
  }
  onCloseCreateQualificationItem(event) {
    this.isCreateQualificationItem = 'hidden';
  }
  onViewClick(event) {
    let obj = { "event": true, "data": event };
    if (event) {
      this.eventStream.emit(new EmitEvent(Events.QUALIFICATION_ITEM_VIEW, obj));
    }
  }
  onEditClick(event) {
    let obj = { "event": true, "data": event };
    if (event) {
      this.eventStream.emit(new EmitEvent(Events.EDIT_QUALIFICATION_ITEM, obj));
    }
  }
  onDisableClicked(event) {
    const programDetails = JSON.parse(this.storageService.get(ProgramConfig[0]));
    const programId = programDetails?.['program_req_id'];
    let qualificationTypeId;
    this.subscriptions.push(this.route.queryParams.subscribe((param:any) => {
      qualificationTypeId = param['id'];
    }));
    const qualificationItem = event;
    const payLoad = {
      is_enabled: qualificationItem.is_enabled ? 'False' : 'True',
    };
    this.subscriptions.push(this._programService.put(`/configurator/programs/${programId}/qualification-types/${qualificationTypeId}/qualifications/${event.id}`, payLoad).subscribe(
      data => {
        if (data) {
          this._alert.success(`You have updated qualification successfully.`);
          this.getQualificationItems();
        }
      },
      (err) => {
        this._alert.error(errorHandler(err));
      }
    ));
  }
  //soft delete qualification
  onDeleteClick(event) {
    const programDetails = JSON.parse(this.storageService.get(ProgramConfig[0]));
    const programId = programDetails?.['program_req_id'];
    let qualificationTypeId;
    this.route.queryParams.subscribe((param:any) => {
      qualificationTypeId = param['id'];
    })
    this._confirmService.confirm('', `Are you sure to delete the ${event.name} from Qualifications?`,
    'Yes','No')
      .then((confirmed) =>{
        if(confirmed){
          this.subscriptions.push(this._programService.delete(`/configurator/programs/${programId}/qualification-types/${qualificationTypeId}/qualifications/${event.id}`).subscribe(
            data => {
              if (data) {
                this._alert.success(`You have removed qualification successfully.`);
                this.getQualificationItems();
              }
            },
            (err) => {
              this._alert.error(errorHandler(err));
            }
          ));
        }
      }
    )
   .catch(() =>
     console.error('User dismissed the dialog')
   );
  }

 onListFilter(event) {
   this._loader.show();
   this.isAdvanceSearch = true;
   this.filterpayLoad = event;
  this.filterQualification(event);
}
 // Advance filter for qualification:
 filterQualification(payload = null, pageNo = 1) {
  let qualificationTypeId;
  this.subscriptions.push(this.route.queryParams.subscribe((param:any) => {
    qualificationTypeId = param['id'];
  }));
  let programDetails = JSON.parse(this.storageService.get('NewProgramData'));
  let programId = programDetails?.['program_req_id'];
  this._loader.show();
  let filter: QualificationFilterModel;
  if (payload !== null) {
    filter = {
      filters: {
        name: payload['name'],
        is_enabled: payload['is_enabled'],
        date_range:payload['modified_on']
      },
      pagination: {
        limit: 10,
        page: pageNo
      }
    }
  } else {
    filter = {
      pagination: {
        limit: 10,
        page: pageNo,
      }
    }
    if (this.filterpayLoad) {
      filter['filters'] = {
        name: this.filterpayLoad['name'],
        is_enabled: this.filterpayLoad['is_enabled'],
        date_range:this.filterpayLoad['modified_on']

      }
    }
  }
  this.subscriptions.push(this._programService.post(`/configurator/programs/${programId}/qualification-types/${qualificationTypeId}/qualifications/advanced-filters`, filter).subscribe(
    (data:any) => {
      this.vmsData = data;
          this.itemPerpage = data.items_per_page;
          this.totalRecords = data.total_records;
          this.tableLoaded = true;
          this._loader.hide();
    },
    (err) => {
      this._alert.error(errorHandler(err));
    }
  ));
 }

 ngOnDestroy(): void {
  this.subscriptions?.forEach(sub => sub.unsubscribe());
}
}
