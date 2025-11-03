import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CandidateScreeningComponent } from  './candidate-screening.component';
import { ShortlistingComponent } from './shortlisting/shortlisting.component';

const routes: Routes = [
  {
    path: '',
    component: CandidateScreeningComponent,
    children: [
      { path: 'shortlisting', component: ShortlistingComponent },
    ],
  },
];
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CandidateScreeningRoutingModule { }
