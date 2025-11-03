import { TestBed } from '@angular/core/testing';

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MasterTalentProfileService } from './master-talent-profile.service';

describe('MasterTalentProfileService', () => {
  let service: MasterTalentProfileService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(MasterTalentProfileService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
