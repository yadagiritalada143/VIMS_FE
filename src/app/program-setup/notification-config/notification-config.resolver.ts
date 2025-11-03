import { Injectable } from '@angular/core';
import { Resolve } from '@angular/router';
import { Observable } from 'rxjs';
import { NotificationConfigService } from './notification-config.service';

@Injectable({
  providedIn: 'root'
})
export class NotificationResolver implements Resolve<Observable<any>> {
  constructor(private service: NotificationConfigService) { }

  resolve(): Observable<any> | Promise<any> | any {
    return this.service.loadNotificationAuthDetails();
  }
}
