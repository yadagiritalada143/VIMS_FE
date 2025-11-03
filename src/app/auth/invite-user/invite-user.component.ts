import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AccountService } from '../account-setup/account.service';
import { LoaderService } from '../../core/components/loader/loader.service';
import { StorageService } from '../../core/services/storage.service';
import { ProgramConfig, UserDataObj } from '../../shared/enums';
import { AlertService } from '../../core/components/alert/alert.service';
@Component({
  selector: 'app-invite-user',
  templateUrl: './invite-user.component.html',
  styleUrls: ['./invite-user.component.scss']
})
export class InviteUserComponent implements OnInit {
  public orgId: any;
  public userToken: any;
  public programId: any;
  public Invite_sender_name = undefined;
  public isTokenExpired = false;
  public tokenUsed = false;
  public programName: any;
  public program_uniqId: any;
  public programObj: object;
  public newProgramId: string;
  public clientName: string;

  constructor(private router: Router, private route: ActivatedRoute, private _accountService: AccountService, private _loader: LoaderService, private localStorage: StorageService, private _alert: AlertService) { }

  ngOnInit(): void {
    this.route.queryParams.subscribe(
      params => {
        this.orgId = params['orgId'];
        this.programId = params['programId'];
        this.userToken = params['token'];
      }
    )
    if (this.programId) {
      this.getUser();
      this.getProgram();
    }
    this.acceptInvite();

  }

  getUser() {
    this._loader.show();
    this._accountService.getProgramMembers(this.programId, this.userToken).subscribe(
      (data: any) => {
        this.Invite_sender_name = data?.members[0].first_name;
        this.isTokenExpired = false;
      }
    )
  }

  getProgram() {
    this._accountService.get(`/configurator/programs/${this.programId}`).subscribe({
      next: (data: any) => {
        this.programName = data?.program?.name;
        this.program_uniqId = data?.program?.unique_id;
        this.newProgramId = data?.program?.id;
        this.programObj = data?.program;
        this._loader.hide();
      },
      error: err => {
        this._loader.hide();
      }
    })
  }

  acceptInvite() {
    this._loader.show();
    let payLaod = { token: this.userToken }
    this._accountService.updateUser(this.programId, payLaod).subscribe({
      next: (data: any) => {
        this._loader.hide();
        this._alert.success('Invitation is successfully accepted')
        this.redirectToProgramDetails();
      },
      error: err => {
        if (err.status == 403) {
          this.isTokenExpired = true;
        }
        if (err.status == 400) {
          this.tokenUsed = true;
          this.isTokenExpired = false;
          if (err?.error?.error === 'INVITE_ACCEPTED') {
            this._alert.success('You have already accepted the invitation')
            this.redirectToProgramDetails();
          }
        }
        else {
          this._alert.error("Invalid Token");
        }
        this._loader.hide();
      }
    })
  }

  regenerateToken() {
    this._loader.show();
    let payLaod = {
      token: this.userToken,
      organization_id: this.orgId
    }
    this._accountService.resenInvitation(this.programId, payLaod).subscribe(data => {
      this._loader.hide();
      this._alert.success('Invitation sent successfully..');
    })
  }

  redirectToProgramDetails() {
    this._loader.show();
    let authToken = this.localStorage.get(UserDataObj[0]);
    if (authToken && authToken != null && authToken != undefined) {
      this._accountService.get(`/configurator/organizations/${this.orgId}`).subscribe((data: any) => {
        this.clientName = data?.name;
        this._loader.hide();
        if (this.clientName) {
          this.router.navigate(['/program-setup'], { queryParams: { programId: this.program_uniqId, clientId: this.orgId, program_req_id: this.newProgramId, clientName: this.clientName, navigate_to_detail: true } });
          this.localStorage.set(ProgramConfig[5], this.programObj, true)
        }
      })
    }
    else {
      this.router.navigate(['/auth/login']);
    }
  }
}
