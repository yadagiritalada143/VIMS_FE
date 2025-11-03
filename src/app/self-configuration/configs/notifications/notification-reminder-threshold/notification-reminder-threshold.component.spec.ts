import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NotificationReminderThresholdComponent } from './notification-reminder-threshold.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('NotificationReminderThresholdComponent', () => {
  let component: NotificationReminderThresholdComponent;
  let fixture: ComponentFixture<NotificationReminderThresholdComponent>;
  CommonTestingModule.setUpTestBed(NotificationReminderThresholdComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(NotificationReminderThresholdComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
