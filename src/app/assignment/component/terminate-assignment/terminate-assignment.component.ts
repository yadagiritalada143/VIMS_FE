import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { ReasonCodesService } from 'src/app/shared/service/reson-codes.service';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { AssignmentService } from '../../assignment.service';
import { ReasonTypes } from 'src/app/shared/enums';
import { AssignmentConfigurationService } from 'src/app/program-setup/assignment-configuration/assignment-configuration.service';
import { EventStreamService, EmitEvent, Events } from 'src/app/core/services/event-stream.service';
import { ConfirmationDialogService } from 'src/app/shared/components/confirmation-dialog/confirmation-dialog.service';
import { getDateFromString } from 'src/app/shared/util/date.util';
import { FormRendererService } from 'src/app/library/form-renderer/form-renderer.service';
import { Log, LOG_TYPE } from 'src/app/library/logs/logs.model';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';

@Component({
  selector: 'app-terminate-assignment',
  templateUrl: './terminate-assignment.component.html',
  styleUrls: ['./terminate-assignment.component.scss']
})
export class TerminateAssignmentComponent implements OnInit {
  getDateFromString = getDateFromString;
  @Input() hierarchy_id:string;
  @Input() isTerminate = 'hidden';
  @Input() picklistId = '';
  @Input() actionType = 'close';
  @Output() onClose = new EventEmitter();
  programID;
  reason: any;
  assignmentConfig: any;
  reasonRehire: any;
  terminationForm: UntypedFormGroup;
  DaysBetween: number;
  assignmentid: any;
  options: any;
  reasoncode: any;
  actionCode: any;
  rehireActionCode: any;
  terminateHistory: any;
  dateFormat: string = 'dd/MM/yyyy';
  hireActionCode: any;
  hireReasons: any;
  is_rehire: any;
  isRehire = false;
  assignmentData:any=undefined;
  isPopupVisible: any;
  programDetails;
  approvedTSExist: boolean = false;
  logs:Log= undefined;
  constructor(
    private assignmentService: AssignmentService,
    private storageService: StorageService,
    private alert: AlertService,
    private fb: UntypedFormBuilder,
    private activatedRoute: ActivatedRoute,
    private loader: LoaderService,
    private reasonCodesService: ReasonCodesService,
    private assignmentConfigService: AssignmentConfigurationService,
    private eventStream: EventStreamService,
    private confirmService: ConfirmationDialogService,
    private _formRendererService: FormRendererService,
    private datePipe : LocalDateFormatPipe
  ) { }

  ngOnInit(): void {
    this.assignmentid = this.activatedRoute.snapshot.params.id;
    this.programDetails = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    if (this.programDetails) {
      this.dateFormat = this.assignmentService.getDefaultDateFormat();
      this.programID = this.programDetails['id'];
    }
    this.getAssignmentDetails();
    this.getPickListItems(this.programID);
    this.getReasonCode(this.programID);
    this.terminationForm = this.fb.group({
      termDate: ['', [Validators.required]],
      termReason: [null, [Validators.required]],
      notes: [''],
      hireNotes: [''],
      hireReason: [],
      reasonRehire: ['']
    });
    this.terminationForm.get('termDate').valueChanges.subscribe(val => {
      if (this.programDetails?.config?.disallow_update_assignment_with_approved_timesheet) {
        const { assignment } = this.assignmentData?.assignments;
        const { end_date } = assignment;
        const endDateString = this.convertDateFormat(val);
        const new_end_date = getDateFromString(endDateString);
        if (new_end_date < getDateFromString(end_date)) {
          this.checkIfApprovedTSImpacted(endDateString);
        }
      }
    })
    this.getHistory();
    this.getAssignmentConfig();
  }

  checkPendingStatus()
  {
    if (this.assignmentData?.assignments?.assignment?.status?.toLowerCase() === 'pending') {
      let originalStartDate = this.datePipe?.transform(new Date(), this.dateFormat, '', '', true);
      this.terminationForm.get('termDate').setValue(originalStartDate);
    }
  }

