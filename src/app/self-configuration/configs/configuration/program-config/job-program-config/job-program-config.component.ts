import { Component, Injector, OnInit } from '@angular/core';
import { AbstractControl, UntypedFormBuilder,  Validators } from '@angular/forms';
import { BaseProgramConfigComponent } from '../base/base-program-config.component';
import { ControlType, IProgramConfigurationControl } from '../program-config-control/program-config-control.model';
import * as _ from 'lodash';

@Component({
  selector: 'app-job-program-config',
  templateUrl: './job-program-config.component.html',
  styleUrls: ['./job-program-config.component.scss'],
})
export class JobProgramConfigComponent extends BaseProgramConfigComponent implements OnInit {
  public toggle: boolean = false;
  public programControls: Array<IProgramConfigurationControl> = [];
  public jobBudgetRates: Array<{ code: string; description: string }> = [
    { code: 'max_budget', description: 'Max Rate' },
    { code: 'average_budget', description: 'Average Rate' },
  ];
  public mounted: boolean = false;
  public additionAmountType: Array<{ code: string; description: string }> = [
    { code: 'percentage', description: 'Percentage' },
    { code: 'fixed', description: 'Flat Amount' },
  ];

  // public jobDurationOptions: Array <{ code: string; name: string }> = [
  //   { code: 'DAYS', name: 'Days' },
  //   { code: 'MONTHS', name: 'Months' },
  //   { code: 'YEARS', name: 'Years' }
  // ];

  constructor(private fb: UntypedFormBuilder, protected injector: Injector) {
    super(injector);
  }

  ngOnInit(): void {
    this.createForm();
  }

  get ControlType() {
    return ControlType;
  }

  createForm = () => {
    this.formGroup = this.fb.group({
      hours_per_day: [8, [Validators.min(0.5), Validators.max(24), Validators.required]],
      is_work_location_read_only: [false, [Validators.required]],
      job_description: this.fb.group({
        attachment: [false, [Validators.required]],
        required: [false, [Validators.required]],
        attachment_mandate: [false, [Validators.required]],
      }),
      allow_equal_min_max_rate: [false, [Validators.required]],
      job_budget_calculation: [null],
      week_working_days: [5, [Validators.min(1), Validators.max(7), Validators.required]],
      adjustment_type: ['percentage', [Validators.required]],
      enable_auto_opt_in: [true, [Validators.required]],
      allow_pre_identified_candidates: [true, [Validators.required]],
      allow_independent_hm_selection: [false, [Validators.required]],
      // maximum_job_duration: this.fb.group({
      //   value: [null],
      //   count: new FormControl(null),
      //   duration: new FormControl(null)
      // })
    });
    this.formGroup.get('job_description').valueChanges.subscribe(value => {
      if (!value.attachment)
        this.formGroup?.get('job_description')?.patchValue({
          attachment_mandate: false,
        });
    });
  };

  setProgramConfig = () => {
    if (!this.mounted) {
      this.mounted = true;
      this.patchValue(_.cloneDeep(this.data?.value));
    }
    this.data.value = this.formGroup.value;
  };

  patchValue(data: any) {
    if (data) {
      const is_work_location_read_only: boolean = data?.is_work_location_read_only ?? false;
      const required: boolean = data?.job?.job_description?.required ?? false;
      const attachment: boolean = data?.job?.job_description?.attachment ?? false;
      const attachment_mandate: boolean = data?.job?.job_description?.attachment_mandate ?? false;
      const allow_equal_min_max_rate: boolean = data?.job?.allow_equal_min_max_rate ?? false;
      const job_budget_calculation: boolean = data?.job?.job_budget_calculation ?? null;
      const hours_per_day: boolean = data?.job?.hours_per_day ?? 8;
      const week_working_days: boolean = data?.job?.week_working_days ?? 5;
      const adjustment_type: boolean = data?.job?.adjustment_type ?? 'percentage';
      const enable_auto_opt_in: boolean = data?.job?.enable_auto_opt_in ?? true;
      const allow_pre_identified_candidates: boolean = data?.job?.allow_pre_identified_candidates ?? true;
      // const value: boolean = data?.max_job_duration ? data?.max_job_duration : false;
      // const count: any = data?.consecutive_employment_span ?? 0;
      // let duration: any = data?.consecutive_employment_span_unit ? this.jobService.toTitleCase(data?.consecutive_employment_span_unit) : "";
      let allow_independent_hm_selection: any = data?.job?.allow_independent_hm_selection ?? false;

      // if count goes below 0, Then duration won't be populeted
      // if(count < 0) {
      //   duration = ''
      // }

      this.formGroup.patchValue({
        is_work_location_read_only,
        allow_equal_min_max_rate,
        job_budget_calculation,
        hours_per_day,
        week_working_days,
        adjustment_type,
        enable_auto_opt_in,
        allow_pre_identified_candidates,
        allow_independent_hm_selection
      });

      let job_description: AbstractControl = this.formGroup?.get('job_description');
      // let maximum_job_duration: AbstractControl = this.formGroup?.get('maximum_job_duration');
      job_description?.patchValue({
        required,
        attachment,
        attachment_mandate,
      });
      // maximum_job_duration?.patchValue({
      //   value,
      //   count,
      //   duration,
      // });
    }
  }

  // get jobDuration() {
  //   return this.formGroup?.get('maximum_job_duration.duration')?.value;
  // }

  // set jobDuration(data: any) {
  //   this.formGroup?.get('maximum_job_duration.duration')?.setValue(data);
  // }
}
