import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { MarketRateComponent } from './market-rate.component';

describe('MarketRateComponent', () => {
  let component: MarketRateComponent;
  let fixture: ComponentFixture<MarketRateComponent>;
  CommonTestingModule.setUpTestBed(MarketRateComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ MarketRateComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MarketRateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
