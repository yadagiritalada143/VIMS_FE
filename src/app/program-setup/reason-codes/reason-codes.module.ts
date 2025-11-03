import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ReasonCodesComponent} from './reason-codes.component';
import {ReasonCodesRoutingModule} from './reason-codes-routing.module';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {NgSelectModule} from '@ng-select/ng-select';
import {FormBuilderModule} from 'src/app/library/form-builder/form-builder.module';
import {VmsTableModule} from 'src/app/library/table/vms-table.module';
import {SharedModule} from 'src/app/shared/shared.module';
import { ReasonCodeCategoryComponent } from './reason-code-category/reason-code-category.component';
import {NewSharedModule} from 'src/app/new-shared/new-shared.module';
import {QuillModule} from 'ngx-quill';
import { I18NextModule } from 'angular-i18next';



@NgModule({
  declarations: [ReasonCodesComponent, ReasonCodeCategoryComponent],
  imports: [
    CommonModule,
    SharedModule,
    ReasonCodesRoutingModule,
    NgSelectModule,
    FormsModule,
    VmsTableModule,
    ReactiveFormsModule,
    FormBuilderModule,
    QuillModule.forRoot(),
    NewSharedModule,
    I18NextModule,
  ],
})
export class ReasonCodesModule {
}
