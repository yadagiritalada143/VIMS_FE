import { TestBed } from '@angular/core/testing';
import { DocumentParsingService } from './document-parsing.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('DocumentParsingService', () => {
  let service: DocumentParsingService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [HttpClientTestingModule],
    });
    service = TestBed.inject(DocumentParsingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
