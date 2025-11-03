import { Injectable } from '@angular/core';
import { HttpService } from 'src/app/core/services/http.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class JobsService {

 
  constructor(private _http: HttpService) {}
 
  get(endPoint): Observable<any> {
    return this._http.get(endPoint)
  }
  getCategory(endPoint): Observable<any> {
    return this._http.get(endPoint)
  }
}
