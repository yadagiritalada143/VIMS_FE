import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { JobService } from 'src/app/jobs/job.service';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { forkJoin, Observable } from 'rxjs';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { DATE_FORMAT } from 'src/app/library/date-format/date-format.model';
import { AccuracyPipe } from 'src/app/shared/pipe/accuracy.pipe';
import { Log, LOG_TYPE } from 'src/app/library/logs/logs.model';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { AccuracyConfigEnum } from 'src/app/shared/enums';

@Component({
  selector: 'app-job-estimate',
  templateUrl: './job-estimate.component.html',
  styleUrls: ['./job-estimate.component.scss']
})
export class JobEstimateComponent implements OnInit {
  jobEstimateForm: UntypedFormGroup;
  submitted = false;
  programId: string = undefined;
  data: any = undefined;
  place_data = '%';
  currency: any;
  isValid = true;
  averageRate: any = 0;
  rateType: any = 'per_hour';
  adjustment_type: string = 'fixed';
  public range:number;
  JobDetails: any = {};
  isMaxBudgetCalculation:boolean = false;
  dataLoading = false;

  @Input() rateModel = '';
  @Input() dateFormat = '';
  @Input() isCreateEstimate = 'visible';
  @Input() set selectedCurrency(value: any) {
    if (value) {
      this.currency = value
    }
  };

  @Input() set estimatorFields(value: any) {
    this.data = value;
    if (this.jobEstimateForm){
      this.adjustment_type = this.data?.adjustment_type ? this.data?.adjustment_type : 'fixed' ;
      if (this.adjustment_type === 'percentage') {
        this.place_data = '%';
      } else if (this.adjustment_type === 'fixed') {
        this.place_data = this?.accuracyPipe?.transform(null, null, { currencyCode: this.currency,  display: 'symbol' });
      }
      this.jobEstimateForm.patchValue(value);
      let budget =  parseFloat(this.jobEstimateForm.get('net_budget').value);
      let pct = parseFloat(String(this.jobEstimateForm.get('averagemarkup').value).slice(0,-1));
      this.jobEstimateForm.get('estmarkup').setValue((budget * pct)/100 + budget);

      let budget1=parseFloat(this.jobEstimateForm.get('min_net_budget').value);;
      let pct1 = parseFloat(String(this.jobEstimateForm.get('minmarkup').value).slice(0,-1));
      this.jobEstimateForm.get('estmarkuprangemin').setValue((budget1 * pct1)/100 + budget1);

      let budget2=parseFloat(this.jobEstimateForm.get('max_net_budget').value);;
      let pct2 = parseFloat(String(this.jobEstimateForm.get('maxmarkup').value).slice(0,-1));
      this.jobEstimateForm.get('estmarkuprangemax').setValue((budget2 * pct2)/100 + budget2);
      this.jobEstimateForm.get('adjustment_type').setValue(this.adjustment_type);
    }

  }
  @Output() onCreateClose = new EventEmitter();
  @Input() disableEditableFields;
  logs: Log= undefined;
  isJobEstBtnDisable = false;
  @Input() jobAction: any;
  constructor(
    private formBuilder: UntypedFormBuilder,
    public jobService: JobService,
    private localStorage: StorageService,
    private datePipe: LocalDateFormatPipe,
    public accuracyPipe: AccuracyPipe) { }

  get f() { return this.jobEstimateForm.controls; }

