import { TestBed } from '@angular/core/testing';

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { RateFactorService } from './rate-factor.service';

describe('RateFactorService', () => {
  let service: RateFactorService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports:[
        HttpClientTestingModule,RouterTestingModule
      ]
    });
    service = TestBed.inject(RateFactorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