  checkIfApprovedTSImpacted(end_date) {
    const url = `/timesheet/programs/${this.programID}/assignment/${this.assignmentid}/validate-approve-ts?date=${end_date}`;
    this._formRendererService.get(url).subscribe({
      next: (res: any) => {
        if (res) {
          const { data } = res;
          this.approvedTSExist = data?.exist;
          let errors = this.terminationForm.get('termDate')?.errors || null;
          if (errors) {
            delete errors['approved_ts_exist_for_selected_end_date'];
            if (errors && this.isEmptyObject(errors)) {
              errors = null;
            }
          }
          if (this.approvedTSExist) {
            if (!errors) {
              errors = {};
            }
            errors['approved_ts_exist_for_selected_end_date'] = true;
          }
          this.terminationForm.get('termDate')?.setErrors(errors);
        }
      },
      error: err => { }
    })
  }

  isEmptyObject(value) {
    return value && Object.keys(value).length === 0 && value.constructor === Object;
  }

  getAssignmentDetails(){
    this.assignmentService.getAssignmentDetails(this.programID, this.assignmentid)
      .subscribe((res: any) => {
        const { data } = res;
        this.assignmentData = data;
        this.ngOnChanges();
        this.checkPendingStatus();
      });
  }
  getImpactedTimesheetList() {
    if(!this.assignmentData?.assignments?.finance?.is_timesheet_enabled){
      return;
    }
    const requestBody: any = {
      page: 1,
      per_page: 15,
      hierarchy_id: this.hierarchy_id,
      effective_start_date: this.convertDateFormat(this.terminationForm?.get('termDate')?.value),
      new_end_date: this.convertDateFormat(this.terminationForm?.get('termDate')?.value),
      old_end_date: this.assignmentData?.assignments?.assignment?.end_date,
      finance_change: {
        "start_date_change": false,
        "end_date_change": true,
        "rate_change": false,
        "st_hours": false,
        "days_per_week": false,
        "fee_change": false,
        "tax_change": false
      },
      non_finance_change: {
        "timesheet_manager": null,
        "custom_field": false,
        "timesheet_type": false
      },
      is_non_finance_change: 0,
      is_timesheet_type_change:0,
      is_finance_change: 1,
      is_location_change: 0,
      location_change: {
        "work_location": null,
        "location_type": null
      }
    };
    const assignmentId = this.activatedRoute.snapshot.params.id;
    const programDetails = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    let programId = programDetails['id'];
    if (assignmentId) {
      let url = `/timesheet/programs/${programId}/assignment/${assignmentId}/impacted`;
      this.assignmentConfigService.post(url,requestBody)
        .subscribe((data: any) => {
          let impactedTimesheets = undefined;
        let showTable = undefined;
        if (data?.data?.timesheet?.length > 0) {
          impactedTimesheets = data?.data?.timesheet;
          showTable = true;
          this.isPopupVisible = true;
        } else {
          showTable = false;
          this.isPopupVisible = false;
        }
        this.eventStream.emit(new EmitEvent(Events.SHOW_IMPACTED_TIMESHEETS, { impactedTimesheets, showTable }));
        })
    }
   }
  ngOnChanges() {
    this.checkPendingStatus();
    this.terminationForm?.get("termDate")?.valueChanges?.subscribe((value) => {
      if(value) {
        this.getImpactedTimesheetList();
      }
    });
    let startDate = new Date(this.assignmentData?.assignments?.assignment?.start_date);
    let start = this.convertDateFormat(this.datePipe.transform(startDate.setDate(startDate.getDate()), this.dateFormat, undefined, undefined, true));
    let endDate = new Date(this.assignmentData?.assignments?.assignment?.end_date);
    let end = this.convertDateFormat(this.datePipe.transform(endDate.setDate(endDate.getDate()), this.dateFormat, undefined, undefined, true));
    this.getDaysDifference();
   let end_split = end?.split('-');
   let start_split = start?.split('-');
    this.options = {
      language: 'English',
      enabledDateRanges: [
        { start: start ? new Date(parseInt(start_split[0]), parseInt(start_split[1]) - 1 , parseInt(start_split[2])): new Date() , end: end ? new Date(parseInt(end_split[0]), parseInt(end_split[1])- 1, parseInt(end_split[2])) :  new Date(), default:  end ? new Date(parseInt(end_split[0]), parseInt(end_split[1])- 1, parseInt(end_split[2])) :  new Date() },
      ]
    };
  }

