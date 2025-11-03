import { Component, OnInit, EventEmitter, Output, Input } from '@angular/core';
import { StorageService } from 'src/app/core/services/storage.service';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { AccountService } from '../account.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-secret-questions',
  templateUrl: './secret-questions.component.html',
  styleUrls: ['./secret-questions.component.scss']
})
export class SecretQuestionsComponent implements OnInit {
  @Output() onNext = new EventEmitter();
  @Output() onSkip = new EventEmitter();
  customizeavatar = false;
  @Output() onBack = new EventEmitter(false);
  isError = false;
  questionform: UntypedFormGroup;

  security_questions: any = []
  security_questions1: any = []
  security_questions2: any = []
  original_security_questions: any = []
  original_security_questions1: any = []
  original_security_questions2: any = []


  @Input() security_questionsObj = {
    question1: 'Confirm Your Password',
    question1Value: '',
    question2: 'What was your childhood nickname',
    question2Value: '',
    question3: 'What is your mothers middle name',
    question3Value: ''
  }
  orgId: any;
  userToken: any;
  savedQuestions: any;
  savedQuestions1: any;
  savedQuestions2: any;

  constructor(private storageService: StorageService,
    private formBuilder: UntypedFormBuilder,
    private _accService: AccountService,
    private router: Router,
    private route: ActivatedRoute,
  ) { }

  ngOnInit(): void {
    this.route.queryParams.subscribe(
      params => {
        this.orgId = params['orgId'];
        this.userToken = params['token']
      }
    )
    this.questionform = this.formBuilder.group({
      question1: [null, Validators.required],
      awnser1: [null, Validators.required],
      question2: [null, Validators.required],
      awnser2: [null, Validators.required],
      question3: [null, Validators.required],
      awnser3: [null, Validators.required],
    })
    this.getQuestions();

  }
  getQuestions() {
    let security_qa = this.storageService.get('securityQuestions') !== undefined ? this.storageService.get('securityQuestions') : '';
    this.savedQuestions = this.storageService.get('security_questions') !== undefined ? this.storageService.get('security_questions') : '';
    this.savedQuestions1 = this.storageService.get('security_questions1') !== undefined ? this.storageService.get('security_questions1') : '';
    this.savedQuestions2 = this.storageService.get('security_questions2') !== undefined ? this.storageService.get('security_questions2') : '';
    this.questionform.patchValue({
      question1: security_qa !== null ? security_qa.security_qa[0]?.question_id : null,
      awnser1: security_qa !== null ? security_qa.security_qa[0]?.answer : '',
      question2: security_qa !== null ? security_qa.security_qa[1]?.question_id : null,
      awnser2: security_qa !== null ? security_qa.security_qa[1]?.answer : '',
      question3: security_qa !== null ? security_qa.security_qa[2]?.question_id : null,
      awnser3: security_qa !== null ? security_qa.security_qa[2]?.answer : '',
    });
    this._accService.Questions("securityQuestions").subscribe(
      data => {
        if (this.savedQuestions !== '' && this.savedQuestions1 !== '' && this.savedQuestions2 !== '' && this.savedQuestions !== null && this.savedQuestions1 !== null && this.savedQuestions2 !== null) {
          this.security_questions = this.savedQuestions;
          this.security_questions1 = this.savedQuestions1;
          this.security_questions2 = this.savedQuestions2;
          this.original_security_questions = this.savedQuestions;
          this.original_security_questions1 = this.savedQuestions1;
          this.original_security_questions2 = this.savedQuestions2;
        } else {
          this.security_questions = data?.security_questions;
          this.security_questions1 = data?.security_questions;
          this.security_questions2 = data?.security_questions;
          this.original_security_questions = data?.security_questions
          this.original_security_questions1 = data?.security_questions
          this.original_security_questions2 = data?.security_questions
        }
      }
    )
  }

  onBackClick() {
    this.onBack.emit(true)
    this.router.navigate(['auth/basic-details'], { queryParams: { orgId: this.orgId, token: this.userToken } });
  }

  removeSecurityQues(value: any, num: any) {
    let preValueQ1 = this.questionform.get('question1');
    let preValueQ2 = this.questionform.get('question2');
    let preValueQ3 = this.questionform.get('question3');
    if (num === 'zero') {
      if ((preValueQ2.value && preValueQ3.value) || preValueQ1.value) {
        const s1 = this.original_security_questions1;
        const s2 = this.original_security_questions2;
        this.security_questions1 = s1.filter((data) => (data.title != value.title && data.id != preValueQ3.value));
        this.security_questions2 = s2.filter((data) => (data.title != value.title && data.id != preValueQ2.value));
      } else {
        const s1 = this.original_security_questions1;
        const s2 = this.original_security_questions2;
        this.security_questions1 = s1.filter((data) => data.title != value.title);
        this.security_questions2 = s2.filter((data) => data.title != value.title);
      }
    } else if (num === 'one') {
      if ((preValueQ1.value && preValueQ2.value) || preValueQ2.value) {
        const s = this.original_security_questions
        const s2 = this.original_security_questions2
        this.security_questions = s.filter((data) => (data.title != value.title && data.id != preValueQ3.value))
        this.security_questions2 = s2.filter((data) => (data.title != value.title && data.id != preValueQ1.value))
      } else {
        const s = this.original_security_questions
        const s2 = this.original_security_questions2
        this.security_questions = s.filter((data) => data.title != value.title)
        this.security_questions2 = s2.filter((data) => data.title != value.title)
      }
    } else if (num === "two") {
      if ((preValueQ1.value && preValueQ2.value) || preValueQ3.value) {
        const s = this.original_security_questions
        const s1 = this.original_security_questions1
        this.security_questions = s.filter((data) => (data.title != value.title && data.id != preValueQ2.value))
        this.security_questions1 = s1.filter((data) => (data.title != value.title && data.id != preValueQ1.value))
      } else {
        const s = this.original_security_questions
        const s1 = this.original_security_questions1
        this.security_questions = s.filter((data) => data.title != value.title)
        this.security_questions1 = s1.filter((data) => data.title != value.title)
      }
    }
  }

  onSubmitForm(form) {
    this.storageService.set('security_questions', this.security_questions, true);
    this.storageService.set('security_questions1', this.security_questions1, true);
    this.storageService.set('security_questions2', this.security_questions2, true);
    const payload = {
      "security_qa": [
        {
          "question_id": this.questionform.get('question1').value,
          "answer": this.questionform.get('awnser1').value
        },
        {
          "question_id": this.questionform.get('question2').value,
          "answer": this.questionform.get('awnser2').value
        },
        {
          "question_id": this.questionform.get('question3').value,
          "answer": this.questionform.get('awnser3').value
        }
      ]
    }
    this.storageService.set('securityQuestions', payload, true);
    this.onNext.emit(payload);
  
  
  }

  onSkipClick() {
    this.router.navigate(['auth/avatar'], { queryParams: { orgId: this.orgId, token: this.userToken } });
    this.onSkip.emit(true);
  }
}
