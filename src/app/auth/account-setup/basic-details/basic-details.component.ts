import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { StorageService } from 'src/app/core/services/storage.service';
import { AlertService } from '../../../core/components/alert/alert.service';
import { AccountService } from '../account.service';

@Component({
  selector: 'app-basic-details',
  templateUrl: './basic-details.component.html',
  styleUrls: ['./basic-details.component.scss']
})
export class BasicDetailsComponent implements OnInit {
  @Output() onNext = new EventEmitter();
  @Output() onBack = new EventEmitter(false);
  secretquestion = false;
  setpassword = false;
  key: any;
  clientNameAvailable = false;
  isValidUserName: boolean = true;
  isClientValid = false;
  userMail: any;
  userNameAlreadyExist = false;
  validatingUserName = false;
  isFirstNameError = false;
  isLastNameError = false;
  isTitleError = false;
  isUserNameError = false;
  errorMassage = '';
  userToken: any;
  orgId: any;
  userInfo: any = {};
  userStorageDetails: any;
  userDetail: any = {};
  constructor(
    private storageService: StorageService,
    private route: ActivatedRoute,
    private accountService: AccountService,
    private alertService: AlertService) { }

  ngOnInit() {
    this.userStorageDetails = this.storageService.get('members');
    this.route.queryParams.subscribe(
      params => {
        this.orgId = params['orgId'];
        this.userToken = params['token']
      }
    )
    if (this.storageService.get('userEmail')) {
      var email = this.storageService.get('userEmail');
      this.userMail = this.removedPlus(email);
    }
    if (this.userMail) {
      this.getUserDetails();
    }
  }
  removedPlus(email) {
    return email?.replaceAll('+', '%2B');
  }
  public onKeydown(event: KeyboardEvent) {
    this.key = event.keyCode;
    if ((this.key >= 15 && this.key <= 64) || (this.key >= 123) || (this.key >= 96 && this.key <= 105)) {
      event.preventDefault();
    }
  }
  clean(obj) {
    for (const propName in obj) {
      if (!obj[propName] || obj[propName] === null || obj[propName] === undefined) {
        delete obj[propName];
      }
    }
    return obj;
  }
  changeCase(email) {
    return email?.replace('wip', 'WIP');
  }
  getUserDetails() {
    if (this.userStorageDetails) {
      this.userInfo = this.userStorageDetails;
    }
    this.accountService.getGuestUser(this.userMail).subscribe({
      next: (res: any) => {
        let user = this.clean(res.user);
        this.userDetail = user;
        this.userInfo = { ...user, ...this.userInfo };
        this.userInfo.username = this.changeCase(this.userInfo.username)
        if (this.userInfo.name_suffix == '') {
          this.userInfo.name_suffix = undefined;
        }
        if (this.userInfo.name_prefix == '') {
          this.userInfo.name_prefix = undefined;
        }
       // this.validateUserName('');   WIP-1245 - username already taken
      },
      error: (err) => {
        console.error(err);
        this.alertService.error(err.error?.error?.message ? err.error?.error?.message :  err.error, {})
      }
    });
  }

  validateUserName(event) {

    this.isValidUserName = true;
    this.validatingUserName = true;
    this.accountService.getGuestUser(this.userInfo.username)
      .subscribe(res => {
        this.userNameAlreadyExist = this.userDetail?.username.toLowerCase() === this.userInfo.username.toLowerCase() ? false : true;
        this.validatingUserName = false;
      }, (err) => {
        this.userNameAlreadyExist = false;
        this.validatingUserName = false;
      })

  }

  secretQuestions() {
    if (!this.userInfo?.first_name || this.userInfo?.first_name === '') {
      this.errorMassage = 'First name should not be blank';
      this.isFirstNameError = true;
      return;
    } else if (!this.userInfo?.last_name || this.userInfo?.last_name === '') {
      this.errorMassage = 'Last name should not be blank';
      this.isLastNameError = true;
      return;
    } else if (!this.userInfo?.username || this.userInfo?.username === '' || this.userNameAlreadyExist) {
      this.isValidUserName = false;
      return;
    }

    this.onNext.emit(this.userInfo);
  }

  resetError(fieldName) {
    if (this.userInfo[fieldName]) {
      if (fieldName === 'title') {
        this.isTitleError = false;
      } else if (fieldName === 'first_name') {
        this.isFirstNameError = false;
      } else if (fieldName === 'last_name') {
        this.isLastNameError = false;
      }
    }
  }

  getPrefixSuffixFlag(){
    return this.storageService.get('CurrentProgram')?.config?.hide_suffix_prefix
  }
}

