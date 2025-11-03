import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { NotificationSettingsComponent } from './notification-settings.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('NotificationSettingsComponent', () => {
  let component: NotificationSettingsComponent;
  let fixture: ComponentFixture<NotificationSettingsComponent>;
  CommonTestingModule.setUpTestBed(NotificationSettingsComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(NotificationSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
