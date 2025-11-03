import { Component, OnInit, Output, EventEmitter, OnDestroy } from '@angular/core';
import { EventStreamService, Events } from 'src/app/core/services/event-stream.service';
import { UntypedFormGroup, UntypedFormBuilder, Validators } from "@angular/forms";
import { JobService } from 'src/app/jobs/job.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { ActivatedRoute } from '@angular/router';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { QuestionnaireService } from '../questionnaire.service';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { DndDropEvent } from 'ngx-drag-drop';


@Component({
  selector: 'app-create-questionnaire',
  templateUrl: './create-questionnaire.component.html',
  styleUrls: ['./create-questionnaire.component.scss']
})
export class CreateQuestionnaireComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];
  private dragStartIndex: number;

  @Output() updateList = new EventEmitter();
  public jobTemplatesSearch = new Subject<string>();
  public cretequestionnaire = 'hidden';
  public createQuestionnaireForm: UntypedFormGroup;
  public submitted = false;
  public totalRecords = 10;
  public itemPerPage = 10;
  public page: any = { size: 25, number: 1 };
  public PageNo = 1;
  public currentProgram: any = undefined;
  public jobTemplateList: any = [];
  public visibility: string;
  public loading = false;
  public questionnairesList: any = [];
  public selectedQues: any = [];
  public isContinue = true;
  public updateId: any;
  public isView: boolean;
  public isEdit: boolean;
  public search: any;
  public title = 'Create new';
  
  constructor(
    private eventStream: EventStreamService,
    public fb: UntypedFormBuilder,
    public jobService: JobService, private loaderService: LoaderService, public alert: AlertService,
    private alertService: AlertService,  private storageService: StorageService, public route: ActivatedRoute,
    public questionnaireService: QuestionnaireService,

  ) {
    this.subscriptions.push(this.jobTemplatesSearch.pipe(
      debounceTime(300),
      distinctUntilChanged())
      .subscribe((value: any) => {
        this.search = value?.term;
        this.getJobTemplates();
      }));
  }
  get createQuestionnaire() { return this.createQuestionnaireForm.controls; }

  ngOnInit(): void {
    this.currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.createQuestionnaireForm = this.fb.group({
      title: ['', Validators.required],
      description: [],
      jobTemplate: [''],
    });
    if (this.currentProgram?.id) {
      this.getJobTemplates();
      this.getQuestionDataCount();
    }
    this.subscriptions.push(this.eventStream.on(Events.CREATE_QUESTIONNAIRE).subscribe( (data) => {
      if (this.currentProgram?.id) {
        this.getJobTemplates();
      }
      if (data) {
        this.cretequestionnaire = 'visible';
        if (data?.id) {
          this.updateId = data?.id;
          this.getQuestionnaireById(this.updateId);
          this.getQuestionsById(this.updateId);
        }
        else {
          this.updateId = undefined;
        }
        if (data.type === 'view') {
          this.title = 'View';
          this.visibility = 'view';
          this.isView = true;
          this.isEdit = false;
        } else if (data.type === 'edit') {
          this.title = 'Edit';
          this.visibility = 'edit';
          this.isEdit = true;
          this.isView = false;
        } else {
          this.visibility = '';
          this.isEdit = false;
        }
      } else {
        this.cretequestionnaire = 'hidden';
      }
    }));
  }

  onDragStart(index: number) {
    this.dragStartIndex = index;
  }

  onDrop(event: DndDropEvent) {
    if (event.data && typeof event.index !== undefined) {
      if (this.dragStartIndex >= 0) {
        let dropIndex = event.index;
        if (dropIndex > this.dragStartIndex) {
          dropIndex--;
        }
        if (dropIndex !== this.dragStartIndex) {
          this.selectedQues.splice(this.dragStartIndex, 1);
          this.selectedQues.splice(dropIndex, 0, event.data);
        }
      }
    }
    this.dragStartIndex = null;
  }

  getQuestionnaireById(updateId) {
    this.loaderService.show();
    this.loading = true;
    const url = '/configurator/programs/' + this.currentProgram?.id + `/questionnaires/${updateId}`;
    this.subscriptions.push(this.questionnaireService.get(url).subscribe(
      (data:any) => {
        this.loading = false;
        this.loaderService.hide();
        if (data?.questionnaire) {
          const tempJobTmplateArry = new Array();
          data.questionnaire?.job_templates?.forEach(element => {
            if (element.id) {
              tempJobTmplateArry.push(element.id);
            }
          });
          this.createQuestionnaireForm.patchValue({
            title: data.questionnaire.name,
            description: data.questionnaire.description,
            jobTemplate: tempJobTmplateArry,
          });
          this.jobTemplateList = new Array();
          this.jobTemplateList = data?.questionnaire?.job_templates;
        } else {
          this.questionnairesList = new Array();
        }
      },
      (err) => {
        this.loaderService.hide();
        this.loading = false;
        this.alertService.error(errorHandler(err));
      }
    ));
  }
  getQuestionsById(updateId) {
    this.loaderService.show();
    this.loading = true;
    const url = '/configurator/programs/' + this.currentProgram?.id + `/questionnaires/questions?questionnaires=${updateId}`;
    this.subscriptions.push(this.questionnaireService.get(url).subscribe(
      (data:any) => {
        this.loading = false;
        this.loaderService.hide();
        if (data?.questions) {
          if (this.isEdit) {
            if (data?.questions) {
              this.questionnairesList?.forEach(list => {
                data?.questions?.forEach(element => {
                  if (list.id === element.id) {
                    if (!list.isAdded) {
                      list.isAdded = true;
                    }
                  }  else{

                  }
                });
              });
            }
          } else if (this.isView) {
            if (data?.questions) {
              data?.questions?.map(item => {
                item.isAdded = true;
                return item;
              });
              this.questionnairesList = data?.questions;
            }
          }
        } else {
          this.questionnairesList = new Array();
        }
      },
      (err) => {
        this.loaderService.hide();
        this.loading = false;
        this.alertService.error(errorHandler(err));
      }
    ));
  }

  goToNext() {
    this.submitted = true;
    if (this.createQuestionnaireForm.invalid) {
      return;
    } else {
      const selectedQuestion = new Array();
      this.selectedQues = this.questionnairesList.filter((question) => question.isAdded);
      this.selectedQues?.forEach(element => {
        if (element?.id) {
          selectedQuestion.push(element.id);
        }
      });
      if (selectedQuestion && selectedQuestion?.length === 0) {
        this.alertService.error('Atleast select one question to create questionnaire');
        return;
      } else {
        this.isContinue = false;
      }
    }
  }
  goBack() {
    this.isContinue = true;
  }

  sidebarClose() {
    this.cretequestionnaire = 'hidden';
    this.createQuestionnaireForm.reset();
    this.submitted = false;
    this.goBack();
    this.getQuestionDataCount();
    this.title = 'Create new';
  }

  selectQuestion(event, question) {
    if (!question?.isAdded) {
      question.isAdded = true;
    } else {
      question.isAdded = false;
    }
  }

  saveQuestionnaire() {
    this.submitted = true;
    if (this.createQuestionnaireForm.invalid) {
      return;
    } else {
      const selectedQuestion = new Array();
      // let selected = this.questionnairesList.filter((question) => { return question.isAdded === true });
      this.selectedQues?.forEach(element => {
        if (element?.id) {
          selectedQuestion.push(element.id);
        }
      });
      this.loading = true;
      let payload;
      payload = {
        name: this.createQuestionnaireForm.value.title,
        description: this.createQuestionnaireForm.value.description,
        questions: selectedQuestion,
        job_templates: this.createQuestionnaireForm.value.jobTemplate,
      };
      if (payload.job_templates != undefined && payload.job_templates != null && payload.job_templates?.length === 0) {
        delete payload.job_templates;
      }
      if (this.updateId) {
        const url = '/configurator/programs/' + this.currentProgram?.id + `/questionnaires/${this.updateId}`;
        this.subscriptions.push(this.questionnaireService.put(url, payload).subscribe(
          (data) => {
            this.loading = false;
            this.submitted = false;
            this.sidebarClose();
            this.updateList.emit(true);
            this.alertService.success('questionnaire Updated successfully.');
            this.isContinue = true;
            this.updateId = undefined;
          },
          (err) => {
            this.loading = false;
            this.alertService.error(errorHandler(err));
          }
        ));
      } else {
        const url = '/configurator/programs/' + this.currentProgram?.id + '/questionnaires';
        this.subscriptions.push(this.questionnaireService.post(url, payload).subscribe(
          (data) => {
            this.loading = false;
            this.submitted = false;
            this.sidebarClose();
            this.updateList.emit(true);
            this.alertService.success('New questionnaire created successfully.');
            this.isContinue = true;
          },
          (err) => {
            this.loading = false;
            this.alertService.error(errorHandler(err));
          }
        ));
      }

    }
  }
  getQuestionDataCount() {
    this.loading = true;
    let qry = '?';
    qry = qry + 'limit=' + this.itemPerPage + '&page=' + this.PageNo;
    const url = '/configurator/programs/' + this.currentProgram?.id + '/questionnaires/questions' + qry;
    this.subscriptions.push(this.questionnaireService.get(url).subscribe(
      (data:any) => {
        this.loading = false;
        if (data.questionnaires) {
        }
        this.itemPerPage = data?.items_per_page;
        this.totalRecords = data?.total_records;
        if (data?.total_records) {
          this.itemPerPage = data?.total_records;
          this.getAllQuestion();
        }
      },
      (err) => {
        this.loading = false;
        this.alertService.error(errorHandler(err));
      }
    ));
  }

  getAllQuestion() {
    this.loading = true;
    let qry = '?';
    qry = qry + 'limit=' + this.itemPerPage + '&page=' + this.PageNo+ '&k=true';
    const url = '/configurator/programs/' + this.currentProgram?.id + '/questionnaires/questions' + qry;
    this.subscriptions.push(this.questionnaireService.get(url).subscribe(
      (data:any) => {
        this.loading = false;
        console.log('data is here', data);

        if (data.questions) {
          this.questionnairesList = data?.questions;
          this.questionnairesList.map(item => {
            item.isAdded = false;
            return item;
          });
        } else {
          this.questionnairesList = new Array();
        }
        this.itemPerPage = data?.item_per_page;
        this.totalRecords = data?.total_recordes;
      },
      (err) => {
        this.loading = false;
        this.alertService.error(errorHandler(err));
      }
    ));
  }

  getJobTemplates() {
    this.totalRecords = 0;
    let url;
    let qry;
    qry = `?limit=${this.page.size}&page=${this.page.number}`;
    if (this.search) {
      qry = qry + '&q=' + this.search;
    }
    url = `/job-manager/programs/${this.currentProgram?.id}/job-templates` + qry;
    this.subscriptions.push(this.jobService.get(url).subscribe(
      (data:any) => {
        if (data) {
          this.jobTemplateList = data?.job_templates;
          if (data.total_count) {
            this.totalRecords = data.total_records;
          }
          this.loaderService.hide();
        } else {
          this.jobTemplateList = new Array();
        }
        this.search = null;
      },
      (err) => {
        this.alertService.error(errorHandler(err));
        this.jobTemplateList = new Array();
      }));
  }
  ngOnDestroy(): void {
    this.subscriptions?.forEach(sub => sub.unsubscribe());
  }
}
