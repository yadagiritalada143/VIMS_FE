import { TestBed } from '@angular/core/testing';
import { CandidateService } from './candidate.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
describe('CandidateService', () => {
  let service: CandidateService;
  
  beforeEach(() => {
    TestBed.configureTestingModule({imports : [HttpClientTestingModule],providers:[LocalDateFormatPipe]});
    service = TestBed.inject(CandidateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
