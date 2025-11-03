import { Injectable } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { StorageService } from './storage.service';

/**
 * NavigationService
 *
 * This service is responsible for tracking navigation history within the application.
 *
 * @Injectable - Decorator that marks a class as available to be provided and injected as a dependency.
 */
@Injectable({
  providedIn: 'root',
})
export class NavigationService {
  // Private property `history` that is an array of strings.
  // It is used to maintain the history of navigation URLs.
  private history: string[] = [];

  /**
   * Constructor function. This function is called when a new instance of this class is created.
   *
   * @param router - An instance of Angular Router is injected into this service.
   */
  constructor(private router: Router, private storageService: StorageService) {
    // Loads navigation history from session storage at the time of service initialization.
    this.loadNavigationHistory();

    // Subscribes to the router events observable.
    // The pipe() function is used with the filter() operator to subscribe to NavigationEnd events only.
    // NavigationEnd events are emitted by Angular Router whenever a navigation completes successfully.
    // The subscribe function is passed a callback that adds the new URL to the `history` array,
    // and then saves the updated `history` array to session storage.
    this.router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe(({ urlAfterRedirects }: NavigationEnd) => {
          // Only add the new URL if it's different from the current URL in the history
          if (this.history[this.history.length - 1] !== urlAfterRedirects) {
            this.history = [...this.history, urlAfterRedirects];
          }

      if (this.history.length > 20) {
        this.history.splice(0, this.history.length - 20); // keep last 20 entries
      }
      this.storageService.setSession('navigationHistory', JSON.stringify(this.history));
    });
  }

  /**
   * getPreviousUrl function
   *
   * This public method is used to get the URL of the previous page from the `history` array.
   *
   * @returns The URL of the previous page as a string, or '/' if there is no previous page.
   */
  public getPreviousUrl(): string {
    const history = this.history;
    return history[history.length - 2] || '/';
  }

  /**
   * loadNavigationHistory function
   *
   * This private method is used to load navigation history from session storage.
   * If there is no navigation history in session storage, it sets `history` to an empty array.
   */
  public loadNavigationHistory(): void {
    const history = this.storageService.getSession('navigationHistory');
    this.history = history ? JSON.parse(history) : [];
  }
}
