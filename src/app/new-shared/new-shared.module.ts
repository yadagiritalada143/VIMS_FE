import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from './components/icon/icon.component';
import { SvmsTabsComponent } from './components/svms-tabs/svms-tabs.component';
import { UploadDocumentsComponent } from './components/upload-documents/upload-documents.component';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { LocalDateTimeFormatPipe } from 'src/app/shared/pipe/local-date-time-format.pipe';
import { CustomcurrencyPipe } from '../shared/pipe/customcurrency.pipe';
import { UploadDocumentS3Component } from './components/upload-document-s3/upload-document-s3.component';
import { DateOfBirthPipe } from 'src/app/shared/pipe/date-of-birth-format.pipe';
import { I18NextModule } from 'angular-i18next';
import { AddAttachmentComponent } from './components/add-attachment/add-attachment.component';
import { ToggleComponent } from './components/toggle/toggle.component';

@NgModule({
  declarations: [IconComponent, SvmsTabsComponent, UploadDocumentsComponent, LocalDateFormatPipe, CustomcurrencyPipe, LocalDateTimeFormatPipe, UploadDocumentS3Component, DateOfBirthPipe, AddAttachmentComponent, ToggleComponent],
  imports: [
    CommonModule, I18NextModule,
  ],
  exports: [IconComponent, SvmsTabsComponent, UploadDocumentsComponent, LocalDateFormatPipe, CustomcurrencyPipe, LocalDateTimeFormatPipe,UploadDocumentS3Component, DateOfBirthPipe, AddAttachmentComponent],
  schemas: [NO_ERRORS_SCHEMA],
  providers: [LocalDateFormatPipe, CustomcurrencyPipe, LocalDateTimeFormatPipe]
})
export class NewSharedModule { }
