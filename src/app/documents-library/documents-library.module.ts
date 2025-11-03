import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DocumentsLibraryRoutingModule } from './documents-library-routing.module';
import { DocumentsFoldersListComponent } from './documents-folders-list/documents-folders-list.component';
import { DocumentsLibrarySidebarComponent } from './documents-library-sidebar/documents-library-sidebar.component';
import { DocumentsFavouritesListComponent } from './documents-favourites-list/documents-favourites-list.component';
import { VmsTableModule } from '../library/smartTable/vms-table.module';
import { SvmsTableModule } from "../library/svms-table/svms-table.module";
import { NewSharedModule } from '../new-shared/new-shared.module';
import { SharedModule } from '../shared/shared.module';
import { NgSelectModule } from '@ng-select/ng-select';
import { DndModule } from 'ngx-drag-drop';
import { DocumentsFilesListComponent } from './documents-files-list/documents-files-list.component';
import { FormsModule } from '@angular/forms';
import { TreeviewModule } from 'ngx-treeview';
import { SortHelperPipe } from 'src/app/shared/pipe/sort-helper.pipe';
import { DocumentsLibraryComponent } from './documents-library.component';
import { HierarchyModule } from "../program-setup/hierarchy/hierarchy.module";
import { I18NextModule} from 'angular-i18next';
@NgModule({
  declarations: [DocumentsFoldersListComponent, DocumentsLibrarySidebarComponent, DocumentsFilesListComponent, DocumentsFavouritesListComponent, DocumentsLibraryComponent],
  imports: [
    CommonModule,
    DocumentsLibraryRoutingModule,
    VmsTableModule,
    NewSharedModule,
    SharedModule,
    NgSelectModule,
    HierarchyModule,
    SvmsTableModule,
    DndModule,
    TreeviewModule.forRoot(),
    FormsModule,
    I18NextModule.forRoot()
  ],
  providers: [
    SortHelperPipe
  ]
})
export class DocumentsLibraryModule { }
