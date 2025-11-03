import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { base64ToFile, Dimensions, ImageCroppedEvent, ImageTransform } from 'ngx-image-cropper';
import { EventStreamService } from '../../../core/services/event-stream.service';
import { AlertService } from '../../../core/components/alert/alert.service';
import { ConfirmationDialogService } from 'src/app/shared/components/confirmation-dialog/confirmation-dialog.service';

@Component({
  selector: 'svms-upload-profile-avatar',
  templateUrl: './svms-upload-profile-avatar.component.html',
  styleUrls: ['./svms-upload-profile-avatar.component.scss']
})
export class SvmsUploadProfileAvatarComponent {

  public imageChangedEvent: any = '';
  public croppedImage: any = '';
  public canvasRotation = 0;
  public rotation = 0;
  public scale = 1;
  public showCropper = false;
  public containWithinAspectRatio = false;
  public transform: ImageTransform = {};
  public imageLoad: boolean;
  public fileName: any;
  public logoUrl: any;
  public logoValidations: any;
  public logoSize: any;
  @Output() hideError = new EventEmitter();
  @Output() nfilename = new EventEmitter();
  @Input() avatar;

  @ViewChild('fileInput') fileInput: ElementRef;
  _image: any;
  @Input() set image(data) {
    // if(data){
    this._image = data;
    this.showCropper = true;
    this.croppedImage = this._image;
    this.logoUrl = this.croppedImage;
    // }
  }
  @Input() removable: Boolean = true;
  @Output('onRemove') removed = new EventEmitter();

  get image() {
    return this._image;
  }
  constructor(
    public eventStream: EventStreamService,
    private _alertService: AlertService,
    private confirmService: ConfirmationDialogService,
  ) {}

  ngOnChanges(changes) {
    if (this.avatar) {
      this.showCropper = true;
      this.croppedImage = this.avatar;
      this.logoUrl = this.croppedImage;
    }
  }

  ngOnInit(): void {}
  private isValidImageType(type: string): boolean {
    return /image\/(png|jpg|jpeg)/.test(type);
  }

  fileChangeEvent(event: any): void {
    if (event && event.target && event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      const imageType = file.type;
      if (file.size / 1028 / 1028 > 3) {
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
    const validations = base64ToFile(event.base64);
    if (validations.type === 'image/png' || validations.type === 'image/jpg') {
    }

    this.logoUrl = this.croppedImage;
    this.hideError.emit(this.logoUrl);
  }

  imageLoaded() {
    this.showCropper = true;
  }

  cropperReady(sourceImageDimensions: Dimensions) {}

  loadImageFailed() {
    this._alertService.error('Invalid Format uploaded, Only .PNG, .JPG formats supported', {});
    this.imageLoad = false;
    this.imageChangedEvent = '';
  }

  crop() {
    this.imageLoad = false;
    this.fileInput.nativeElement.value = '';
    this.hideError.emit(this.croppedImage);
    this.nfilename.emit({ name: this.fileName, raw: this.croppedImage });
  }

  removeUpload() {
    this.confirmService
      .confirm('', `Do you want to remove the profile picture?`, 'Yes', 'No')
      .then(confirmed => {
        if (confirmed) {
          this.croppedImage = null;
          this.hideError.emit(this.croppedImage);
          this.removed.emit(true);
          this.imageChangedEvent = '';
          this.imageLoad = false;
          this.fileInput.nativeElement.value = '';
          this.nfilename.emit(null);
        }
      })
      .catch(_ => {});
  }

  cancelUpload() {
    this.croppedImage = null;
    this.hideError.emit(this.croppedImage);
    this.imageChangedEvent = '';
    this.imageLoad = false;
    this.fileInput.nativeElement.value = '';
    this.nfilename.emit(null);
  }

  zoomOut() {
    this.scale -= 0.1;
    this.transform = {
      ...this.transform,
      scale: this.scale,
    };
  }

  zoomIn() {
    this.scale += 0.1;
    this.transform = {
      ...this.transform,
      scale: this.scale,
    };
  }

}
