import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { interval, Subscription } from 'rxjs';

import { PopupService } from 'src/app/shared/service/popup.service';
import { Alert, ALERT_TYPE } from './alert.model';
import { AlertService } from './alert.service';

@Component({
  selector: 'app-alert',
  templateUrl: './alert.component.html',
  styleUrls: ['./alert.component.scss']
})
export class AlertComponent implements OnInit, OnDestroy {
  @Input() id = 'default-alert';

  alerts: Alert[] = [];
  alert: Alert;
  alertSubscription: Subscription;
  alertSubscriptionProcess: Subscription;
  closeErrorSubscription: Subscription;

  constructor(private popupService: PopupService,
              private notificationService: AlertService) { }

  ngOnInit() {
   this.closeErrorSubscription =  this.popupService.sendAlertFlag.subscribe(message => {
        if(message && this.alerts.length > 0) {
          this.closeAlert();
        }
       });

    this.alertSubscription = this.notificationService.onAlert(this.id)
      .subscribe(alert => {
        // skipping alerts when an empty alert is received
        if (!alert.message) {
          return;
        }

         // add alert to array
         this.alerts.push(alert);
         this.alert = this.alerts[0];

         if (this.alerts.length === 1) {
           this.removeAlert();
         }
      });


  }

  ngOnDestroy() {
    // unsubscribe to avoid memory leaks
    if(this.alertSubscription)
      this.alertSubscription.unsubscribe();
    if(this.alertSubscriptionProcess)
      this.alertSubscriptionProcess.unsubscribe();
    if(this.closeErrorSubscription) {
      this.closeErrorSubscription.unsubscribe();
    }
  }

  removeAlert() {
    const INTERVAL_TIME= this.alert?.type === ALERT_TYPE.ERROR ? ALERT_TYPE.ERROR_INTERVAL_TIME : ALERT_TYPE.INTERVAL_TIME;
    const numbers = interval(INTERVAL_TIME);
    this.alertSubscriptionProcess = numbers.subscribe(() => {
      this.alerts.splice(0, 1);
      this.alert = this.alerts[0];
      if (this.alerts.length === 0) {
        this.alertSubscriptionProcess.unsubscribe();
      }
    });
  }

  closeAlert() {
    this.alerts.splice(0, 1);
    this.alert = this.alerts[0];
  }

  cssClass(alert: Alert) {
    if (!alert) { return; }

    const classes = ['alert', 'alert-dismissable', 'alert-background'];

    const alertTypeClass = {
      [ALERT_TYPE.SUCCESS]: 'alert alert-success',
      [ALERT_TYPE.ERROR]: 'alert alert-danger',
      [ALERT_TYPE.INFO]: 'alert alert-info',
      [ALERT_TYPE.WARNING]: 'alert alert-warning'
    };

    classes.push(alertTypeClass[alert.type]);

    if (alert.position === 'top-left') {
      classes.push('alert-left-top');
    } else if (alert.position === 'top-right') {
      classes.push('alert-right-top');
    } else if (alert.position === 'top-center') {
      classes.push('alert-center-top');
    } else if (alert.position === 'bottom-left') {
      classes.push('alert-left-bottom');
    } else if (alert.position === 'bottom-right') {
      classes.push('alert-right-bottom');
    } else if (alert.position === 'bottom-center') {
      classes.push('alert-center-bottom');
    } else if (alert.position === undefined) {
      classes.push('alert-left-bottom');
    }

    if(alert.bgColor === "light") {
      classes.push('light');
    }

    return classes.join(' ');
  }
}
