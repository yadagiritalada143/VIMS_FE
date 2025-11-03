import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TreeComponent } from './tree.component';
import { TreeNodeInfoFormComponent } from './components/tree-node-info-form/tree-node-info-form.component';
import { CreateTreeNodeComponent } from './create-tree-node/create-tree-node.component';
import { TreeContentComponent } from './tree-content/tree-content.component';
import { TreeHeaderComponent } from './tree-header/tree-header.component';
import { TreeNodeComponent } from './tree-content/tree-node/tree-node.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { RendererComponent } from './renderer/renderer.component';
import { FormsModule ,ReactiveFormsModule} from '@angular/forms';
import { ChildRendererComponent } from './child-renderer/child-renderer.component';
import { DndModule } from 'ngx-drag-drop';
import { FilterComponent } from './filter/filter.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { NewSharedModule } from 'src/app/new-shared/new-shared.module';
import { I18NextModule } from 'angular-i18next';


@NgModule({
  declarations: [TreeComponent, TreeNodeInfoFormComponent, CreateTreeNodeComponent, TreeContentComponent, TreeHeaderComponent, TreeNodeComponent, RendererComponent, ChildRendererComponent, FilterComponent],
  imports: [
    CommonModule,
    SharedModule,
    FormsModule,
    DndModule,
    NgSelectModule,
    ReactiveFormsModule,
    NewSharedModule,
    I18NextModule,
  ],
  exports: [
    TreeComponent,
    RendererComponent,
    SharedModule,
    ChildRendererComponent
  ]
})
export class TreeModule { }
