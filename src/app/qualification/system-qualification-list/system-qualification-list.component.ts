import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { QualificationList,QualificationFilterModel } from '../qualification.model';
import { QualificationService } from '../qualification.service';
import { VMSConfig } from 'src/app/library/table/table/table.model';
import {
  EventStreamService,
  Events,
  EmitEvent,
} from 'src/app/core/services/event-stream.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { errorHandler } from 'src/app/shared/util/error-handler';


@Component({
  selector: 'system-qualification-list',
  templateUrl: './system-qualification-list.component.html',
  styleUrls: ['./system-qualification-list.component.scss']
})
export class SystemQualificationListComponent implements OnInit {
  isCreateQualificationItem = 'hidden';

  tableConfig: VMSConfig = {
    title: 'Qualification Types',
    columnList: [
      { name: 'name', title: 'Qualification', width: 27, isIcon: false, isImage: true, isContact: false, isNumberBadge: false },
      { name: 'code', title: 'Code', width: 20, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
      { name: 'source', title: 'Type', width: 20, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
      { name: 'modified_on', title: 'Updated Date', width: 15, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
      { name: 'is_enabled', title: 'Status', width: 13, isIcon: false, isImage: false, isContact: false, isVieworEdit: false, isDisableorDelete: false, isNumberBadge: false }
    ],
    isExpand: false,
    isFilter: true,
    isSearch: true,
    isSetting: true,
    isTopPagination: true,
    isDownload: false,
    isCreate: false,
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

  tableLoaded = false
  itemPerPage = 10;
  totalRecords = 10;
  vmsData: QualificationList;
  qualificationTypeId: string;
  searchTerm: '';
  filterDataPage: number;
  isAdvanceSearch = false;
  filterpayLoad: any;

  constructor(private _qualificationService: QualificationService,
    private _loader: LoaderService,
    private route: ActivatedRoute,
    private eventStream: EventStreamService,
    private _alert: AlertService) { }

   ngOnInit(): void {
    this.route.queryParams.subscribe(param => {
      this.tableConfig.title = param['name']
      this.qualificationTypeId = param['id']
    })
    this.getQulificationList();
   }

  onSearch(term) {
    this.searchTerm = term;
    this.getQulificationList();
  }

  getQulificationList(page = 1) {
    this._loader.show()
    this._qualificationService.getSystemQualificationList('*', this.qualificationTypeId, this.itemPerPage, page,this.searchTerm)
      .subscribe((data: QualificationList) => {
        this.totalRecords = data.total_records;
        this.vmsData = data;
        this.isAdvanceSearch = false;
        this._loader.hide()
      })
  }

  onViewClick(event) {
    let obj = { "event": true, "data": event };
    if (event) {
      this.eventStream.emit(new EmitEvent(Events.QUALIFICATION_ITEM_VIEW, obj));
    }
  }

  onCloseCreateQualificationItem(event) {
    this.isCreateQualificationItem = 'hidden';
  }

  onPaginationClick(event) {
    if (this.isAdvanceSearch) {
      this.filterDataPage = event;
      this.filterQualification(null, event);
    }
    else {
      this.getQulificationList(event);
    }
  }

   //advance filter
   onListFilter(event) {
    this._loader.show();
    this.isAdvanceSearch = true;
    this.filterpayLoad = event;
    this.filterQualification(event);
  }

    // Advance filter for qualification:
   filterQualification(payload = null, pageNo = 1) {
    let qualificationTypeId;
    this.route.queryParams.subscribe(param => {
      qualificationTypeId = param['id'];
    })
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
  this._qualificationService.getAdvanceFilterData('*', this.qualificationTypeId,filter ).subscribe({
    next: (data: any) => {
      this.vmsData = data;
          // this.itemPerpage = data.items_per_page;
          this.totalRecords = data.total_records;
          this.tableLoaded = true;
          this._loader.hide();
    },
    error: (err) => {
      this._alert.error(errorHandler(err));
    }
  });
 }

}
