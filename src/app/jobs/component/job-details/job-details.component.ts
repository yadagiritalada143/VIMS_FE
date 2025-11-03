import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { JobService } from '../../job.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { StorageKeys, StorageService } from '../../../core/services/storage.service';
import { UserService } from '../../../core/services/user.service';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';

@Component({
  selector: 'app-job-details',
  templateUrl: './job-details.component.html',
  styleUrls: ['./job-details.component.scss']
})
export class JobDetailsComponent implements OnInit {
  @Output() onClose = new EventEmitter();
  @Output() onSubmit = new EventEmitter();
  @Input() jobData;
  showEstimate: boolean = false;
  _foundationTypelist: any[] = [];
  public approvalList = [];

  jobFormGroup = this.fb.group({
    num_resources: [1, [Validators.required]],
    hours_per_day: [8, [Validators.required]],
    week_working_days: [5, [Validators.required]],
    formatted_working_days: [null, [Validators.required]],
    working_hours: [null, [Validators.required]],
    adjustment_type: ['percentage'],
    rate_type: ['per_hour'],//per_hour / per_day
    single_initial_budget: [null, [Validators.required]],
    single_net_budget: [null, [Validators.required]],
    additional_amount: [0, [Validators.required]],
    single_gross_budget: [null, [Validators.required]],
    adjustment_value: [0, [Validators.required]],
    net_budget: [null, [Validators.required]],
    job_manager: [null, []],
    allow_expense: [true, []],
    foundational: this.fb.group({}),
    min_bill_rate: ['', [Validators.required]],
    max_bill_rate: ['', [Validators.required]],
    respond_by_date: ['', [Validators.required]],
    note_for_approver: [''],

  });
  firstFoundationalType: any;
  @Input() set foundationTypeList(data: any[]) {

    if (data && data.length > 0) {
      data.forEach(element => {
        const isRequired = element?.configuration?.module_jobs === '"REQUIRED"';
        const group = this.jobFormGroup.get('foundational') as UntypedFormGroup;
        group.addControl(element.code, new UntypedFormControl(null, isRequired ? [Validators.required] : []));
      });
      this.firstFoundationalType = data[0];
      this._foundationTypelist = this.chunkArray(data, 2);
    }
  }


  backToQualification() {
    this.onClose.emit({ type: 'saveQualification', value: 2 });
  }

  /* onChanges(): void {
    this.jobFormGroup.get('hours_per_day').valueChanges.subscribe(val => {
      this.getWorkingHoursEstimate();
    });
    this.jobFormGroup.get('week_working_days').valueChanges.subscribe(val => {
      this.getWorkingHoursEstimate();
    });
  } */

  managerList: any[] = [];

  public status;
  public toggle = {
    title: 'Allow Expense',
    value: true
  };
  public toggleDisable = {
    value: true
  };
  clientId;
  programId: string = '';
  pageNo = 1;
  public basicJobInfo: any = {};
  public jobDetails: UntypedFormGroup;
  public currentProgram;
  constructor(
    private alertService: AlertService,
    public router: Router,
    private fb: UntypedFormBuilder,
    public userService: UserService,
    private localStorage: StorageService,
    public datePipe: LocalDateFormatPipe,
    public jobService: JobService) { }

  ngOnInit(): void {
    // let programid = this.localStorage.get(ProgramConfig[0]);
    // programid = JSON.parse(programid);
    // if (programid) {
    //   this.clientId = programid['clientId'];
    //   this.programId = programid['program_req_id'];
    // }
    // this.programId = '19106c90-e1f5-4016-b7bf-3cdf24a2b183';
    const program = {
      id: '19106c90-e1f5-4016-b7bf-3cdf24a2b183'
    };
    this.currentProgram = this.localStorage.get(StorageKeys.CURRENT_PROGRAM) || program;
    this.programId = this.currentProgram?.id || program?.id



    if (this.jobData?.basicInfo) {

      if (this.jobData?.basicInfo?.min_bill_rate) {

        this.jobFormGroup.patchValue({
          min_bill_rate: this.jobData?.basicInfo?.min_bill_rate
        });
      }
      if (this.jobData?.basicInfo?.max_bill_rate) {
        this.jobFormGroup.patchValue({
          max_bill_rate: this.jobData?.basicInfo?.max_bill_rate,
        });
      }
    }


    // this.getRateCardProgramConfigurator();
    // this.getWorkingHoursEstimate();
    // this.getApprovalList();


    this.init();
  }

