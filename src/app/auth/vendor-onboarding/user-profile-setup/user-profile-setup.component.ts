import { Component, OnInit, EventEmitter, Output, ViewChild, ElementRef, Input } from '@angular/core';
import { Dimensions, ImageCroppedEvent, ImageTransform, base64ToFile } from 'ngx-image-cropper';
import { StorageService } from 'src/app/core/services/storage.service';
import { Router, ActivatedRoute } from '@angular/router';
import { AccountService } from '../account.service';
import { UserService } from 'src/app/core/services/user.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { ConfirmationDialogService } from 'src/app/shared/components/confirmation-dialog/confirmation-dialog.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
@Component({
  selector: 'app-user-profile-setup',
  templateUrl: './user-profile-setup.component.html',
  styleUrls: [
    '../../../../assets/sass/self-config/config-main.scss',
    '../../../../assets/sass/self-config/config-main-2.scss',
    './user-profile-setup.component.scss'
  ]
})
export class UserProfileSetupComponent implements OnInit {
  @Output() onNext = new EventEmitter();
  @Input() userBasicInformation;
  basicdetails = false;
  password = '';
  buttonDisable = false;
  rePassword = ''
  isPasswordError = false;
  isRePasswordError = false;
  errorMessage = '';
  passwordstrength = '';
  passwordstrength1 = false;
  passwordstrength2 = false;
  passwordstrength3 = false;
  passwordstrength4 = false;
  isValidPassword: boolean = false;
  // Basic detail variables
  key: any;
  userInfo :any = {}
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
  userStorageDetails: any;
  userDetail: any = {};
  public showBackPopup:boolean = false;
  // Avatar section's variables
  name = 'SN'
  public imageChangedEvent: any = '';
  public croppedImage: any = '';
  public canvasRotation = 0;
  public rotation = 0;
  public scale = 1;
  public showCropper = false;
  public containWithinAspectRatio = false;
  public transform: ImageTransform = {};
  public orgId;
  public userToken;
  public avatarList = [
    { "color": "#6F5CEC" },
    { "color": "#FF9628" },
    { "color": "#FF4D1F" },
    { "color": "#F22626" },
    { "color": "#FF00FC" },
    { "color": "#1D1D1D" }
  ]

  public defaultColor = this.avatarList[0]?.color;
  public imageOrColorSelected = "color"
  public imageLoad: boolean;
  public fileName: any;
  @ViewChild('fileInput') fileInput: ElementRef;

  constructor(
    private storageService: StorageService, private router: Router, private route: ActivatedRoute,
    private alertService: AlertService, private accountService: AccountService,
    private confirmService: ConfirmationDialogService, private loaderService: LoaderService,private userService: UserService
  ) { }

  ngOnInit(): void {
    history.pushState(null, null, location.href);
    window.onpopstate = (event) => {
      history.pushState(null, null, location.href);
      this.showBackPopup = true;
    };
    this.route.queryParams.subscribe(
      params => {
        this.orgId = params['orgId'];
        this.userToken = params['token']
      }
    )
    if (this.userBasicInformation?.userEmail) {
      var email = this.userBasicInformation?.userEmail;
      this.userMail = this.removedPlus(email);

    }
    if ((this.userMail && !this.storageService.get("userBasicInformation")) || (this.storageService.get("userBasicInformation") && this.storageService.get("userBasicInformation").userToken != this.userToken)) {
      this.getUserDetails();
    }else if(this.storageService.get("userBasicInformation")){
      let tempValues = this.storageService.get("userBasicInformation");
      this.userInfo.first_name  = tempValues.first_name
      this.userInfo.middle_name  = tempValues.middle_name
      this.userInfo.last_name  = tempValues.last_name
      this.userInfo.username  = tempValues.username
      this.userInfo.userEmail  = tempValues?.userEmail
      this.userInfo.title  = tempValues.title
      if(tempValues?.image?.avatar_color){
        this.defaultColor = tempValues?.image?.avatar_color
      }
      if(tempValues?.image?.file_name){
        this.imageOrColorSelected = "image";
        this.defaultColor = "";
        this.imageLoaded();
        this.fileName = tempValues?.image?.file_name
        this.croppedImage = tempValues?.image?.image
      }

    }
   // this.loginDummyApiCall();
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
      this.errorMessage = 'Password Mismatch with Primary entered'
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

    //this.onNext.emit({ password: this.password });
  }

