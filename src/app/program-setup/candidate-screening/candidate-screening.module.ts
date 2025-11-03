import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CandidateScreeningRoutingModule } from './candidate-screening-routing.module';
import { CandidateScreeningComponent } from './candidate-screening.component';
import { ShortlistingComponent } from './shortlisting/shortlisting.component';
import { NewSharedModule } from 'src/app/new-shared/new-shared.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { ReactiveFormsModule ,FormsModule  } from '@angular/forms';
import { ShortlistingService } from './shortlisting.service';
import { InterviewComponent } from './interview/interview.component';
import { OfferComponent } from './offer/offer.component';
import { SubmissionComponent } from './submission/submission.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { OnboardingComponent } from './onboarding/onboarding.component';
import { I18NextModule } from 'angular-i18next';
import { JobComponent } from './job/job.component';



@NgModule({
  declarations: [CandidateScreeningComponent, ShortlistingComponent, InterviewComponent, OfferComponent, SubmissionComponent, OnboardingComponent, JobComponent],
  imports: [
    CommonModule,
    CandidateScreeningRoutingModule,
    NewSharedModule,
    SharedModule,
    ReactiveFormsModule,
    FormsModule,
    NgSelectModule,
    I18NextModule,
  ],
  providers: [ShortlistingService]
})
export class CandidateScreeningModule { }
