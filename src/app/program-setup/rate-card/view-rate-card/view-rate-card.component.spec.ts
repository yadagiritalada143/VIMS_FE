import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { ViewRateCardComponent } from './view-rate-card.component';

describe('ViewRateCardComponent', () => {
  let component: ViewRateCardComponent;
  let fixture: ComponentFixture<ViewRateCardComponent>;
  CommonTestingModule.setUpTestBed(ViewRateCardComponent);
  beforeEach(() => {
    fixture = TestBed.createComponent(ViewRateCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
