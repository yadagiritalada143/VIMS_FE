import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { VendorComponent} from './vendor.component';
import { VendorListComponent } from './vendor-list/vendor-list.component';
import { VendorGroupListComponent } from './vendor-group-list/vendor-group-list.component';
import { VendorDsListComponent } from './vendor-ds-list/vendor-ds-list.component';
import { CreateVendorComponent } from './create-vendor/create-vendor.component';
import { CreateVendorGroupComponent } from './create-vendor-group/create-vendor-group.component';
import { CreateVendorScheduleComponent } from './create-vendor-schedule/create-vendor-schedule.component';
import { VendorComplianceListComponent } from './vendor-compliance-list/vendor-compliance-list.component';
import { VendorDocumentGroupListComponent } from './vendor-document-group-list/vendor-document-group-list.component';
import { ComplianceRestrictionRuleComponent } from './compliance-restriction-rule/compliance-restriction-rule.component';
import { NewComplianceRestictionRuleComponent } from './new-compliance-restiction-rule/new-compliance-restiction-rule.component';
import { AuthguardService } from 'src/app/core/services/auth_guard.service'
const routes: Routes = [
  {
    path: '',
    component: VendorComponent,
    children: [
      {
        path: 'create-vendor',
        canActivate: [AuthguardService],
        data: { userRoles: ['vendors_manage'] },
        component: CreateVendorComponent
      },
      {
        path: 'vendor-list',
        canActivate: [AuthguardService],
        data: { userRoles: ['menu_vendor','vendors_view'] },
        component: VendorListComponent
      },
      {
        path: 'vendor-group-list',
        canActivate: [AuthguardService],
        data: { userRoles: ['menu_vendor','vendor_group_view'] },
        component: VendorGroupListComponent
      },
      {
        path: 'vendor-distribution-list',
        canActivate: [AuthguardService],
        data: { userRoles: ['menu_vendor_distribution','vendor_distribution_schedule_view'] },
        component: VendorDsListComponent
      },
      {
        path: 'vendor-compliance-list',
        canActivate: [AuthguardService],
        data: { userRoles: ['menu_vendor_compliance','vendor_compliance_view'] },
        component: VendorComplianceListComponent
      },
      {
        path: 'vendor-document-group-list',
        canActivate: [AuthguardService],
        data: { userRoles: ['menu_vendor_compliance','vendor_compliance_view'] },
        component: VendorDocumentGroupListComponent
      },
      {
        path: 'new-vendor-document',
        canActivate: [AuthguardService],
        data: { userRoles: ['vendor_compliance_manage'] },
        component: CreateVendorGroupComponent
      },
      {
        path: 'create-vendor-schedule',
        canActivate: [AuthguardService],
        data: { userRoles: ['vendor_distribution_schedule_manage'] },
        component: CreateVendorScheduleComponent
      },
      {
        path: 'compliance-restriction-rule',
        canActivate: [AuthguardService],
        data: { userRoles: ['menu_vendor_compliance','vendor_compliance_view'] },
        component: ComplianceRestrictionRuleComponent
      },
      {
        path: 'create-compliance-rule',
        canActivate: [AuthguardService],
        data: { userRoles: ['vendor_compliance_manage'] },
        component: NewComplianceRestictionRuleComponent
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class VendorRoutingModule { }
