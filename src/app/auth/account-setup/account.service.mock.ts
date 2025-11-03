import { Injectable } from '@angular/core';
import { AccountService } from './account.service';
import { of } from 'rxjs';
@Injectable()
export class AccountServiceMock extends AccountService {
    validateUserInvitationToken() { return of([]); }
    setPasswordViaInvitaionToken() { return of([]); }
    updateUserDetails() { return of([]); }
    Questions() { return of([]); }
}
