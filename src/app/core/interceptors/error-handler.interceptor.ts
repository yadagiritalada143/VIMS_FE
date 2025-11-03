import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators'
import { AlertService } from '../components/alert/alert.service';
import { Router } from '@angular/router';
import { StorageService } from '../services/storage.service';
import { LoaderService } from '../components/loader/loader.service';
import { EventStreamService, EmitEvent, Events, } from '../services/event-stream.service';
import { LoginService } from 'src/app/auth/login/login.service';

@Injectable()
export class ErrorHandlerInterceptor implements HttpInterceptor {
  private _errorCodes = {
    400: 'Bad request syntax',
    401: 'Unauthorized request',
    403: 'Forbidden. The server is refusing to respond to the request',
    404: 'The requested endpoint was not found',
    500: 'Internal server issue. Please try again later',
    502: 'Bad gateway error',
    503: 'The server is currently unavailable',
    504: 'Gateway timeout error'
  }

  constructor(
    private _alertService: AlertService,
    private _router: Router,
    private _storageService: StorageService,
    private _loader: LoaderService,
    private eventStream: EventStreamService,
    private login: LoginService
  ) { }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401 && !error?.url?.endsWith('authenticate')) { //error reaction for Unauthorize response
          // START :: Temp fix to overcome jnotification auth failures
          if(this.login.impersonationSession) {
            this.login.revertToOriginalUser();
            return of(undefined);
          }


          if (error.url.toLowerCase().indexOf('jnotification') !== -1) {
            return of(undefined);
          }
          // END :: Temp fix to overcome jnotification auth failures
          if (error?.error?.error) {
            this._alertService.error(error?.error?.error?.message);
            this.eventStream.emit(new EmitEvent(Events.HIDESPINNER, 'hide'));
          }
          this._loader.hide();
          this._storageService.clear();
          this._router.navigate(['/auth/login']);
          return of(undefined);
        }

        //To enable global error alert for responses, uncomment this code

        //else if (this._errorCodes.hasOwnProperty(error.status)) {
        //this._alertService.error(this._errorCodes[error.status]);
        //throw error;
        //}

        else throw error;
      })
    )
  }

}
