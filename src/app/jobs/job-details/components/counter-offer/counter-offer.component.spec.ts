import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { CounterOfferComponent } from './counter-offer.component';
import { SvmsDatepickerComponent } from 'src/app/shared/components/svms-datepicker/svms-datepicker.component';

describe('CounterOfferComponent', () => {
  let component: CounterOfferComponent;
  let fixture: ComponentFixture<CounterOfferComponent>;
  CommonTestingModule.setUpTestBed(CounterOfferComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CounterOfferComponent,
      SvmsDatepickerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CounterOfferComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
