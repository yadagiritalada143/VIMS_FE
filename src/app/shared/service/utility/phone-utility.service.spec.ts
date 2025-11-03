import { TestBed } from '@angular/core/testing';

import { PhoneUtilityService } from './phone-utility.service';

describe('PhoneUtilityService', () => {
  let service: PhoneUtilityService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PhoneUtilityService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
