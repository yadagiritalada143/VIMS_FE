import { Component, OnInit } from '@angular/core';
import { VMSConfig } from 'src/app/library/table/table/table.model';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { QualificationService } from '../qualification.service';
import { QualificationTypeList } from '../qualification.model';
import { Router } from '@angular/router';
import { EmitEvent, Events, EventStreamService } from 'src/app/core/services/event-stream.service';

@Component({
  selector: 'system-qualification-type-list',
  templateUrl: './system-qualification-type-list.component.html',
  styleUrls: ['./system-qualification-type-list.component.scss']
})
export class SystemQualificationTypeListComponent implements OnInit {
  isCreateRole = 'hidden';

  tableConfig: VMSConfig = {
    title: 'Qualification Type',
    columnList: [
      { name: 'name', title: 'Qualification Type', width: 27, isIcon: false, isImage: true, isContact: false, isNumberBadge: false ,enableClick: true},
      { name: 'total_qualifications', title: 'Count', width: 20, isIcon: false, isImage: false, isContact: false, isNumberBadge: true, enableClick: true },
      { name: 'type', title: 'Type', width: 20, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
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
    density: 'COMFORTABLE'
  }

  tableLoaded = false
  itemPerPage = 10;
  totalRecords = 30;
  vmsData: QualificationTypeList;

  constructor(private _qualificationService: QualificationService,
    private eventStream: EventStreamService,
    private _loader: LoaderService,
    private router: Router) { }

  ngOnInit(): void {
    this.getSystemQulificationTypeData()
  }

  getSystemQulificationTypeData(page = 1) {
    this._loader.show()
    this._qualificationService.getSystemQualificationTypeList('*', this.itemPerPage, page)
      .subscribe((data: QualificationTypeList) => {
        this.vmsData = data;
        this.totalRecords = data.total_records;
        this._loader.hide()
      })
  }

  onQualificationTypeClick(event) {
    if (event.name === 'total_qualifications'||event.name === 'name') {
      this.router.navigate(['/qualifications/qualification-list'], { queryParams: { name: event.vmsData.name, id: event.vmsData.id } });
    }
  }
  onViewClick(event) {
    let obj = { "event": true, "data": event };
    if (event) {
      this.eventStream.emit(new EmitEvent(Events.SYSTEM_QUALIFICATION_TYPE_VIEW, obj));
    }
  }
  onCloseCreateRole(event) {
    this.isCreateRole = 'hidden';
  }

}
