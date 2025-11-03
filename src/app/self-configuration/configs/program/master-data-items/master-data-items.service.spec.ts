import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { MasterDataItemsService } from './master-data-items.service';

describe('MasterDataItemsService', () => {
  let service: MasterDataItemsService;
  
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        RouterTestingModule
      ]
    });
    service = TestBed.inject(MasterDataItemsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
