import { Component, OnInit, ViewChild } from '@angular/core';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { AccessControlService } from 'src/app/core/services/access-control.service';
import {
  EmitEvent,
  EventStreamService,
  Events,
} from 'src/app/core/services/event-stream.service';
import { StorageService } from 'src/app/core/services/storage.service';
import { VMSTableComponent } from 'src/app/library/table/table/table.component';
import { VMSConfig } from 'src/app/library/table/table/table.model';
import { ProgramService } from 'src/app/programs/program.service';
import { errorHandler } from '../../../shared/util/error-handler';

@Component({
  selector: 'app-task-checklist',
  templateUrl: './task-checklist.component.html',
  styleUrls: ['./task-checklist.component.scss']
})
export class TaskChecklistComponent implements OnInit {
  vmsData: any;
  checklistCreateForm = 'hidden';
  searchTerm: any;
  public tableLoaded = false;
  public itemsPerPage = 10;
  public totalRecords = 10;
  public showWarningModal: boolean = false;
  public selectedChecklist: any;
  @ViewChild(VMSTableComponent) vmsTable: VMSTableComponent;

  constructor(
    private eventStream: EventStreamService,
    private _programService: ProgramService,
    private accessControlService: AccessControlService,
    private _loader: LoaderService,
    private storageService: StorageService,
    private _alert: AlertService,
  ) { }

  tableConfig: VMSConfig = {
    title: 'Checklists',
    columnList: [
      {name: 'name', title: 'Checklist Name', width: 30, isIcon: false, isImage: false, isContact: false, isNumberBadge: false},
      {name: 'description', title: 'Description', width: 50, isIcon: false, isImage: false, isContact: false, isNumberBadge: false},
      {
        name: 'is_enabled', title: 'Status', width: 20, isIcon: false, isImage: false,
        isContact: false, isNoOption: false, isVieworEdit: true, isDisableorDelete: this.accessControlService.accessControl(), isDelete: this.accessControlService.accessControl(), isNumberBadge: false
      }

    ],
    isExpand: false,
    isDownload: false,
    isFilter: true,
    isSearch: true,
    isSetting: true,
    isTopPagination: true,
    isCreate: true,
    density: 'COMFORTABLE',
    advanceFilter: [
      {name: 'name', title: 'Checklist Name', filterType: 'TEXT'},
    ]
  };

  ngOnInit(): void {
    this.listChecklist();
  }

  listChecklist(pageNo = 1) {

    let programDetails = JSON.parse(this.storageService.get('NewProgramData'));
    let programId = programDetails?.['program_req_id'];

    this._loader.show();
    this._programService.get(`/configurator/programs/${programId}/onboarding/checklists?limit=${this.itemsPerPage}&page=${pageNo}${this.searchTerm ? ('&k=' + this.searchTerm) : ''}`)
      .subscribe({
        next: (data: any) => {
          if (data) {
            this.vmsData = data;
            this.itemsPerPage = 10;
            this.totalRecords = data.total_records;
            this.tableLoaded = true;
            this._loader.hide();
          }
        }, error: (err: Error | any) => {
          this._loader.hide();
          this._alert.error(errorHandler(err));
        }
      }
    );
  }

  onClickView(event) {
    const obj = {event: true, data: event};
    this.eventStream.emit(new EmitEvent(Events.VIEW_CHECKLIST, obj));
  }

  onEditClick(event) {
    const obj = {event: true, data: event};
    this.eventStream.emit(new EmitEvent(Events.EDIT_CHECKLIST, obj));
  }

  onPaginationClick(event) {
    this.listChecklist(event);
  }

  disableClicked(event) {
    const tasks = [];
    let order = 1;
    event.tasks.map(task => {
      if (task.dependent_task) {
        tasks.push({
          task_id: task.task.id,
          order,
          dependent_task_id: task.dependent_task.id,
        });
      } else {
        tasks.push({
          task_id: task.task.id,
          order,
        });
      }
      order++;
    });
    const payload = {
      ...event
    };
    payload.tasks = tasks;
    payload.is_enabled = !payload.is_enabled;

    const programId = this.storageService.get('PROGRAM_ID');
    this._programService.put(`/configurator/programs/${programId}/onboarding/checklists/${event.id}`, payload)
      .subscribe((data: any) => {
        this._alert.success(`Checklist is ${event.is_enabled ? 'disabled' : 'enabled'}`, {
          color: 'white',
          bgColor: 'lightgreen',
        });
        event.is_enabled = !event.is_enabled;
      });
  }

  onCreateClick(event) {
    if (event) {
      this.eventStream.emit(new EmitEvent(Events.CREATE_CHECKLIST, true));
    }
  }

  onListFilter(event) {
    event !== undefined ? this.filterChecklistData(event) : this.listChecklist();
  }

  onSearch(event) {
    this.searchTerm = event;
    this.listChecklist();
  }

  onDeleteClick(event) {
    this.selectedChecklist = event;
    this.showWarningModal = true;
  }

  public closeWarningModal(): void {
    this.showWarningModal = false;
  }

  public deleteChecklist() {
    const programId = this.storageService.get('PROGRAM_ID');
    this._programService.delete(`/configurator/programs/${programId}/onboarding/checklists/${this.selectedChecklist.id}`)
      .subscribe({
        next: (data: any) => {
          this._alert.success('Checklist deleted successfully');
          this.vmsData.checklists.splice(this.vmsData.checklists.indexOf(this.selectedChecklist), 1);
          this.showWarningModal = false;

        }, error: (error: Error | any) => {
          this._alert.error(errorHandler(error));
          this.showWarningModal = false;
        }
      }
    );
  }

  filterChecklistData(payload = null, pageNo = 1) {

    const programDetails = JSON.parse(this.storageService.get('NewProgramData'));
    const programId = programDetails?.program_req_id;

    if (payload !== null) {
      this._loader.show();
      this._programService.get(`/configurator/programs/${programId}/onboarding/checklists?limit=${this.itemsPerPage}&page=${pageNo}${payload.name ? '&k=' + payload.name : ''}`)
        .subscribe({
          next: (data: any) => {
            if (data) {
              this.vmsData = data;
              this.itemsPerPage = 10;
              this.totalRecords = data.total_records;
              this.tableLoaded = true;
              this._loader.hide();
            }
          }, error: (err: Error | any) => {
            this._loader.hide();
            this._alert.error(errorHandler(err));
          }
        }
      );
    }
  }
}
