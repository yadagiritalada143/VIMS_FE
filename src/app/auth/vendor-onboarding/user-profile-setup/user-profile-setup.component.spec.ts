import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { UserProfileSetupComponent } from './user-profile-setup.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('UserProfileSetupComponent', () => {
  let component: UserProfileSetupComponent;
  let fixture: ComponentFixture<UserProfileSetupComponent>;
  CommonTestingModule.setUpTestBed(UserProfileSetupComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(UserProfileSetupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
