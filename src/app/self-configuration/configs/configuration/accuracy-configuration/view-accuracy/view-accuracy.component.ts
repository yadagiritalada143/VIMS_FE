import { Component, OnInit } from '@angular/core';
import { StorageService, StorageKeys } from 'src/app/core/services/storage.service';
import { Router } from '@angular/router';
import { ProgramSetupService } from 'src/app/program-setup/program-setup.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { CommonViewConfig, CommonViewDetail } from 'src/app/shared/components/common-view-rule-flow/common-view-rule-flow.component';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { accuracyConfig, scaling_type } from '../accuracy.config';
import { SnakeToTitleCasePipe } from 'src/app/shared/pipe/snake-to-title-case.pipe';
import { AccountService } from 'src/app/auth/account-setup/account.service';

@Component({
  selector: 'app-view-accuracy',
  templateUrl: './view-accuracy.component.html',
  styleUrls: ['./view-accuracy.component.scss'],
})
export class ViewAccuracyComponent implements OnInit {
  // Private Variables
  private program: any;

  // Public Variables
  public isAccuracyAvailable: boolean = false;
  public accuracyData: any;
  public viewConfig: Array<CommonViewDetail> = [];

  // Component Variables
  updated_by: string;
  updated_on: string;

  constructor(
    private storageService: StorageService,
    private router: Router,
    private service: ProgramSetupService,
    private loader: LoaderService,
    private alert: AlertService,
    private snakeToTitleCase: SnakeToTitleCasePipe,
    private accountService: AccountService,
  ) {
    this.loader.show();
  }

  ngOnInit(): void {
    this.program = this.storageService.get(StorageKeys?.CURRENT_PROGRAM) || null;
    this.isAccuracyAvailable = this.program?.config?.accuracy_config || false;
    this.initViewConfig();
    if (this.isAccuracyAvailable) {
      this.getAccuracyData();
    } else {
      this.loader.hide();
    }
  }

  getAccuracyData(): void {
    if (!this.program?.id) return;
    this.service.get(`/configurator/programs/${this.program?.id}/accuracy-config`).subscribe({
      next: (data: any) => {
        if (data?.total_records && data?.config_data?.length) {
          this.accuracyData = data?.config_data?.[0];
          this.storageService.set(StorageKeys.ACCURACY_CONFIG, data?.config_data?.[0], true);
          this.viewConfig = [];
          this.initViewConfig();
          this.loadUserDetails(this.accuracyData?.modified_by);
          this.updated_on = this.accuracyData?.modified_on;
        } else {
          this.loader.hide();
        }
      },
      error: (err: Error | any) => {
        this.loader.hide();
        this.alert.error(err?.error?.error?.message || err?.message);
      },
    });
  }

  editAccuracy(): void {
    this.router.navigate(['self-configuration/configuration/accuracy-configuration/edit']);
  }

  initViewConfig(): void {
    accuracyConfig?.forEach(elem => {
      this.viewConfig.push({
        label: elem?.main_scope_label ? this.snakeToTitleCase.transform(elem?.main_scope_label) : '',
        value: elem?.main_scope,
        displayType: CommonViewConfig.HEADER,
      });
      elem?.scopes?.forEach(el => {
        this.viewConfig.push({
          label: this.displayLabel(el, elem?.scopes?.length) + (el === 'adjustment' ? ' (Fixed)' : ''),
          value: el,
          displayType: CommonViewConfig.SUB_HEADING,
        });
        this.viewConfig.push({
          label: 'Scaling Type',
          value: (this.accuracyData?.[el]?.precision_type === scaling_type[0].value
            ? scaling_type[0].name
            : this.accuracyData?.[el]?.precision_type === scaling_type[1].value
            ? scaling_type[1].name
            : this.accuracyData?.[el]?.precision_type === scaling_type[2].value
            ? scaling_type[2].name
            : '--'
          )?.toUpperCase(),
          displayType: CommonViewConfig.TEXT,
        });
        this.viewConfig.push({
          label: 'Scaling Limit',
          value: this.accuracyData?.[el]?.scale || '--',
          displayType: CommonViewConfig.TEXT,
        });
        this.viewConfig.push({
          label: 'Scaling Threshold',
          value: this.accuracyData?.[el]?.threshold || '--',
          displayType: CommonViewConfig.TEXT,
        });
      });
    });
  }

  displayLabel(input: string, scope_length: number): string {
    input = input === 'hour' ? 'measure' : input;
    return input
      ? scope_length > 1
        ? input.includes('percentage')
          ? this.snakeToTitleCase.transform(input.replace('_percentage', '')) + ' (Percentage)'
          : this.snakeToTitleCase.transform(input) + ' (Fixed)'
        : this.snakeToTitleCase.transform(input)
      : '';
  }

  loadUserDetails(id: string): void {
    this.accountService.getUser(id).subscribe({
      next: (data: any) => {
        this.updated_by = data?.user?.full_name;
        this.loader.hide();
      },
      error: (err: Error | any) => {
        this.loader.hide();
        this.alert.error(err?.error?.error?.message || err?.message);
      },
    });
  }
}
