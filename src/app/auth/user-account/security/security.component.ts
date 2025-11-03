import { Component, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { UserService } from 'src/app/core/services/user.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { errorHandler } from '../../../shared/util/error-handler';
import { LoginService } from '../../login/login.service';
import { SvmsRouterService } from 'src/app/core/services/svms-router.service';
@Component({
  selector: 'app-security',
  templateUrl: './security.component.html',
  styleUrls: ['./security.component.scss']
})
export class SecurityComponent implements OnInit {
  isPasswordError = false;
  isRePasswordError = false;
  isCurrentPasswordError= false;
  isUserNameError = '';
  errorMessage = '';
  password = '';
  username = '';
  user: any;
 profileUser: any;
  programMember: any;
  passwordStrength = false;
  passwordstrength = '';
  passwordstrength1 = false;
  passwordstrength2 = false;
  passwordstrength3 = false;
  passwordstrength4 = false;
  isStrong:any ;
  readOnlyField = true;
  create_username= false;
  userNameAlreadyExist = false;
  searchTerm: any ;
  searchUserName = new Subject<string>();
  passwordObject:any = {} ;

  constructor(
    private _alertService: AlertService,
    private userService: UserService,
    private loader: LoaderService,
    private storageService: StorageService,
    private login: LoginService,
    private route: SvmsRouterService
  ) {

                  this.searchUserName.pipe(
                    debounceTime(300),
                    distinctUntilChanged())
                    .subscribe((value: any) => {
                      if (value?.target?.value) {
                        this.userNameAlreadyExist = false;
                        this.searchTerm = value?.target?.value;
                        if(this.searchTerm?.length > 4) {
                          this.checkUserName(value?.target?.value);
                        }

        }
      }
    );
  }

  ngOnInit(): void {

    if (this.login.impersonationSession) {
      this.route.navigate(["auth", "user-account", "account-settings"]);
      return;
    }

    this.user = this.storageService.get('user');
    this.getUser();
  }

  toggleEdit() {
    this.readOnlyField = !this.readOnlyField;
    if(this.readOnlyField) {
       this.updateUserName();
    }
  }
  resetUserName() {
    this.readOnlyField = !this.readOnlyField;
    if(this.profileUser.username) {
      this.username = this.profileUser.username;
      this.searchTerm = '';
      this.userNameAlreadyExist = false;
      this.isUserNameError = null;
    } else {
      this.username = '';
      this.searchTerm = '';
      this.userNameAlreadyExist = false;
      this.create_username = false;
      this.isUserNameError= null;
    }

  }
  createUserName() {
     this.create_username = true;
     this.readOnlyField = false;
  }
  showPassowrdStrength() {
    this.passwordStrength = true;
    if(this.passwordObject.new_password) {
      this.errorMessage = '';
    }
  }
  CheckCurrentPassword(event) {
   if(event) {
     this.isCurrentPasswordError = false;
   }
  }
  checkPassword(password) {
    if(password) {
    if (this.passwordObject?.new_password == password) {
      this.isRePasswordError = false
      this.errorMessage = '';
    } else {
      this.isRePasswordError = true
      this.errorMessage = 'The passwords entered do not match. Passwords must match in order to continue'
    }
  }
  }
  checkNewPassword(password) {
    if(this.passwordObject?.confirmed_password) {
    if (this.passwordObject?.confirmed_password == password) {
      this.isPasswordError = false;
      this.isRePasswordError = false
      this.errorMessage = '';
    } else {
      this.isPasswordError = true
      this.errorMessage = 'The passwords entered do not match. Passwords must match in order to continue'
    }
  }
  }
  getUser() {
    this.loader.show();
    let currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.userService.get(`/profile-manager/users/${this.user?.id}`)
      .subscribe({
        next: (res: any) => {
          const { user } = res;
          this.profileUser = user;
          if (this.profileUser && this.profileUser.username) {
            this.username = this.profileUser.username;
          }

          this.loader.hide();
        },
        error: err => {
          this.loader.hide();
        }
      })

    if(currentProgram?.id && this.user?.id) {
      this.userService.getMembershipDetails(currentProgram?.id, this.user?.id).subscribe((res: any) => {
        const { member } = res;
        this.programMember = member;
      });
    }
  }

  updatePassword() {
    this.isPasswordError = false;
    this.isRePasswordError = false;
    if ((this.passwordObject.old_password === undefined || this.passwordObject.old_password === '')) {
      this.isCurrentPasswordError = true
      this.errorMessage = 'Current password field should not be blank';
      return;
      }
      if ((this.passwordObject.old_password || '').match(/\s/g)) {
        this.isCurrentPasswordError = true
        this.errorMessage = 'Space in the current password field is not allowed !'
        return;
      }
      if ((this.passwordObject.new_password === undefined || this.passwordObject.new_password === '')) {
        this.isPasswordError = true
        this.errorMessage = 'Password field should not be blank';
        return;
        }
        if ((this.passwordObject.confirmed_password === undefined)) {
          this.isRePasswordError = true
          this.errorMessage = 'Confirm Password field should not be blank';
          return;
          }
    if ((this.passwordObject.new_password || '').match(/\s/g)) {
       this.isPasswordError = true
       this.errorMessage = 'Space in password field not allowed';
       return;
       }

     if (this.passwordObject.new_password === '') {
      this.isPasswordError = true
      this.errorMessage = 'Password field should not be blank'
      return;
    }
    if (this.passwordObject.new_password === this.passwordObject.old_password) {
      this.errorMessage = 'The current password and new password should not be same'
      this.isPasswordError = true
      return;
    }
     if (this.passwordObject.new_password !== this.passwordObject.confirmed_password) {
      this.errorMessage = 'The password entered do not match. Password must match in order to continue'
      this.isRePasswordError = true
      return;
    }
     if(!this.passwordstrength1) {
      this.errorMessage = 'The password must be longer than 7 characters'
      this.isPasswordError = true
      return;
    }
     if(this.isStrong !=='strong') {
      this.errorMessage = 'The new password must satisfy all the above conditions'
      this.isPasswordError = true
      return;
    }
    this.loader.show();
    const url = `/profile-manager/users/password-update`;
    this.userService.put(url,  this.passwordObject).subscribe((res) => {
      this._alertService.success('Password updated successfully');
      this.passwordObject = {} ;
      this.passwordStrength = false;
      this.loader.hide();
    }, (err) => {
      this.loader.hide();
      this.passwordObject = {} ;
      this.passwordStrength = false;
      this._alertService.error(errorHandler(err));
    })
  }
  getPasswordStrength(event) {
   if(event) {
      this.isStrong = event;
   }
  }
  passwordChange(eve) {
    this.passwordstrength1 = eve?.length >= 7 ? true : false;
    this.isPasswordError = false;

  }
  checkUserName(name) {
    this.userNameAlreadyExist = false;
    const url = `/public/users/basic-info?k=${name}`;
    this.userService.get(url).subscribe({
      next: (res: any) => {
        if(this.profileUser && this.profileUser?.username && this.profileUser?.username?.toLowerCase() === name?.toLowerCase()) {
          this.userNameAlreadyExist = false;
        } else {
          this.userNameAlreadyExist = name?.toLowerCase() === res?.user?.username ? true : false;
          if(this.userNameAlreadyExist) {
            this.isUserNameError = 'User Name is already taken'
          }
        }
        this.loader.hide();
      },
      error: (err) => {
        this.userNameAlreadyExist = false;
        this.loader.hide();
      }
    })
  }
  checkValidUserName() {
    this.isUserNameError = '';

      if ((this.username || '').match(/\s/g)) {
      this.isUserNameError = 'Space in user name field not allowed'
      this.readOnlyField = false;
      return;
    }
    if(this.username && this.username?.length < 8) {
      this.isUserNameError = 'User name should be more than 7 characters long'
      this.readOnlyField = false;
      return ;
    }
    if(this.username && this.username?.length > 26) {
      this.isUserNameError = 'User name should be less than 26 characters long'
      this.readOnlyField = false;
      return ;
    }
    if(this.userNameAlreadyExist) {
      this.isUserNameError = 'User Name is already taken'
      this.readOnlyField = false;
      return;
    }
  }
  updateUserName() {
    this.isUserNameError = null;

    if ((this.username || '').match(/\s/g)) {
      this.isUserNameError = 'Space in user name field is not allowed'
      this.readOnlyField = false;
      return;
    }
    if(this.username && this.username?.length < 8) {
      this.isUserNameError = 'User Name should be more than 7 characters long'
      this.readOnlyField = false;
      return ;
    }
    if(this.username && this.username?.length > 26) {
      this.isUserNameError = 'User Name should be less than 26 characters long'
      this.readOnlyField = false;
      return ;
    }
    if(this.userNameAlreadyExist) {
      this.isUserNameError = 'User Name is already taken.'
      this.readOnlyField = false;
      return;
    }
    const format = /[ `!@#$%^&*()+\=\[\]{};':"\\|,<>\/?~]/;
    if(format.test(this.username)) {
      this.isUserNameError = 'Special characters are not allowed'
      this.readOnlyField = false;
      return;
    }
    if(this.profileUser && this.profileUser?.username && this.profileUser?.username?.toLowerCase() === this.username?.toLowerCase()) {
    return ;
    }
    if(this.username) {
    this.loader.show();
    const url = `/configurator/organizations/${this.profileUser.organization_id}/members/${this.profileUser.id}`;
    this.userService.put(url,  {username: this.username}).subscribe((res) => {
      this._alertService.success('User Name updated successfully');
      this.create_username = false;
      this.searchTerm = '';
      this.loader.hide();
      this.getUser();
    }, (err) => {
      this.loader.hide();
      this._alertService.error(errorHandler(err));
    })
  } else {
    this.readOnlyField = false;
    this.loader.hide();
    this.isUserNameError = 'User Name field should not be blank'

  }
}
}
