import { Injectable } from '@angular/core';
import { NavigationExtras, Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class SvmsRouterService {

  constructor(private route: Router) { }

  navigate(navigation: Array<any>, opts: NavigationExtras = {}): Promise<any> {

    if (this.fromSelfConfiguration()) {
      return this.route.navigate(['self-configuration', ...navigation], opts);
    }

    if (this.fromControlPanel()) {
      return this.route.navigate(['control-panel', ...navigation], opts);
    }

    return this.route.navigate(navigation, opts);
  }

  public fromSelfConfiguration() {
    return this.route.url?.split('/')?.includes('self-configuration');
  }

  public fromControlPanel() {
    return this.route.url?.split('/')?.includes('control-panel');
  }

  public get url(): string {
    return this.route?.url || '';
  }
}