  ngOnInit(): void {
    const currentProgram = this.localStorage.get(StorageKeys.CURRENT_PROGRAM);
    this.isMaxBudgetCalculation = currentProgram?.config?.job?.job_budget_calculation?.toLowerCase() === "max_budget";
    this.programId = currentProgram?.id;
    this.isValid = true;
    this.jobEstimateForm = this.formBuilder.group({
      start_date: [''],
      end_date: [''],
      num_resources: [1, [Validators.required, Validators.pattern(/^[0-9]\d*$/)]],
      hours_per_day: [8, [Validators.required, Validators.pattern(/^[0-9]\d*$/)]],
      week_working_days: [5, [Validators.required, Validators.pattern(/^[1-9]\d*$/)]],
      formatted_working_days: [null, [Validators.required]],
      working_hours: [null, [Validators.required]],
      working_days: [null],
      adjustment_type: ['fixed'],
      rate_type: ['per_hour'],//per_hour / per_day
      single_initial_budget: [null, [Validators.required]],
      min_single_initial_budget: [null],
      max_single_initial_budget: [null],
      single_net_budget: [null, [Validators.required]],
      min_single_net_budget: [null],
      max_single_net_budget: [null],
      additional_amount: [0, [Validators.required]],
      single_gross_budget: [null, [Validators.required]],
      min_single_gross_budget: [null],
      max_single_gross_budget: [null],
      adjustment_value: ['', [Validators.required]],
      net_budget: [null, [Validators.required]],
      min_net_budget: [null],
      max_net_budget: [null],
      min_bill_rate: ['', [Validators.required]],
      max_bill_rate: ['', [Validators.required]],
      unit_of_measure: ['', [Validators.required]],
      RateCardDetails: [null],
      adjustment_amount: [null],
      averagemarkup:['',[Validators.required]],
      minmarkup:['',[Validators.required]],
      maxmarkup:['',[Validators.required]],
      estpayrate:['',[Validators.required]],
      estminrate:['',[Validators.required]],
      estmaxrate:['',[Validators.required]],
      averageRate:[''],
      range:[''],
      estmarkup:[''],
      estmarkuprangemin:[''],
      estmarkuprangemax:[''],
    });
    this.adjustment_type = this.data?.adjustment_type ?? this.adjustment_type;
    if (this.jobEstimateForm) {
      this.jobEstimateForm.patchValue({
        ...this.data, adjustment_type: this.adjustment_type
      });
      if (this.adjustment_type === 'percentage') {
        this.place_data = '%';
      } else if (this.adjustment_type === 'fixed') {
        this.place_data = this?.accuracyPipe?.transform(null, null, { currencyCode: this.currency,  display: 'symbol' });
      }
      if (this.jobEstimateForm.get('adjustment_value').value && +this.jobEstimateForm.get('adjustment_value').value) {
        this.dataLoading = true;
        this.getResourceBudget();
      }
    }

    this.jobEstimateForm.controls.adjustment_value.valueChanges
      .pipe(debounceTime(1000), distinctUntilChanged())
      .subscribe(value => {
        this.dataLoading = true;
        this.getResourceBudget();
      });
  }

  sidebarClose(allowUpdate) {
    let estimateValue = this.jobEstimateForm.value;
    if (+(estimateValue.num_resources) === 0) {
      this.showError(`Please select Number of Positions greater than 0`);
      return;
    }
    let values = undefined;
    if (allowUpdate) {
      values = this.jobEstimateForm.value;
    }
    this.isCreateEstimate = 'hidden';
    this.isValid = true;
    this.onCreateClose.emit(values);
    this.jobAction = this.jobAction.toLowerCase();
    if (this.jobAction == 'create' || this.jobAction == 'clone') {
      this.jobEstimateForm.patchValue({
        adjustment_value : '',
        adjustment_amount: ''
      })
    }
  }

  checkrate() {
    return this.rateModel !== '' && this.rateModel !== 'BILL_RATE';
  }

  async getWorkingHoursEstimate() {
    this.dataLoading = true;
    const isValidData = await this.validateInput();
    if (isValidData) {
      const week_working_days = this.jobEstimateForm.get('week_working_days').value;
      const hours_per_day = this.jobEstimateForm.get('hours_per_day').value;
      let start_date: any = this.jobEstimateForm.get('start_date').value;
      let end_date: any = this.jobEstimateForm.get('end_date').value;
      if (start_date && end_date && week_working_days) {

        start_date =this.datePipe.transform(start_date,  DATE_FORMAT?.FORMATYMD, null, null, true, this.dateFormat);
        end_date =this.datePipe.transform(end_date,  DATE_FORMAT?.FORMATYMD, null, null, true, this.dateFormat);
        if (start_date && end_date) {
          this.jobService.get(`/core-money/programs/${this.programId}/working-hours-estimate?week_working_days=${week_working_days}&hours_per_day=${hours_per_day}&start_date=${start_date}&end_date=${end_date}`).subscribe({
            next: (data: any) => {
            if (data && data.data) {
              this.jobEstimateForm.patchValue(data.data);
              this.getResourceBudget();
              this.isJobEstBtnDisable = false;
            }
          },
          error: (err) => {
            this.showError(err?.error?.error?.errors[0]?.message);
            this.isJobEstBtnDisable = true;
          }});
        }
      }

    }
  }

