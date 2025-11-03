import {NotificationCategoryComponent} from './notification-category/notification-category.component';
import {NotificationsComponent} from './notifications.component';
import {NgModule} from '@angular/core';
import {Routes, RouterModule, UrlSegment} from '@angular/router';
import {EmailTemplateHeaderComponent} from './email-template-header/email-template-header.component';
import {NotificationsEmailFooterComponent} from './notifications-email-footer/notifications-email-footer.component';
import { AuthguardService } from 'src/app/core/services/auth_guard.service';

const routes: Routes = [
  {
    path: '', component: NotificationsComponent,
    children: [
      {
        matcher: matcherFunction,
        canActivate: [AuthguardService],
        data: {
          userRoles: ['notification_view'],
        },
        component: NotificationCategoryComponent
      }
    ]
  },
  {
    path: 'layout/header',
    canActivate: [AuthguardService],
    data: {
      userRoles: ['notification_manage'],
    },
    component: EmailTemplateHeaderComponent
  },
  {
    path: 'layout/footer',
    canActivate: [AuthguardService],
    data: {
      userRoles: ['notification_manage'],
    },
    component: NotificationsEmailFooterComponent
  },
];

export function matcherFunction(url: UrlSegment[]) {
  if (url.length === 1) {
    const path = url[0].path;
    if (path.startsWith('job')
      || path.startsWith('password')
      || path.startsWith('profile')
      || path.startsWith('approval')
      || path.startsWith('generic')
      || path.startsWith('expense')
      || path.startsWith('time-sheet')
      || path.startsWith('assignment')
      || path.startsWith('onboarding')
      || path.startsWith('interview')
      || path.startsWith('submission')
      || path.startsWith('offer')
      || path.startsWith('invoice')
      || path.startsWith('consolidated-invoice')
      || path.startsWith('job-distribution')) {
      return {consumed: url};
    }
  }
  return null;
}

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})

export class NotificationsRoutingModule {
}
