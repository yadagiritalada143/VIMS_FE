import { Component, OnInit, EventEmitter, Output, Input } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { StorageService } from '../../../core/services/storage.service';
import { AlertService } from '../../../core/components/alert/alert.service';
import { AccountService } from '../account.service';

@Component({
  selector: 'app-account-setup-intro',
  templateUrl: './account-setup-intro.component.html',
  styleUrls: ['./account-setup-intro.component.scss']
})
export class AccountSetupIntroComponent implements OnInit {
  @Output() onNext = new EventEmitter<boolean>();
  setpassword = false;
  @Input() isValid;
  orgId: any;
  userToken: any;
  newInvitation = false;
  newInvitationMessage;
  setPassword() {
    this.onNext.emit(this.setpassword = true);
    this.router.navigate(['auth/setup-password'], { queryParams: { orgId: this.orgId, token: this.userToken } });
  }

  constructor(private router: Router, 
    private alertService: AlertService,
    private route: ActivatedRoute, private storageService: StorageService, private accountService: AccountService) {

  }

  ngOnInit(): void {
    this.storageService.clear();
    this.route.queryParams.subscribe(
      params => {
        this.orgId = params['orgId'];
        this.userToken = params['token']
        this.storageService.set('invitation_token', this.userToken, true);
        this.storageService.set('organization_id', this.orgId, true);
      }
    )
  }

  requestNewInvitation() {
    this.accountService.requestNewInvitationToken(this.orgId, this.userToken)
      .subscribe((res) => {
        this.newInvitation = true;
        this.newInvitationMessage = res.email;
      }, (error) => {
        this.alertService.warn(error?.error?.error?.message);
      })
  }
}
