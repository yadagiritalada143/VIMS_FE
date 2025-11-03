import {AfterViewChecked, AfterViewInit, ChangeDetectorRef, Component, OnDestroy, OnInit} from '@angular/core';
import { NavigationStart, Router} from '@angular/router';
import { Subscription } from 'rxjs';
import {LoaderService} from 'src/app/core/components/loader/loader.service';
import {EmitEvent, Events, EventStreamService} from 'src/app/core/services/event-stream.service';
import {UserService} from 'src/app/core/services/user.service';
import {VMSConfig} from 'src/app/library/table/table/table.model';
import {ProgramSetupSidebarService} from '../../component/program-setup-sidebar/program-setup-sidebar.service';
import {ConfirmationDialogService} from '../../../shared/components/confirmation-dialog/confirmation-dialog.service';
import sideBarOptions from './../../../self-configuration/components/self-config-sidebar/self-config-sidebar.config';
import { SvmsRouterService } from 'src/app/core/services/svms-router.service';
import { AccessControlService } from 'src/app/core/services/access-control.service';

@Component({
  selector: 'app-notification-category',
  templateUrl: './notification-category.component.html',
  styleUrls: ['./notification-category.component.scss']
})
export class NotificationCategoryComponent implements OnInit, AfterViewChecked, AfterViewInit, OnDestroy {


  private subscriptions: Subscription[] = [];
  public programId: string;
  public vmsData: any;
  public tableConfig: VMSConfig;
  public isExpand = false;
  public totalPages = 0;
  public totalRecords = 0;
  public itemsPerPage = 10;
  public tableLoaded = false;
  public editData: any;
  public viewData: any;
  public users: any;
  public viewclick: any;
  private pageNo = 1;
  public viewEventVisibility = 'hidden';
  public dataLoading = true;
  public pathname = '';
  public isCreateUser = 'hidden';
  public category: any;
  public title: string;
  public categoryPath: string;
  public categories: any;
  public activities: any;
  

  constructor(
    private router: Router,
    private sidebarService: ProgramSetupSidebarService,
    private cdr: ChangeDetectorRef,
    public userService: UserService,
    private confirmService: ConfirmationDialogService,
    private _loader: LoaderService,
    private eventStream: EventStreamService,
    public svmsRouter: SvmsRouterService,
    private accessControlService: AccessControlService
  ) {
    router.events.subscribe((val) => {
     if(val instanceof NavigationStart){
     this.tableConfig.advanceFilter[0].multiSelectData.length = 0;
     this.eventStream.emit(new EmitEvent(Events.FILTER_CLEAR, true));
     }

     });
     if(this.svmsRouter?.fromSelfConfiguration()) {
      this.category = sideBarOptions.find(c => c.name == 'Notifications');
    } else {
      this.category = this.sidebarService.getSideMenu().filter(c => c.name == 'Notifications');
    }
     }

