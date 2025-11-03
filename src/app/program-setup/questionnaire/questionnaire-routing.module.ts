import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ListQuestionnaireComponent } from './list-questionnaire/list-questionnaire.component';
import { CreateQuestionnaireComponent } from './create-questionnaire/create-questionnaire.component';
import { QuestionnaireComponent } from './questionnaire.component';
import { ListQuestionsComponent } from './list-questions/list-questions.component';
import { CreateQuestionsComponent } from './create-questions/create-questions.component';

const routes: Routes = [
  {
    path: '',
    component: QuestionnaireComponent,
    children: [
      { path: 'create', component: CreateQuestionnaireComponent },
      { path: 'create/:id/:name', component: CreateQuestionnaireComponent },
      { path: 'list', component: ListQuestionnaireComponent },
      { path: 'list-question', component: ListQuestionsComponent },
      { path: 'create-question', component: CreateQuestionsComponent },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class QuestionnaireRoutingModule { }
