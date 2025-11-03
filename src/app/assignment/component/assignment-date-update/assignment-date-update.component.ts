import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { UntypedFormBuilder, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { FormRendererService } from 'src/app/library/form-renderer/form-renderer.service';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { ReasonCodesService } from 'src/app/shared/service/reson-codes.service';
import { getDateFromString } from 'src/app/shared/util/date.util';
import { Log , LOG_TYPE } from 'src/app/library/logs/logs.model'; 
import { DATE_FORMAT } from 'src/app/library/date-format/date-format.model'; 
@Component({
  selector: 'app-assignment-date-update',
  templateUrl: './assignment-date-update.component.html',
  styleUrls: ['./assignment-date-update.component.scss']
})
export class AssignmentDateUpdateComponent implements OnInit {
  reasonList:any= undefined;
  action:string= undefined;
  actionName:string= undefined;
  private subscriptions: Subscription[] = [];
  specialAccess = "hidden";
  _assignmentData: any;
  options = {
    language: 'English'
  };
optionsEndDate = {
    language: 'English'
  };
  updateForm = this.fb.group({
    start_date: ['', Validators.required],
    end_date: ['', Validators.required],
    request_reason: ['', Validators.required],
    reason_code_action: [null],
    request_notes: [null]
  })
 @Input('assignmentData') set assignmentData(value: any) {
    if (value) {
      this._assignmentData = value;
      if (value?.assignment?.start_date) {
        let startDate = getDateFromString(value?.assignment?.start_date);
        // let endDate = getDateFromString(value?.assignment?.end_date);
        this.updateForm.patchValue({
          start_date: this.datePipe.transform(value?.assignment?.start_date, this.dateFormat , '' ,'', true),
          end_date: this.datePipe.transform(value?.assignment?.end_date, this.dateFormat , '' ,'', true),
        });
        startDate.setDate(startDate.getDate());
        if (value?.assignment?.status?.toLowerCase() !== 'pending') {
          this.options['enabledDateRanges'] = [
            { start: startDate }
          ];
        }
        this.optionsEndDate['enabledDateRanges'] = [
          { start: startDate }
        ]
        this.options = { ... this.options };
        this.optionsEndDate = { ...this.optionsEndDate }
      }
      this.getSOWProjectsDetail();
    }
  }
  @Output() onSubmit =  new EventEmitter<any>();
  logs: Log= undefined;
  @Input('err') set err (value :any)
  {
    if(value)
    {
      this.logs = { type: LOG_TYPE.ERROR, heading: value , autoClose: true, isShown: true, showReportButton: false, additionalInfo: undefined };
    }
  } 
 @Input() dateFormat = 'dd/MM/yyyy';
  get assignmentData() {
    return this._assignmentData;
  }
  constructor(private eventStream: EventStreamService, private fb: UntypedFormBuilder, private datePipe: LocalDateFormatPipe,private resonCodesService: ReasonCodesService, private _formRendererService: FormRendererService, private _storageService: StorageService) { }
  ngOnInit(): void {
    this.eventStream.on(Events.UPDATE_ASSIGNMENT_DURATION).subscribe((data) => {
      if (data) {
        this.specialAccess = "visible";
      }
      else {
        this.specialAccess = "hidden";
      }
    });
    this.updateForm.controls.start_date.valueChanges.subscribe(res => {
      // as new date will not understand DD/MM/YYYY format
      if (this._assignmentData?.sow?.id && this._assignmentData?.sow?.project?.id) {
        if (this.optionsEndDate['enabledDateRanges']?.length) {
          this.optionsEndDate['enabledDateRanges'] = [
            {
              ...this.optionsEndDate['enabledDateRanges'][0],
              start: new Date(this.datePipe.transform(res,DATE_FORMAT?.FORMATYMD,null,null,true,this.dateFormat))
            }
          ];
        }
      } else {
        this.optionsEndDate['enabledDateRanges'] = [
          { start: new Date(this.datePipe.transform(res,DATE_FORMAT?.FORMATYMD,null,null,true,this.dateFormat)) }
        ];
      }
      this.optionsEndDate = { ...this.optionsEndDate };
      const endDate = this.updateForm?.controls?.end_date?.value;
      if (new Date(endDate).getTime() < new Date(res).getTime()) {
        this.updateForm.patchValue({
          end_date: '',
        })
      }
      if(!this.reasonList || !this.reasonList?.length || this.reasonList?.length ==0) {
      this.getReasonCodeActions('REQUEST_START_DATE')
      }
 })
 this.updateForm.controls.end_date.valueChanges.subscribe(res => {
  if(res) {
    if(this.optionsEndDate && this.optionsEndDate['enabledDateRanges']?.length > 0 && this.optionsEndDate['enabledDateRanges']?.[0]?.hasOwnProperty('end')) {
        let sow_milestone_date = new Date(this.optionsEndDate['enabledDateRanges']?.[0]?.end);
        if ((new Date(this.datePipe.transform(res,DATE_FORMAT?.FORMATMDY,null,null,true,this.dateFormat)).getTime() > new Date(sow_milestone_date).getTime())) {
        this.updateForm.get('end_date')?.setErrors({ 'invalidDate': true });
      } else {
        this.updateForm.get('end_date')?.setErrors(null);
      }
    }
    if(!this.reasonList || !this.reasonList?.length || this.reasonList?.length ==0) {
      this.getReasonCodeActions('REQUEST_START_DATE')
    }
  }
 });
  }
  getReasonCodeActions(action){
    this.subscriptions.push(
      this.resonCodesService.getResoncodesFor(action).subscribe(data => {
        this.reasonList = data?.reason_codes;
        this.updateForm.patchValue({
          reason_code_action: data?.resonCodeID,
        });
      })
    )
  }
 formatDate(date) {
    var d = new Date(date),
      month = '' + (d.getMonth() + 1),
      day = '' + d.getDate(),
      year = d.getFullYear();
    if (month.length < 2)
      month = '0' + month;
    if (day.length < 2)
      day = '0' + day;
    return [year, month, day].join('-');
  }
  submit() {
    this.onSubmit.emit(this.updateForm.value);
  }
  sidebarClose() {
    this.specialAccess = 'hidden';
    this.logs = undefined;
  }

  getSOWProjectsDetail() {
    if (!this._assignmentData?.sow?.id || !this._assignmentData?.sow?.project?.id || this._assignmentData.callInProcess) {
      return;
    }
    this._assignmentData.callInProcess = true; // restrict to call second time same API
    const programDetails = this._storageService.get(StorageKeys.CURRENT_PROGRAM);
     let url =  `/sow/programs/${programDetails?.id}/sow/${this._assignmentData?.sow?.id}/deliverables/${this._assignmentData?.sow?.project?.id}?is_latest=True&is_awarded=True`;
    this._formRendererService.get(url).subscribe(data => {
       if(data) {
      const selectedSowProj = data;
      const sowStartDate= selectedSowProj?.client_start_date;
      const sowEndDate= selectedSowProj?.client_end_date;
      if (selectedSowProj && sowStartDate?.year && sowEndDate?.year) {
        const enabledDateRanges = [
          {
            start: new Date(parseInt(sowStartDate?.year), parseInt(sowStartDate?.month) - 1, parseInt(sowStartDate?.day), 0, 0, 0, 0),
            end: new Date(parseInt(sowEndDate?.year), parseInt(sowEndDate?.month) - 1, parseInt(sowEndDate?.day), 0, 0, 0, 0)
          }
        ]
        this.options['enabledDateRanges'] = enabledDateRanges;
        this.optionsEndDate['enabledDateRanges'] = enabledDateRanges;
        this.options = { ... this.options };
        this.optionsEndDate = { ...this.optionsEndDate }
      }
      this._assignmentData.callInProcess = false; 
    }
    });
  }

  addTimeZone(date){
    if(date && typeof date == 'string' && date?.toLowerCase()?.indexOf("utc") == -1){
     return `${date} UTC`;
    }else{
      return date;
    }
 }
}