  sidebarClose() {
    this.isTerminate = 'hidden';
    this.terminationForm.reset();
    this.logs = undefined;
    this.onClose.emit(this.isTerminate);
  }
  // get status of form fields
  get termDate() { return this.terminationForm.get('termDate'); }
  get termReason() { return this.terminationForm.get('termReason'); }
  get hireReason() { return this.terminationForm.get('hireReason'); }

  get terminationControl() {
    return this.terminationForm.controls;
  }

  getHistory() {
    this.assignmentService.getTerminationHistory(this.programID, this.assignmentid).subscribe({
      next: (data: any) => {
        if (data) {
          this.terminateHistory = data?.data;
        }
      },
      error: (error) => {
        this.alert.error(errorHandler(error));
      }
    })
  }

  getPickListItems(programID) {
    this.reasonCodesService.getResoncodesFor('REQUEST_CLOSING_ASSIGNMENT', 'name')
      .subscribe(res => {
        const { reason_codes, resonCodeID } = res;
        this.actionCode = resonCodeID;
        this.reason = reason_codes;
      })
    }

  getRehirePickListItems() {
    this.reasonCodesService.getResoncodesFor('REQUEST_CLOSING_ASSIGNMENT')
      .subscribe(res => {
          const { reason_codes, resonCodeID } = res;
          this.reasonRehire = reason_codes;
          this.rehireActionCode = resonCodeID;
          });    
  }

  getReasonCode(programID) {
    this.reasonCodesService.getResoncodesFor('DO_NOT_RE_HIRE')
      .subscribe(res => {
        const { reason_codes, resonCodeID } = res;
        this.hireActionCode = resonCodeID;
        this.hireReasons = reason_codes;
      });
  }

  private markFormGroupTouched(formGroup: UntypedFormGroup) {
    (<any>Object).values(formGroup.controls).forEach(control => {
      control.markAsTouched();

      if (control.controls) {
        this.markFormGroupTouched(control);
      }
    });
  }

  convertDateFormat(dateString: string) {
    if (!dateString) {
      return;
    }
    let date, month, year, dateArray, formatArray;
    if (dateString.includes('-')) {
      dateArray = dateString.split('-');
      formatArray = this.dateFormat.split('-');

    } else if (dateString.includes('/')) {
      dateArray = dateString.split('/');
      formatArray = this.dateFormat.split('/');
    }

    if (this.dateFormat.includes('-')) {
      formatArray = this.dateFormat.split('-');

    } else if (this.dateFormat.includes('/')) {
      formatArray = this.dateFormat.split('/');
    }

    for (let index = 0; index < formatArray.length; index++) {
      const abb = formatArray[index];
      if (abb.toLowerCase().includes('mm')) {
        month = dateArray[index];
      } else if (abb.toLowerCase().includes('yy')) {
        year = dateArray[index];
      } else if (abb.toLowerCase().includes('dd')) {
        date = dateArray[index];
      }
    }
    return `${year}-${month}-${date}`
  }
  showPopup(){
    if(this.isPopupVisible){
    this.confirmService.confirm('', `There are timesheets which will be impacted.. Do you want to proceed?`,
    'Yes', 'No')
    .then((confirmed) => {
      if (confirmed) {
        this.terminateassign();
      }
    })
    .catch(() => {
     });
    } else{
      this.terminateassign();
    }
  } 

