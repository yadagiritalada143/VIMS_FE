import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { InterviewsComponent } from './components/interviews/interviews.component';
import { OffersComponent } from './components/offers/offers.component';
import { ScheduleInterviewComponent } from './components/schedule-interview/schedule-interview.component';
import { SubmittedDetailsComponent } from './components/submitted-details/submitted-details.component';

const routes = [

    { path: ':jobid/candidate/:candidateId', component: SubmittedDetailsComponent, matchPath: 'full' },
    { path: ':jobid/candidate/:candidateId/offer', component: OffersComponent },
    { path: ':jobid/candidate/:candidateId/interviews', component: InterviewsComponent },
    { path: ':jobid/candidate/:candidateId/schedule-interview', component: ScheduleInterviewComponent },
];


@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})


export class SubmittedCandidateRoutingModule { }