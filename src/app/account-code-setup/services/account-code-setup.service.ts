import { HttpService } from './../../core/services/http.service';
import { Injectable } from '@angular/core';
import { AccoutCodeValidationRequest } from '../models/account-code-setup-model';
import { Observable } from 'rxjs/internal/Observable';

@Injectable({
  providedIn: 'root'
})
export class AccountCodeService {

  constructor(private httpService: HttpService) { }

  verifyAccountCodeToken(programId: string ,payload :AccoutCodeValidationRequest): Observable<any> {
     return this.httpService.post(`/configurator/programs/${programId}/accountcode_validation`,payload);
  }
  
}
