import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../../shared/shared.module';
import { NewSharedModule } from '../../new-shared/new-shared.module';
import { NgSelectModule } from '@ng-select/ng-select';
import { FoundationalFieldsComponent } from '../foundational-fields/foundational-fields/foundational-fields.component';
import { I18NextModule } from 'angular-i18next';

@NgModule({
  declarations: [FoundationalFieldsComponent],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    NgSelectModule,
    SharedModule,
    NewSharedModule,
    CommonModule,
    I18NextModule,
  ],
  exports: [FoundationalFieldsComponent]
})
export class FoundationalFieldsModule { }
