import { Component, OnInit, EventEmitter, Output } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
@Component({
  selector: 'app-set-password',
  templateUrl: './set-password.component.html',
  styleUrls: ['./set-password.component.scss']
})
export class SetPasswordComponent implements OnInit {
  @Output() onNext = new EventEmitter();
  basicdetails = false;
  password = '';
  rePassword = ''
  isPasswordError = false;
  isRePasswordError = false;
  errorMessage = '';
  orgId = '';
  userToken = '';
  passwordstrength = '';
  passwordstrength1 = false;
  passwordstrength2 = false;
  passwordstrength3 = false;
  passwordstrength4 = false;

  constructor(
    private route: ActivatedRoute, 
  ) { }

  ngOnInit(): void {
    this.route.queryParams.subscribe(
      params => {
        this.orgId = params['orgId'];
        this.userToken = params['token']
      })

  }

  get invalidPassword() {
    return !/(?=.*?[a-z])(?=.*?[A-Z])/.test(this.password) ||
      !/[ !"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]/.test(this.password) ||
      !/[0-9]/.test(this.password) ||
      this.password.toUpperCase()?.includes('PASSWORD') ||
      !((this.password || '').trim().length > 7) || this.isRePasswordError
  }

  basicDetail() {
    this.isPasswordError = false;
    this.isRePasswordError = false;
    if ((this.password || '').match(/\s/g)) {
      this.isPasswordError = true
      this.errorMessage = 'Space in password field not allow'
      return;
    } else if (this.password === '') {
      this.isPasswordError = true
      this.errorMessage = 'Password field should not be blank'
      return;
    } else if (this.password !== this.rePassword) {
      this.errorMessage = 'The passwords entered do not match. Passwords must match in order to continue.'
      this.isRePasswordError = true
      return;
    }

    // this._AccService.setPasswordViaInvitaionToken(this.orgId,this.userToken,this.password).subscribe(
    //   data => {
    //       if(data.id){
    //         this.onNext.emit({ password: this.password });
    //       }
    //   },
    //   err => {
    //     this.errorMessage = err.error.error.message;
    //     this.isRePasswordError = true
    //   }
    // )
    // this.storageService.set
    this.onNext.emit({ password: this.password });
  }

  checkPassword(password) {
    if (this.password == password) {
      this.isRePasswordError = false
      this.errorMessage = '';
    } else {
      this.isRePasswordError = true
      this.errorMessage = 'The passwords entered do not match. Passwords must match in order to continue.'
    }

  }
  passwordChange(eve) {
    let pattern1 = /(?=.*?[a-z])(?=.*?[A-Z])/;
    let special = /[ !"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]/;
    let number = /[0-9]/;
    this.passwordstrength1 = eve.length >= 7 ? true : false;
    this.passwordstrength2 =
      pattern1.test(eve) && this.passwordstrength1 ? true : false;
    this.passwordstrength3 =
      special.test(eve) &&
        this.passwordstrength1 &&
        number.test(eve) &&
        this.passwordstrength2
        ? true
        : false;
    this.passwordstrength4 =
      this.passwordstrength1 && this.passwordstrength2 && this.passwordstrength3
        ? true
        : false;
    this.passwordstrength =
      ((eve && eve.length > 0) || this.passwordstrength1) &&
        !this.passwordstrength2 &&
        !this.passwordstrength3 &&
        !this.passwordstrength4
        ? 'weak'
        : this.passwordstrength1 &&
          this.passwordstrength2 &&
          !this.passwordstrength3 &&
          !this.passwordstrength4
          ? 'fair'
          : this.passwordstrength1 &&
            this.passwordstrength2 &&
            this.passwordstrength3 &&
            !this.passwordstrength4
            ? 'good'
            : this.passwordstrength1 &&
              this.passwordstrength2 &&
              this.passwordstrength3 &&
              this.passwordstrength4
              ? 'strong'
              : '';
    // let confirmpwd = this.resetPasswordForm.get('confirmpassword');
    // if (confirmpwd == eve) {
    // }
  }
}