  validateInput() {
    this.isValid = true;
    let request = this.jobEstimateForm.value;
    if (request.week_working_days < 0 || request.week_working_days > 7) {
      this.showValidationError('Please provide valid working days');
      this.isValid = false;
      return false;
    } else if (request.hours_per_day < 0 || request.hours_per_day > 24) {
      this.showValidationError('Please provide valid hours');
      this.isValid = false;
      return false;
    } else if (request.adjustment_value < 0) {
      this.showValidationError('Please provide valid adjustment value');
      this.isValid = false;
      // return false;
    } else if (request.additional_amount < 0) {
      this.showValidationError('Please provide valid additional amount');
      this.isValid = false;
      return false;
    } else if (request.num_resources < 0) {
      this.showValidationError('Please provide valid positions');
      this.isValid = false;
      return false;
    } else {
      this.isValid = true;
      this.logs = null;
      return true;
    }
  }

  getAverageRate() {
    if (this.rateModel === 'BILL_RATE') {
      const sum = (+this.jobEstimateForm.get('min_bill_rate').value) + (+this.jobEstimateForm.get('max_bill_rate').value);
      if (sum) {
        this.averageRate = sum / 2;
      }
    } else {
      this.averageRate = (+this.jobEstimateForm.get('estpayrate')?.value) ?? 0;
    }
    const value = this.accuracyPipe.transform(this.averageRate, AccuracyConfigEnum.RATE, { currencyCode: this.currency, view_accurate:true });
    this.jobEstimateForm.patchValue({ averageRate: value });
    if (value) {
      return value;
    }
  }

  showValidationError(message) {
    this.showError(message);
  }

