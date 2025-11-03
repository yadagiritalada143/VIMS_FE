import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomFieldsComponent } from './custom-fields/custom-fields.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../../shared/shared.module';
import { NewSharedModule } from '../../new-shared/new-shared.module';
import { NgSelectModule } from '@ng-select/ng-select';
import { dynamicCustomFieldsComponent } from './dynamic-custom-fields/dynamic-custom-fields.component';
import { I18NextModule } from 'angular-i18next';
import { SortHelperPipe } from 'src/app/shared/pipe/sort-helper.pipe';

@NgModule({
  declarations: [CustomFieldsComponent, dynamicCustomFieldsComponent],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    NgSelectModule,
    SharedModule,
    NewSharedModule,
    CommonModule,
    I18NextModule,
    // CandidatesModule
  ],
  exports: [CustomFieldsComponent,dynamicCustomFieldsComponent],
  providers: [SortHelperPipe]
})
export class CustomFieldsModule { }
