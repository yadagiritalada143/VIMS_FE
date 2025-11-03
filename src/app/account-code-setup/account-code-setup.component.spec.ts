import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { AccountCodeSetupComponent } from './account-code-setup.component';

describe('AccountCodeSetupComponent', () => {
  let component: AccountCodeSetupComponent;
  let fixture: ComponentFixture<AccountCodeSetupComponent>;

  CommonTestingModule.setUpTestBed(AccountCodeSetupComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ AccountCodeSetupComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AccountCodeSetupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
