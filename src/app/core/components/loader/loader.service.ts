import { Injectable, Injector } from '@angular/core';
import { Subject, interval } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Loader } from './loader.model';
import { LoginService } from 'src/app/auth/login/login.service';

@Injectable({
  providedIn: 'root'
})
export class LoaderService {

  private loaderLock: boolean = false;
  private loaderSubject = new Subject <Loader> ();
  loaderState = this.loaderSubject.asObservable();

  constructor(private injector: Injector) { }

  show(message = 'loading,_please_wait') {
    if(!this.loaderLock)
      this.loaderSubject.next(<Loader>{ show: true, message: message });
  }
  hide() {
    if(!this.loaderLock)
      this.loaderSubject.next(<Loader>{ show: false });
  }

  timer(timer = 2000) {
    if(!this.loaderLock)
      this.loaderSubject.next(<Loader>{ show: true, timer });
  }

  // Launch persistent loader till all API calls aren't resolved
  launchPersistentLoader(): Promise <any> {
    this.show();
    this.loaderLock = true;
    return new Promise((resolve: Function, reject: Function) => {

      let $destroySub: Subject <void> = new Subject <void> ();
      let loginService: LoginService = this.injector.get(LoginService);

      interval(100)
      .pipe(takeUntil($destroySub))
      .subscribe(() => {
          if(loginService.APICallLock === 0) {
            $destroySub.next();
            this.loaderLock = false;
            this.hide();
            return resolve(true);
          }
      })
    });
  }
}
