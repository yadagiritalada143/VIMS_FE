import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { BidListComponent } from './bid-list.component';

describe('BidListComponent', () => {
  let component: BidListComponent;
  let fixture: ComponentFixture<BidListComponent>;
  CommonTestingModule.setUpTestBed(BidListComponent);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BidListComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BidListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
