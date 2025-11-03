import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { RulesListComponent } from './rule-list/rules-list.component';
import { NewRuleComponent } from './new-rule/new-rule.component';
import { RulesViewComponent } from './rule-view/rules-view.component';
import { AuthguardService } from 'src/app/core/services/auth_guard.service';

const routes: Routes = [
  {
    path: 'list', 
    component:RulesListComponent,
    canActivateChild: [AuthguardService],
    data: {
      userRoles: ['rule_builder_view']
    }
  },
  { path: 'create', 
    component: NewRuleComponent,
    canActivateChild: [AuthguardService],
    data: {
      userRoles: ['rule_builder_manage']
    }
  },
  {
    path: 'view/:id', 
    component: RulesViewComponent,
    canActivateChild: [AuthguardService],
    data: {
      userRoles: ['rule_builder_view']
    }
  },
  // {  
  //   path: 'edit/:id', 
  //   component: NewRuleComponent,
  //   canActivateChild: [AuthguardService],
  //   data: {
  //     userRoles: ['rule_builder_manage']
  //   }
  // }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class RulesManagementRoutingModule { }
