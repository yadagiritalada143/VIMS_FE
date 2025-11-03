import { NgModule } from '@angular/core';
import { SowsRoutingModule } from './sows-routing.module'
import { ListSowsComponent } from './lists/sows.component';
import { CreateSowsComponent } from './create-sow/sows.component';
import { ProjectListComponent } from './project-list/project-list.component';
import { AllProgressUpdateComponent } from './all-progress-update/all-progress-update.component';

@NgModule({
    declarations: [ListSowsComponent, CreateSowsComponent, ProjectListComponent, AllProgressUpdateComponent],
    imports: [
        SowsRoutingModule
    ],
})
export class SowsModule { }