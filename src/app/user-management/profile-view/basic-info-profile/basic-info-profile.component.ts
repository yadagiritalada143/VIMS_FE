import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { HttpService } from 'src/app/core/services/http.service';
import { StorageService,StorageKeys } from 'src/app/core/services/storage.service';
import { errorHandler } from 'src/app/shared/util/error-handler';
import * as _ from 'lodash';
import { AuthorizationService } from 'src/app/core/services/authorize.service';
@Component({
  selector: 'vms-basic-info-profile',
  templateUrl: './basic-info-profile.component.html',
  styleUrls: ['./basic-info-profile.component.scss'],
})
export class BasicInfoProfileComponent implements OnInit {
  @Input() viewData: any;
  @Output('onEditClick') onEditClick: EventEmitter<any> = new EventEmitter();
  @Output('onResetClick') onResetClick: EventEmitter<any> = new EventEmitter();
  orgId: any;
  orgType: string = null;
  showResendButton: boolean = false;
  showSsoIdField: boolean = false;
  userType : string = null;
  currentProgram: any;
  ssoResult:any;

  constructor(
    private localStorage: StorageService,
    private httpService: HttpService,
    private alert: AlertService,
    private loader: LoaderService,
    private authorizationService:AuthorizationService) { }

  ngOnInit(): void {
    let userAccount =  this.localStorage.get(StorageKeys.CURRENT_ACCOUNT);
    this.currentProgram = this.localStorage.get(StorageKeys.CURRENT_PROGRAM);
    this.userType = userAccount?.organization?.category;
    if (window.location.href.includes('users')) {
      this.orgId = this.localStorage.get('PROFILE_ORG_ID');
      this.orgType = this.localStorage.get('PROFILE_ORG_CATEGORY');
      if (this.orgType === 'Client' || this.orgType === 'CLIENT'
          || this.orgType === 'MSP' || this.orgType === 'VENDOR'
          || this.orgType === 'SUPER_ORG' || this.orgType === 'SimplifyVMS' || this.orgType === 'SVMS') {
        this.showResendButton = true;
      }
    }
    if (window.location.href.includes('user-management')) {
      this.orgId = this.localStorage.get('PROFILE_ORG_ID');
      this.orgType = this.localStorage.get('PROFILE_ORG_CATEGORY');
      if (this.orgType === 'Client' || this.orgType === 'CLIENT'
          || this.orgType === 'MSP' || this.orgType === 'VENDOR'
          || this.orgType === 'SUPER_ORG' || this.orgType === 'SimplifyVMS' || this.orgType === 'SVMS') {
        this.showResendButton = true;
      }
    }
    this.getSSOSetting(this.orgId);
  }

  getSSOSetting = (org_id:string) => {
    this.showSsoIdField = false;
    if (org_id) {
      const url = `/global-tms/ssoproviders/all?org_id=${org_id}`;
      this.httpService.get(url).subscribe((result: any) => {
        this.ssoResult = result
         if(result && result?.is_enabled){
          this.showSsoIdField = this.authorizationService.authorize('sso_view')
         }
      });
    }
  }

  editClick() {
    this.onEditClick.emit();
  }

  resetClick() {
    this.onResetClick.emit();
  }

  // resetPassword() {
  //   let email = { email: this.viewData?.email };
  //   this.loader.show();
  //   this.httpService
  //     .post('/public/users/password-reset', email)
  //     .subscribe(
  //       (data) => {
  //         this.loader.hide();
  //         this.alert.success("Reset password email is sent successfully");
  //       },
  //       (err) => {
  //         this.loader.hide();
  //         this.alert.error('Failed to send reset password email');
  //       }
  //     );
  // }

  resendInvitation() {
    this.loader.show();
    let data = {}
    if (this.currentProgram?.id) {
      data = { program_id: this.currentProgram?.id };
    }
    this.httpService.post(`/configurator/resend-invite/${this.viewData?.id}`, data)
      .subscribe({
        next: (data: any) => {
          this.loader.hide();
          this.alert.success("Invitation is resent successfully");
        }, error: (err: Error | any) => {
          this.loader.hide();
          this.alert.error(errorHandler(err));
        }
      }
    );
  }

  getFullName(name){
    if(!name) return;
    if(this.localStorage.get('CurrentProgram')?.config?.hide_suffix_prefix){
      if(this.viewData.name_prefix && this.viewData.name_prefix !== '')
        name = name.replace(this.viewData.name_prefix , '')
      if(this.viewData.name_suffix && this.viewData.name_suffix !== '')
        name = name.replace(this.viewData.name_suffix , '');
      return _.toLower(name);
    }
    return _.toLower(name);
  }
}