  ngOnInit(): void {
    this.title = 'Notification (' + this.getCategoryName() + ')';
   
    this.programId = 'e0ed0ed7-7423-4ae2-8439-ae71c54b5090';
    this.tableConfig = {
      title: this.title,
      columnList: [
        {name: 'name', title: 'Activity', width: 15, isIcon: true, isImage: true, isContact: false, isNumberBadge: false},
        {
          name: 'notification_type',
          title: 'Notification type',
          width: 20,
          isIcon: true,
          isImage: false,
          isContact: false,
          isNumberBadge: false,
          isNotificationType: true
        },
        {name: 'role_engine.0.actor.name', title: 'Actor', width: 15, isIcon: true, isImage: false, isContact: false, isNumberBadge: false},
        {
          name: 'role_engine.0.recipient.name',
          title: 'Recipient',
          width: 15,
          isIcon: true,
          isImage: false,
          isContact: false,
          isNumberBadge: false
        },
        {name: 'message_type', title: 'Message', width: 15, isIcon: true, isImage: false, isContact: false, isNumberBadge: false},
        {
          name: 'status.status',
          title: 'Status',
          width: 15,
          isIcon: false,
          isImage: false,
          isContact: false,
          isNumberBadge: false,
          isNoOption: false,
          isVieworEdit: true,
          isDisableorDelete: this.accessControlService.accessControl(),
        }
      ],
      isDownload: false,
      showTabs: true,
      isFilter: true,
      isSearch: true,
      isSetting: true,
      isTopPagination: true,
      isCreate: false,
      density: 'COMFORTABLE',
      advanceFilter: [
        { name: 'name', title: 'Notification Activity', filterType: 'SELECT', multiSelectData: []},
      ]
    };
    this.subscriptions.push(this.eventStream.on(Events.FILTER_NOTIFICATIONS).subscribe((data:any) => {

      if(data == 'clear') {
        this.getCategories();
      } else {
        const category = data.split(' ')[0];
        const event_id = data.split(' ')[1];
        this.getEvents(this.pageNo, category, event_id, null);
      }
    }));
    this.subscriptions.push(this.eventStream.on(Events.NOTIFICATION_CATEGORY).subscribe((data:any) => {
      const id = this.categories?.filter(x => x.name === data)[0]?.id;
      this.getEvents(this.pageNo, id);

    }));
    this.subscriptions.push(this.eventStream.on(Events.EVENT_UPDATED).subscribe((data:any) => {
      if(data) {
        this.getEvents(this.pageNo, data.category);
      }
    }));
    this.subscriptions.push(this.eventStream.on(Events.EVENT_DISABLE_ENABLE).subscribe((data:any) => {
      const event = this.vmsData.filter(ev => ev.id == data.template)[0];
      this.disableClicked(event);
    }));
  }

  ngAfterViewInit() {
    this.getCategories();
  }

  ngAfterViewChecked(): void {
    this.tableConfig.title = 'Notification (' + this.getCategoryName() + ')';
    this.cdr.detectChanges();
  }

  getCategoryName() {
    if(this.svmsRouter?.fromSelfConfiguration()) {
      return this.category?.submenuItem?.filter(ct => '/self-configuration' + ct.path == this.router.url)[0]?.name;
    } else {
      return (this.category[0]?.sideBarSubMenu[0]?.subMenuItem).filter(ct => ct.path === this.router.url)[0]?.title;
    }
  }

  getCategories(): Promise<any> {
    return new Promise(() => {
      this._loader.show();
      this.userService.get('/notification/api/notification/categories?limit=20').toPromise().then((data:any) => {
        this.categories = data.results;
        if(!!this.getCategoryName()) {
          const id = data.results.filter(c => c.name === this.getCategoryName())[0]?.id;
          this.getEvents(this.pageNo, id);
        }
        this._loader.hide();
      });
    });
  }

  disableClicked(event) {
    if (!event) {
      return;
    }
    this.confirmService.confirm('', `Are you sure to ${event.status.status ? 'disable' : 'enable'} the < ${event.name} > notification?`, 'Yes', 'No')
      .then((confirmed) => {
        if (confirmed) {
        const status = event.role_engine[0].status['status'];
          const payload = {
            status: !status,
            program_id: this.programId,
            roleengine:event.role_engine[0].status.roleengine
          }
          this._loader.show();
          this.subscriptions.push(this.userService.post(`/notification/api/notification/role-engine-status`, payload)
            .subscribe((data:any) => {
              if (data) {
                this.eventStream.emit(new EmitEvent(Events.EVENT_UPDATED, event));
              }
            }));
        }
      }).catch(() => { });
  }

