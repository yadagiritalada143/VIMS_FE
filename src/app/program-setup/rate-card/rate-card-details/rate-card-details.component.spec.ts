import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { RateCardDetailsComponent } from './rate-card-details.component';

describe('RateCardDetailsComponent', () => {
  let component: RateCardDetailsComponent;
  let fixture: ComponentFixture<RateCardDetailsComponent>;


  CommonTestingModule.setUpTestBed(RateCardDetailsComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(RateCardDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
