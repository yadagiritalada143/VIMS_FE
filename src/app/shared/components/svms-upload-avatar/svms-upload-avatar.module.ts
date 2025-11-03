import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SvmsUploadAvatarComponent } from './svms-upload-avatar.component';
import { ImageCropperModule } from 'ngx-image-cropper';
import { NewSharedModule } from 'src/app/new-shared/new-shared.module';
import { I18NextModule } from 'angular-i18next';
@NgModule({
  declarations: [SvmsUploadAvatarComponent],
  imports: [
    CommonModule,
    ImageCropperModule,
    NewSharedModule,
    I18NextModule,
  ],

  exports: [
    SvmsUploadAvatarComponent
  ]


})
export class SvmsUploadAvatarModule { }
