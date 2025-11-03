import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ConfigureEditRulesComponent } from './components/configure-edit-rules/configure-edit-rules.component';
import { ListEditRulesComponent } from './components/list-edit-rules/list-edit-rules.component';
import { EditRulesComponent } from './edit-rules.component';

const routes: Routes = [
  { path: '', redirectTo: '', pathMatch: 'full' },
  {
    path: '',
    component: EditRulesComponent,
    children: [
      { path: 'configure-edit-rules', component:  ListEditRulesComponent},
      { path: 'create-edit-rules', component: ConfigureEditRulesComponent},
      { path: 'edit-edit-rules/:id', component: ConfigureEditRulesComponent},
      { path: 'view-edit-rules/:id', component: ConfigureEditRulesComponent}
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EditRulesRoutingModule {}