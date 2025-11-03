import { Component, Injector, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, Validators } from '@angular/forms';
import { BaseProgramConfigComponent } from '../base/base-program-config.component';
import { ControlType } from '../program-config-control/program-config-control.model';
import * as _ from 'lodash';

@Component({
  selector: 'app-time-sheet-and-expense',
  templateUrl: './time-sheet-and-expense.component.html',
  styleUrls: ['./time-sheet-and-expense.component.scss']
})
export class TimeSheetAndExpenseComponent extends BaseProgramConfigComponent implements OnInit {

  public mounted: boolean = false;
  constructor(private fb: UntypedFormBuilder, protected injector: Injector) {
    super(injector);
  }

  ngOnInit(): void {
    this.createForm();
  }

  setProgramConfig = () => {
    if(!this.mounted) {
      this.mounted = true;
      this.patchValue(_.cloneDeep(this.data?.value));
    }
    this.data.value = this.formGroup.value;
  }

  createForm() {
    this.formGroup = this.fb.group({
      'multiple_approval_timesheet_expense': new UntypedFormControl(false, Validators.required),
      'bulk_timesheet_approval': new UntypedFormControl(false, Validators.required),
      'bulk_general_expense_approval': new UntypedFormControl(false, Validators.required),
      'bulk_misc_expense_approval': new UntypedFormControl(false, Validators.required)
    });
  }

  patchValue(data: any) {
    if(data) {
      let multiple_approval_timesheet_expense: boolean = data?.multiple_approval_timesheet_expense || false;
      let bulk_timesheet_approval: boolean = data?.bulk_timesheet_approval || false;
      let bulk_general_expense_approval: boolean = data?.bulk_general_expense_approval || false;
      let bulk_misc_expense_approval: boolean = data?.bulk_misc_expense_approval || false;
      this.formGroup.patchValue({
        multiple_approval_timesheet_expense,
        bulk_timesheet_approval,
        bulk_general_expense_approval,
        bulk_misc_expense_approval
      });
    }
  }

  get ControlType() {
    return ControlType;
  }
}
