import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SimpleTableComponent } from './simple-table/simple-table.component';
import { HeaderComponent } from './header/header.component';
import { NewSharedModule } from 'src/app/new-shared/new-shared.module';
import { PerfectScrollbarModule } from 'ngx-perfect-scrollbar';
import { TableIconComponent } from './table-icon/table-icon.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { NgSelectModule } from '@ng-select/ng-select';
import { SimpleRowComponent } from './simple-row/simple-row.component';
import { FormsModule } from '@angular/forms';
import { I18NextModule } from 'angular-i18next';



@NgModule({
  declarations: [SimpleTableComponent, HeaderComponent, TableIconComponent, SimpleRowComponent],
  imports: [
    CommonModule,
    NgSelectModule,
    SharedModule,
    PerfectScrollbarModule,
    NewSharedModule,
    FormsModule,
    I18NextModule,
  ],
  exports: [SimpleTableComponent]
})
export class SimpleTableModule { }
