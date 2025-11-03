import { Component, OnInit, Input, Output , EventEmitter} from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { Observable, debounceTime, forkJoin } from 'rxjs';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { JobService } from 'src/app/jobs/job.service';
import { Log, LOG_TYPE } from 'src/app/library/logs/logs.model';
import { AccuracyPipe } from 'src/app/shared/pipe/accuracy.pipe';
import * as _ from 'lodash';
import { DATE_FORMAT } from 'src/app/library/date-format/date-format.model';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
@Component({
  selector: 'app-job-budget-estimate-view',
  templateUrl: './job-budget-estimate-view.component.html',
  styleUrls: ['./job-budget-estimate-view.component.scss']
})

export class JobBudgetEstimateViewComponent implements OnInit {
  currency: any;
  @Input() isCreateEstimate = 'hidden'
  jobDetailsData:any = undefined;
  showLoader: boolean = false;
  @Input() set jobData(jobDetailsData){
    this.jobDetailsData = jobDetailsData;
    this.showLoader = true;
    this.isMaxBudgetCalculation = this.jobDetailsData?.estimate_budget_type?.toLowerCase() === "max_budget";
    if (jobDetailsData?.rate_model === 'BILL_RATE') {
       if(jobDetailsData?.rate_markup_info.hasOwnProperty('avg_bill_rate') || !jobDetailsData?.rate_markup_info?.avg_bill_rate){
            let minRate = jobDetailsData?.rate_model === 'BILL_RATE' ? (+jobDetailsData?.min_bill_rate) : (+jobDetailsData?.rate_markup_info?.est_min_rate);
            let maxRate = jobDetailsData?.rate_model === 'BILL_RATE' ? (+jobDetailsData?.max_bill_rate) : (+jobDetailsData?.rate_markup_info?.est_max_rate);
            const sum = minRate + maxRate;
            if (sum) {
              this.averageRate = sum / 2;
            }
          }
    }
    else{
      this.averageRate = jobDetailsData?.rate_markup_info?.est_rate;
    }

  };
  @Input() set selectedCurrency(value: any) {
    if (value) {
      this.currency = value
    }
  };
  @Input() showReduceFlyout: boolean;
  reducePositionForm: UntypedFormGroup;
  programID: string;
  reducePosition: number;
  dataLoading: boolean = false;
  isValid: boolean = false;
  logs: Log= undefined;
  @Output() onCreateClose = new EventEmitter();
  @Output() onUpdateReduceData = new EventEmitter<boolean>();
  isMaxBudgetCalculation:boolean = false;
  averageRate;
  avgValue;
  rateTypeMap = new Map<string, string>([
    ['per_hour', 'Hourly'],
    ['per_day', 'Daily'],
    ['per_month', 'Monthly'],
    ['per_week', 'Weekly'],
    ['per_year', 'Yearly'],
  ]);
  constructor(
    private accuracyPipe: AccuracyPipe,
    private formBuilder: UntypedFormBuilder,
    private jobService: JobService,
    private localStorage: StorageService,
    private datePipe: LocalDateFormatPipe
  ) { }

  ngOnInit(): void {
    this.programID = this.localStorage.get(StorageKeys.CURRENT_PROGRAM)?.id;
    this.reducePositionForm = this.formBuilder.group({
      num_resources: [''],
      min_net_budget : [0],
      max_net_budget: [0],
      net_budget: [0],
      notes: [''],
    })
    this.reducePositionForm.get('num_resources').valueChanges.pipe(debounceTime(500)).subscribe((res)=> {
      this.getResourceBudget();
    })
  }

