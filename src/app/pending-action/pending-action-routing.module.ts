import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PendingActionComponent } from './pending-action.component';
import { PendingActionContentComponent } from './pending-action-content/pending-action-content.component';

const routes: Routes = [
  {
    path: '',
    component: PendingActionComponent,
    children: [
      {
        path: 'content',
        component: PendingActionContentComponent,
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PendingActionRoutingModule {}
