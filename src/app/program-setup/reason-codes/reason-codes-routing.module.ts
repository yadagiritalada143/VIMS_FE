import { AuthguardService } from 'src/app/core/services/auth_guard.service';
import { ReasonCodeCategoryComponent } from './reason-code-category/reason-code-category.component';
import {ReasonCodesComponent} from './reason-codes.component';
import {NgModule} from '@angular/core';
import {Routes, RouterModule, UrlSegment} from '@angular/router';

const routes: Routes = [
  {
    path: '',
    canActivate: [AuthguardService],
    data: {
      userRoles: ['reason_code_view'],
    },
    component: ReasonCodesComponent,
    children: [
      {
        matcher: matcherFunction,
        canActivate: [AuthguardService],
        data: {
          userRoles: ['reason_code_view'],
        },
        component: ReasonCodeCategoryComponent
      }
    ]
  }
];

export function matcherFunction(url: UrlSegment[]) {
  if (url.length === 1) {
    const path = url[0].path;
    if (path.startsWith('job')
      || path.startsWith('expense')
      || path.startsWith('time-sheet')
      || path.startsWith('assignment')
      || path.startsWith('onboarding')
      || path.startsWith('interview')
      || path.startsWith('submission')
      || path.startsWith('offer')
      || path.startsWith('invoice')
      || path.startsWith('sow')) {
      return {consumed: url};
    }
  }
  return null;
}

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})

export class ReasonCodesRoutingModule {
}
