import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SetPasswordComponent } from './set-password.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('SetPasswordComponent', () => {
  let component: SetPasswordComponent;
  let fixture: ComponentFixture<SetPasswordComponent>;
  CommonTestingModule.setUpTestBed(SetPasswordComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(SetPasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
