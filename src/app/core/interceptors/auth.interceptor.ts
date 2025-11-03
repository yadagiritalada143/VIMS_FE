import { Injectable, OnDestroy } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { Observable, Subject, Subscription, interval, of } from 'rxjs';
import { StorageService } from '../services/storage.service';
import { UserDataObj } from '../../shared/enums';
import { Router } from '@angular/router';
import { debounceTime, finalize, tap } from 'rxjs/operators';
import { LoaderService } from '../components/loader/loader.service';
import { LoginService } from 'src/app/auth/login/login.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor, OnDestroy {

  private subscriptions: Array<Subscription> = [];
  private readonly checkInterval: number = 1_000;
  private readonly timeInterval: number = 120_000;

  private logger: Map <HttpRequest <any>, number> = new Map <HttpRequest <any>, number> ();
  private resetAPILockSub: Subject <void> = new Subject <void> ();

  constructor(
    private router: Router,
    private _storageService: StorageService,
    private _loader: LoaderService,
    private loginService: LoginService
  ) {
    this.pendingRequestLogger();
    this.APILockResetSubInit();
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

    // Request staller
    if(this.loginService.impersonationAPILock) {
      return of(null);
    }

    let authReq: HttpRequest<any> = null;

    const storageCall: boolean = req.url.includes(`s3.amazonaws.com`);
    const notificationCall: boolean = this._storageService.get('notificationAuthDetails')?.base_url;
    const hasNotificationToken: boolean = req.url.includes(this._storageService.get('notificationAuthDetails')?.base_url);

    if (storageCall) {
      // Storage call
      authReq = req.clone({});
    } else if (notificationCall && hasNotificationToken) {
      // Notification call
      const authHeader = `Bearer ${this._storageService.get('notificationAuthDetails')?.token}`;
      authReq = req.clone({
        headers: req.headers.set('Authorization', authHeader)
      });
    } else {
      // Normal token call
      const token = this._storageService.get(UserDataObj[0]);
      const authHeader = `Bearer ${token}`;
      authReq = req.clone({
        headers: req.headers.set('Authorization', authHeader)
      });
    }

    if(this.loginService.impersonationSession) {
      authReq = req.clone({
        headers: authReq.headers.set('impersonation', 'true')
      });
    }

    this.loginService.APICallLock += 1;
    this.resetAPILockSub.next();
    this.logger.set(authReq, Date.now());

    return next.handle(authReq).pipe(
      tap({
        next: (event: HttpEvent<any>) => {
          if (event instanceof HttpResponse) { }
        }, error: (err: any) => {
          if (err instanceof HttpErrorResponse) {

            // START :: Temp fix to overcome jnotification auth failures
            if (err.url.toLowerCase().indexOf('jnotification') !== -1) {
              return;
            }

            // END :: Temp fix to overcome jnotification auth failures
            if (err.status === 401) {

              // Case for expired token
              if(this.loginService.impersonationSession) {
                this.loginService.exitImpersonation();
                return;
              }

              this._loader.hide();
              this._storageService.clear();
              this.router.navigate(['/auth/login']);
            }
          }
        }
      }), finalize(() => {
        this.loginService.APICallLock -= 1;
        this.logger.delete(authReq);
      })
    );
  }

  // Log request exceeding specified time interval
  pendingRequestLogger() {

    this.subscriptions.push(
      interval(this.checkInterval)
        .subscribe(() => {

          // Start evaluation at next event loop
          setTimeout(() => {

            // Do nothing
            if (this.loginService.APICallLock === 0) {
              return;
            }


            // Check for API calls exceeding timeout interval
            let errorTable: Array <any> = [];
            [...this.logger.entries()].forEach(([request, timestamp], it) => {

              if((Date.now() - timestamp) > this.timeInterval) {
                this.logger.delete(request);
                errorTable.push({
                  request: request.url,
                  timestamp: (new Date(timestamp))
                });
              }
            });

            // Print API calls exceeding timeout interval
            if(errorTable.length) {
              console.error(`SLI: API call(s) exceeding ${this.timeInterval}ms : `, errorTable);
            }
          })
        }
      )
    );
  }

  // Reset API call lock after specified IDLE time interval
  APILockResetSubInit() {
    this.subscriptions.push(
      this.resetAPILockSub.pipe(
        debounceTime(this.timeInterval)
      ).subscribe(() => {
        console.info('INFO: API Lock released');
        this.loginService.APICallLock = 0;
      })
    )
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub: Subscription) => {
      sub?.unsubscribe();
    });
  }
}
