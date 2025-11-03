import { TestBed } from '@angular/core/testing';

import { MassUpdateService } from './mass-update.service';

describe('MassUpdateService', () => {
  let service: MassUpdateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MassUpdateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
