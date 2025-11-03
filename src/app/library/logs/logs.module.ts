import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NewSharedModule } from '../../new-shared/new-shared.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { I18NextModule } from 'angular-i18next';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    NewSharedModule,
    SharedModule,
    I18NextModule,
  ],
  exports: []
})
export class LogsModule { }
