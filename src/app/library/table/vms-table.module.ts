import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/shared/shared.module';
import { CommonModule } from '@angular/common';
import { VMSTableComponent } from './table/table.component';
import { VMSRowComponent } from './row/row.component';
import { VMSPaginatorComponent } from './paginator/paginator.component';
import { VMSHeaderComponent } from './header/header.component';
import { ShortNamePipe } from './pipe/short-name.pipe';
import { TableIconComponent } from './table-icon/table-icon.component';
import { DndModule } from 'ngx-drag-drop';
import { FilterComponent } from './filter/filter.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { NewSharedModule } from 'src/app/new-shared/new-shared.module';
import { PerfectScrollbarModule, PERFECT_SCROLLBAR_CONFIG } from 'ngx-perfect-scrollbar';
import { I18NextModule } from 'angular-i18next';

@NgModule({
  declarations: [
    VMSTableComponent,
    VMSRowComponent,
    VMSPaginatorComponent,
    VMSHeaderComponent,
    ShortNamePipe,
    TableIconComponent,
    FilterComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    DndModule,
    NgSelectModule,
    SharedModule,
    NgxSkeletonLoaderModule,
    FormsModule,
    ReactiveFormsModule,
    NewSharedModule,
    PerfectScrollbarModule,
    I18NextModule,
  ],
  providers: [
       {
       provide: PERFECT_SCROLLBAR_CONFIG,
        useValue: PERFECT_SCROLLBAR_CONFIG
      }
   ],
  exports: [VMSTableComponent,TableIconComponent]
})
export class VmsTableModule { }
