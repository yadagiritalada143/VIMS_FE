import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { InviteUserComponent } from './invite-user.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('InviteUserComponent', () => {
  let component: InviteUserComponent;
  let fixture: ComponentFixture<InviteUserComponent>;
  CommonTestingModule.setUpTestBed(InviteUserComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(InviteUserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
