import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { DocumentsFoldersListComponent } from './documents-folders-list/documents-folders-list.component';
import { DocumentsFilesListComponent } from './documents-files-list/documents-files-list.component';
import { DocumentsFavouritesListComponent } from './documents-favourites-list/documents-favourites-list.component';
import { DocumentsLibraryComponent } from './documents-library.component';

const routes: Routes = [
  {
    path: '',
    component: DocumentsLibraryComponent,
    children: [
      {
        path: 'folder-list',
        component:DocumentsFoldersListComponent
      },
      {
        path: 'document-list/:id',
        component: DocumentsFilesListComponent
      },
      {
        path: 'favorites',
        component: DocumentsFavouritesListComponent
      },
      {
        path: 'favorites/document-list/:id',
        component: DocumentsFavouritesListComponent
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DocumentsLibraryRoutingModule { }
