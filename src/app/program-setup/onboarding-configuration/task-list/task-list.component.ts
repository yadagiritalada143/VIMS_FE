import {Component, OnInit, ViewChild} from '@angular/core';
import {VMSTableComponent} from 'src/app/library/table/table/table.component';
import {EmitEvent, Events, EventStreamService} from 'src/app/core/services/event-stream.service';
import {VMSConfig} from 'src/app/library/table/table/table.model';
import {ActivatedRoute} from '@angular/router';
import {ProgramService} from 'src/app/programs/program.service';
import {LoaderService} from 'src/app/core/components/loader/loader.service';
import {StorageService} from 'src/app/core/services/storage.service';
import {AlertService} from 'src/app/core/components/alert/alert.service';
import {errorHandler} from '../../../shared/util/error-handler';
import {ConfirmationDialogService} from 'src/app/shared/components/confirmation-dialog/confirmation-dialog.service';
import { AccessControlService } from 'src/app/core/services/access-control.service';
import has = Reflect.has;


@Component({
  selector: 'app-task-list',
  templateUrl: './task-list.component.html',
  styleUrls: ['./task-list.component.scss']
})
export class TaskListComponent implements OnInit {
  public vmsData: any;
  public totalPages = 0;
  public tableLoaded = false;
  public dataLoading = true;
  public tasklistCreateForm = 'hidden';
  public searchTerm: any;
  public itemsPerPage = 10;
  public totalRecords = 10;
  public page = 1;
  @ViewChild(VMSTableComponent) vmsTable: VMSTableComponent;

  constructor(private eventStream: EventStreamService,
              private _programService: ProgramService,
              private _loader: LoaderService,
              private storageService: StorageService,
              private accessControlService: AccessControlService,
              private route: ActivatedRoute,
              private _alert: AlertService,
              private confirmService: ConfirmationDialogService) {
  }

