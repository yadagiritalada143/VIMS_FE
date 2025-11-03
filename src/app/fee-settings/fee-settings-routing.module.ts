import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FeeSettingsComponent } from './fee-settings.component';

const routes: Routes = [{
  path : "", component : FeeSettingsComponent, children :[{
  path: '',
  loadChildren: () => import('../self-configuration/configs/configuration/fees-configuration/fees-configuration.module').then(m => m.FeesConfigurationModule)
  }]

  
}];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class FeeSettingsRoutingModule { }
