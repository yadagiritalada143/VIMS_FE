import { Component, EventEmitter, Input, OnChanges, OnInit, Output } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { JobDetailsService } from '../../job-details.service';
import { StorageKeys, StorageService } from '../../../../core/services/storage.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';

@Component({
  selector: 'app-update-submision-limit-popup',
  templateUrl: './update-submision-limit-popup.component.html',
  styleUrls: ['./update-submision-limit-popup.component.scss'],
})
export class UpdateSubmisionLimitPopupComponent implements OnInit, OnChanges {
  @Input() is_show = false;
  @Input() vmsData: any;

  submissionLimitForm: UntypedFormGroup;
  currentProgram: any;
  showError: boolean = false;

  @Output() onClose = new EventEmitter();

  constructor(
    private fb: UntypedFormBuilder,
    private jobDetailsService: JobDetailsService,
    private storageService: StorageService,
    private _alert: AlertService,
  ) {}

  ngOnInit(): void {
    this.currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.submissionLimitForm = this.fb.group({
      submission_limit: [null, [Validators.required,Validators.min(0)]],
      vendor_id: [null, Validators.required],
    });
  }

  ngOnChanges() {
    if (this?.vmsData) {
      this.submissionLimitForm?.get('submission_limit').setValue(this.vmsData?.submission_limit);
      this.submissionLimitForm?.get('vendor_id').setValue(this.vmsData?.vendor?.id);
    }
  }

  close(reload = false) {
    this.is_show = false;
    this.onClose.emit({ reload });
  }

  private markFormGroupTouched(formGroup: UntypedFormGroup) {
    (Object as any).values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control.controls) {
        this.markFormGroupTouched(control);
      }
    });
  }

  validateInput(event) {
    this.showError = +event?.target?.value === this.vmsData?.submission_limit;
  }

  onSave() {
    this.markFormGroupTouched(this.submissionLimitForm);
    if (this.submissionLimitForm.invalid) {
      return;
    }
    this.showError = this.submissionLimitForm?.value?.submission_limit === this.vmsData?.submission_limit;
    if (!this.showError) {
      this.jobDetailsService.changeSubmissionLimit(this.currentProgram.id, this.vmsData.job_id, this.submissionLimitForm.value).subscribe(
        data => {
          if (data) {
            this._alert.success(
              `Submission Limit has been set to ${this.submissionLimitForm?.value?.submission_limit} for ${this.vmsData?.vendor?.name}.`,
            );
            this.close(true);
          }
        },
        error => {
          console.error(error);
          this._alert.error(
            `Unable to set the limit to ${this.submissionLimitForm?.value?.submission_limit} for ${this.vmsData?.vendor?.name}.`,
          );
        },
      );
    }
  }
}
