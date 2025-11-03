import { Injectable } from '@angular/core';

import { Subject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})

export class DataTransferService {

  private subject$: Subject<any>;
  dataObservable$: Observable<any>;

  constructor() {
    this.initSubjects();
  }

  send(data: any) {
    this.subject$.next(data);
  }

  initSubjects() {
    this.subject$ = new Subject();
    this.dataObservable$ = this.subject$.asObservable();
  }

}
