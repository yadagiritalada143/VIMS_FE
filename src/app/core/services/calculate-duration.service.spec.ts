import { TestBed } from '@angular/core/testing';

import { CalculateDurationService } from './calculate-duration.service';

describe('CalculateDurationService', () => {
  let service: CalculateDurationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CalculateDurationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
