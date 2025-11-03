import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { OnbaordSetupComponent } from './onbaord-setup/onbaord-setup.component';
import { VendorComplianceListComponent } from './vendor-compliance-list/vendor-compliance-list.component';
import { VendorConfigurationComponent } from './vendor-configuration/vendor-configuration.component';
import { VendorGroupComponent } from './vendor-group/vendor-group.component';
import { VendorListComponent } from './vendor-list/vendor-list.component';
import { VendorManagmentComponent } from './vendor-managment.component';
import { VendorUserListComponent } from './vendor-users/user-list/user-list.component';
import { AuthguardService } from 'src/app/core/services/auth_guard.service';

const routes: Routes = [
  { path: '', redirectTo: '', pathMatch: 'full' },
  {
    path: '', component: VendorManagmentComponent,
    children: [
      {
        path: 'setup',
        canActivate: [AuthguardService],
        data: {
          userRoles: ['vendor_details']
        },
        component: OnbaordSetupComponent
      },
      { path: 'program-list', component: VendorConfigurationComponent },
      { path: 'vendor-list', component: VendorListComponent },
      { path: 'vendor-group', component: VendorGroupComponent },
      { path: 'compliance-list/:progId/:orgId', component: VendorComplianceListComponent },
      { path: 'users/list', component: VendorUserListComponent },
      { path: 'users/list/:add', component: VendorUserListComponent },

    ]
  }

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class VendorManagmentRoutingModule { }
