import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { OnboardingSetupIntroComponent } from './onboarding-setup-intro.component';
import { RouterTestingModule } from '@angular/router/testing';

describe('OnboardingSetupIntroComponent', () => {
  let component: OnboardingSetupIntroComponent;
  let fixture: ComponentFixture<OnboardingSetupIntroComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [OnboardingSetupIntroComponent],
      imports: [RouterTestingModule]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OnboardingSetupIntroComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
