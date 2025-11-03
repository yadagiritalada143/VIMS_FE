import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { RateCardUomFilterComponent } from './rate-card-uom-filter.component';

describe('RateCardUomFilterComponent', () => {
  let component: RateCardUomFilterComponent;
  let fixture: ComponentFixture<RateCardUomFilterComponent>;
  CommonTestingModule.setUpTestBed(RateCardUomFilterComponent);
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RateCardUomFilterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RateCardUomFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
