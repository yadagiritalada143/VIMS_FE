import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SvmsSidebarNgComponent } from './svms-sidebar-ng.component';
import { SvmsSidebarHeaderContentComponent } from './svms-sidebar-header-content/svms-sidebar-header-content.component';
import { SvmsSidebarBodyNgComponent } from './svms-sidebar-body/svms-sidebar-body-ng.component';
import { SvmsSidebarFooterNgComponent } from './svms-sidebar-footer/svms-sidebar-footer-ng.component';
import { SvmsSidebarProfileComponent } from './svms-sidebar-profile/svms-sidebar-profile.component';
import { SidebarIconComponent } from './sidebar-icon/sidebar-icon.component';
import { SvmsUserProfileComponent } from './svms-user-profile/svms-user-profile.component';
import { SvmsHelpComponent } from './svms-help/svms-help.component';
import { SvmsSidebarNavComponent } from './svms-sidebar-nav/svms-sidebar-nav.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { SvmsSidebarLoaderComponent } from './svms-sidebar-loader/svms-sidebar-loader.component';
import { I18NextModule } from 'angular-i18next';

@NgModule({
  declarations: [
    SvmsSidebarNgComponent,
    SvmsSidebarBodyNgComponent,
    SvmsSidebarFooterNgComponent,
    SvmsSidebarProfileComponent,
    SidebarIconComponent,
    SvmsUserProfileComponent,
    SvmsHelpComponent,
    SvmsSidebarNavComponent,
    SvmsSidebarHeaderContentComponent,
    SvmsSidebarLoaderComponent
  ],
  imports: [CommonModule, SharedModule, NgxSkeletonLoaderModule, I18NextModule],
  exports: [
    SvmsSidebarNgComponent,
    SvmsSidebarBodyNgComponent,
    SvmsSidebarFooterNgComponent,
    SvmsSidebarProfileComponent,
    SvmsSidebarNavComponent,
    SvmsSidebarHeaderContentComponent,
    SvmsSidebarLoaderComponent
  ],
})
export class SvmsSidebarNgModule {}
