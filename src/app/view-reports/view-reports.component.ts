import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit, Renderer2, Injector } from '@angular/core';
import { Observable, Subscription, filter, interval } from 'rxjs';
import { switchMap, tap } from 'rxjs';
// import * as analytics from 'analytics';
import { HttpService } from '../core/services/http.service';
import { environment } from 'src/environments/environment';
import { StorageKeys, StorageService } from '../core/services/storage.service';
import { ActivatedRoute, NavigationStart,  Router } from '@angular/router';
import { Location } from '@angular/common';

@Component({
  selector: 'app-view-reports-iframe',
  templateUrl: './view-reports.component.html',
  styleUrls: ['./view-reports.component.scss'],
})
export class ViewReportsComponent implements OnInit, OnDestroy, AfterViewInit {
  isLoading = true;
  accessToken$ = new Observable<{
    accesstoken: string;
    expiresIn: number;
  }>();

  refreshAccessToken$ = new Observable<{
    accesstoken: string;
    expiresIn: number;
  }>();
  private baseURL = `${environment.API_ENDPOINT}`;

  @ViewChild('analytics', {static: true}) analytics: ElementRef
  componentPath = '/view-reports'
  currentAppPath = `/reports/recent`

  subscriptions: Array<Subscription> = []
  
  private renderer: Renderer2
  private route:ActivatedRoute
  private router: Router
  private location: Location
  private httpService: HttpService
  private storageService: StorageService
  constructor(
    // private httpService: HttpService, 
    // private storageService: StorageService, 
    // private route:ActivatedRoute, 
    // private renderer: Renderer2,
    private injector: Injector
    ) {
    // this.loadReport();
    this.route = injector.get(ActivatedRoute)
    this.router = injector.get(Router)
    this.location = injector.get(Location)
    this.renderer = injector.get(Renderer2)
    this.httpService = injector.get(HttpService)
    this.storageService = injector.get(StorageService)

    environment.REPORTING_MODULE_URL = localStorage.getItem('__REPORTING_MODULE_URL__') || environment.REPORTING_MODULE_URL;

    this.currentAppPath = '/' + this.route.snapshot.url.map(x => x.path).join('/')
    console.log(this.route.snapshot.data)

  }

  private loadIframe() {
    const iframe = this.renderer.createElement('iframe') as HTMLIFrameElement
    this.renderer.setAttribute(iframe, 'src', environment.REPORTING_MODULE_URL)
    this.renderer.setAttribute(iframe, 'width', '100%')
    this.renderer.setAttribute(iframe, 'height', 'calc(100vh - 60px)')
    this.renderer.addClass(iframe, 'analytics')
    this.renderer.listen(iframe, 'load', () => this.initIframe(iframe))
    this.renderer.appendChild(this.analytics.nativeElement, iframe)

    const subscription = this.router.events.pipe(filter(event => event instanceof NavigationStart)).subscribe(
      (newRoute: NavigationStart) => {
        const newUrlPath = newRoute.url
        console.log(newUrlPath)

        const newAppPath = '/' + newRoute.url
        if(!newUrlPath.startsWith(this.componentPath) || newAppPath === this.currentAppPath) return;

        this.currentAppPath = newAppPath

        const win = iframe.contentWindow
        win.postMessage({ type: 'redirect', args: [{path: newUrlPath.slice(this.componentPath.length)}] }, '*')
      }
    )
    this.subscriptions.push(subscription)
    
  }

  private initIframe(iframe: HTMLIFrameElement) {
    const win = iframe.contentWindow
    this.accessToken$ = this.getCustomGeneratedToken();
    const currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    
    this.accessToken$.subscribe(
      res => {

        win.postMessage({
          type: 'init',
          args: [
              {
                  type: this.currentAppPath,
                  token: res?.accesstoken,
                  program: currentProgram?.id,
                  user_date_format: currentProgram?.config?.preferred_date_format,
                  api_url: `${this.baseURL}/analytics-api`,
                  events: ['loaded', 'dataSelected', 'error','renderingStarted']
              }
          ]
        }, environment.REPORTING_MODULE_URL)

        const currentDate: any = new Date();
        const after1Hour = new Date();
        after1Hour.setHours(after1Hour.getHours() + 1);
        const expireDate: any = new Date(res?.expiresIn || after1Hour);
        this.refreshAccessToken$ = interval(((Math.ceil(Math.abs(expireDate - currentDate) / (1000 * 60)) - 2) * 60) * 1000).pipe( // will fetch new token before expiring the token
          tap(_ => console.log('refresh token')),
          switchMap(_ => this.accessToken$),
        );

        // FIXME: unsubscribe all subscriptions on destroy
        this.refreshAccessToken$.subscribe(r => {
          win.postMessage({
            type: 'updateToken',
            args: [
                {
                  token: r?.accesstoken,
                }
            ]
          }, environment.REPORTING_MODULE_URL)
        });


        const eventHandlerMap = {
            routeChange: (event: MessageEvent, path: string) => {
                console.log(path)
                this.currentAppPath = path
                this.location.go(`${this.componentPath}${path}`)
            },

            SDK: (event: MessageEvent, sdk_event: string) => {
              if(sdk_event === "Loaded") {
                this.isLoading = false
              }
            }
        }

        window.addEventListener('message', (event) => {
            if(!event.data?.type) return;

            const handler = eventHandlerMap[event.data?.type]
            if(!handler)return;
            
            handler(event, ...event.data.args)
        })
      }
    )

    
  }

  getCustomGeneratedToken(): Observable<any> {
    const url = '/profile-manager/authentication/generate-custom-token';
    return this.httpService.get(url, this.baseURL);
  }

  onInit = (event: any): void => {
    console.log(event);
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.subscriptions.forEach(subscription => subscription.unsubscribe())
  }

  ngAfterViewInit(): void {
    this.loadIframe()
  }
}
