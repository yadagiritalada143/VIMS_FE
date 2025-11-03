import { Component, OnInit, Output, Input, EventEmitter } from '@angular/core';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { StorageService, StorageKeys } from 'src/app/core/services/storage.service';
import { QuestionnaireService } from 'src/app/program-setup/questionnaire/questionnaire.service';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { Validators, UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { JobService } from 'src/app/jobs/job.service';
import { AccuracyPipe } from 'src/app/shared/pipe/accuracy.pipe';
import { AccuracyConfigEnum } from 'src/app/shared/enums';
@Component({
  selector: 'app-others',
  templateUrl: './others.component.html',
  styleUrls: ['./others.component.scss']
})
export class OthersComponent implements OnInit {
  _othersData: any;
  public othersForm: UntypedFormGroup;
  @Output() onClose = new EventEmitter();
  @Output() onSubmit = new EventEmitter();
  public is_submission_exceed_max_bill_rate = false
  @Input() set othersData(data) {
    if (data) {
      this._othersData = data;
      setTimeout(() => {
        this.patchData();
      }, 200);
    }
  }
  get getOthersData() {
    return this._othersData;
  }


  public itemPerPage: number = 25;
  public Page = 1;
  public search: any;
  currentProgram: any;
  // questionnaires: any;
  showType: any;
  isSaveLoader: any;
  rateFactor: any;
  visibility: any;
  // is_ot_exempt: any;
  // questionariesearch = new Subject<string>();
  ratecardsearch = new Subject<string>();
  pageError: boolean = false;
  isCheckList = false;
  checkListData: any;

  constructor(public questionnaireService: QuestionnaireService,
    private storageService: StorageService,
    private alertService: AlertService,
    public route: ActivatedRoute,
    private fb: UntypedFormBuilder,
    private jobService:JobService,
    private accuracyPipe: AccuracyPipe
    ) {
    this.othersForm = this.fb.group({
      // questionnaire: [, [Validators.required]],
      rates: [, [Validators.required]],
      // is_ot_exempt: false
    });
    // this.questionariesearch.pipe(
    //   debounceTime(300),
    //   distinctUntilChanged())
    //   .subscribe((value: any) => {
    //     this.search = value?.term;
    //     // this.getAllQuestionnaireList();
    //   });
    this.ratecardsearch.pipe(
      debounceTime(300),
      distinctUntilChanged())
      .subscribe((value: any) => {
        this.search = value?.term;
        this.getAllRatefactorList();
      });
      // this.is_ot_exempt = this.othersForm?.value?.is_ot_exempt;
  }

  ngOnInit(): void {
    this.visibility = this.route.snapshot.params['name'];
    let programId = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.currentProgram = programId['id'];
    // this.currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    // this.getAllQuestionnaireList();
    this.othersForm = this.fb.group({
      // questionnaire: [, [Validators.required]],
      rates: [, [Validators.required]],
      // is_ot_exempt: false,
      checklist: [],
      is_onboarding_checklist: false,
      is_submission_exceed_max_bill_rate: false,
    });
    if(!this.visibility){
      this.getAllRatefactorList();
    }
    this.patchData();
  }

  getCheckList() {
    const _url = `/configurator/programs/${this.currentProgram}/onboarding/checklists`;
    this.jobService.get(_url).subscribe(
      (data: any) => {
        this.checkListData = data?.checklists;
        this.checkListData?.forEach(c => {
          if (this._othersData?.checklist?.id === c?.id) {
            c.checkList = true;
          } else {
            c.is_enabled = false;
          }
        })
        this.othersForm.patchValue({
          checklist: this.checkListData
        });
        this.othersForm?.controls?.checklist?.updateValueAndValidity();
      });
  }

  patchData() {
    this.othersForm.reset();
      if(this._othersData?.rates && this._othersData?.rates?.length > 0) {
        this._othersData?.rates?.forEach(element => {
          if(element.bill_rate.length > 0) {
            element.bill_rate[0].factor = this.accuracyPipe.transform(element?.bill_rate?.[0]?.factor,AccuracyConfigEnum.RATE,{isEdit: true});
          }
          if(element.pay_rate.length > 0) {
            element.pay_rate[0].factor = this.accuracyPipe.transform(element?.pay_rate?.[0]?.factor,AccuracyConfigEnum.RATE,{isEdit: true});
          }
          
           if(!element.name) {
             element.name = element?.rate_factor;
           }
        });
      }
    this.othersForm.patchValue({
      // questionnaire: this._othersData?.questionnaire || this._othersData?.questionnaire,
      rates: this._othersData?.rates,
      // is_ot_exempt: this._othersData?.is_ot_exempt
    });
    // this.is_ot_exempt = this.othersForm?.value?.is_ot_exempt;

    if (this._othersData && Object.keys(this._othersData).length != 0) {
      this.othersForm.patchValue({
        is_onboarding_checklist: this._othersData?.is_onboarding_checklist,
        is_submission_exceed_max_bill_rate: this._othersData?.is_submission_exceed_max_bill_rate,
      })
      this.isCheckList = this._othersData?.is_onboarding_checklist;
      this.is_submission_exceed_max_bill_rate = this._othersData?.is_submission_exceed_max_bill_rate;
    }
    const data = this._othersData?.checklist;
    if (data && data?.length > 0) {
      this.othersForm.patchValue({
        checklist: this._othersData?.checklist,
      });
    }
    setTimeout(() => {
      let data = this._othersData?.checklist;
      if (data && data?.length > 0) {
      } else {
        this.getCheckList();
      }
    }, 200);
    this.getAllRatefactorList();   
  }

  getRate(rate) {
    return rate?.replace("_", " ");
  }

  // getAllQuestionnaireList() {
  //   let url;
  //   let qry = '?';
  //   qry = qry + 'limit=' + this.itemPerPage + '&page=' + this.Page;
  //   if (this.search) {
  //     qry = qry + '&k=' + this.search;
  //   }
  //   url = '/configurator/programs/' + this.currentProgram + '/questionnaires' + qry;
  //   this.questionnaireService.get(url).subscribe(
  //     (data:any) => {
  //       if (data.questionnaires) {
  //         this.questionnaires = data?.questionnaires;
  //       }
  //     },
  //     (err) => {
  //       this.alertService.error(errorHandler(err));
  //     }
  //   );
  // }

  resetRatefactorList() {
    this.othersForm?.controls?.rates?.reset();
    this.othersForm?.patchValue({
      // is_ot_exempt:this.is_ot_exempt
    });
    this.getAllRatefactorList();
  }

  getAllRatefactorList() {
    let url;
    let qry = '?';
    qry = qry + 'limit=' + this.itemPerPage + '&page=' + this.Page + '&is_enabled=True';
    if (this.search) {
      qry = qry + '&k=' + this.search;
    }

    url = '/configurator/programs/' + this.currentProgram + '/rate-factors' + qry;
    this.questionnaireService.get(url).subscribe({
      next: (data:any) => {
        if (data.rate_factors) {
          this.rateFactor = data?.rate_factors;
          this.rateFactor?.forEach((d,i)=> {
            // if((d?.is_ot_exempt === true) &&  (this.is_ot_exempt === true)){
            //   this.rateFactor.splice(i,1);
            // }
            if((d?.is_ot_exempt === true)){
              this.rateFactor.splice(i,1);
            } 
          });
          
        }
      },
      error: (err) => {
        this.alertService.error(errorHandler(err));
      }
  });
  }

  removeRateFactor(data, i) {
    this.othersForm.value.rates.splice(i, 1);
    this.othersForm.patchValue({
      rates: this.othersForm.value.rates
    })
  }
  toggleView(data) {
    data.iscollapse = !data?.iscollapse
  }
  backTo() {
    // this.othersForm.value.is_ot_exempt = this.is_ot_exempt;
    this.onClose.emit({ type: 'otherInfo', data: this.othersForm?.value, value: 3 });
  }
  saveOthers() {
    const checkList = this.othersForm?.value?.checklist;
    if (this.visibility != 'isview' && this.isCheckList) {
      if (checkList && checkList?.length > 0) {
        const isEnabled = checkList.filter(c => c.is_enabled);
        if (isEnabled && isEnabled.length === 0) {
          this.alertService.error(`Please Select Onboarding checklist.`);
          return;
        }
      } else {
        this.alertService.error(`Please Select Onboarding checklist.`);
        return;
      }
    }
    if (this.visibility != 'isview' && this.pageError) {
      this.alertService.error('Please provide valid inputs before proceeding.');
    } else {
      // this.othersForm.value.is_ot_exempt = this.is_ot_exempt;
      this.onSubmit.emit({ type: 'otherInfo', data: this.othersForm?.value, value: 5 });
    }
  }

  factorChange(event, data): void {
    if (data?.factor) {
      if ((+event.target.value) >= 1 && (+event.target.value) <= 10) {
        data.factor = (+event.target.value);
        this.pageError = data['is_error'] = false;
      } else {
        this.pageError = data['is_error'] = true;
      }
    }
  }

  addRate(data): void {
    if (data?.factor && (data?.factor + 0.5) <= 10) {
      data.factor += 0.5;
    }
  }

  removeCheckList() {
    this.isCheckList = !this.isCheckList;
    if (!this.isCheckList) {
      this.othersForm?.value?.checklist?.forEach(q => {
        q.is_enabled = false;
      });
    }
    this.othersForm?.patchValue({
      is_onboarding_checklist: this.isCheckList
    });
  }

  activeChecklist(cl) {
    cl.is_enabled = true;
    this.othersForm?.value?.checklist?.forEach(q => {
      if (q?.id === cl?.id) {
        cl.is_enabled = true;
      } else {
        q.is_enabled = false;
      }
    });
  }

  checkBillRate() {
    this.is_submission_exceed_max_bill_rate = !this.is_submission_exceed_max_bill_rate;
    this.othersForm.patchValue({
      is_submission_exceed_max_bill_rate: this.is_submission_exceed_max_bill_rate
    })
  }
}
