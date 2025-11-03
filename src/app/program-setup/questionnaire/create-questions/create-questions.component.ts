import { Component, OnInit, Output, EventEmitter, OnDestroy } from '@angular/core';
import { EventStreamService, Events } from 'src/app/core/services/event-stream.service';
import { Validators, UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { QuestionnaireService } from '../questionnaire.service';
import { StorageService, StorageKeys } from 'src/app/core/services/storage.service';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Subject, Subscription } from 'rxjs';
import { AlertService } from 'src/app/core/components/alert/alert.service';

@Component({
  selector: 'app-create-questions',
  templateUrl: './create-questions.component.html',
  styleUrls: ['./create-questions.component.scss']
})
export class CreateQuestionsComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];
  public createQuestionForm: UntypedFormGroup;
  questionariesearch = new Subject<string>();
  @Output() close = new EventEmitter();
  isupdate = true
  public quastionList;
  public filter: any = {};
  public totalRecords: number = 25;
  questionnaires: any;
  selectedQuestionType: any;
  cretequestion = "hidden";
  questionConfig = false;
  questionActive = false;
  selectedItems: number = null;
  questionRequired = false;
  questionDependent = false;
  public itemPerPage: number = 25;
  public Page = 1;
  public search: any;
  currentProgram: any;
  isSaveLoader: boolean = false;
  questionId: any;
  selectedIndex: any;
  title = 'Add New Question';
  showType: any;
  multiSelect = true;
  resultingQuestion = [{
    question: null
  }]
  resultingField = [{
    field: null
  }]
  tooltipActive = true;
  tooltipModal = false;
  tooltipInfoActive = true;
  tooltipinfo = false;
  tooltipreportproblem = false;
  tooltipreport = false;
  questionType = [
    { name: 'textfield', src: 'assets/images/custom-fields-icons/1.svg', label: 'Text Box' },
    { name: 'phone', src: 'assets/images/custom-fields-icons/2.svg', label: 'Phone' },
    { name: 'datetime', src: 'assets/images/custom-fields-icons/3.svg', label: 'Date & Time' },
    { name: 'date', src: 'assets/images/custom-fields-icons/4.svg', label: 'Date' },
    { name: 'dropdown', src: 'assets/images/custom-fields-icons/5.svg', label: 'Drop Down' },
    { name: 'checkbox', src: 'assets/images/custom-fields-icons/6.svg', label: 'Check Box' },
    { name: 'radio', src: 'assets/images/custom-fields-icons/7.svg', label: 'Radio' },
    { name: 'togglebutton', src: 'assets/images/custom-fields-icons/8.svg', label: 'Toggle Button' },
    { name: 'textarea', src: 'assets/images/custom-fields-icons/asset-1.svg', label: 'Text Area' },
    { name: 'numbers', src: 'assets/images/custom-fields-icons/asset-2.svg', label: 'Numbers' },
    { name: 'email', src: 'assets/images/custom-fields-icons/asset-3.svg', label: 'Email' },
    { name: 'fileupload', src: 'assets/images/custom-fields-icons/asset-4.svg', label: 'File Upload' },
    { name: 'currency', src: 'assets/images/custom-fields-icons/asset-5.svg', label: 'Currency' },
    { name: 'hyperlink', src: 'assets/images/custom-fields-icons/asset-6.svg', label: 'Hyperlink' }
  ]
  constructor(
    private fb: UntypedFormBuilder,
    private eventStream: EventStreamService,
    public questionnaireService: QuestionnaireService,
    private alertService: AlertService,
    private storageService: StorageService,
  ) {
    this.subscriptions.push(this.questionariesearch.pipe(
      debounceTime(300),
      distinctUntilChanged())
      .subscribe((value: any) => {
        this.search = value?.term;
        this.getAllQuestionnaireList();
      }));




  }

  ngOnInit(): void {
    this.currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.createQuestionForm = this.fb.group({
      type: ['', [Validators.required]],
      name: ['', [Validators.required]],
      label: ['', [Validators.required]],
      is_required: [this.questionRequired],
      is_enabled: [this.questionActive],
      questionnires: [],
      description: [''],
      placeholder: ['Select Option'],
      field_values: [[{ label: "", value: "", help_text: "", is_help_text_enabled: true, help_text_type: "",isselected: false }]],
      dependent_questions: [[{ condition: "", questions: [] }]]
    });
    this.getAllQuestionnaireList();
    this.getAllQuestionList();
    this.subscriptions.push(this.eventStream.on(Events.CREATE_QUESTION).subscribe((data:any) => {
      if (data) {
        this.cretequestion = 'visible';
      } else {
        this.cretequestion = 'hidden';
      }
    }));

    this.subscriptions.push(this.eventStream.on(Events.EDIT_QUESTION).subscribe((data:any) => {
      if (data?.isedit) {
        this.title = 'Edit Question'
        this.showType = 'isedit';
        this.cretequestion = 'visible';
        this.questionId = data?.data?.id;
        this.getQuestionDetails(data?.data?.id)
      }
    }));

    this.subscriptions.push(this.eventStream.on(Events.VIEW_QUESTION).subscribe((data:any) => {
      if (data?.isview) {
        this.title = 'View Question'
        this.showType = 'isview';
        this.cretequestion = 'visible';
        this.getQuestionDetails(data?.data?.id)
      }
    }));
    this.getQuestionType();
  }

  getQuestionType() {
    let url;
    let qry = '?';
    qry = qry + 'limit=' + this.itemPerPage + '&page=' + this.Page;
    if (this.search) {
      qry = qry + '&k=' + this.search;
    }
    url = '/configurator/resources/custom-fields' + qry;
    this.subscriptions.push(this.questionnaireService.get(url).subscribe(
      (data:any) => {
        this.questionType = data?.custom_fields;
      },
      (err) => {
        this.alertService.error(errorHandler(err));
      }
    ));
  }

  getQuestionDetails(id) {
    let url;
    url = '/configurator/programs/' + this.currentProgram?.id + '/questionnaires/questions/' + id;
    this.subscriptions.push(this.questionnaireService.get(url).subscribe(
      (data:any) => {
        const question = data?.questions;
        this.questionType?.forEach((e, i) => {
          if (e?.name === question?.question_type) {
            this.selectedQuestionType = e;
            this.selectedItems = i;
          }
        });
        const selectedQuestionnier = new Array();
        question?.questionnaires?.forEach(q => {
          selectedQuestionnier.push(q?.id);
        });

        this.createQuestionForm.patchValue({
          type: question?.question_type,
          name: question?.name,
          label: question?.label,
          is_required: question?.is_required || this.questionRequired,
          is_enabled: question?.is_enabled || this.questionActive,
          questionnires: selectedQuestionnier,
          description: question?.description,
          field_values: question?.meta_data?.datasource?.options,
          dependent_questions: this.assignDependentQua(question?.dependent_questions),
        })
        this.checkSelected(this.assignDependentQua(question?.dependent_questions));
        this.questionRequired = question?.is_required || this.questionRequired;
        this.questionActive = question?.is_enabled || this.questionActive;
        if(question?.dependent_questions && question?.dependent_questions?.length === 0){
          question.dependent_questions = { condition: "", questions: [] };
        } else {
          this.questionDependent = true;
        }

      },
      (err) => {
        this.alertService.error(errorHandler(err));
      }
    ));
  }

  assignDependentQua(data) {
    let d_question = new Array();
    data?.map((item, i) => {
      let match = d_question?.some(q => q?.condition === item?.condition);
      let index = d_question?.findIndex(q => q?.condition === item?.condition);
      if (match) {
        d_question[index]?.questions?.push(item?.id)
      } else {
        d_question.push({
          condition: item?.condition, questions: [item?.id]
        });
      }
    })
    return d_question
  }

  checkSelected(data) {
    data?.forEach(d => {
      this.createQuestionForm?.value?.field_values?.forEach(cq => {
        if(cq?.label === d?.condition){
          cq.isselected = true
        }
      });
    });
    // this.createQuestionForm.patchValue({
    //   field_values: this.createQuestionForm?.value?.field_values
    // })
    // this.createQuestionForm?.updateValueAndValidity();
  }

  getAllQuestionList() {
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
        if (data.questions) {
          this.quastionList = data?.questions;
          this.quastionList?.forEach(element => {
            if (element.is_required == true) {
              element.is_required = 'YES'
            } else {
              element.is_required = 'NO'
            }
            return
          });
        } else {
          this.quastionList = new Array();
        }
        this.itemPerPage = data?.items_per_page;
        this.totalRecords = data?.total_records
      },
      (err) => {
        this.alertService.error(errorHandler(err));
        this.totalRecords = 0;
      }
    );
  }


  getAllQuestionnaireList() {
    let url;
    let qry = '?';
    qry = qry + 'limit=' + this.itemPerPage + '&page=' + this.Page;
    if (this.search) {
      qry = qry + '&k=' + this.search;
    }
    url = '/configurator/programs/' + this.currentProgram?.id + '/questionnaires' + qry;
    this.subscriptions.push(this.questionnaireService.get(url).subscribe(
      (data:any) => {
        if (data.questionnaires) {
          this.questionnaires = data?.questionnaires;
        }
      },
      (err) => {
        this.alertService.error(errorHandler(err));
      }
    ));
  }

  selectQuetionType(data, i) {
    this.selectedQuestionType = data;
    this.selectedItems = i;
    this.createQuestionForm.patchValue({
      type: data?.name
    })
  }
  sidebarClose() {
    this.cretequestion = 'hidden';
    this.questionConfig = false;
    this.selectedItems = null;
    this.showType = null;
    this.questionRequired = false;
    this.questionDependent = false;
    this.createQuestionForm.reset();
  }
  continue() {
    this.questionConfig = true;
  }

  changeFieldType() {
    this.questionConfig = false;
  }

  questionActiveToggle() {
    this.questionActive = !this.questionActive;
    this.createQuestionForm.patchValue({
      is_enabled: this.questionActive
    })
  }
  questionRequiredToggle() {
    this.questionRequired = !this.questionRequired;
    this.createQuestionForm.patchValue({
      is_required: this.questionRequired
    })
  }

  questionDependentToggle() {
    this.questionDependent = !this.questionDependent;
  }
  addQuestion(i) {
    this.resultingQuestion.push({ question: null });
  }

  removeQuestion(i) {
    this.resultingQuestion.splice(i, 1);
  }

  addresultingField(i) {
    this.resultingField.push({ field: null });
  }

  removeresultingField(i) {
    this.resultingField.splice(i, 1);
  }
  multiSelectToggle() {
    this.multiSelect = !this.multiSelect;
  }

  openTooltipModal() {
    this.tooltipModal = true;
  }

  tooltipActiveToggle() {
    this.tooltipActive = !this.tooltipActive;
  }

  tooltipActiveMode() {
    this.tooltipInfoActive = !this.tooltipInfoActive;
  }

  showTooltipInfo(data, type, index) {
    data.help_text_type = type;
    this.selectedIndex = index;
    this.tooltipinfo = false;
    this.tooltipreport = false;
    this.tooltipreportproblem = false;
    if (type === 'INFO') {
      this.tooltipinfo = true;
    } else if (type === 'WARN') {
      this.tooltipreportproblem = true;
    } else if (type === 'REPORT') {
      this.tooltipreport = true;
    }
  }

  hideTooltipInfo() {
    this.tooltipinfo = false;
  }

  showTooltipReportProblem() {
    this.tooltipreportproblem = true;
    this.tooltipreport = false;
    this.tooltipinfo = false;
  }

  hideTooltipReportProblem() {
    this.tooltipreportproblem = false;
  }

  showTooltipReport() {
    this.tooltipreport = true;
    this.tooltipreportproblem = false;
    this.tooltipinfo = false;
  }

  hideTooltipReport() {
    this.tooltipreport = false;
  }

  cancel() {
    this.selectedQuestionType = undefined;
    this.questionConfig = false;
    this.questionActive = false;
    this.questionRequired = false;
    this.questionDependent = false;
    this.createQuestionForm.reset();
    this.sidebarClose();
  }

  saveQuestion() {
    this.isSaveLoader = true;
    const data = this.createQuestionForm?.value;
    const PayLoad: any = {
      // ...this.createQuestionForm?.value
      "type": data?.type,
      "label": data?.label,
      "name": data?.name,
      "slug": data?.slug,
      "placeholder": data?.placeholder,
      "description": data?.description,
      "questionnires": data?.questionnires?.length ? data?.questionnires : null,
      "dependent_questions": data?.dependent_questions || null,
      "meta_data": {
        "datasource": {
          "options": data?.field_values
        },
        // "is_multi_select": true,
      },
      "is_required": data?.is_required,
      "is_enabled": data?.is_enabled
    }
    if(!this.selectedQuestionType?.meta_data?.datasource?.options) {
      delete PayLoad?.dependent_questions;
    }
    // return
    if (this.questionId) {
      delete PayLoad.category;
      const url = `/configurator/programs/${this.currentProgram['id']}/questionnaires/questions/${this.questionId}`;
      this.subscriptions.push(this.questionnaireService.put(url, PayLoad).subscribe(data => {
        this.isSaveLoader = false;
        this.alertService.success('Question updated Successfully');
        this.title = 'Add New Question';
        this.createQuestionForm.reset();
        this.selectedQuestionType = {};
        this.close.emit({ event: 'getList' })
        this.sidebarClose();
      }, error => {
        this.alertService.error(errorHandler(error), {});
        this.isSaveLoader = false;
      }));
    } else {
      const url = `/configurator/programs/${this.currentProgram['id']}/questionnaires/questions`;
      this.subscriptions.push(this.questionnaireService.post(url, PayLoad).subscribe(data => {
        this.isSaveLoader = false;
        this.alertService.success('Question Created Successfully');
        this.title = 'Add New Question';
        this.createQuestionForm.reset();
        this.selectedQuestionType = {};
        this.close.emit({ event: 'getList' })
        this.sidebarClose();
      }, error => {
        this.alertService.error(errorHandler(error), {});
        this.isSaveLoader = false;
      }));
    }

  }

  addNewField() {
    if (!this.createQuestionForm.value.field_values) {
      this.createQuestionForm.value.field_values = new Array();
    }
    this.createQuestionForm.value.field_values.push({ label: "", value: "", help_text: "", is_help_text_enabled: true, help_text_type: "", isselected: false });
  }

  updateFieldValue(data) {
    this.isupdate = false;
    this.createQuestionForm.patchValue({
      field_values: this.createQuestionForm.value.field_values
    })
    this.createQuestionForm?.updateValueAndValidity();
    setTimeout(() => {
      this.isupdate = true
    }, 1);
  }

  removeField(i) {
    this.createQuestionForm.value.field_values.splice(i, 1);
  }

  addDependentValue() {
    if(!this.createQuestionForm.value.dependent_questions){
      this.createQuestionForm.value.dependent_questions = new Array();
    }
    this.createQuestionForm.value.dependent_questions.push({ condition: "", questions: [] });
  }

  ngOnDestroy(): void {
    this.subscriptions?.forEach(sub => sub.unsubscribe());
  }
}
