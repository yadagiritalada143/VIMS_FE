import { Component, OnInit } from '@angular/core';
import { accuracyConfig, scaling_type } from '../accuracy.config';
import { StorageService, StorageKeys } from 'src/app/core/services/storage.service';
import { Router } from '@angular/router';
import { ProgramSetupService } from 'src/app/program-setup/program-setup.service';
import { SnakeToTitleCasePipe } from 'src/app/shared/pipe/snake-to-title-case.pipe';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { Log, LOG_TYPE } from 'src/app/library/logs/logs.model';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { AccuracyPipe } from 'src/app/shared/pipe/accuracy.pipe';
import { UntypedFormControl, UntypedFormGroup, UntypedFormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-edit-accuracy',
  templateUrl: './edit-accuracy.component.html',
  styleUrls: ['./edit-accuracy.component.scss'],
})
export class EditAccuracyComponent implements OnInit {
  public accuracyData: any;
  propertyNames: string[] = [
    'rate',
    'markup',
    'markup_percentage',
    'fee',
    'fee_percentage',
    'amount',
    'amount_percentage',
    'tax',
    'tax_percentage',
    'adjustment',
    'hour',
  ];
  items: string[] = ['Round Up', 'Round Down', 'Truncate'];
  // Private Variables
  private program: any;
  private method: string = 'post';
  private accuracyConfigURL: string;
  private updateAccuracyConfigLocalStorage: boolean = false;

  // Public variables
  public accuracyConfigStatus: boolean = false;
  public accuracyConfig: any;
  public scalingType: any;
  public isEditMode: boolean = true;
  public btnTxt: string = 'Save';
  public enableSave: boolean = false;
  public logs: Log = undefined;
  public openTryModal: boolean = false;
  public scaleExample: any = {
    type: null,
    scale: null,
    threshold: null,
    input: null,
    result: null,
  };
  public scaleLimitError: boolean = false;
  public scaleThresholdError: boolean = false;
  public scaleLimitErrorMessage: string = 'Scaling Limit should be within 0 - 8';
  public scaleThresholdErrorMessage: string = 'Scaling Threshold should be within 0 - 9';
  public accuracyForm: UntypedFormGroup;
  public accdata: any;
  public isAccuracyAvailable: boolean = false;
  constructor(
    private storageService: StorageService,
    private router: Router,
    private fb: UntypedFormBuilder,
    private service: ProgramSetupService,
    private snakeCase: SnakeToTitleCasePipe,
    private alertService: AlertService,
    private loader: LoaderService,
    private accuracyPipe: AccuracyPipe,
  ) // private fb: FormBuilder,
  {
    this.loader.show();
    this.accuracyConfig = accuracyConfig;
    this.scalingType = scaling_type;
    this.intialScopeSetup();
    this.accuracyForm = this.fb.group({});
  }

  intialScopeSetup(): void {
    this.accuracyConfig.forEach(config => {
      config.scopes.forEach(scope => {
        this[scope] = {
          precision_type: this.accuracyData ? this.accuracyData?.[scope]?.precision_type : null,
          scale: this.accuracyData ? this.accuracyData?.[scope]?.scale : null,
          threshold: this.accuracyData ? this.accuracyData?.[scope]?.threshold : null,
          validData: false,
        };
      });
    });
  }

  ngOnInit(): void {
    this.program = this.storageService.get(StorageKeys?.CURRENT_PROGRAM) || null;
    this.isAccuracyAvailable = this.program?.config?.accuracy_config || false;
    if (!this.isAccuracyAvailable) {
      this.alertService.error('Accuracy configuration is currently disabled for this program');
      this.router.navigate(['self-configuration/configuration/accuracy-configuration']);
    }
    this.accuracyConfigURL = `/configurator/programs/${this.program?.id}/accuracy-config`;
    this.accuracyConfigStatus = this.storageService.get(StorageKeys.CURRENT_PROGRAM)?.config?.accuracy_config;
    this.getAccuracyData();
    this.initFormControl();
  }

  getAccuracyData(): void {
    if (this.accuracyConfigStatus) {
      if (!this.program?.id) return;
      this.service.get(this.accuracyConfigURL).subscribe({
        next: (data: any) => {
          if (data?.total_records && data?.config_data?.length) {
            this.method = 'put';
            this.btnTxt = 'Update';
            this.accuracyData = data?.config_data[0];
            this.accdata = this.accuracyData;
            if (this.updateAccuracyConfigLocalStorage) this.storageService.set(StorageKeys.ACCURACY_CONFIG, data?.config_data[0], true);
            this.intialScopeSetup();
            this.initFormControl();
            this.buildFormControl();
            this.validateData();
          }
          this.loader.hide();
        },
        error: (err: Error | any) => {
          this.showError(err);
          this.loader.hide();
        },
      });
    } else {
      this.loader.hide();
    }
  }

  changePrecisionType(scope: string): void {
    if (scope && this[scope]?.precision_type?.toLowerCase() === 'truncate') 
    {
        this[scope].threshold = null;
        this.accuracyForm.get(scope)?.get('threshold').disable();
    }
    else{
       this.accuracyForm.get(scope)?.get('threshold').enable();
    }  
    this.validateData();
  }

  changeInput(scope: string, inputType: string, maxLimit: number): void {
    if (this[scope][inputType]) {
      this[scope][inputType] = +this[scope]?.[inputType]?.toString()?.replace('-', '')?.replace('.', '');
      if (this[scope][inputType] > maxLimit) {
        this[scope][inputType] = parseInt(this[scope]?.[inputType].toString()?.substring(0, 1));
        if (this[scope][inputType] > maxLimit) this[scope][inputType] = null;
      }
    }
    this.validateData();
  }

