import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { PicklistItem } from '../assignment.model';
import { AssignmentService } from '../assignment.service';
import { Log , LOG_TYPE } from 'src/app/library/logs/logs.model'; 
import { AccuracyConfigEnum } from '../enums/accuracy-config';
@Component({
  selector: 'app-add-additional-budget',
  templateUrl: './add-additional-budget.component.html',
  styleUrls: ['./add-additional-budget.component.scss']
})
export class AddAdditionalBudgetComponent implements OnInit {
  @Input() isAdditionalBudget = 'visible';
  @Output() onClose = new EventEmitter();

  formTitle = 'Add Additional Budget';
  programId = '';
  assignmentid = '';
  logs: Log= undefined;
  causeOfAdditionalBudget: PicklistItem[];
  accuracyConfig = AccuracyConfigEnum;

  editionalBudgetForm: UntypedFormGroup;

  effectiveDate = ''
  constructor(private fb: UntypedFormBuilder,
              private storageService: StorageService,
              private assignmentService: AssignmentService,
              private loader: LoaderService,
              private activatedRoute: ActivatedRoute,
              private alert: AlertService) { }

  ngOnInit(): void {
    this.assignmentid = this.activatedRoute.snapshot.params.id;
    const programDetails = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    if (programDetails) {
      this.programId = programDetails.id;
    }
    this.getCodeList(this.programId);
    this.editionalBudgetForm = this.fb.group({
      value: [null, [Validators.required]],
      request_reason: [null, [Validators.required]],
      request_notes: [null,],
      effective_date: [null, [Validators.required]]
    })
  }

  getCodeList(programID) {
    let reasonArray = [];
    let reasoncode;
    this.assignmentService.getReasonCodeAction(programID).subscribe((reason: any) => {
      if (reason) {
        reasonArray = reason.reason_code_actions;
        reasonArray.forEach(item => {
          if (item.code === 'REQUEST_ADDITIONAL_BUDGET') {
            reasoncode = item.id;
            this.getbudgetCode(programID, reasoncode);
          }
        })
      }
    })
  }

  getbudgetCode(programID, reasoncode) {
    this.assignmentService.getEvaluationListItems(programID, reasoncode).subscribe({next:(data: any) => {
      if (data) {
        this.causeOfAdditionalBudget = data.reason_codes;
      }
    }, error: (err) => {
      // this.alert.error(errorHandler(error));
    }})
  }
  showsidebar() {
    this.isAdditionalBudget = 'visible';
  }
  sidebarClose() {
    this.isAdditionalBudget = 'hidden';
    this.logs = undefined;
    this.onClose.emit(false);
  }

  private markFormGroupTouched(formGroup: UntypedFormGroup) {
    (<any>Object).values(formGroup.controls).forEach(control => {
      control.markAsTouched();

      if (control.controls) {
        this.markFormGroupTouched(control);
      }
    });
  }
  showError(err){
    this.logs = {
      type: LOG_TYPE.ERROR, heading: err?.error?.error?.message ? err?.error?.error?.message : (typeof err == 'string' ? err : ''), messages: [], autoClose: true, isShown: true, showReportButton: (err?.status == 500 || err?.status == 400), additionalInfo:{trace_id: err?.error?.trace_id }
    };
      err?.error?.error?.errors?.forEach(msg => {      
        if (msg?.message) {      
          this.logs.messages.push(msg?.message);
        }
      });
  }

  onSubmit() {
    if (!this.editionalBudgetForm.valid) {
      this.markFormGroupTouched(this.editionalBudgetForm)
      // this.alert.error('There is one or more issues on the page. Please review and correct errors prior to resubmitting.')
      this.showError('There is one or more issues on the page. Please review and correct errors prior to resubmitting.');
      return;
    }
    // const formvalue = this.editionalBudgetForm.value;
    // let formvalue = this.editionalBudgetForm.value;
    // let endDate = this.datePipe.transform((new Date(formvalue.termDate)), 'yyyy-MM-dd');
    // let data = {
    //   'type': 'terminate',
    //   'value': endDate,
    //   'request_reason': formvalue.termReason,
    //   'request_notes': formvalue.notes,
    //   'reason_code_action' : this.reasoncode
    // }
    this.loader.show();
    this.assignmentService.addAdditionalBudget(this.programId, this.assignmentid, this.editionalBudgetForm.value).subscribe({next:
      (data: any) => {
      if (data) {
        this.loader.hide();
        this.alert.success(data?.data?.message);
        this.isAdditionalBudget = 'hidden';
        this.onClose.emit(true);
      }
    }, error: (err) => {
      this.loader.hide();
      // this.alert.error(err?.error);
      this.showError(err?.error);
    }});
  }

}
