import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HierarchyChildRendererComponent } from './hierarchy-child-renderer/hierarchy-child-renderer.component';
import { HierarchyComponent } from './hierarchy.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { FormsModule } from '@angular/forms';
import { I18NextModule } from 'angular-i18next';
import { NewSharedModule } from 'src/app/new-shared/new-shared.module';
import { NgSelectModule } from "@ng-select/ng-select";
import { NewHierarchyComponent } from './new-hierarchy/new-hierarchy.component';
import { NewHierarchyChildRendererComponent } from './new-hierarchy/new-hierarchy-child-renderer/new-hierarchy-child-renderer.component'


@NgModule({
  declarations: [HierarchyComponent, HierarchyChildRendererComponent, NewHierarchyComponent, NewHierarchyChildRendererComponent],
  imports: [
    CommonModule,
    SharedModule,
    FormsModule,
    I18NextModule,
    NewSharedModule,
    NgSelectModule,
  ],
  exports: [HierarchyComponent,NewHierarchyComponent]
})
export class SvmsHierarchyModule { }
