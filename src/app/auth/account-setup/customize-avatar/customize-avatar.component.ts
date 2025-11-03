import { Component, OnInit, EventEmitter, ViewChild, ElementRef, Output } from '@angular/core';
import { Dimensions, ImageCroppedEvent, ImageTransform, base64ToFile } from 'ngx-image-cropper';
import { StorageService } from 'src/app/core/services/storage.service';
import { AccountService } from '../account.service';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertService } from '../../../core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { ConfirmationDialogService } from 'src/app/shared/components/confirmation-dialog/confirmation-dialog.service';


@Component({
  selector: 'app-customize-avatar',
  templateUrl: './customize-avatar.component.html',
  styleUrls: ['./customize-avatar.component.scss']
})
export class CustomizeAvatarComponent implements OnInit {
  @Output() onNext = new EventEmitter();
  chooseColor = false;
  @Output() onBack = new EventEmitter(false)
  @Output() onSkip = new EventEmitter();

  name = 'SN'

  public imageChangedEvent: any = '';
  public croppedImage: any = '';
  public canvasRotation = 0;
  public rotation = 0;
  public scale = 1;
  public showCropper = false;
  public containWithinAspectRatio = false;
  public transform: ImageTransform = {};

  public avatarList = [
    { "color": "#6F5CEC" },
    { "color": "#FF9628" },
    { "color": "#FF4D1F" },
    { "color": "#F22626" },
    { "color": "#FF00FC" },
    { "color": "#1D1D1D" }
  ]

  public defaultColor = this.avatarList[0]?.color;
  public imageLoad: boolean;
  public userToken: any;
  public fileName: any;
  orgId: any;
  @ViewChild('fileInput') fileInput: ElementRef;

  constructor(private storageService: StorageService,
    private accountService: AccountService,
    private route: ActivatedRoute,
    private router: Router,
    private _alertService: AlertService,
    private loaderService: LoaderService,
    private confirmService: ConfirmationDialogService,
  ) { }

  ngOnInit(): void {

    this.route.queryParams.subscribe(
      params => {
        this.orgId = params['orgId'];
        this.userToken = params['token']
      }
    )
    let user = this.storageService.get('user');
    if (user) {
      this.name = user.first_name + ' ' + user.last_name
    }
    let member = this.storageService.get('members');
    if (member) {
      this.croppedImage = member?.image || member?.avatar;
    }
    this.defaultColor = (this.storageService.get('colorAvatar') != undefined && this.storageService.get('colorAvatar') != null) ? this.storageService.get('colorAvatar') : this.defaultColor;
    this.showCropper = this.croppedImage !== undefined ? true : false;
  }
  private isValidImageType(type: string): boolean {
    return /image\/(png|jpg|jpeg)/.test(type);
  }

  setAvatar(e, value) {
    if (e.target.checked) {
      this.defaultColor = value.color;
    }
  }

  onBackClick() {
    this.onBack.emit(true);
    this.router.navigate(['auth/basic-details'], { queryParams: { orgId: this.orgId, token: this.userToken } });
    //Temporary disabling security questions section - TFSB PROD issue
    // this.router.navigate(['auth/security-questions'], { queryParams: { orgId: this.orgId, token: this.userToken } });
  }

  onSkipClick() {
    this.onSkip.emit(true)
    this.router.navigate(['auth/theme-color'], { queryParams: { orgId: this.orgId, token: this.userToken } });
  }

  chooseColorTheme() {
    let user = this.storageService.get('user');
    let members = this.storageService.get('members');
    if (this.croppedImage) {
      let requestPayload = {
        "file_name": this.fileName,
        "image": this.croppedImage
      }
      if (requestPayload.image !== undefined) { members.image = requestPayload.image; }
      this.storageService.set('members', members, true);
      this.accountService.updateAvatar(this.orgId, this.userToken, requestPayload).subscribe((res) => {
        members.avatar = res['url'];
        user.avatar = res['url'];
        this.storageService.set('user', user, true);
        this.storageService.set('members', members, true);
      }, (err) => {
        this.loaderService.hide();
        // this._alertService.error(errorHandler(err));
      })
    } else {
      this.storageService.set('colorAvatar', this.defaultColor, true)
      let paylod = { "avatar_color": this.defaultColor }
      this.accountService.updateAvatar(this.orgId, this.userToken, paylod).subscribe((res) => {
        members.avatar = res['url'];
        this.storageService.set('members', members, true);
      }, (err) => {
        this.loaderService.hide();
        // this._alertService.error(errorHandler(err));
      })
    }
    this.onNext.emit({ defaultColor: this.defaultColor });
  }

  fileChangeEvent(event: any): void {
    if (event && event.target && event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      const imageType = file.type;
      if ((file.size / 1028 / 1028) > 3) {
        this.showCropper = false;
        this.croppedImage = null;
        this.imageLoad = false;
        this._alertService.error('Logo size should not exceed more than 3 MB', {});
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
    let members = this.storageService.get('members'); 
    members.image = event.base64; 
    this.storageService.set('members', members, true); 
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
    this._alertService.error('Invalid Format uploaded, Only .PNG, .JPG formats supported', {});
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