  checkPassword(password) {
    if (this.password == password) {
      this.isRePasswordError = false
      this.errorMessage = '';
    } else {
      this.isRePasswordError = true
      this.errorMessage = 'Password Mismatch with Primary entered'
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

  public onKeydown(event: KeyboardEvent) {
    this.key = event.keyCode;
    if ((this.key >= 15 && this.key <= 64) || (this.key >= 123) || (this.key >= 96 && this.key <= 105)) {
      event.preventDefault();
    }
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
     // this.onNext.emit(this.userInfo);
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

  removedPlus(email) {
    return email?.replaceAll('+', '%2B');
  }

  changeCase(email) {
    return email?.replace('wip', 'WIP');
  }
  loginDummyApiCall(){
    this.loaderService.show()
    let authPayload = { username: this.userInfo.username, password: this.password };
    this.accountService.login(authPayload).subscribe({
      next: (res: any) => {
        this.storageService.set("Token", res['token'], true);
        this.getMyPrograms()
        this.loaderService.hide()
      },
      error: (err) => {
        this.buttonDisable = false;
        console.error(err);
        this.alertService.error(err.error?.error?.message ? err.error?.error?.message :  err.error, {})
      }
    });
    this.loaderService.hide()
  }

  checkPasswordRegex() {
    const passwordRegex = /^(?=.*?[a-z])(?=.*?[A-Z])(?=.*?[0-9])(?=.*?[ !"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]).{8,256}$/;
    this.isValidPassword = passwordRegex.test(this.password);
  }

  getMyPrograms() {
    this.loaderService.show()
    this.userService.getAllPrograms().subscribe({
      next: data => {
        this.storageService.set("currentProgram", data?.programs[0], true);
        this.loaderService.hide()
        this.buttonDisable = false;
        this.onNext.emit({userBasicInformation:this.userBasicInformation,nextStep:true})
      },
      error: (err) => {
        this.loaderService.hide();
      }
    })
    this.loaderService.hide()
  }

  getUserDetails() {

    this.accountService.getGuestUser(this.userMail).subscribe({
      next: (res: any) => {
        let user = this.clean(res.user);
        this.userDetail = user;
        this.userInfo = { ...user};
        this.userInfo.username = this.userBasicInformation?.userEmail
        this.userInfo.userEmail = this.userBasicInformation?.userEmail
        this.validateUserName(this.userInfo.username)
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
    const usernamePattern = /^[a-zA-Z0-9](?:[a-zA-Z0-9._\-+@]*[a-zA-Z0-9]){4,255}$/;
    const valid = usernamePattern.test(this.userInfo.username);
    if(valid){
      this.isValidUserName = true
    }else{
      this.isValidUserName = false
    }

    this.validatingUserName = true;
    this.accountService.getGuestUser(this.userInfo.username)
      .subscribe((res:any) => {
        this.userNameAlreadyExist = res?.user?.is_activated || false;
        this.validatingUserName = false;
      }, (err) => {
        this.userNameAlreadyExist = false;
        this.validatingUserName = false;
      })

  }


  private isValidImageType(type: string): boolean {
    return /image\/(png|jpg|jpeg)/.test(type);
  }

  setAvatar(e, value) {
    if (e.target.checked) {
      this.defaultColor = value.color;
    }
  }

  onSkipClick() {
    this.router.navigate(['auth/theme-color'], { queryParams: { orgId: this.orgId, token: this.userToken } });
  }

  gotoVendorDetail() {
    this.buttonDisable = true;
    this.loaderService.show()
    this.userInfo.password = this.password
    this.userInfo.userToken = this.userToken
    this.userInfo.orgId = this.orgId
    let avatarPayload = {}
    if (!this.defaultColor) {
      avatarPayload = {
        "file_name": this.fileName,
        "image": this.croppedImage
      }
      this.userInfo.image = avatarPayload
    } else {
      avatarPayload = { "avatar_color": this.defaultColor }
      this.userInfo.image = avatarPayload
    }
    this.onNext.emit({userBasicInformation:this.userInfo,nextStep:true})
    this.buttonDisable = false;
    // this.userBasicInformation.userInfo = this.userInfo
    // this.userBasicInformation.userInfo.password = this.password
    // let avatarPayload = {}
    // if (!this.defaultColor) {
    //   avatarPayload = {
    //     "file_name": this.fileName,
    //     "image": this.croppedImage
    //   }
    //   this.userBasicInformation.userInfo.image = avatarPayload
    // } else {
    //   avatarPayload = { "avatar_color": this.defaultColor }
    //   this.userBasicInformation.userInfo.image = avatarPayload
    // }

    // this.accountService.setPasswordViaInvitaionToken(this.orgId, this.userToken, this.password).subscribe({
    //   next: (setPasswordResponse: any) => {
    //     this.accountService.updateAvatar(this.orgId, this.userToken,avatarPayload).subscribe({
    //       next: (setAvatarResponse: any) => {
    //         this.accountService.uploadMembers(this.orgId, this.userToken,this.userInfo).subscribe({
    //           next: (memberUpdateResponse: any) => {
    //             this.loginDummyApiCall()
    //           },
    //           error: (err) => {
    //             this.buttonDisable = false;
    //             console.error(err);
    //             this.alertService.error(err.error?.error?.message ? err.error?.error?.message :  err.error, {})
    //           }
    //         });
    //       },
    //       error: (err) => {
    //         console.error(err);
    //         this.buttonDisable = false;
    //         this.alertService.error(err.error?.error?.message ? err.error?.error?.message :  err.error, {})
    //       }
    //     });
    //   },
    //   error: (err) => {
    //     console.error(err);
    //     this.buttonDisable = false;
    //     this.alertService.error(err.error?.error?.message ? err.error?.error?.message :  err.error, {})
    //   }
    // });
      this.loaderService.hide()
  }


  fileChangeEvent(event: any): void {
    if (event && event.target && event.target.files && event.target.files.length > 0) {
      this.imageOrColorSelected = "image"
      this.defaultColor = ""
      const file = event.target.files[0];
      const imageType = file.type;
      if ((file.size / 1028 / 1028) > 3) {
        this.showCropper = false;
        this.croppedImage = null;
        this.imageLoad = false;
        this.alertService.error('Logo size should not exceed more than 3 MB', {});
      } else {
        if (this.isValidImageType(imageType)) {
          this.imageChangedEvent = event;
          this.fileName = event.target.files[0]?.name;
          this.imageLoad = true;
        } else {
          this.loadImageFailed();
          event.target.value = '';
        }
      }
    }
  }

  imageCropped(event: ImageCroppedEvent) {
    this.croppedImage = event.base64;

    const validations = base64ToFile(event.base64);
    if (validations.type === 'image/png' || validations.type === 'image/jpg') {

    }
  }

  imageLoaded() {
    this.showCropper = true;
  }

  cropperReady(sourceImageDimensions: Dimensions) {
  }

  loadImageFailed() {
    this.alertService.error('Invalid Format uploaded, Only .PNG, .JPG formats supported', {});
    this.imageLoad = false;
    this.imageChangedEvent = '';
  }

  crop() {
    this.imageLoad = false
    this.fileInput.nativeElement.value = '';
  }
  cancelUpload() {
    this.showCropper = false;
    this.croppedImage = null;
    this.imageChangedEvent = '';
    this.imageLoad = false;
    this.fileInput.nativeElement.value = '';
  }
  deleteUpload() {
    this.confirmService.confirm('', `Are you sure you want to delete?`,
      'Yes', 'No')
      .then((confirmed) => {
        if (confirmed) {
          this.showCropper = false;
          this.croppedImage = null;
          this.imageChangedEvent = '';
          this.imageLoad = false;
          this.fileInput.nativeElement.value = '';
        }
      })
      .catch(() => {

      });
  }

  zoomOut() {
    this.scale -= .1;
    this.transform = {
      ...this.transform,
      scale: this.scale
    };
  }

  zoomIn() {
    this.scale += .1;
    this.transform = {
      ...this.transform,
      scale: this.scale
    };
  }
}
