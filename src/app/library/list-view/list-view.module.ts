import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SvmsTableModule } from '../svms-table/svms-table.module';
import { ListViewComponent } from './list-view.component';
import { ListViewRoutingModule } from './list-view.routing';
import { I18NextModule } from 'angular-i18next';

@NgModule({
  declarations: [ListViewComponent],
  imports: [CommonModule,SvmsTableModule, ListViewRoutingModule,I18NextModule],
  exports: [ListViewComponent],
})
export class ListViewModule {}
