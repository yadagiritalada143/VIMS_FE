import { Component, OnInit } from '@angular/core';
import { SideBarSection } from './pending-action-sidebar/pending-action-sidebar.model';
import { UserService } from '../core/services/user.service';
import { StorageKeys, StorageService } from '../core/services/storage.service';
import { PendingActionContentComponent } from './pending-action-content/pending-action-content.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-pending-action',
  templateUrl: './pending-action.component.html',
  styleUrls: ['./pending-action.component.scss'],
})
export class PendingActionComponent implements OnInit {
  programId: string;
  isRightDivOpen: boolean = false;
  clickedClassName: string = '';
  private subscriptions: Array<Subscription> = [];

  toggleRightDiv(className: string) {
    this.isRightDivOpen = !this.isRightDivOpen;
    this.clickedClassName = className;
  }
  toggleBackDiv() {
    this.isRightDivOpen = false;
    this.clickedClassName = '';
  }
  sideBarSections: SideBarSection[] = [
    {
      header: 'profile',
      items: [
        {
          name: 'Profiles Pending Link',
          dataUrl: '/submission-manager/candidates?program_id=PROGRAM_ID&pending_profile_linking=true&limit=1',
          count: 0,
          url: 'content',
          childComponent: PendingActionContentComponent,
        },
      ],
    },
  ];

  constructor(public userService: UserService, private localStorage: StorageService) {
    this.programId = this.localStorage.get(StorageKeys?.PROGRAM_ID);
  }

  getDataUrl = (dataUrl: string) => {
    return dataUrl.replace('PROGRAM_ID', this.programId);
  };

  get totalCount(){
    let count = 0
    this.sideBarSections?.map(sideBarSection => {
      count = sideBarSection.items.reduce((acc, cur)=>(acc + cur.count), 0)
    })
    return count
  }

  ngOnInit(): void {
    this.sideBarSections.map(sideBarSection => {
      sideBarSection.items.map(sideBarData => {
        const dataUrl = this.getDataUrl(sideBarData.dataUrl);
        if (dataUrl)
          this.userService.get(dataUrl).subscribe({
            next: (res: any) => {
              sideBarData.count = res?.total_records ?? 0;
            },
          });
      });
    });
  }
  subscribeToEmitter(componentRef): void {
    if (!(componentRef instanceof PendingActionContentComponent))
      return
    this.sideBarSections.map(sideBarSection => {
      const sideBarData = sideBarSection.items.find((item)=>(item.childComponent === PendingActionContentComponent))
      componentRef.updateCountEvent.subscribe((countChange)=>{
        sideBarData.count += countChange
      })
    })
  }
  unsubscribe(): void {
    this.subscriptions.forEach((sub: Subscription) => sub?.unsubscribe());
  }
}
