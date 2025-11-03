import { Location, LocationStrategy, PathLocationStrategy } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, OnDestroy, OnInit, Renderer2, SecurityContext, ViewChild } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { environment } from '../../../environments/environment';
import { Router } from '@angular/router';
import { Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { Subscription } from 'rxjs';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';

@Component({
  selector: 'app-sows',
  templateUrl: './sows.component.html',
  styleUrls: ['./sows.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default,
  providers: [Location, { provide: LocationStrategy, useClass: PathLocationStrategy }]
})
export class ListSowsComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('sowIframe', { static: false }) sowIframe: ElementRef<HTMLDivElement>;

  eventSubscriber: Subscription
  langChangeSubscriber: Subscription
  themeSubscriber: Subscription

  constructor(
    protected sanitizer: DomSanitizer,
    private renderer: Renderer2,
    private location: Location,
    private router: Router,
    private eventStream: EventStreamService,
    private _storageService: StorageService
    ) {
      
  }
  ngOnInit() {
    // this.createIframe()
    this.eventSubscriber = this.eventStream.on(Events.SIDE_MENU_CLICKED).subscribe((data) => {
      if (String(data.path).includes("sow")) {
        this._storageService.set("sow_side_nav", data.path, true)
      }
      this.sowIframe.nativeElement.innerHTML = "";
      if (this.sowIframe != undefined) {
        this.createIframe(true)
      }
    })
    this.themeSubscriber = this.eventStream.on(Events.THEME_UPDATE).subscribe((data) => {
      setTimeout(() => {
        this.sowIframe.nativeElement.innerHTML = "";
        if (this.sowIframe != undefined) {
          this.createIframe(true)
        }
      }, 500);
    })
    this.langChangeSubscriber = this.eventStream.on(Events.LANGUAGE_SWITCHED).subscribe(() => {
      this.sowIframe.nativeElement.innerHTML = "";
      if (this.sowIframe != undefined) {
        this.createIframe(true)
      }
    })
  }
  ngAfterViewInit() {
    if (this.sowIframe != undefined) {
      const sowww = this._storageService.get("sow_side_nav")
      this.createIframe(sowww === "/sow/create_sow")
    }
  }
  sowURL(base: boolean) {
    let query = ""
    if (base) {
      query = environment.SOW_URL;
    } else {
      if (this.router.url.includes("/sow/") || this.router.url.includes("/vendor_sow/")) {
        query = environment.SOW_URL + (this.router.url);
      }
      else if (this.router.url.includes("/sow?")) {
        query = environment.SOW_URL + (this.router.url).replace('/sow?', '/?');
      }
      else {
        query = environment.SOW_URL;
      }
    }
    // query = environment.SOW_URL;
    return this.sanitizer.sanitize(SecurityContext.URL, query);
  }

  createIframe(base = false) {
    const iframe = this.renderer.createElement('iframe') as HTMLIFrameElement
    this.renderer.setAttribute(iframe, 'src', this.sowURL(base))
    this.renderer.setAttribute(iframe, 'width', '100%')
    this.renderer.setAttribute(iframe, 'height', 'calc(100vh - 60px)')
    this.renderer.addClass(iframe, 'sowframe')
    this.renderer.listen(iframe, 'load', () => this.IframeOnload(iframe, this.sowURL(base), base))
    this.renderer.appendChild(this.sowIframe.nativeElement, iframe)
    // return iframe
  }

  IframeOnload(iframe: HTMLIFrameElement, src: string, reset: boolean) {
    this.SendCredentials(iframe, src, reset)
    window.addEventListener("message", (event) => this.IframeOnloadEvent(event, iframe, reset), false);
  }

  IframeOnloadEvent(event: MessageEvent, iframe: HTMLIFrameElement, reset: boolean) {
    if (iframe == null) {
      return
    }
    if (event.origin !== environment.SOW_URL) {
      return;
    }
    if ((!!(event.data.history) || !!(event.data.redirect)) == false) {
      this.SendCredentials(iframe, this.sowURL(true), reset)
      this.location.go('/sow');
    }
    // {
    // "redirect": "/assignment/create-assignment?project_id=e427038a-5997-468a-b588-6acb3ee7fdbe&sow_id=4792d028-6c22-493d-80a9-a60951e07510",
    // "moduletype": "SOW"
    // }
    if(!!(event.data.history) || !!(event.data.redirect)) {
      if (!!event.data.history) {
        if (event.data.history == '/') {
          this.location.go('/sow');
        } else if (event.data.history.includes('/?')) {
          const goto = event.data.history.replace('/?', 'sow?')
          this.location.go(goto);
        } else {
          this.location.go(event.data.history);
        }
      }
      if (!!event?.data?.redirect){
        this.router.navigateByUrl(`${event?.data?.redirect}`);
      }
    }

    // else {
    //   this.location.go('/sow');
    // }
    return;
  }

  SendCredentials(iframe: HTMLIFrameElement, src: string, reset: boolean) {
    if (iframe.contentWindow != null) {
      iframe.contentWindow.postMessage(
        {
          "token": JSON.parse(localStorage.getItem('Token')),
          "org_id": JSON.parse(localStorage.getItem('ORG_ID')),
          "program_id": JSON.parse(localStorage.getItem('PROGRAM_ID')),
          "user_type": JSON.parse(localStorage.getItem('user_type')),
          "redirect": src,
          "ancestorOrigin": window.location.origin,
          "userPreferredTimeZone": JSON.parse(localStorage.getItem('UserPreferredTimeZone'))?.id,
          "userLanguage": this._storageService.get(StorageKeys.USER_LANGUAGE) ? this._storageService.get(StorageKeys.USER_LANGUAGE) : "en-US",
          "themeCode": this._storageService.get('Usertheme') ?? "white-blue",
          "resetData": reset
        }, environment.SOW_URL);
    }
  }
  ngOnDestroy() {
    this.sowIframe.nativeElement.innerHTML = "";
    this.eventSubscriber.unsubscribe();
    this.langChangeSubscriber.unsubscribe();
    this.themeSubscriber.unsubscribe();
    window.removeEventListener("message", (event) => this.IframeOnloadEvent(event, null, true), false);
  }

}