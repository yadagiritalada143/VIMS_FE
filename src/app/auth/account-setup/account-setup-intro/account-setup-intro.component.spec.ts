import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { AccountSetupIntroComponent } from './account-setup-intro.component';
import { RouterTestingModule } from '@angular/router/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('AccountSetupIntroComponent', () => {
  let component: AccountSetupIntroComponent;
  let fixture: ComponentFixture<AccountSetupIntroComponent>;
  CommonTestingModule.setUpTestBed(AccountSetupIntroComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(AccountSetupIntroComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
