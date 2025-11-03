import { TestBed } from '@angular/core/testing';

import { ProgramConfigService } from './program-config.service';

describe('ProgramConfigService', () => {
  let service: ProgramConfigService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProgramConfigService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