  getResourceBudget() {
    const isValidData = this.validateInput();
    this.showLoader = false;
    if(isValidData){
      this.dataLoading = true;
      const request = this.reducePositionForm.value;
      this.reducePosition = this.reducePositionForm.get('num_resources').value
      request.rate = this.averageRate || +this.jobDetailsData?.max_bill_rate || 0;
      request.rate_type = this.jobDetailsData?.rate_type;
      request.week_working_days = this.jobDetailsData?.day_per_week;
      request.hours_per_day = this.jobDetailsData?.estimated_hours;

      const start_date = this.jobDetailsData?.start_date
        ? this.datePipe.transform(this.jobDetailsData?.start_date, DATE_FORMAT?.FORMATYMD, '', '', true)
        : null;
      const end_date = this.jobDetailsData?.end_date
        ? this.datePipe.transform(this.jobDetailsData?.end_date, DATE_FORMAT?.FORMATYMD, '', '', true)
        : null;

        if(!start_date || !end_date || (!this.isMaxBudgetCalculation && !request.rate)){
          return;
        }

      request.start_date = start_date;
      request.end_date = end_date;
      request.adjustment_value = this.jobDetailsData?.adjustment_value;
      request.adjustment_type = this.jobDetailsData?.adjustment_type;
      const requestParam = this.jsonToQueryString(request);
      const minRequest = {...request};
      const maxRequest = {...request};
      minRequest.rate = this.jobDetailsData?.rate_model === 'BILL_RATE' ? +this.jobDetailsData?.min_bill_rate : (+this.jobDetailsData?.rate_markup_info?.est_min_rate);
      maxRequest.rate = this.jobDetailsData?.rate_model === 'BILL_RATE' ? +this.jobDetailsData?.max_bill_rate : (+this.jobDetailsData?.rate_markup_info?.est_max_rate);
      const minParam: string = this.jsonToQueryString(minRequest);
      const maxParam: string = this.jsonToQueryString(maxRequest);
      const req_array: Array<Observable<any>> = new Array();
      const minBudgetApi = this.jobService.get(`/core-money/programs/${this.programID}/resource-budget${minParam}`);
      const avgBudgetApi = this.jobService.get(`/core-money/programs/${this.programID}/resource-budget${requestParam}`);
      const maxBudgetApi = this.jobService.get(`/core-money/programs/${this.programID}/resource-budget${maxParam}`);
      if(minRequest?.rate!== 0) {
        req_array.push(minBudgetApi);
      }
      else{
        this.reducePositionForm.patchValue({
          min_single_gross_budget: 0.00,
          min_net_budget: 0.00,
        });
      }
      if(maxRequest?.rate!== 0) {
        req_array.push(avgBudgetApi);
      }
      if(request?.rate!== 0) {
        req_array.push(maxBudgetApi);
      }
      forkJoin(req_array).subscribe({
        next: (results) => {
        let combineResult = JSON.parse(JSON.stringify(results));
        if (combineResult && combineResult.length >= 1) {
          if(req_array.includes(avgBudgetApi) ){
            const  index = this.averageRate ? (req_array?.length < 3 ? 0:1) :  (req_array?.length < 3 ? 0:2);
            this.reducePositionForm.patchValue(combineResult[index]?.data);
          }
        }
        if (combineResult && combineResult.length > 0 && req_array.includes(minBudgetApi)) {
          this.reducePositionForm.patchValue({
            min_net_budget: combineResult[0]?.data?.net_budget,
          });
        }
      
        if (combineResult && combineResult.length > 1  && req_array.includes(maxBudgetApi)) {
          const index= req_array?.length < 3 ? 1:2;
          this.reducePositionForm.patchValue({
            max_net_budget: combineResult[index]?.data?.net_budget,
          })
        }
        this.dataLoading = false;
      },
      error: (err) => {
        this.isValid = false;
        this.showError(err?.error?.error?.errors[0]?.message);
      }});
    }
  }

  showError(err){
    window.scrollTo(0,0);
    this.logs = {
      type: LOG_TYPE.ERROR, heading:err?.error?.error?.message ? err?.error?.error?.message : (typeof err == 'string' ? err : ''), messages: [], autoClose: true, isShown: true, showReportButton: (err?.status == 500 || err?.status == 400), additionalInfo:{trace_id: err?.error?.trace_id }
    };
      err?.error?.error?.errors?.forEach(msg => {
        if (msg?.message) {
          this.logs.messages.push(msg?.message);
        }
      });
  }

  jsonToQueryString(json) {
    return '?' +
      Object.keys(json).map(function (key) {
        return encodeURIComponent(key) + '=' +
          encodeURIComponent(json[key]);
      }).join('&');
  }


  validateInput() {
    if(this.reducePositionForm.get('num_resources').value == null){
      this.dataLoading = false;
      this.isValid = false;
      this.reducePosition = 0;
      this.reducePositionForm.patchValue({
        max_net_budget: 0.00,
        min_net_budget: 0.00,
        net_budget: 0.00
      });
      return false;
    }
    else if (!this.reducePositionForm.get('num_resources').valid) {
      this.isValid = false;
      this.reducePosition = 0;
      this.dataLoading = true;
      if(this.showLoader){
        this.dataLoading = false;
      }
      return false;
    }else{
      this.isValid = true;
      return true;
    }
    
  }
  
  sidebarClose(allowUpdate) {
      this.onCreateClose.emit('hidden');
  }

  onUpdateReducePosition(){
    this.onCreateClose.emit('hidden');
    const PayLoad:any = {
          min_budget: parseFloat(this.reducePositionForm.get('min_net_budget').value ?? 0),
          max_budget: parseFloat(this.reducePositionForm.get('max_net_budget').value ?? 0),
          budget_estimate: this.reducePositionForm.get('net_budget').value,
          location_id: this.jobDetailsData?.location?.id ? [this.jobDetailsData?.location?.id] : [],
          status_note: this.reducePositionForm.get('notes').value
    }
    PayLoad.positions = this.reducePositionForm.get('num_resources')?.value;
    this.reducePositionForm.reset();
    this.showLoader = true;
    this.onUpdateReduceData.emit(PayLoad);
  }

  getWorkingUnits() {
    switch (this.jobDetailsData?.rate_type) {
      case 'per_hour':
        if (this.jobDetailsData?.working_hours)
          return this.accuracyPipe?.transform(this.jobDetailsData?.working_hours, 'hour') + ' Hours';
        return '--';
      case 'per_day':
        if (this.jobDetailsData?.working_days)
          return this.accuracyPipe?.transform(this.jobDetailsData?.working_days, 'hour') + ' Days';
        return '--';
      default:
        return '--'
    }
  }
}
