import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProgramsRoutingModule } from './programs-routing.module';
import { ProgramsComponent } from './programs.component';
import { SharedModule } from '../shared/shared.module';
import { NgSelectModule } from '@ng-select/ng-select';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ProgramListComponent } from './program-list/program-list.component';
import { ProgramCreateComponent } from './program-create/program-create.component';
import { NoProgramComponent } from './components/no-program/no-program.component';
import { CreateNewUserComponent } from './create-new-user/create-new-user.component';
import { VmsTableModule } from '../library/smartTable/vms-table.module';
import { ImageCropperModule } from 'ngx-image-cropper';
import { OrganizationsModule } from '../../app/organizations/organizations.module';
import { NewSharedModule } from '../new-shared/new-shared.module';
import { CustomFieldsModule } from '../program-setup/custom-fields/custom-fields.module';
import { I18NextModule } from 'angular-i18next';
@NgModule({
  declarations: [ProgramsComponent, ProgramListComponent, ProgramCreateComponent, NoProgramComponent, CreateNewUserComponent],
  imports: [
    CommonModule,
    ProgramsRoutingModule,
    SharedModule,
    NgSelectModule,
    FormsModule,
    ReactiveFormsModule,
    VmsTableModule,
    ImageCropperModule,
    OrganizationsModule,
    NewSharedModule,
    CustomFieldsModule,
    I18NextModule,
  ],
  exports: [CreateNewUserComponent],
})
export class ProgramsModule {}
