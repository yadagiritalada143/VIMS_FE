import { Component, OnInit } from '@angular/core';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { VMSConfig } from 'src/app/library/table/table/table.model';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { EmitEvent, Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { QuestionnaireService } from '../questionnaire.service';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { ConfirmationDialogService } from 'src/app/shared/components/confirmation-dialog/confirmation-dialog.service';


@Component({
  selector: 'app-list-questionnaire',
  templateUrl: './list-questionnaire.component.html',
  styleUrls: ['./list-questionnaire.component.scss']
})
export class ListQuestionnaireComponent implements OnInit {
  public vmsData;
  public filter: any = {};
  public totalRecords: number = 10;
  public itemPerPage: number = 10;
  public Page = 1;

  public loading = false;
  public search: any;
  tableConfig: VMSConfig = {
    title: 'Questionnaire',
    columnList: [
      { name: 'name', title: 'Title', width: 25, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
      { name: 'description', title: 'Description', width: 30, isIcon: false, isImage: false, isContact: false, isNumberBadge: false, },
      { name: 'modified_on', title: 'Updated Date', width: 25, isIcon: false, isImage: false, isContact: false, isNumberBadge: false, enableClick: true },
      { name: 'is_enabled', title: 'Status', width: 20, isIcon: false, isImage: false, isContact: false, isNoOption: false, isVieworEdit: true, isDisableorDelete: true, isDelete: true, isNumberBadge: false, }
    ],
    isExpand: false,
    isFilter: true,
    isSearch: true,
    isSetting: true,
    isTopPagination: true,
    isCreate: true,
    isCreateButtonName: 'Create New',
    density: 'COMFORTABLE',
    advanceFilter: [
      { name: 'name', title: 'Title', filterType: 'TEXT' },
      {
        name: 'is_enabled', title: 'Status', filterType: 'SELECT', multiSelectData: [
          { name: 'Active', value: true },
          { name: 'Inactive', value: false }
        ]
      }
    ]
  };
  currentProgram: any;
  user_type: any;
  user: any;
  constructor(
    public questionnaireService: QuestionnaireService,
    private alertService: AlertService,
    private storageService: StorageService,
    private eventStream: EventStreamService,
    private confirmService: ConfirmationDialogService,
  ) { }

  ngOnInit(): void {
    this.currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.user_type = this.storageService.get('user_type');
    this.user = this.storageService.get('user');
    this.getAllQuestionnaireList();
  }
  getAllQuestionnaireList() {
    this.loading = true;
    let qry = '?';
    qry = qry + 'limit=' + this.itemPerPage + '&page=' + this.Page;
    if (this.search) {
      qry = qry + '&k=' + this.search;
    }
    if (this.filter.searchTerm) {
      qry = qry + '&name=' + this.filter.searchTerm;
    }
    if (this.filter.hasOwnProperty('is_enabled')) {
      qry = qry + '&k=' + this.filter.is_enabled;
    }
    let url = '/configurator/programs/' + this.currentProgram?.id + '/questionnaires' + qry;
    this.questionnaireService.get(url).subscribe(
      (data:any) => {
        this.loading = false;
        if (data.questionnaires) {
          this.vmsData = data?.questionnaires;
        }
        this.itemPerPage = data?.items_per_page;
        this.totalRecords = data?.total_records
      },
      (err) => {
        this.loading = false;
        this.alertService.error(errorHandler(err));
        this.vmsData = new Array();
        this.totalRecords = 0;
      }
    );
  }

  updateAllList(e) {
    if (e) {
      this.getAllQuestionnaireList();
    }
  }
  onPaginationClick(e) {
    this.Page = e;
    this.getAllQuestionnaireList();
  }
  onCreateClick($event) {
    if ($event) {
      this.eventStream.emit(new EmitEvent(Events.CREATE_QUESTIONNAIRE, true));
    }
  }

  onDisableClick(event) {
    if (event.is_enabled == true) {
      event.is_enabled = false;
    } else {
      event.is_enabled = true;
    }
    this.loading = true;
    let url = '/configurator/programs/' + this.currentProgram?.id + '/questionnaires/' + event?.id;
    this.questionnaireService.put(url, event).subscribe(
      (data:any) => {
        this.loading = false;
        if (event.is_enabled == false) {
          this.alertService.warn('Questionnaire Disabled Successfully');
        } else {
          this.alertService.success('Questionnaire Unable Successfully');
        }
        this.getAllQuestionnaireList();
      },
      (err) => {
        this.loading = false;
        this.alertService.error(errorHandler(err));
      }
    );
  }

  onSearch(event) {
    this.search = event;
    this.Page = 1;
    this.getAllQuestionnaireList();
  }

  onEditClick(event) {
    this.eventStream.emit(new EmitEvent(Events.CREATE_QUESTIONNAIRE, { id: event.id, type: 'edit' }));
  }

  onListFilter(event) {
    this.Page = 1;
    if (event?.hasOwnProperty('is_enabled')) {
      if (event?.is_enabled) {
        this.filter.is_enabled = 'True';
      } else {
        this.filter.is_enabled = 'False';
      }
    } else {
      delete this.filter.is_enabled
    }
    if (event && event.name) {
      this.filter.searchTerm = event?.name;
    } else {
      this.filter.searchTerm = '';
    }

    if (event && event.name && !event?.hasOwnProperty('is_enabled')) {
      this.filter.searchTerm = event?.name;
    } else {
      // this.filter.searchTerm = '';
    }
    this.getAllQuestionnaireList();
  }

  onClickView(event) {
    this.eventStream.emit(new EmitEvent(Events.CREATE_QUESTIONNAIRE, { id: event.id, type: 'view' }));

  }

  onClickDelete(event) {
    this.confirmService.confirm('', `Are you sure if you want to delete this questionnaire ?`,
      'Yes', 'No')
      .then((confirmed) => {
        if (confirmed) {
          this.loading = true;
          let url = '/configurator/programs/' + this.currentProgram?.id + '/questionnaires/' + event?.id;
          this.questionnaireService.delete(url, event).subscribe(
            (data:any) => {
              this.loading = false;
              this.alertService.success('Questionnaire deleted successfully');
              this.getAllQuestionnaireList();
            },
            (err) => {
              this.loading = false;
              this.alertService.error(errorHandler(err));
            }
          );
        }
      })
  }
}
