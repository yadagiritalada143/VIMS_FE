import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { AccountSettingsComponent } from './account-settings.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('AccountSettingsComponent', () => {
  let component: AccountSettingsComponent;
  let fixture: ComponentFixture<AccountSettingsComponent>;
  CommonTestingModule.setUpTestBed(AccountSettingsComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(AccountSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
