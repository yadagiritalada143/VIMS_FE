import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { QuestionnaireRoutingModule } from './questionnaire-routing.module';
import { CreateQuestionnaireComponent } from './create-questionnaire/create-questionnaire.component';
import { ListQuestionnaireComponent } from './list-questionnaire/list-questionnaire.component';
import { QuestionnaireComponent } from './questionnaire.component';
import { VmsTableModule } from 'src/app/library/table/vms-table.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { NgSelectModule } from '@ng-select/ng-select';
import { DndModule } from 'ngx-drag-drop';
import { ListQuestionsComponent } from './list-questions/list-questions.component';
import { CreateQuestionsComponent } from './create-questions/create-questions.component';
import { QuestionnaireService } from './questionnaire.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NewSharedModule } from 'src/app/new-shared/new-shared.module';
import { I18NextModule } from 'angular-i18next';



@NgModule({
  declarations: [CreateQuestionnaireComponent, ListQuestionnaireComponent, QuestionnaireComponent, ListQuestionsComponent, CreateQuestionsComponent],
  imports: [
    CommonModule,
    QuestionnaireRoutingModule,
    VmsTableModule,
    SharedModule,
    NgSelectModule,
    DndModule,
    FormsModule,
    ReactiveFormsModule,
    NewSharedModule,
    I18NextModule,
  ],
  providers: [QuestionnaireService],

})
export class QuestionnaireModule { }