  tableConfig: VMSConfig = {
    title: 'Tasks',
    columnList: [
      {name: 'name', title: 'Task Name', width: 30, isIcon: true, isImage: false, isContact: false, isNumberBadge: false},
      {name: 'task_type_label', title: 'Type', width: 30, isIcon: true, isImage: false, isContact: false, isNumberBadge: false},
      {name: 'role.name', title: 'Actor', width: 20, isIcon: true, isImage: false, isContact: false, isNumberBadge: false},
      {
        name: 'is_enabled', title: 'Status', width: 15, isIcon: true, isImage: false,
        isContact: false, isNoOption: false, isVieworEdit: true, isDisableorDelete: this.accessControlService.accessControl(), isDeleteInVisible: true, isDelete: false, isNumberBadge: false
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
      {name: 'name', title: 'Task Name', filterType: 'TEXT'},
      {
        name: 'task_type', title: 'Task Type', filterType: 'SELECT', multiSelectData: [
          {name: 'Upload Credentials', value: 'UPLOAD_CREDENTIAL'},
          {name: 'Attach Document', value: 'ATTACH_DOCUMENT'},
          {name: 'Sign Document', value: 'SIGN_DOCUMENT'},
          {name: 'Acknowledge', value: 'ACKNOWLEDGEMENT'},
        ]
      },
      {
        name: 'is_enabled', title: 'Status', filterType: 'SELECT', multiSelectData: [
          {name: 'Active', value: true},
          {name: 'Inactive', value: false}
        ]
      },
    ]
  };

  ngOnInit(): void {
    this.taskList();
    this.route.paramMap.subscribe(param => {
      if (param.get('add')) {
        this.tasklistCreateForm = 'visible';
      }
    });
  }

  taskList(globalSearch = false) {

    const programDetails = JSON.parse(this.storageService.get('NewProgramData'));
    const programId = programDetails.program_req_id;
    this._loader.show();

    this._programService.get(`/configurator/programs/${programId}/onboarding/tasks?limit=${this.itemsPerPage}${globalSearch ? '' : '&page=' + this.page}${this.searchTerm ? ('&k=' + this.searchTerm) : ''}`)
      .subscribe({
        next: (data: any) => {
          if (data) {
            this.vmsData = data;
            this.vmsData.tasks.forEach(item => {
              item.task_type_label = item.task_type[0].toUpperCase() + item.task_type.replace('_', ' ').toUpperCase().slice(1);
              if(item.roles && item.roles.length > 0){
                item.role = {name: item.roles.map(role=>role?.name)?.join(', ')};
              }
            });
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

  filterTaskListData(payload = null, pageNo = 1) {
    const programDetails = JSON.parse(this.storageService.get('NewProgramData'));
    const programId = programDetails.program_req_id;
    if (payload !== null) {
      this._loader.show();
      const status = has(payload, 'is_enabled') ? '&k=' + payload.is_enabled : null;
      this._programService.get(`/configurator/programs/${programId}/onboarding/tasks?limit=${this.itemsPerPage}&page=${pageNo}${payload.name ? '&name=' + payload.name : ''}${payload.task_type ? '&task_type=' + payload.task_type : ''}${status ? status : ''}`)
        .subscribe({
          next: (data: any) => {
            if (data) {
              this.vmsData = data;
              this.vmsData.tasks.forEach(item => {
                item.task_type_label = item.task_type[0].toUpperCase() + item.task_type.replace('_', ' ').toUpperCase().slice(1);
                if(item.roles && item.roles.length > 0){
                  item.role = {name: item.roles.map(role=>role.name).join(', ')};
                }
              });
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
    } else {
      this.taskList();
    }
  }

  onClickView(event) {
    const obj = {event: true, data: event};
    this.tasklistCreateForm = 'visible';
    this.eventStream.emit(new EmitEvent(Events.VIEW_TASK, obj));
  }

  onEditClick(event) {
    event.task_type = event.task_type.toUpperCase().replace(' ', '_');
    const obj = {event: true, data: event};
    this.tasklistCreateForm = 'visible';
    this.eventStream.emit(new EmitEvent(Events.EDIT_TASK, obj));
  }

  onPaginationClick(event) {
    this.page = event;
    this.taskList();
  }

  disableClicked(event) {
    const programDetails = JSON.parse(this.storageService.get('NewProgramData'));
    const programId = programDetails.program_req_id;
    const payload = {
      name: event.name,
      task_type: event.task_type.toUpperCase().replace(' ', '_'),
      role_id: event?.role?.id,
      description: event.description,
      config: event.config,
      is_enabled: !event.is_enabled,
    };

    event.is_enabled = !event.is_enabled;
    this._loader.show();
    this._programService.put(`/configurator/programs/${programId}/onboarding/tasks/${event.id}`, payload)
      .subscribe({
        next: (data: any) => {
          if (data) {
            this._alert.success(`You have successfully updated a task`);
            this._loader.hide();
          }
        }, error: (error: Error | any) => {
          this._loader.hide();
          this._alert.error(errorHandler(error));
        }
      }
    );
  }

  onCreateClick(event: any) {
    if (event) {
      this.eventStream.emit(new EmitEvent(Events.CREATE_TASK, true));
    }
  }

  onSearch(event) {
    this.searchTerm = event;
    this.taskList(true);
  }

  onListFilter(event) {
    this.filterTaskListData(event);
  }

  onSortClick(event) {
    if (event?.order) {
      switch (event.name) {
        case 'name':
        case 'task_type':
        case 'role.name':
          this.vmsData.tasks = this.vmsData.tasks.sort(function(a, b) {
            const nameA = a[event.name].toUpperCase(); // ignore upper and lowercase
            const nameB = b[event.name].toUpperCase(); // ignore upper and lowercase
            if (event.order === 'ASC') {
              return nameA < nameB ? -1 : 1;
            } else {
              return nameA < nameB ? 1 : -1;
            }
          });
          break;
        case 'is_enabled':
          this.vmsData.tasks = this.vmsData.tasks.sort(function(a, b) {
            const codeA = a.is_enabled;
            const codeB = b.is_enabled;
            if (event.order === 'ASC') {
              return codeA < codeB ? -1 : 1;
            } else {
              return codeA < codeB ? 1 : -1;
            }
          });
          break;
      }
    }
  }

  onDeleteClick(event) {
    this.confirmService.confirm('', `Are you sure to delete the ${event.name}?`, 'Yes', 'No')
    .then((confirmed) => {
        if (confirmed) {

          const programDetails = JSON.parse(this.storageService.get('NewProgramData'));
          const programId = programDetails.program_req_id;
          this._programService.delete(`/configurator/programs/${programId}/onboarding/tasks/${event.id}`)
            .subscribe({
              next: (data: any) => {
                if (data) {
                  this._alert.success(`You have successfully deleted the task`);
                  this.vmsData.tasks.splice(this.vmsData.tasks.indexOf(event), 1);
                  this.totalRecords = this.totalRecords - 1;
                  this._loader.hide();
                }
              }, error: (error: Error | any) => {
                this._loader.hide();
                this._alert.error(errorHandler(error));
              }
            }
          );
        }
      }
    );
  }
}
