import { TestBed } from '@angular/core/testing';

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ProgramSetupService } from './program-setup.service';

describe('ProgramSetupService', () => {
  let service: ProgramSetupService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports:[HttpClientTestingModule]
    });
    service = TestBed.inject(ProgramSetupService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
