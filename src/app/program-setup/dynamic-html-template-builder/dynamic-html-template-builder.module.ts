import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DynamicHtmlTemplateBuilderRoutingModule } from './dynamic-html-template-builder-routing.module';
import {RowRendererComponent} from './components/row-renderer/row-renderer.component';
import {ItemRendererComponent} from './components/item-renderer/item-renderer.component';
import {ColRendererComponent} from './components/col-renderer/col-renderer.component';
import {TemplateDesignerComponent} from './components/template-designer/template-designer.component';
import { ItemPropertiesComponent } from './components/item-properties/item-properties.component';
import { ToolbarComponent } from './components/toolbar/toolbar.component';
import { KeyValuePairGeneratorComponent } from './components/key-value-pair-generator/key-value-pair-generator.component';
import { NewSharedModule } from 'src/app/new-shared/new-shared.module';
import { PerfectScrollbarModule } from 'ngx-perfect-scrollbar';
import { SharedModule } from 'src/app/shared/shared.module';
import { NgSelectModule } from '@ng-select/ng-select';
import { FormsModule } from '@angular/forms';
import { ItemQuillEditorComponent } from './components/item-properties/item-quill-editor/item-quill-editor.component';
import { QuillModule } from 'ngx-quill';
import { DesignPanelComponent } from './components/design-panel/design-panel.component';
import { CustomHtmlComponent } from './components/custom-html/custom-html.component';
import { TemplateRenderComponent } from './components/template-render/template-render.component';
import { I18NextModule } from 'angular-i18next';



@NgModule({
  declarations: [
    TemplateDesignerComponent,
    ColRendererComponent,
    ItemRendererComponent,
    RowRendererComponent,
    ItemPropertiesComponent,
    ToolbarComponent,
    KeyValuePairGeneratorComponent,
    ItemQuillEditorComponent,
    DesignPanelComponent,
    CustomHtmlComponent,
    TemplateRenderComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    NewSharedModule,
    PerfectScrollbarModule,
    DynamicHtmlTemplateBuilderRoutingModule,
    SharedModule,
    NgSelectModule,
    QuillModule.forRoot(),
    I18NextModule,
  ],
  exports: [
    TemplateDesignerComponent,
    ColRendererComponent,
    ItemRendererComponent,
    RowRendererComponent,
    ItemPropertiesComponent,
    ToolbarComponent,
    KeyValuePairGeneratorComponent,
    DesignPanelComponent,
    CustomHtmlComponent,
    TemplateRenderComponent
  ]
})
export class DynamicHtmlTemplateBuilderModule { }
