import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { base64ToFile, Dimensions, ImageCroppedEvent, ImageTransform } from 'ngx-image-cropper';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { UserService } from 'src/app/core/services/user.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { errorHandler } from '../../../shared/util/error-handler';
import { LoginService } from '../../login/login.service';
@Component({
  selector: 'app-user-preference-header',
  templateUrl: './user-preference-header.component.html',
  styleUrls: ['./user-preference-header.component.scss']
})
export class UserPreferenceHeaderComponent implements OnInit {

  @Input() profileUser: any;
  @Input() programMember: any;
  @Output() loadData = new EventEmitter();
  public imageChangedEvent: any = '';
  public croppedImage: any = '';
  public canvasRotation = 0;
  public rotation = 0;
  public scale = 1;
  public showCropper = false;
  public containWithinAspectRatio = false;
  public transform: ImageTransform = {};
  public fileName: any;
  imageLoad: any;
  user_type:string= undefined;
  accountDetails:any= undefined;
  config:any;
  @ViewChild('fileInput') fileInput: ElementRef;
  constructor(
    private _alertService: AlertService,
    private storageService: StorageService,
    private userService: UserService,
    private loader: LoaderService,
    public login: LoginService
  ) { }

  ngOnInit(): void {
    this.user_type = this.storageService.get(StorageKeys.USER_TYPE)?.toLowerCase();
    this.accountDetails = this.storageService.get(StorageKeys.CURRENT_ACCOUNT);
    this.config = this.storageService.get(StorageKeys.CURRENT_PROGRAM)?.config;
  }

  fileChangeEvent(event: any): void {
    if (event && event.target && event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      const imageType = file.type;
      if ((file.size / 1028 / 1028) > 10) {
        this.showCropper = false;
        this.croppedImage = null;
        this.imageLoad = false;
        this._alertService.error('Profile Image size should not exceed more than 10 MB', {});
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

  cancelUpload() {
    this.showCropper = false;
    this.croppedImage = null;
    this.imageChangedEvent = '';
    this.imageLoad = false;
    this.fileInput.nativeElement.value = '';
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

  crop() {
    this.loader.show();
    const orgId = this.storageService.get(StorageKeys.ORGANIZATION_ID);
    const user = this.storageService.get(StorageKeys.CURRENT_USER);
    let programDetails = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    const programList = this.storageService.get('ProgramList');
    let programId = programDetails['id'];
    let userInfo = JSON.parse(JSON.stringify(this.profileUser));
    userInfo.role_id = this.profileUser?.role?.id;
    userInfo.email = user.email;
    userInfo.avatar = this.croppedImage;
    userInfo.program_id = programId;
    userInfo.programs = programList;
    if(userInfo.addresses && userInfo.addresses?.length) {
      delete userInfo.addresses;
    }
    if(userInfo.username) {
      delete userInfo.username;
    }
    if(userInfo?.hierarchy_units && !userInfo?.hierarchy_units.length){
     delete userInfo.hierarchy_units;
    }
    userInfo?.programs?.forEach(d => {
      d.program_id = d?.id;
    });
    delete userInfo.role;
    delete userInfo.addresses;
    delete userInfo.contacts;
    delete userInfo.work_locations;
    delete userInfo.preferred_time_zone;
    let payload = {
      avatar: this.croppedImage
    }
    const url = `/configurator/organizations/${orgId}/members/${user.id}`;
    this.userService.put(url, payload).subscribe((res) => {
      this.loadData.emit();
      this.loader.hide();
    }, (err) => {
      this.loader.hide();
    })
    this.imageLoad = false
    this.fileInput.nativeElement.value = '';
  }

  deleteProfile() {
    const orgId = this.storageService.get(StorageKeys.ORGANIZATION_ID);
    const user = this.storageService.get(StorageKeys.CURRENT_USER);
    const url = `/profile-manager/organizations/${orgId}/members/${user.id}/remove-avatar`
    this.userService.put(url,'').subscribe(
      data => {
        if (data) {
          this._alertService.success(`Profile image deleted successfully.`);
          this.loadData.emit();
        }
      },
      (err) => {
        this._alertService.error(errorHandler(err));
      });
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

  private isValidImageType(type: string): boolean {
    return /image\/(png|jpg|jpeg)/.test(type);
  }

  loadImageFailed() {
    this._alertService.error('Invalid format uploaded, only .JPG, .PNG formats are supported', {});
    this.imageLoad = false;
    this.imageChangedEvent = '';
  }


}
