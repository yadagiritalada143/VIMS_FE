import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { SortHelperPipe } from '../shared/pipe/sort-helper.pipe';
import { ListPicklistComponent } from './list-picklist/list-picklist.component';

const routes: Routes = [{
  path: '',
  component: ListPicklistComponent
}];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
  providers: [SortHelperPipe]
})
export class PicklistRoutingModule { }
