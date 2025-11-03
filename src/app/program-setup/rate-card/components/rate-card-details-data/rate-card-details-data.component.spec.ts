import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { RateCardDetailsDataComponent } from './rate-card-details-data.component';

describe('RateCardDetailsDataComponent', () => {
  let component: RateCardDetailsDataComponent;
  let fixture: ComponentFixture<RateCardDetailsDataComponent>;
  CommonTestingModule.setUpTestBed(RateCardDetailsDataComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ RateCardDetailsDataComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RateCardDetailsDataComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
