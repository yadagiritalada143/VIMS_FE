import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VmsTableModule } from '../../library/table/vms-table.module';
import { OnboardingConfigurationRoutingModule } from './onboarding-configuration-routing.module';
import { TaskChecklistComponent } from './task-checklist/task-checklist.component';
import { TaskListComponent } from './task-list/task-list.component';
import { CreateChecklistComponent } from './create-checklist/create-checklist.component';
import { SharedModule } from './../../shared/shared.module'
import { NgSelectModule } from '@ng-select/ng-select';
import { FormsModule, ReactiveFormsModule  } from '@angular/forms';
import { CreateTasklistComponent } from './create-tasklist/create-tasklist.component';
import { NewSharedModule } from 'src/app/new-shared/new-shared.module';
import { ViewChecklistComponent } from './view-checklist/view-checklist.component';
import { EditChecklistComponent } from './edit-checklist/edit-checklist.component';
import { I18NextModule } from 'angular-i18next';
@NgModule({
  declarations: [TaskChecklistComponent, TaskListComponent, CreateChecklistComponent, CreateTasklistComponent, ViewChecklistComponent, EditChecklistComponent],
  imports: [
    CommonModule,
    OnboardingConfigurationRoutingModule,
    VmsTableModule,
    SharedModule,
    NgSelectModule,
    FormsModule,
    ReactiveFormsModule,
    NewSharedModule,
    I18NextModule,
  ], exports: [
    CreateChecklistComponent,
    EditChecklistComponent,
    ViewChecklistComponent,
    CreateTasklistComponent
  ]
})
export class OnboardingConfigurationModule { }