  getEvents(pageNo, categoryID, eventID = null, const_activities = 1) {
    let activity = '';
    if(!!eventID) {
      activity = this.activities.filter(act => act.id == eventID)[0].name.toLowerCase();
    }
    this.dataLoading = true;
    if (pageNo === 1) {
      this._loader.show();
    }
    this.subscriptions.push(this.userService.get(`/notification/api/notification/events/${this.programId}?category=${categoryID}${!!activity ? ('&activity=' + activity) : ''}&limit=${this.itemsPerPage}`).subscribe((data:any) => {
      this.vmsData = data?.results;
     
      if(const_activities == 1) {
        this.activities = this.vmsData.map(act => ({
          name: act.name,
          id: act.id
        }));
      }
      if(this.tableConfig.advanceFilter[0].multiSelectData.length == 0) {
        this.tableConfig.advanceFilter[0].multiSelectData = this.vmsData.map(ev => (
          {
            name: ev.name,
            value: ev.category+' '+ev.id,
          }
        ));
      }
      const finalData = [];
      this.vmsData.forEach((element, z) => {
          if(element.message_type !== undefined){
            element.message_type = element.message_type[0].toUpperCase() +
            element.message_type.toLowerCase().slice(1);
          }else {
            element.message_type = '';
          }
          for(let i=0; i < element.role_engine.length; i++){
            let userIcons = ['1', '2', '3', '4'];
            userIcons.join('')
            const role_engine = JSON.parse(JSON.stringify({...element.role_engine}));
            const dataListing = JSON.parse(JSON.stringify({...element}));
            if(element.status.status === true){
              dataListing.notification_type = userIcons[0] + '' + userIcons[3];
            }else {
              dataListing.notification_type = userIcons[1] + '' + userIcons[2]
            }
            dataListing.role_engine[length] = role_engine[i];
            finalData.push(dataListing);
          }
      });

      this.vmsData = finalData;
      this.totalRecords = finalData.length;
      this.itemsPerPage = 10;
      this.tableLoaded = false;
      this._loader.hide();
    }, error => {
      console.log(error);
    },
      () => {
        this.dataLoading = false;
        this._loader.hide();
      }));
  }

  onSortClick(event) {
    if (!event) {
      return;
    }
    switch (event.name) {
      case 'name':
      case 'notification_type':
      case 'message_type':
        this.vmsData = this.vmsData.sort(function(a, b) {
          const nameA = a[event.name].toUpperCase();
          const nameB = b[event.name].toUpperCase();
          if (event.order === 'ASC') {
            return nameA < nameB ? -1 : 1;
          } else {
            return nameA < nameB ? 1 : -1;
          }
        });
        break;
      case 'role_engine.0.actor.name':
        this.vmsData = this.vmsData.sort(function(a, b) {
          let nameA = '';
          let nameB = '';
          a.role_engine.map(item => nameA = item.actor.name.toUpperCase())
          b.role_engine.map(item => nameB = item.actor.name.toUpperCase())
          if (event.order === 'ASC') {
            return nameA < nameB ? -1 : 1;
          } else {
            return nameA < nameB ? 1 : -1;
          }
        })
        break;
      case 'role_engine.0.recipient.name':
        this.vmsData = this.vmsData.sort(function(a, b) {
          let nameA = '';
          let nameB = '';
          a.role_engine.map(item => nameA = item.recipient.name.toUpperCase())
          b.role_engine.map(item => nameB = item.recipient.name.toUpperCase())
          if (event.order === 'ASC') {
            return nameA < nameB ? -1 : 1;
          } else {
            return nameA < nameB ? 1 : -1;
          }
        })
        break;
    }


  }

  onCreateClick(e) {
    this.isCreateUser = 'visible';
    this.editData = null;
    this.viewclick = false;
    this.viewData = event;
  }

  onSearch(event) {
    console.log(event);
  }

  onCloseCreateUser() {
    this.isCreateUser = 'hidden';
    this.editData = '';
    this.viewclick = false;
  }

  onClickView(event) {
    this.viewEventVisibility = 'visible';
    this.eventStream.emit(new EmitEvent(Events.VIEW_EVENT, event));
  }

  onCloseViewCard(event) {
    this.viewEventVisibility = 'hidden';
  }

  onPaginationClick(event) {
  }

  onEditClick(event) {
    this.viewEventVisibility = 'visible';
    this.eventStream.emit(new EmitEvent(Events.EDIT_EVENT, event));
  }

  ngOnDestroy(): void {
    this.subscriptions?.forEach(sub => sub.unsubscribe());
  }
}
