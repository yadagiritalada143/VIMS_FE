import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SvmsUploadUserAvatarComponent } from './svms-upload-avatar.component';
import { ImageCropperModule } from 'ngx-image-cropper';
import { NewSharedModule } from 'src/app/new-shared/new-shared.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { I18NextModule } from 'angular-i18next';
@NgModule({
  declarations: [SvmsUploadUserAvatarComponent],
  imports: [
    CommonModule,
    ImageCropperModule,
    NewSharedModule,
    SharedModule,
    I18NextModule,
  ],
  exports: [
    SvmsUploadUserAvatarComponent
  ]


})
export class SvmsUploadAvatarModule { }
