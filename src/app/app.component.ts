import { Component, LOCALE_ID, Inject, OnInit, ChangeDetectorRef, Renderer2, OnDestroy } from '@angular/core';
import { EventStreamService, Events } from '../app/core/services/event-stream.service';
import { mapTo } from 'rxjs/operators';
import { Observable, fromEvent, merge, of, Subscription } from 'rxjs'
import { AlertService } from './core/components/alert/alert.service';
import { StorageKeys, StorageService } from './core/services/storage.service';
import { environment } from 'src/environments/environment';
import { LoginService } from './auth/login/login.service';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'Simplify VMS 2.0';
  showBackdrop = false;
  public showRouter = true
  valueEmittedFromChildComponent = '';
  subscriptions: Subscription[] = [];
  parentEventHandlerFunction(valueEmitted) {
    this.valueEmittedFromChildComponent = valueEmitted;
  }

  valueEmittedFromHeaderComponent: '';

  notificationEventHandlerFunction(valueEmitted) {
    this.valueEmittedFromHeaderComponent = valueEmitted;
  }

  logged_In = false;
  onLine: Observable<any>;
  constructor(
    private changeDetection: ChangeDetectorRef,
    private eventStream: EventStreamService,
    private _alerts: AlertService,
    private _render: Renderer2,
    private login: LoginService,
    private storageService: StorageService,
    @Inject(LOCALE_ID) protected localeId: string) {
      // Do Not MODIFY the Below Code w/o discussion
      localStorage.setItem('app-loaded', 'true');
      // Do Not MODIFY the Above Code w/o discussion
    if (localeId) {
    //  translate.setDefaultLang(localeId.split('-')[0] ? localeId.split('-')[0] : 'English (United States)');
    }
    this.onLine = merge(
      of(navigator.onLine),
      fromEvent(window, 'online').pipe(mapTo('yes')),
      fromEvent(window, 'offline').pipe(mapTo('no'))
    )
    this.getNetworkStatus();
  }
  ngOnDestroy(): void {
    this.subscriptions?.forEach(sub => sub.unsubscribe());
  }
  ngOnInit() {
    window.addEventListener('storage', (event: StorageEvent) => {
      if (event.key == StorageKeys.LOGOUT_EVENT) {
        // Refresh the page when a logout event is detected
        this.storageService.remove(StorageKeys.LOGOUT_EVENT);
        window.location.reload();
      }
    });
    this.subscriptions.push(this.eventStream.on(Events.LoggedIn).subscribe((data) => {
      this.logged_In = data;
      // this.changeDetection.detectChanges()
    }));

    this.subscriptions.push(this.eventStream.on(Events.SET_PROGRAM).subscribe((data) => {
      if (!data.fromLogin) {
        this.showRouter = false;
        setTimeout(() => {
          this.showRouter = true;
        }, 200);
      }
    }));

    this.subscriptions.push(this.eventStream.on(Events.DO_SHOW_CLIENT_FORM).subscribe((data) => {
      this.showBackdrop = data;
      if (data) {
        this._render.addClass(document.body, 'overflow-hidden')
      } else {
        this._render.removeClass(document.body, 'overflow-hidden')
      }
      this.changeDetection.detectChanges()
    }));
    this.subscriptions.push(this.eventStream.on(Events.DO_SHOW_USER_FORM).subscribe((data) => {
      this.showBackdrop = data;
      if (data) {
        this._render.addClass(document.body, 'overflow-hidden')
      } else {
        this._render.removeClass(document.body, 'overflow-hidden')
      }
      this.changeDetection.detectChanges()
    }));
    this.subscriptions.push(this.eventStream.on(Events.DO_SHOW_USER_FORM).subscribe((data) => {
      this.showBackdrop = data;
      if (data) {
        this._render.addClass(document.body, 'overflow-hidden')
      } else {
        this._render.removeClass(document.body, 'overflow-hidden')
      }
      this.changeDetection.detectChanges()
    }));
    this.injectMatomo();

  }

  injectMatomo() {
    var _paq = window['_paq'] = window['_paq'] || [];
    /* tracker methods like "setCustomDimension" should be called before "trackPageView" */
    _paq.push(['trackPageView']);
    _paq.push(['enableLinkTracking']);
    (function () {
      var u = "//insights.simplifyvms.com/";
      _paq.push(['setTrackerUrl', u + 'matomo.php']);
      _paq.push(['setSiteId', environment.MATOMO_SITE_ID]);
      var d = document, g = d.createElement('script'), s = d.getElementsByTagName('script')[0];
      g.type = 'text/javascript'; g.async = true; g.src = u + 'matomo.js'; s.parentNode.insertBefore(g, s);
    })();
  }

  getNetworkStatus() {
    let cnt = 0;
    this.onLine.subscribe(status => {
      if (cnt > 0 && status == 'yes') {
        this._alerts.success('Back to online', { color: 'black', bgColor: 'lightgreen' });
      }
      if (status == 'no') {
        this._alerts.warn('You are offline', { color: 'black', bgColor: '#DE4E5E' });
      }
      cnt++;
    })
  }

  get impersonationExitLock() {
    return this.login.impersonationExitLock;
  }
}
