import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { OrganizationsComponent } from './organizations.component';
import { OrganizationListComponent } from './organization-list/organization-list.component';
// import { NoOrganizationComponent } from './no-organization/no-organization.component';

const routes: Routes = [
  {
    path: '',
    component: OrganizationsComponent,
    children: [
      { path: 'list/:term', component: OrganizationListComponent },
      // { path: '', component: NoOrganizationComponent },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class OrganizationsRoutingModule {}
