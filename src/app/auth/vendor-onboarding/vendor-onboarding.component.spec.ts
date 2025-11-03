import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { VendorOnboardingComponent } from './vendor-onboarding.component';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { AccountServiceMock } from '../account-setup/account.service.mock';

describe('AccountSetupIntroComponent', () => {
  let component: VendorOnboardingComponent;
  let fixture: ComponentFixture<VendorOnboardingComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [VendorOnboardingComponent],
      imports: [RouterModule.forRoot([], { relativeLinkResolution: 'legacy' }), HttpClientModule],
      providers: [{ provide: AccountServiceMock }]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VendorOnboardingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
