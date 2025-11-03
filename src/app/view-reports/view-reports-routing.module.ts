import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ViewReportsComponent } from './view-reports.component';

const routes: Routes = [
  { path: '**', component: ViewReportsComponent, data: { type:'report' } },
  // { path: 'create-new', component: ViewReportsComponent, data:{type:'create'} },
  // { path: 'standard-reports', component: ViewReportsComponent, data:{type:'standard'} },
  // { path: 'dashboards', component: ViewReportsComponent, data:{type:'dashboard'} },
  // { path: 'schedules', component: ViewReportsComponent, data:{type:'schedule'} },
  // { path: 'folders', component: ViewReportsComponent, data:{type:'folder'} },
  // { path: '', component: ViewReportsComponent,data:{type:'/reports/recent'} },
  // { path: 'create-report', component: ViewReportsComponent, data:{type:'/reports/add'} },
  // { path: 'create-new', component: ViewReportsComponent, data:{type:'/create-new'} },
  // { path: 'create-dashboard', component: ViewReportsComponent, data:{type:'/dashboard/dashboard-templates'} },
  // { path: 'standard-reports', component: ViewReportsComponent, data:{type:'standard'} },
  // { path: 'dashboards', component: ViewReportsComponent, data:{type:'/dashboards/recent'} },
  // { path: 'schedules', component: ViewReportsComponent, data:{type:'schedule'} },
  // { path: 'folders', component: ViewReportsComponent, data:{type:'/folders-all'} },
  // { path: 'bookmarks', component: ViewReportsComponent, data:{type:'/bookmarks/reports'} },
  // { path: 'archives', component: ViewReportsComponent, data:{type:'/archive/reports'} },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ViewReportsRoutingModule { }
