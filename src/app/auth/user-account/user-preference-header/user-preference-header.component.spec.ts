import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { UserPreferenceHeaderComponent } from './user-preference-header.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('UserPreferenceHeaderComponent', () => {
  let component: UserPreferenceHeaderComponent;
  let fixture: ComponentFixture<UserPreferenceHeaderComponent>;
  CommonTestingModule.setUpTestBed(UserPreferenceHeaderComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(UserPreferenceHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
