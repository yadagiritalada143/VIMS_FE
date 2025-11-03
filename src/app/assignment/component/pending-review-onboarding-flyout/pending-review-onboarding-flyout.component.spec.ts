import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { PendingReviewOnboardingFlyoutComponent } from './pending-review-onboarding-flyout.component';

describe('PendingReviewOnboardingFlyoutComponent', () => {
  let component: PendingReviewOnboardingFlyoutComponent;
  let fixture: ComponentFixture<PendingReviewOnboardingFlyoutComponent>;
  CommonTestingModule.setUpTestBed(PendingReviewOnboardingFlyoutComponent);
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PendingReviewOnboardingFlyoutComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PendingReviewOnboardingFlyoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