  validateData(): void {
    let isDataValid = true;
    this.accuracyConfig.forEach(config => {
      config.scopes.forEach(scope => {
        if (
          !this[scope]?.precision_type ||
          this[scope]?.scale === null ||
          this[scope]?.scale === undefined ||
          (this[scope]?.precision_type?.toLowerCase() !== 'truncate' &&
            (this[scope]?.threshold === null || this[scope]?.threshold === undefined))
        ) {
          isDataValid = false;
          this[scope].validData = false;
          this.validateConfig(scope, false);
        } else {
          this[scope].validData = true;
          this.validateConfig(scope, true);
        }
      });
    });
    this.enableSave = isDataValid;
  }

  validateConfig(scope: string, isValid: boolean): void {
    const configScope = this.accuracyConfig.find(x => x.main_scope === scope && x.scopes.length === 1);
    if (configScope) {
      configScope['validData'] = isValid;
    }
  }

  saveConfiguration(): void {
    this.loader.show();
    const scopes = [];
    this.accuracyConfig.forEach(config => {
      config.scopes.forEach(scope => {
        const scopeData = {
          scope: scope,
          name: `${this.program?.name} ${this.snakeCase?.transform(scope)} Accuracy`,
          precision_type: this[scope].precision_type,
          scale: this[scope].scale,
          threshold: this[scope].precision_type && this[scope].precision_type?.toLowerCase() === 'truncate' ? null : this[scope].threshold,
        };
        scopes.push(scopeData);
      });
    });
    const payload = {
      max_precision: +this.accuracyData?.max_precision || 15,
      scopes: [...scopes],
    };
    this.service[this.method](this.accuracyConfigURL, payload).subscribe({
      next: (data: any) => {
        if (data) {
          this.updateAccuracyConfigLocalStorage = true;
          this.alertService.success(`Accuracy Configuration Records has been ${(this.method = 'post' ? 'Saved' : 'Updated')}`);
          this.backClicked();
        }
      },
      error: (err: Error | any) => {
        this.showError(err);
        this.loader.hide();
      },
    });
  }

  showError(err: any): void {
    window.scrollTo(0, 0);
    this.logs = {
      type: LOG_TYPE.ERROR,
      heading: err?.error?.error?.message ? err?.error?.error?.message : typeof err == 'string' ? err : '',
      messages: [],
      autoClose: true,
      isShown: true,
      showReportButton: err?.status == 500 || err?.status == 400,
      additionalInfo: { trace_id: err?.error?.trace_id },
    };
    err?.error?.error?.errors?.forEach(msg => {
      if (msg?.message) {
        this.logs.messages.push(msg?.message);
      }
    });
  }

  toggleTryModal(): void {
    this.openTryModal = !this.openTryModal;
    if (this.openTryModal) {
      this.scaleExample = {
        type: null,
        scale: null,
        threshold: null,
        input: null,
        result: null,
      };
    }
  }

  tryInputChange(): void {
    this.scaleLimitError = this.scaleThresholdError = false;
    if (!(this.scaleExample?.scale >= 0 && this.scaleExample?.scale < 9)) {
      this.scaleLimitError = true;
      if (this.scaleExample?.type !== 'truncate' && !(this.scaleExample?.threshold >= 0 && this.scaleExample?.threshold <= 9)) {
        this.scaleThresholdError = true;
      }
      this.scaleExample.result = null;
    } else if (this.scaleExample?.type !== 'truncate' && !(this.scaleExample?.threshold >= 0 && this.scaleExample?.threshold <= 9)) {
      this.scaleThresholdError = true;
      this.scaleExample.result = null;
    } else if (
      this.scaleExample?.input &&
      this.scaleExample?.type &&
      this.scaleExample?.scale >= 0 &&
      this.scaleExample?.scale <= 9 &&
      (this.scaleExample?.type === 'truncate' || (this.scaleExample?.threshold >= 0 && this.scaleExample?.threshold <= 9))
    ) {
      this.scaleExample.result = this.accuracyPipe.roundByType(
        this.scaleExample?.input,
        this.scaleExample?.type,
        this.scaleExample?.scale,
        this.scaleExample?.threshold || null, // if threshold is 0 then it will not work
        true, // isFunction true to use roundByType function directly
      );
    } else {
      this.scaleExample.result = null;
    }
  }

  getLabel(scope: string): string {
    return scope?.replace('_percentage', '');
  }

  backClicked() {
    this.router.navigate(['self-configuration/configuration/accuracy-configuration']);
  }

  initFormControl() {
    this.propertyNames.forEach(propertyName => {
      this.accuracyForm.addControl(
        propertyName,
        this.fb.group({
          precisiontype: new UntypedFormControl(null, [Validators.required]),
          scale: new UntypedFormControl('', [Validators.required]),
          threshold: new UntypedFormControl({ value: '', disabled: false }, [Validators.required]),
        }),
      );
    });
  }

  buildFormControl() {
    this.accuracyConfig.forEach(config => {
      config.scopes.forEach(scope => {
        const nestedFormGroup = this.accuracyForm.get(scope) as UntypedFormGroup;
        nestedFormGroup.patchValue({
          precisiontype: this[scope]?.precision_type || '',
          scale: this[scope]?.scale || '',
          threshold: this[scope]?.threshold || '',
        });
      });
    });
  }
}
