import { Location, LocationStrategy, PathLocationStrategy } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, OnDestroy, OnInit, Renderer2, SecurityContext, ViewChild } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { environment } from '../../../environments/environment';
import { Router } from '@angular/router';
import { Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { Subscription } from 'rxjs';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';

@Component({
  selector: 'app-rfx',
  templateUrl: './rfx.component.html',
  styleUrls: ['./rfx.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default,
  providers: [Location, { provide: LocationStrategy, useClass: PathLocationStrategy }]
})
export class ListRFxComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('rfxIframe', { static: false }) rfxIframe: ElementRef<HTMLDivElement>;

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
      if (String(data.path).includes("rfx")) {
        this._storageService.set("rfx_side_nav", data.path, true)
      }
      this.rfxIframe.nativeElement.innerHTML = "";
      if (this.rfxIframe != undefined) {
        this.createIframe(true)
      }
    })
    this.themeSubscriber = this.eventStream.on(Events.THEME_UPDATE).subscribe((data) => {
      setTimeout(() => {
        this.rfxIframe.nativeElement.innerHTML = "";
        if (this.rfxIframe != undefined) {
          this.createIframe(true)
        }
      }, 500);  
    })
    this.langChangeSubscriber = this.eventStream.on(Events.LANGUAGE_SWITCHED).subscribe(() => {
      this.rfxIframe.nativeElement.innerHTML = "";
      if (this.rfxIframe != undefined) {
        this.createIframe(true)
      }
    })
  }
  ngAfterViewInit() {
    if (this.rfxIframe != undefined) {
      const rfxs = this._storageService.get("rfx_side_nav")
      this.createIframe(rfxs === "/rfx/create")
    }
  }
  rfxURL(base: boolean) {
    let query = ""
    if (base) {
      query = environment.RFX_URL;
    } else {
      if (this.router.url.includes("/rfx/")) {
        query = environment.RFX_URL + (this.router.url);
      }
      else if (this.router.url.includes("/rfx/list?")) {
        query = environment.RFX_URL + (this.router.url);
      }
      else {
        query = environment.RFX_URL;
      }
    }
    // query = environment.RFX_URL;
    return this.sanitizer.sanitize(SecurityContext.URL, query);
  }

  createIframe(base = false) {
    const iframe = this.renderer.createElement('iframe') as HTMLIFrameElement
    this.renderer.setAttribute(iframe, 'src', this.rfxURL(base))
    this.renderer.setAttribute(iframe, 'width', '100%')
    this.renderer.setAttribute(iframe, 'height', 'calc(100vh - 60px)')
    this.renderer.addClass(iframe, 'rfxframe')
    this.renderer.listen(iframe, 'load', () => this.IframeOnload(iframe, this.rfxURL(base), base))
    this.renderer.appendChild(this.rfxIframe.nativeElement, iframe)
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
    if (event.origin !== environment.RFX_URL) {
      return;
    }
    if ((!!(event.data.history) || !!(event.data.redirect)) == false) {
      this.SendCredentials(iframe, this.rfxURL(true), reset)
      this.location.go('/rfx');
    }
    if(!!(event.data.history) || !!(event.data.redirect)) {
      if (!!event.data.history) {
        if (event.data.history == '/') {
          this.location.go('/rfx');
        } else if (event.data.history.includes('/rfx/list?')) {
          const goto = event.data.history
          this.location.go(goto);
        } else {
          this.location.go(event.data.history);
        }
      }
      if (!!event?.data?.redirect){
        this.router.navigateByUrl(`${event?.data?.redirect}`);
      }
    }
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
        }, environment.RFX_URL);
    }
  }
  ngOnDestroy() {
    this.rfxIframe.nativeElement.innerHTML = "";
    this.eventSubscriber.unsubscribe();
    this.langChangeSubscriber.unsubscribe();
    this.themeSubscriber.unsubscribe();
    window.removeEventListener("message", (event) => this.IframeOnloadEvent(event, null, true), false);
  }

}