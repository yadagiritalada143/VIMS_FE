import { Component, OnInit,  Renderer2, ViewChild, ElementRef } from '@angular/core';
import { NotificationConfigService } from 'src/app/program-setup/notification-config/notification-config.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { ConfirmationDialogService } from 'src/app/shared/components/confirmation-dialog/confirmation-dialog.service';
import { ProgramService } from 'src/app/programs/program.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { BehaviorSubject, forkJoin, fromEvent, Observable } from "rxjs";
import { map, take } from "rxjs/operators";

@Component({
  selector: 'app-notification',
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.scss']
})

export class NotificationComponent implements OnInit {
  notificationPanel = false;
  notifications: any = [];
  notification: any = {};
  totalCount : number = 0; 
  options: any = {};
  userEmail: string;
  obsArray: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);
  items$: Observable<any> = this.obsArray.asObservable();
  page: number = 0;
  size: number = 10;

  @ViewChild('notifyTrigger', { read: ElementRef, static: false }) notifyTrigger: ElementRef;
  @ViewChild('notifyPanel', { read: ElementRef, static: false }) notifyPanel: ElementRef;
  constructor(private render: Renderer2, private notificationConfigService: NotificationConfigService,
    private _alert: AlertService, private confirmService: ConfirmationDialogService,
    public programService: ProgramService, private storageService: StorageService,
    private localDatePipe: LocalDateFormatPipe) {
    this.render.listen('window', 'click', (e: Event) => {
      if ((this.notifyTrigger && this.notifyTrigger.nativeElement.contains(e.target)) ||
        (this.notifyPanel && this.notifyPanel.nativeElement.contains(e.target)) && this.notificationPanel) {
        this.notificationPanel = true;
        this.render.addClass(document.body, 'sidebar-notify-overflow');
      } else {
        this.notificationPanel = false;
        this.render.removeClass(document.body, 'sidebar-notify-overflow');
      }
    })
    this.userEmail = this.storageService.get('user')['email'];
   }

   ngAfterViewInit() {
    this.notificationConfigService?.loadNotificationAuthDetails()?.subscribe(data => {
      this.getNotifications();
      this.getNotificationCount();
    });
   }

  ngOnInit(): void { }

  getNotificationCount() {
    this.notificationConfigService?.get(`/notification-tracker/count?notificationDest=${this.userEmail}&readMessage=False`).subscribe((response: any) => {
      this.totalCount = response;
    })
  }

  private getNotifications() {
    this.notificationConfigService?.getNotificationsData(this.userEmail, this.page, this.size)?.subscribe((data: any) => {
      this.obsArray?.next(data);
      this.notifications = data;
      this.obsArray?.next(Object.assign([], this.notifications));
      if(this.notifications && this.notifications?.length > 0) {
        this.selectedNotification(this.notifications[0]);
      }
    });
    const content = document?.querySelector('.list-outer');
    const scroll$ = fromEvent(content!, 'scroll').pipe(map(() => { return content!.scrollTop; }));
    scroll$?.subscribe((scrollPos) => {
      let limit = content!.scrollHeight - content!.clientHeight;
      if (scrollPos > limit) {
        this.page += 1;
        forkJoin([this.items$?.pipe(take(1)), this.notificationConfigService?.getNotificationsData(this.userEmail, this.page, this.size)]).subscribe((data: Array<Array<any>>) => {
          const newArr = [...data[0], ...data[1]];
          this.obsArray.next(newArr);
          this.notifications = newArr;
          this.obsArray.next(Object.assign([], this.notifications));
        });
      }
    });    
  }

  closeNotification() {
    this.notificationPanel = false;
    this.render.removeClass(document.body, 'sidebar-notify-overflow');
  }

  notificationToggle() {
    this.notificationPanel = true;
    this.render.addClass(document.body, 'sidebar-notify-overflow');
    this.notification = this.notifications[0];
    this.options['selected'] = this.notification?.id;
  }

  selectedNotification(item) {
    this.notification = null;
    this.notification = item;
    this.notification.messageBody2 = this.notification.messageBody.replace(/\\/g, "");
    this.options['selected'] = this.notification.id;
    if (!this.notification.readMessage) {
      this.notification.readMessage = true;
      const payload = {
        emailId: this.userEmail,
        ids: [
          item.id
        ],
        readMessage: true,
        tenantId: item.tenantId
      }
      this.notificationConfigService.put(`/notification-tracker/read-message`, payload).subscribe((response: any) => {
        this.getNotificationCount();
      });
    }
  }

  showPopup() {
    this.confirmService.confirm('', `Do you really want to delete this Notification`,
      'Yes', 'No')
      .then((confirmed) => {
        if (confirmed) {
          this.deleteNotification();
        }
      })
      .catch(() => {
      });
  }

  deleteNotification() {
    this.notificationConfigService.delete(`/notification-tracker/${this.notification.id}`).subscribe((response:any)=>{
      // this.page = 1;
      this.notifications = [];
      this.obsArray = new BehaviorSubject<any[]>([]);
      this.items$ = this.obsArray.asObservable();
      this.page = 0;
      this.getNotificationCount();
      this.getNotifications();
      // if (response) {
       this._alert.success('Notification Deleted successfully');
      // }
    });
  }

  getDateTime(d) {
    if (!d) {
      return '--';
    }
    const dateformat = this.storageService.get(StorageKeys.CURRENT_PROGRAM)['defaultDateFormat'];
    let t = new Date(d * 1000).toISOString();
    return this.localDatePipe.transform(`${t}`, `${dateformat} h:mm a`);
  }
}
