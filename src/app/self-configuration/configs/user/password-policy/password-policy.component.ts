import { Component, OnInit } from '@angular/core';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { ProgramService } from 'src/app/programs/program.service';
import { CommonViewConfig, CommonViewDetail } from 'src/app/shared/components/common-view-rule-flow/common-view-rule-flow.component';
import { SortHelperPipe } from 'src/app/shared/pipe/sort-helper.pipe';
import { errorHandler } from 'src/app/shared/util/error-handler';

@Component({
  selector: 'app-password-policy',
  templateUrl: './password-policy.component.html',
  styleUrls: ['./password-policy.component.scss']
})
export class PasswordPolicyComponent implements OnInit {

  public viewDetails: Array <CommonViewDetail> = [];

  public mustContainOptions: Array <any> = [
    { label: 'Upper Case', value: 'UPPERCASE' },
    { label: 'Lower Case', value: 'LOWERCASE' },
    { label: 'Numbers', value: 'NUMBER' },
    { label: 'Special Characters', value: 'SPECIAL' }
  ];

  public cannotContainOptions: Array <any> = [
    { label: 'First Name', value: 'FIRST_NAME' },
    { label: 'Last Name', value: 'LAST_NAME' },
    { label: 'Words', value: 'WORDS' },
    { label: 'Special Characters', value: 'SPECIAL' },
    { label: 'TalentIQVMS Account User Name', value: 'TalentIQ_USERNAME' },
    { label: 'TalentIQVMS Account Email address', value: 'TalentIQ_EMAIL' },
    { label: 'Sequential Characters (a,b,c...)', value: 'CHAR_SEQUENCE' },
    { label: 'Sequential Numbers (1,2,3...)', value: 'NUM_SEQUENCE' }
  ];

  constructor(
    private programService: ProgramService,
    private sortHelper: SortHelperPipe,
    private storage: StorageService,
    private loader: LoaderService,
    private alert: AlertService
  ) { }

  ngOnInit(): void {

    let orgId: string = this.storage.get(StorageKeys.CURRENT_USER)?.organization_id;
    if(orgId) {

      this.loader.show();
      this.programService.get(`/profile-manager/${orgId}/password-policy`).subscribe({
        next: (data: any) => {
          this.loader.hide();
          this.populatePasswordPolicy(data?.password_policy);
        }, error: (err: any) => {
          this.loader.hide();
          this.alert.error(errorHandler(err));
          this.populatePasswordPolicy({});
        }
      });
    }
  }

  private populatePasswordPolicy(data: any) {
    this.viewDetails = [{
      label: 'Password Minimum Length',
      value: data?.min_length ?? '--',
      displayType: CommonViewConfig.TEXT
    }, {
      label: 'Maximum Log In Attempts',
      value: data?.max_log_attempt ?? '--',
      displayType: CommonViewConfig.TEXT
    }, {
      label: 'Number of Days to Expiration',
      value: data?.expire_in ?? '--',
      displayType: CommonViewConfig.TEXT
    },{
      label: 'Number of Retained Passwords',
      value: data?.retained ?? '--',
      displayType: CommonViewConfig.TEXT
    },{
      label: 'Password Must Contain',
      value: this.getLabelText(data?.must_contain, this.mustContainOptions) ?? '--',
      displayType: CommonViewConfig.TEXT
    }, {
      label: 'Passwords Cannot Contain',
      value: this.getLabelText(data?.cannot_contain, this.cannotContainOptions) ?? '--',
      displayType: CommonViewConfig.TEXT
    }];

    if(Array.isArray(data?.cannot_contain) && data.cannot_contain.includes('WORDS')) {
      this.viewDetails.push({
        label: 'Password Must Not Contain Below Words',
        value: this.sortHelper.transform(data?.not_allowed_words || []).join(", ") ?? '--',
        displayType: CommonViewConfig.TEXT
      });
    }
  }

  private getLabelText(values: Array <string>, opts: Array <any>) {
    let result: Array <string> = [];
    if(Array.isArray(values) && Array.isArray(opts)) {
      result = values.map((val: string) => {
        return opts.find((entry: any) => (entry?.value === val))?.label || val;
      })
    }

    return this.sortHelper.transform(result).join(", ");
  }
}
