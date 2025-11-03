import { TestBed } from '@angular/core/testing';

import { AuthguardService } from './auth_guard.service';
import { RouterTestingModule } from '@angular/router/testing';

describe('AuthguardService', () => {
  let service: AuthguardService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule]
    });
    service = TestBed.inject(AuthguardService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
