import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { ActivityBasedPricingComponent } from './activity-based-pricing.component';

describe('ActivityBasedPricingComponent', () => {
  let component: ActivityBasedPricingComponent;
  let fixture: ComponentFixture<ActivityBasedPricingComponent>;
  CommonTestingModule.setUpTestBed(ActivityBasedPricingComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ActivityBasedPricingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ActivityBasedPricingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
