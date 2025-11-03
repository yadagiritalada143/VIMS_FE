import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { SystemQualificationListComponent } from './system-qualification-list/system-qualification-list.component';
import { SystemQualificationTypeListComponent } from './system-qualification-type-list/system-qualification-type-list.component';

const routes: Routes = [
    { path: '', redirectTo: 'qualification-type', pathMatch: 'full' },
    { path: 'qualification-type', component: SystemQualificationTypeListComponent },
    { path: 'qualification-list', component: SystemQualificationListComponent }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class QulificationRoutingModule { }
