import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { svmsResumeUploadComponent } from './resume-upload.component';
import { NewSharedModule } from '../../new-shared/new-shared.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { I18NextModule } from 'angular-i18next';

@NgModule({
  declarations: [svmsResumeUploadComponent],
  imports: [CommonModule, NewSharedModule, SharedModule, I18NextModule],
  exports: [svmsResumeUploadComponent],
})
export class ResumeUploadModule {}
