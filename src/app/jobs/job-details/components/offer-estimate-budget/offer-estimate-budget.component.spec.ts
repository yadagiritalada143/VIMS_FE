import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { OfferEstimateBudgetComponent } from './offer-estimate-budget.component';
import { AccuracyPipe } from 'src/app/shared/pipe/accuracy.pipe';
import { DecimalPipe } from '@angular/common';
describe('OfferEstimateBudgetComponent', () => {
  let component: OfferEstimateBudgetComponent;
  let fixture: ComponentFixture<OfferEstimateBudgetComponent>;
  CommonTestingModule.setUpTestBed(OfferEstimateBudgetComponent);
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OfferEstimateBudgetComponent, AccuracyPipe ],
      providers: [
        { provide: AccuracyPipe, useValue: DecimalPipe },
        DecimalPipe,
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OfferEstimateBudgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