  get foundationTypeList() {
    return this._foundationTypelist;
  }

  get foundationlGroupForm() {
    return this.jobFormGroup.get('foundational') as UntypedFormGroup;
  }


  get jobFormControl() {
    return this.jobFormGroup.controls;
  }

  makeFoundationDataType(event, code) {

  }

  getRateCardProgramConfigurator() {

    this.jobService.get(`/configurator/programs/${this.programId}/config?entity_code=rate_card`).subscribe((data: any) => {
      if (data && data.config) {
        this.jobFormGroup.patchValue(data.config);
        if (data.config.days_per_week) {
          this.jobFormGroup.get('week_working_days').setValue(data.config.days_per_week);
        }
        this.getWorkingHoursEstimate(undefined);
      }
    });
  }

  validateInput() {
    let request = this.jobFormGroup.value;
    if (request.week_working_days < 0 || request.week_working_days > 7) {
      this.showValidationError('Please provide valid working days');
      return false;
    } else if (request.hours_per_day < 0 || request.hours_per_day > 24) {
      this.showValidationError('Please provide valid hours');
      return false;
    } else if (request.adjustment_value < 0) {
      this.showValidationError('Please provide valid adjustment value');
      return false;
    } else if (request.additional_amount < 0) {
      this.showValidationError('Please provide valid additional amount');
      return false;
    } else {
      return true;
    }
  }

  async getWorkingHoursEstimate(field) {
    const isValidData = await this.validateInput();
    if (isValidData) {
      const week_working_days = this.jobFormGroup.get('week_working_days').value;
      const hours_per_day = this.jobFormGroup.get('hours_per_day').value;
      var start_date: any = new Date();
      

      start_date =this.datePipe.transform(start_date, "yyyy-MM-dd");
      var end_date: any = new Date();
      end_date.setDate(end_date.getDate() + 10);
     
      end_date =this.datePipe.transform(end_date, "yyyy-MM-dd");
      this.jobService.get(`/core-money/programs/${this.programId}/working-hours-estimate?week_working_days=${week_working_days}&hours_per_day=${hours_per_day}&start_date=${start_date}&end_date=${end_date}`).subscribe((data: any) => {
        if (data && data.data) {
          this.jobFormGroup.patchValue(data.data);
          this.getResourceBudget();
        }
      });
    }
  }

  showValidationError(message) {
    this.alertService.error(message);
  }

  async getResourceBudget() {
    const isValidData = await this.validateInput();
    if (isValidData) {
      let request = this.jobFormGroup.value;
      delete request['foundational'];
      request.total_hours = request.working_hours;
      request.rate = this.jobFormGroup.get('max_bill_rate').value || '0';
      var start_date: any = new Date();
      request.start_date = this.getFormattedDate(start_date);
      var end_date: any = new Date();
      end_date.setDate(end_date.getDate() + 10);
      request.end_date = this.getFormattedDate(end_date);
      const requestParam = this.jsonToQueryString(request);
      this.jobService.get(`/core-money/programs/${this.programId}/resource-budget${requestParam}`).subscribe((data: any) => {
        if (data && data.data) {
          this.jobFormGroup.patchValue(data.data);
        }
      });
    }
  }

  jsonToQueryString(json) {
    return '?' +
      Object.keys(json).map(function (key) {
        return encodeURIComponent(key) + '=' +
          encodeURIComponent(json[key]);
      }).join('&');
  }

