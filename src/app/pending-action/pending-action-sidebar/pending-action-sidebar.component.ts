import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { SvmsRouterService } from 'src/app/core/services/svms-router.service';
import { Location } from '@angular/common';
import { SideBarSection } from './pending-action-sidebar.model'



@Component({
  selector: 'app-pending-action-sidebar',
  templateUrl: './pending-action-sidebar.component.html',
  styleUrls: ['./pending-action-sidebar.component.scss'],
})
export class PendingActionSidebarComponent implements OnInit {
  @Input() sideBarSections!: SideBarSection[];
  programId: any;
  programDetails: any;
  dateFormat: any;
  currentTab: any = 'content';
  currentAccountInfo: any;

  constructor(private router: SvmsRouterService, private route: Router, private localStorage: StorageService, private location: Location) {}

  ngOnInit(): void {
    const items = this.route.url.split("/")
    const pathName = items[items.length-1].split("?")[0]
    this.currentTab = pathName
    this.programDetails = this.localStorage.get(StorageKeys?.CURRENT_PROGRAM);
    this.dateFormat = this.programDetails?.defaultDateFormat.toUpperCase();
    this.programId = this.localStorage.get(StorageKeys?.PROGRAM_ID);
    this.currentAccountInfo = this.localStorage.get(StorageKeys?.CURRENT_ACCOUNT);
  }

  changeRoute(event) {
    this.currentTab = event
    this.router.navigate(['pending-actions', event]);
  }

  backtoList() {
    this.location.back()
  }
}
