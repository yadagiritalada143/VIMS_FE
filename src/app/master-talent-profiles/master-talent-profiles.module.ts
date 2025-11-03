import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MasterTalentProfilesRoutingModule } from './master-talent-profiles-routing.module';
import { MasterTalentProfilesListComponent } from './master-talent-profiles-list/master-talent-profiles-list.component';
import { MasterTalentProfilesComponent } from './master-talent-profiles.component';
import { SvmsTableModule } from '../library/svms-table/svms-table.module';
import { I18NextModule } from 'angular-i18next';
import { NewSharedModule } from '../new-shared/new-shared.module';
import { SharedModule } from '../shared/shared.module';
import { JobDetailsModule } from '../jobs/job-details/job-details.module';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@NgModule({
  declarations: [
    MasterTalentProfilesListComponent,
    MasterTalentProfilesComponent,
  ],
  imports: [
    CommonModule,
    SvmsTableModule,
    I18NextModule,
    MasterTalentProfilesRoutingModule,
    SharedModule,
    NewSharedModule,
    JobDetailsModule,
    FormsModule
  ],
  providers: [NgbActiveModal]
})
export class MasterTalentProfilesModule { }
