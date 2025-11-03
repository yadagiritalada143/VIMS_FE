import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/shared/shared.module';
import { CommonModule } from '@angular/common';
import { DndModule } from 'ngx-drag-drop';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { NewSharedModule } from 'src/app/new-shared/new-shared.module';
import { PerfectScrollbarModule, PERFECT_SCROLLBAR_CONFIG } from 'ngx-perfect-scrollbar';
import { SvmsTablePaginatorComponent } from '../svms-table/svms-table-paginator/svms-table-paginator.component';
import { SvmsTableFilterComponent } from './svms-table-filter/svms-table-filter.component';
import { SvmsTableHeaderComponent } from './svms-table-header/svms-table-header.component';
import { SvmsTableRowComponent } from './svms-table-row/svms-table-row.component';
import { SvmsTableComponent } from './svms-table.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ClickOutsideModule } from 'ng-click-outside';
import { SvmsDropdownComponent } from '../svms-dropdown/svms-dropdown.component';
import { SvmsColoumnFilterComponent } from './svms-coloumn-filter/svms-coloumn-filter.component';
import { OrderByPipe } from './pipe/order-by.pipe';
import { SvmsColumnSettingComponent } from './svms-column-setting/svms-column-setting.component';
import { I18NextModule } from 'angular-i18next';

@NgModule({
  declarations: [
    SvmsTableRowComponent,
    SvmsTableFilterComponent,
    SvmsTableHeaderComponent,
    SvmsTableComponent,
    SvmsTablePaginatorComponent,
    SvmsDropdownComponent,
    SvmsColoumnFilterComponent,
    SvmsColumnSettingComponent,
    OrderByPipe
  ],
  imports: [
    CommonModule,
    DndModule,
    NgSelectModule,
    SharedModule,
    NgxSkeletonLoaderModule,
    FormsModule,
    ReactiveFormsModule,
    NewSharedModule,
    PerfectScrollbarModule,
    NgbModule,
    ClickOutsideModule,
    I18NextModule,
  ],
  providers: [
       {
       provide: PERFECT_SCROLLBAR_CONFIG,
        useValue: PERFECT_SCROLLBAR_CONFIG
      }
   ],
  exports: [SvmsTableComponent, SvmsTablePaginatorComponent]
})
export class SvmsTableModule { }
