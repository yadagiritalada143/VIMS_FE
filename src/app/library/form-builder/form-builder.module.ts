import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'src/app/shared/shared.module';
import { FormBuilderComponent } from './form-builder.component';
import { ToolboxComponent } from './toolbox/toolbox.component';
import { PropertyEditorComponent } from './property-editor/property-editor.component';
import { FormEditorComponent } from './form-editor/form-editor.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { InputFieldsComponent } from './toolbox/input-fields/input-fields.component';
import { HeadingsComponent } from './toolbox/headings/headings.component';
import { CustomDataComponent } from './property-editor/custom-data/custom-data.component';
import { NoFieldsComponent } from './no-fields/no-fields.component';
import { CustomFieldsComponent } from './custom-fields/custom-fields.component';
import { NewSharedModule } from 'src/app/new-shared/new-shared.module';
import { I18NextModule } from 'angular-i18next';

@NgModule({
  declarations: [
    FormBuilderComponent,
    ToolboxComponent,
    PropertyEditorComponent,
    FormEditorComponent,
    InputFieldsComponent,
    HeadingsComponent,
    CustomDataComponent,
    NoFieldsComponent,
    CustomFieldsComponent,
  ],
  imports: [CommonModule, SharedModule, FormsModule, NgSelectModule, NewSharedModule, I18NextModule],
  exports: [
    FormBuilderComponent,
    ToolboxComponent,
    PropertyEditorComponent,
    FormEditorComponent,
    CustomDataComponent,
    CustomFieldsComponent,
  ],
})
export class FormBuilderModule {}