  terminateassign() {
    this.logs= undefined;
    if (!this.terminationForm.valid) {
      this.markFormGroupTouched(this.terminationForm);
      this.logs= { type: LOG_TYPE.ERROR, heading: "There is one or more issues on the page. Please review and correct errors prior to resubmitting.", autoClose: true, isShown: true};
      // this.alert.error("There is one or more issues on the page. Please review and correct errors prior to resubmitting.")
      return
    }
    let formvalue = this.terminationForm.value;
    let data;
    if(!this.isRehire) {
      data = {
        "type": 'terminate',
        "end_date": this.convertDateFormat(formvalue.termDate),
        "request_reason": formvalue.termReason,
        "request_notes": formvalue.notes,
        "reason_code_action": this.actionCode
      }
    } else {
    data = {
      "type": 'terminate',
      "end_date": this.convertDateFormat(formvalue.termDate),
      "request_reason": formvalue.termReason,
      "request_notes": formvalue.notes,
      "reason_code_action": this.actionCode,
      "is_do_not_re_hire_allow": this.isRehire,
      "do_not_re_hire": this.isRehire,
      "do_not_re_hire_reason_code_action": this.hireActionCode,
      "do_not_re_hire_reason": formvalue?.hireReason,
      "do_not_re_hire_reason_notes": formvalue?.hireNotes
    }
  }
    this.loader.show();
    let observable$  = this.actionType === 'cancel' ? this.assignmentService.cancelAssignment(this.programID, this.assignmentid, data) : this.assignmentService.terminateAssignment(this.programID, this.assignmentid, data);
    observable$.subscribe({
      next: (data: any) => {
        if (data?.data) {
          this.loader.hide();
          this.alert.success(this.actionType === 'cancel' ? data?.data?.message : 'Assignment terminated successfully..');
          this.eventStream.emit(new EmitEvent(Events.RELOAD_ONBOARDING, true));
          this.sidebarClose();
        }
      },
      error: (err) => {
        this.loader.hide();
        this.logs= { type: LOG_TYPE.ERROR, heading: err?.error?.error?.message, messages: this.showErrorMessges(err), autoClose: true, isShown: true, showReportButton: err?.status == 500 || err?.status == 400, additionalInfo:{trace_id: err?.error?.trace_id } };
            //  this.alert.error(errorHandler(err));
      }
    });
  }

  showErrorMessges(err){
    let messages= [];
    err?.error?.error?.errors?.forEach(msg => {      
      if (msg?.message) {      
       messages.push(msg?.message);
      }
    });
    return messages;
  }

  getDaysDifference() {
    let todayDate = new Date();
    let endassgnmentDate = new Date(this.assignmentData?.assignments?.assignment?.end_date);
    let Difference_In_Time = (endassgnmentDate.getTime() - todayDate.getTime());
    let Difference_In_Days = Math.ceil(Difference_In_Time / (1000 * 24 * 60 * 60));
    this.DaysBetween = Difference_In_Days;
  }

  updateToggle($event) {
    if($event?.category?.toLowerCase() === ReasonTypes?.negative) {
      this.toggleReHire(true)
    }
    else{
    this.toggleReHire(false);
  }
  }

  toggleReHire($event) {
    if($event) {
      this.isRehire = true;
      this.terminationForm?.controls?.hireReason?.setValidators([Validators.required]);
    }
    else {
      this.isRehire = false;
      this.terminationForm?.controls?.hireReason.reset();
      this.terminationForm?.controls?.hireReason?.setValidators(null);
      this.terminationForm?.controls?.hireReason?.clearValidators();
      this.terminationForm?.controls?.hireReason?.setErrors(null);
    }
    this.terminationForm?.controls?.hireReason?.updateValueAndValidity();
  }

  getAssignmentConfig() {
    const currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    const url = `/configurator/programs/${currentProgram?.id}/config?entity_code=assignment_setting`;
    this.assignmentConfigService.get(url).subscribe({
      next: (response: any) => {
        this.assignmentConfig = response?.config;
      },
      error: err => {
        this.alert.error(errorHandler(err));
      }
    });
  }
}