  getFormattedDate(date) {
    if (date) {
      return this.datePipe.transform(date);
    }
  }

  chunkArray(array, size) {
    const result = [];
    for (let i = 1; i < array.length; i += size) {
      const chunk = array.slice(i, i + size);
      if (chunk.length < size) {
        chunk.push({ hidden: true });
      }
      result.push(chunk);
    }
    return result;
  }

  async init() {
    this.managerList = await this.getManagerList(null, false).toPromise();
    if (this.managerList.length > 0) {
      this.jobFormGroup.patchValue({
        job_manager: this.managerList[0]
      });
    }
    this.getRateCardProgramConfigurator();
    this.getWorkingHoursEstimate(undefined);
    this.getApprovalList();
    this.patchData();
  }

  changeManager(event) {
    this.getApprovalList();
  }

  getManagerList(term, reset = false) {
    if (reset) {
      this.pageNo = 1;
    }

    return this.userService.get(`/configurator/programs/${this.programId}/members?org_category=CLIENT&info_level=basic`)
      .pipe(
        map((res: any) => res.members.map(mem => {
          return {
            id: mem.id,
            first_name: mem.first_name,
            last_name: mem.last_name,
            email: mem.email
          }
        }))
      );
  }

  onClickToggleDisable() {
    if (this.toggleDisable.value) {
      this.toggleDisable.value = false;
    } else {
      this.toggleDisable.value = true;
    }
  }

  onClickToggle() {
    this.jobFormGroup.patchValue({
      allow_expense: !this.jobFormControl.allow_expense.value
    });
  }

  submitJobDetails() {
    if (this.jobFormGroup.value.min_bill_rate && this.jobFormGroup.value.max_bill_rate && (this.jobFormGroup.value.min_bill_rate) < (this.jobFormGroup.value.max_bill_rate)) {
    } else {
      this.alertService.error(`Please select max bill rate greater than min bill rate`);
      return;
    }
    this.jobFormGroup.value.approverList = this.approvalList;
    const jobDetails = this.jobFormGroup.value;
    this.onSubmit.emit({ type: 'jobInfo', data: jobDetails });
    this.onClose.emit({ type: 'jobDetails', value: 4 });
  }

  getApprovalList() {
    if (this.jobFormGroup.value.min_bill_rate && this.jobFormGroup.value.max_bill_rate && (this.jobFormGroup.value.min_bill_rate) < (this.jobFormGroup.value.max_bill_rate)) {
    } else {
      this.alertService.error(`Please select max bill rate greater than min bill rate`);
      return;
    }
    let logUser;
    logUser = this.localStorage.get('user');

    let payLoad = {
      module: "job",
      data: {
        program_id: this.programId,
        job_manager: this.jobFormControl.job_manager.value,

        min_bill_rate: Number(this.jobFormGroup.get('min_bill_rate')?.value),
        max_bill_rate: Number(this.jobFormGroup.get('max_bill_rate')?.value),
        created_by: {
          id: logUser?.id,
          first_name: logUser?.first_name,
          last_name: logUser?.last_name,
          email: logUser?.email
        }
      }
    }
    this.jobService.post('/approval/approvers-list', payLoad).subscribe({
      next: (data: any) => {
      this.approvalList = data.approvers_list;
      this.approvalList.map(data => {
        data.value = true
      })
    },
      error: (error) => {
        this.approvalList = new Array();
      }});
  }
  changeToggleValue(data, index) {
    this.approvalList[index].value = !this.approvalList[index].value;

  }
  patchData() {
    if (this.jobData && this.jobData.hasOwnProperty('jobInfo')) {

      this.jobFormGroup.patchValue(this.jobData['jobInfo']);
      if (this.jobData['jobInfo'].job_manager) {
        this.jobFormGroup.patchValue({ job_manager: this.jobData['jobInfo'].job_manager });
      }
    }
  }
}
