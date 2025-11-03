import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { StorageService,StorageKeys } from 'src/app/core/services/storage.service';
import { SvmsRouterService } from 'src/app/core/services/svms-router.service';
import { Location } from '@angular/common';

@Component({
  selector: 'app-documents-library-sidebar',
  templateUrl: './documents-library-sidebar.component.html',
  styleUrls: ['./documents-library-sidebar.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class DocumentsLibrarySidebarComponent implements OnInit {

  programId: any;
  programDetails:any;
  dateFormat:any;
  currentTab:any = 'my_library';
  currentAccountInfo:any

  constructor (
    private router: SvmsRouterService,
    private route: Router,
    private localStorage: StorageService,
    private location: Location
  ) { }

  ngOnInit(): void {
    this.currentTab = this.route.url.includes('favorites') ? 'favorites' : this.currentTab;
    this.programDetails = this.localStorage.get(StorageKeys?.CURRENT_PROGRAM);
    this.dateFormat = this.programDetails?.defaultDateFormat.toUpperCase();
    this.programId = this.localStorage.get(StorageKeys?.PROGRAM_ID);
    this.currentAccountInfo = this.localStorage.get(StorageKeys?.CURRENT_ACCOUNT);

  }

  changeRoute(event) {
    if(event == 'my_library') {
      this.currentTab = 'my_library'
      this.router.navigate(['my-library', 'folder-list']);
    } else if(event == 'favorites') {
      this.currentTab = 'favorites'
      this.router.navigate(['my-library', 'favorites']);
    }
  }

  backtoList() {
    this.location.back();
  }
}
