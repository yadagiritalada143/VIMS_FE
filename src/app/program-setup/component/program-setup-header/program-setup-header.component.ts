import { Component, OnInit, EventEmitter, Output, ChangeDetectorRef, ViewChild, ElementRef, Renderer2, OnDestroy } from '@angular/core';
import { StorageService } from '../../../core/services/storage.service';
import { ProgramConfig } from '../../../shared/enums';

import {
  EventStreamService,
  Events,
  EmitEvent,
} from '../../../core/services/event-stream.service';
import { Router } from '@angular/router';
import { ProgramSetupSidebarService } from '../program-setup-sidebar/program-setup-sidebar.service';
import { ProgramService } from 'src/app/programs/program.service';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
@Component({
  selector: 'app-program-setup-header',
  templateUrl: './program-setup-header.component.html',
  styleUrls: ['./program-setup-header.component.scss'],
  providers: []
})
export class ProgramSetupHeaderComponent implements OnInit, OnDestroy {
  showProgramDrop = false;
  showSubmenuDropdwon = false;
  breadcrumList: any;
  programData: any;
  bradCrumSubMenu: any;
  showInsight = false;
  sideBarData: any;
  client_status:any;
  program_name: any;
  client_logo: any;
  dataLoad:boolean;
  breadCrumbName: any;
  @Output()
  notificationClick: EventEmitter<string> = new EventEmitter<string>();
  user: any = { name: '' };

  @ViewChild('moreIcon', { read: ElementRef, static: false }) moreIcon: ElementRef;
  @ViewChild('subMenu', { read: ElementRef, static: false }) subMenu: ElementRef;

  private subscriptions: Subscription[] = [];
  constructor(
    public eventStrems: EventStreamService,
    public storageService: StorageService,
    public router: Router,
    public ProgramSetupSidebarService: ProgramSetupSidebarService,
    private changeDetectorRef: ChangeDetectorRef,
    private _storageService: StorageService,
    private programService: ProgramService,
    private route: ActivatedRoute,
    private render: Renderer2) {
      this.subscriptions.push(this.route.queryParams.subscribe((params:any) => {
        this.breadCrumbName = params['name'];
    }));
    this.subscriptions.push(router.events.subscribe((val:any) => {
      if (val) {
        this.createBreadcrum(val);
      }
    }));

    this.render.listen('window', 'click', (e: Event) => {
      if ((this.moreIcon && this.moreIcon.nativeElement.contains(e.target))) {
        this.showProgramDrop = true;
      } else {
        this.showProgramDrop = false;
      }
      if ((this.subMenu && this.subMenu.nativeElement.contains(e.target))) {
        this.showSubmenuDropdwon = true;
      } else {
        this.showSubmenuDropdwon = false;
      }
    })
  }

  ngOnInit(): void {
    this.subscriptions.push(this.eventStrems.on(Events.LoggedIn).subscribe((data:any) => {
      this.user.name = data;
    }));
    this.subscriptions.push(this.eventStrems.on(Events.ON_SHOW_INSIGHT).subscribe((visibility:any) => {
      this.showInsight = visibility;
    }));
    this.programData = JSON.parse(this._storageService.get(ProgramConfig[0]));
    this.fetchClientDetails(this.programData?.program_req_id);
    this.subscriptions.push(this.programService.shareProgramData.subscribe((data:any) =>{
      if(data){
        this.fetchClientDetails(this.programData?.program_req_id);
      }
    }));
  }

  onShowProgramDrop() {
    this.showProgramDrop = !this.showProgramDrop;
    this.changeDetectorRef.detectChanges();
  }
  onShowSubmenuDropdwon() {
    this.showSubmenuDropdwon = !this.showSubmenuDropdwon;
    this.changeDetectorRef.detectChanges();
  }
  onInsightClick() {
    this.showInsight = !this.showInsight;
    this.eventStrems.emit(new EmitEvent(Events.ON_SHOW_INSIGHT, this.showInsight));
  }

  exitProgramSetup() {
    //remove the current program configuration
    this.storageService.remove(ProgramConfig[0]);
    this.storageService.remove(ProgramConfig[1]);
    //redirect user to program listing page.
    this.router.navigate(['/']);
  }

  createBreadcrum(data) {
    this.sideBarData = this.ProgramSetupSidebarService.getSideMenu();
    if (data) {
      this.sideBarData?.forEach(s => {
        if (data?.url?.includes(s?.name?.toLowerCase())) {
          this.breadcrumList = s;
        } else if (data?.url?.includes(s?.path?.toLowerCase()) && s?.path) {
          this.breadcrumList = s;
        }
        this.breadcrumList?.sideBarSubMenu?.forEach(b => {
          b?.subMenuItem?.forEach(bs => {
            if (data?.url?.includes(bs?.path?.toLowerCase())) {
              this.bradCrumSubMenu = bs;
            }
          });
        });
      });
    }
  }

  fetchClientDetails(clientName) {

    this.subscriptions.push(this.programService.get(`/configurator/programs/${clientName}`).subscribe((data:any)=>{
      const clientData = data.program;
      this.dataLoad = true;
      this.program_name =  clientData?.name != null ?  clientData?.name : '';
      this.client_logo =  clientData?.logo != null ?  clientData?.logo :  this.program_name;
      this.client_status = clientData?.is_enabled != null ?  clientData?.is_enabled : '';
    },error => {
      if (error?.error?.message) {
        console.error(error);
      }
    }));
  }


  onViewClick(vmsData) {
    if (vmsData.program_uniqId) {
      this.showProgramDrop = false;
      this.router.navigate(['/program-setup/program-detail'], { queryParams: { programId: vmsData?.program_uniqId, clientId: vmsData?.clientId, program_req_id: vmsData?.program_req_id, clientName: vmsData?.clientName } });
    }
  }

  ngOnDestroy(): void {
    this.subscriptions?.forEach(sub => sub.unsubscribe());
  }
}