  async getResourceBudget() {
    const isValidData = await this.validateInput();
    if (isValidData) {
      let request = JSON.parse(JSON.stringify(this.jobEstimateForm.value));
      delete request['foundational'];
      delete request['unit_of_measure'];
      delete request['RateCardDetails'];
      delete request['estmarkuprangemin'];
      delete request['estmarkuprangemax'];
      delete request['single_initial_budget'];
      delete request['min_single_initial_budget'];
      delete request['min_single_initial_budget'];
      delete request['max_single_initial_budget'];
      delete request['single_net_budget'];
      delete request['min_single_net_budget'];
      delete request['max_single_net_budget'];

      delete request['single_gross_budget'];
      delete request['min_single_gross_budget'];
      delete request['max_single_gross_budget'];
      delete request['min_net_budget'];
      delete request['max_net_budget'];
      delete request['minmarkup'];
      delete request['maxmarkup'];
      delete request['estpayrate'];
      delete request['averageRate'];
      delete request['range'];
      delete request['estmarkup'];
      delete request['net_budget'];
      delete request['averagemarkup'];
      delete request['formatted_working_days'];
      request.total_hours = request.working_hours;
      request.rate = this.averageRate || +this.jobEstimateForm.get('max_bill_rate').value || 0;
      request.adjustment_amount = request?.adjustment_amount ?? 0; 
      let start_date: any = this.jobEstimateForm.get('start_date').value
        ? this.datePipe.transform(this.jobEstimateForm.get('start_date').value, DATE_FORMAT?.FORMATYMD, '', '', true, this.dateFormat)
        : null;
      let end_date: any = this.jobEstimateForm.get('end_date').value
        ? this.datePipe.transform(this.jobEstimateForm.get('end_date').value, DATE_FORMAT?.FORMATYMD, '', '', true, this.dateFormat)
        : null;
      if(!this.isMaxBudgetCalculation){
        if (!request.rate || !start_date || !end_date) {
          return;
        }
      }else{
        if (!start_date || !end_date) {
          return;
        }
      }

      request.start_date = start_date;
      request.end_date = end_date;
      request.adjustment_type = this.adjustment_type;
      if (!request.adjustment_value) {
        delete request.adjustment_value
      }
      const requestParam = this.jsonToQueryString(request);
      let minRequest = JSON.parse(JSON.stringify(request));
      let maxRequest = JSON.parse(JSON.stringify(request));
      minRequest.rate = this.rateModel === 'BILL_RATE' ? +request.min_bill_rate : +request.estminrate;
      maxRequest.rate = this.rateModel === 'BILL_RATE' ? +request.max_bill_rate : +request.estmaxrate;
      const minParam: any = this.jsonToQueryString(minRequest);
      const maxParam: any = this.jsonToQueryString(maxRequest);
      let req_array: Array<Observable<any>> = new Array();
      const request1 = this.jobService.get(`/core-money/programs/${this.programId}/resource-budget${minParam}`);
      const request2 = this.jobService.get(`/core-money/programs/${this.programId}/resource-budget${requestParam}`);
      const request3 = this.jobService.get(`/core-money/programs/${this.programId}/resource-budget${maxParam}`);
      // req_array.push(request1, request2, request3);
      if(minRequest?.rate!== 0) {
        req_array.push(request1);
      } else {
        this.jobEstimateForm.patchValue({
          min_single_initial_budget: 0.00,
          min_single_net_budget: 0.00,
          min_single_gross_budget: 0.00,
          min_net_budget: 0.00,
        });
      }
      if(maxRequest?.rate!== 0) {
        req_array.push(request2);
      }
      if(request?.rate!== 0) {
        req_array.push(request3);
      }
      this.isJobEstBtnDisable = true;
      forkJoin(req_array).subscribe({
        next: (results) => {
        let combineResult = JSON.parse(JSON.stringify(results));
        this.isJobEstBtnDisable = false;
        if (combineResult && combineResult.length >= 1) {
          if(req_array.includes(request2) ){
            const  index = this.averageRate ? (req_array?.length < 3 ? 0:1) :  (req_array?.length < 3 ? 0:2);
            this.jobEstimateForm.patchValue(combineResult[index]?.data);
          }
          // this.jobEstimateForm.patchValue(combineResult[1].data);
        }
        if (combineResult && combineResult.length > 0 && req_array.includes(request1)) {
          this.jobEstimateForm.patchValue({
            min_single_initial_budget: combineResult[0]?.data?.single_initial_budget,
            min_single_net_budget: combineResult[0]?.data?.single_net_budget,
            min_single_gross_budget: combineResult[0]?.data?.single_gross_budget,
            min_net_budget: combineResult[0]?.data?.net_budget,
          });
        }
        if (combineResult && combineResult.length > 0 && !req_array.includes(request1)) {
          this.jobEstimateForm.patchValue({
            min_single_net_budget: this.jobEstimateForm.get('adjustment_type').value === 'percentage' ? 0.00 : this.jobEstimateForm.get('adjustment_value').value ?? 0.00,
            min_net_budget: this.jobEstimateForm.get('adjustment_type').value === 'percentage' ? 0.00 : this.jobEstimateForm.get('adjustment_value').value ?? 0.00
          });
        }
        if (combineResult && combineResult.length > 1  && req_array.includes(request3)) {
          const index= req_array?.length < 3 ? 1:2;
          this.jobEstimateForm.patchValue({
            max_single_initial_budget: combineResult[index]?.data?.single_initial_budget,
            max_single_net_budget: combineResult[index]?.data?.single_net_budget,
            max_single_gross_budget: combineResult[index]?.data?.single_gross_budget,
            max_net_budget: combineResult[index]?.data?.net_budget,
          })
        }
        this.dataLoading = false;
      },
      error: (err) => {
        this.showError(err?.error?.error?.errors[0]?.message);
        this.isJobEstBtnDisable = true;
      }});
    }
  }

  get estimateFormValid() {
    return this.jobEstimateForm.get('num_resources').valid &&
      this.jobEstimateForm.get('hours_per_day').valid &&
      this.jobEstimateForm.get('week_working_days').valid
  }

