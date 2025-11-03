import { Component, Injector, OnInit } from '@angular/core';
import { QuickLinkWidgetComponent } from '../quick-link-widget.component';
import { Router } from '@angular/router';
import { MasterTalentProfileService } from 'src/app/master-talent-profiles/master-talent-profile.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { Observable, map } from 'rxjs';


@Component({
  selector: 'app-active-job-widget',
  templateUrl: './pending-actions-widget.component.html',
  styleUrls: ['./pending-actions-widget.component.scss']
})

export class PendingActionsWidgetComponent extends QuickLinkWidgetComponent implements OnInit {

  totalCount$: Observable<number>;
  constructor(injector: Injector,
              private router:Router,
              private masterTalentProfileService:MasterTalentProfileService,
              public storageService:StorageService) {
    super(injector);
  }



  ngOnInit() {
    this.count = 1;
    this.getPendingActionCount();
    this.initWidget();
  }

  viewPendingAction = () => {
    this.router.navigateByUrl('/pending-actions/content')
  }

  getPendingActionCount() {
    this.totalCount$ = this.masterTalentProfileService.getPendingMTPLinkingCandidates(this.storageService.get(StorageKeys.PROGRAM_ID)).pipe(
       map((data:any) => data.total_records)
    );
  }
}
