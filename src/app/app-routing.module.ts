import { NgModule } from '@angular/core';
import { Routes, RouterModule, PreloadAllModules } from '@angular/router';
import { AuthguardService } from './core/services/auth_guard.service';

const routes: Routes = [
  {
    path: '',
    canActivate: [AuthguardService],
    loadChildren: () => import('./main/main.module').then(m => m.MainModule),
  },

  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule),
  },
  { path: '**', redirectTo: 'dashboard', pathMatch: 'full' },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      preloadingStrategy: PreloadAllModules,
      relativeLinkResolution: 'legacy',
    }),
  ],
  exports: [RouterModule],
  providers: [AuthguardService],
})
export class AppRoutingModule {}
