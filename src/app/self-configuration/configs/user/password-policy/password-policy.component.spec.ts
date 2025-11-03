import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PasswordPolicyComponent } from './password-policy.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('PasswordPolicyComponent', () => {
  let component: PasswordPolicyComponent;
  let fixture: ComponentFixture<PasswordPolicyComponent>;
  CommonTestingModule.setUpTestBed(PasswordPolicyComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(PasswordPolicyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