  jsonToQueryString(json) {
    return '?' +
      Object.keys(json).map(function (key) {
        return encodeURIComponent(key) + '=' +
          encodeURIComponent(json[key]);
      }).join('&');
  }

  onAdjustmentTypeChange(e) {
    this.adjustment_type = e === 'percentage' || e === 'fixed' ? e : null;
    if (this.adjustment_type) {
      if (e === 'percentage') {
        this.place_data = '%';
      } else if (e === 'fixed') {
        this.place_data = this?.accuracyPipe?.transform(null, null, { currencyCode: this.currency,  display: 'symbol' });
      }
      this.jobEstimateForm.patchValue({
        adjustment_type: this.adjustment_type,
        adjustment_value: null,
        adjustment_amount: null
      });
      this.getResourceBudget();
    }
  }

  onRateTypeChange(e) {
    this.dataLoading = true;
    if (e && e?.unit_of_measure) {
      let rate_type = '';
      if (e && e?.unit_of_measure === 'hourly') {
        rate_type = 'per_hour'
      } else if (e && e?.unit_of_measure === 'daily') {
        rate_type = 'per_day'
      } else if (e && e?.unit_of_measure === 'monthly') {
        rate_type = 'per_month';
      } else if (e && e?.unit_of_measure === 'weekly') {
        rate_type = 'per_week'
      } else if (e && e?.unit_of_measure === 'yearly') {
        rate_type = 'per_year'
      }
      this.jobEstimateForm.patchValue({ rate_type: rate_type });
    }
    //  if(e?.unit_of_measure) {
    //    this.rateType = e?.unit_of_measure;
    //  }
    // this.jobEstimateForm.controls['adjustment_value'].setValue(0);
    this.getResourceBudget();
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

  addAccuracy() {
    const accuracyType = this.adjustment_type=='percentage' ? 'amount_percentage' : 'amount';
    const value = this?.accuracyPipe?.transform(this.jobEstimateForm.get('adjustment_value').value, accuracyType, { isEdit: true });
    this.jobEstimateForm.patchValue({
      adjustment_value: value
    })
  }

  /*
    hours - no. of hours in the 'working_hours'
    days - no. of days in the 'working_days'
    weeks - no. of weeks in the 'formatted_working_days' +
            (no. of days in the 'formatted_working_days' / no. of days in the 'week_working_days')
    months - yet to be calculated
    years - yet to be calculated
  */
  getWorkingUnits() {
    switch (this.jobEstimateForm?.get('rate_type')?.value) {
      case 'per_hour':
        if (this.jobEstimateForm?.get('working_hours')?.value)
          return this.accuracyPipe?.transform(this.jobEstimateForm?.get('working_hours')?.value, 'hour') + ' Hours';
        return '--';
      case 'per_day':
        if (this.jobEstimateForm?.get('working_days')?.value)
          return this.accuracyPipe?.transform(this.jobEstimateForm?.get('working_days')?.value, 'hour') + ' Days';
        return '--';
      case 'per_week':
        const weeks =
          +this.jobEstimateForm.get('formatted_working_days').value.toString().split(' ')[0] +
          +this.jobEstimateForm.get('formatted_working_days').value.toString().split(' ')[2] /
            +this.jobEstimateForm.get('week_working_days').value;
        if (weeks) return this.accuracyPipe.transform(weeks ?? 0, 'hour', { view_accurate: true }) + ' Weeks';
        return '--';
      case 'per_month':
        const months =
          (+this.jobEstimateForm.get('formatted_working_days').value.toString().split(' ')[0] * 7 +
            +this.jobEstimateForm.get('formatted_working_days').value.toString().split(' ')[2]) /
          30;
        if (months)
          return this.accuracyPipe.transform(months, 'hour', { view_accurate: true }) + ' Months';
        return '--';
      case 'per_year':
        const years = 0;
        if (years) 
          return this.accuracyPipe.transform(years, 'hour', { view_accurate: true }) + ' Years';
        return '--';
      default:
        return '--'
    }
  }
}
