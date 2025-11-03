import { TestBed } from '@angular/core/testing';

import { AuthLoginService } from './auth-login.service';
import { HttpClientModule } from '@angular/common/http';

describe('AuthLoginService', () => {
  let service: AuthLoginService;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientModule] });
    service = TestBed.inject(AuthLoginService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
