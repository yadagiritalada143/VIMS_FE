import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { RateCardUomComponent } from './rate-card-uom.component';

describe('RateCardUomComponent', () => {
  let component: RateCardUomComponent;
  let fixture: ComponentFixture<RateCardUomComponent>;
  CommonTestingModule.setUpTestBed(RateCardUomComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ RateCardUomComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RateCardUomComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
