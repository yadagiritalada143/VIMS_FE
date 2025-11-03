import { Component, OnInit } from '@angular/core';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { VMSConfig } from 'src/app/library/table/table/table.model';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { EmitEvent, Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { QuestionnaireService } from '../questionnaire.service';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { ConfirmationDialogService } from 'src/app/shared/components/confirmation-dialog/confirmation-dialog.service';

@Component({
  selector: 'app-list-questions',
  templateUrl: './list-questions.component.html',
  styleUrls: ['./list-questions.component.scss']
})
export class ListQuestionsComponent implements OnInit {
  public vmsData;
  public filter: any = {};
  public totalRecords: number = 25;
  public itemPerPage: number = 25;
  public Page = 1;

  public loading = false;
  public search: any;
  public currentProgram: any;
  public user_type: any;
  public user: any;
  tableConfig: VMSConfig = {
    title: 'Question',
    columnList: [
      { name: 'label', title: 'Label', width: 30, isIcon: false,  isImage: false, isContact: false, isNumberBadge: false },
      { name: 'question_type', title: 'Question Type', width: 25, isIcon: false, isImage: false, isContact: false, isNumberBadge: false},
      { name: 'is_required', title: 'Required', width: 14, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
      { name: 'modified_on', title: 'Updated Date', width: 14, isIcon: false, isImage: false, isContact: false, isNumberBadge: false},
      { name: 'is_enabled', title: 'Status', width: 17, isIcon: false, isImage: false, isContact: false, isNoOption: false, isVieworEdit: true, isDisableorDelete: true, isDelete: true, isNumberBadge: false, }
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
    this.getAllQuestionList();
  }


  onCreateClick($event) {
    if ($event) {
      this.eventStream.emit(new EmitEvent(Events.CREATE_QUESTION, true));
    }
  }

  getQuestionData(event) {
    this.getAllQuestionList();
  }
  getAllQuestionList() {
    this.loading = true;
    let url;
    let qry = '?';
    qry = qry + 'limit=' + this.itemPerPage + '&page=' + this.Page;
    if (this.search) {
      qry = qry + '&k=' + this.search;
    }
    if (this.filter.searchTerm) {
      qry = qry + '&label=' + this.filter.searchTerm;
    }
    if (this.filter.hasOwnProperty('is_enabled')) {
      qry = qry + '&k=' + this.filter.is_enabled;
    }
    url = '/configurator/programs/' + this.currentProgram?.id + '/questionnaires/questions' + qry;
    this.questionnaireService.get(url).subscribe(
      (data:any) => {
        this.loading = false;
        if (data.questions) {
          this.vmsData = data?.questions;
          this.vmsData?.forEach(element => {
            if(element.is_required == true){
               element.is_required = 'YES'
            } else {
              element.is_required = 'NO'
            }
            return
          });
        } else{
          this.vmsData = new Array();
        }
        this.itemPerPage = data?.items_per_page;
        this.totalRecords = data?.total_records
      },
      (err) => {
        this.loading = false;
        this.alertService.error(errorHandler(err));
        this.totalRecords = 0;
      }
    );
  }
  onPaginationClick(e) {
    this.Page = e;
    this.getAllQuestionList();
  }


  onDisableClick(event) {
    if (event.is_enabled == true) {
      event.is_enabled = false;
    } else {
      event.is_enabled = true;
    }
    if(event.is_required == 'YES'){
      event.is_required = true ;
   } else {
    event.is_required = false;
   }

    this.loading = true;
    let url = '/configurator/programs/' + this.currentProgram?.id + '/questionnaires/questions/' + event?.id;
    this.questionnaireService.put(url, event).subscribe(
      (data:any) => {
        this.loading = false;
        if (event.is_enabled == false) {
          this.alertService.success('Question Disabled Successfully');
        } else {
          this.alertService.success('Question Unable Successfully');
        }
        this.getAllQuestionList();
      },
      (err) => {
        this.loading = false;
        this.alertService.error(errorHandler(err));
      }
    );
  }

  onSearch(event) {
  this.search = event;
  this.getAllQuestionList();
  }

  onEditClick(event) {
    let obj = { "isedit": true, "data": event };
    this.eventStream.emit(new EmitEvent(Events.EDIT_QUESTION, obj));
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
    this.getAllQuestionList();
  }

  onClickView($event) {
    let obj = { "isview": true, "data": $event };
    this.eventStream.emit(new EmitEvent(Events.VIEW_QUESTION, obj));
  }

  onClickDelete(event) {
    this.confirmService.confirm('', `Are you sure you want to delete?`,
    'Yes', 'No')
    .then((confirmed) => {
      if (confirmed) {
        this.loading = true;
        let url = '/configurator/programs/' + this.currentProgram?.id + '/questionnaires/questions/' + event?.id;
        this.questionnaireService.delete(url, event).subscribe(
          (data:any) => {
            this.loading = false;
            this.alertService.success('Question deleted successfully');
            this.getAllQuestionList();
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
