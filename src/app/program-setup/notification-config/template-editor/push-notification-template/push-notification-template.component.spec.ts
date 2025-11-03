import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { PushNotificationTemplateComponent } from './push-notification-template.component';

describe('PushNotificationTemplateComponent', () => {
  let component: PushNotificationTemplateComponent;
  let fixture: ComponentFixture<PushNotificationTemplateComponent>;
  CommonTestingModule.setUpTestBed(PushNotificationTemplateComponent);
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PushNotificationTemplateComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PushNotificationTemplateComponent);
    component = fixture.componentInstance;
    component.pushNotificationFields = {
      title: 'title',
      details: 'details',
      body: 'body',
      recipients: 'recipients',
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
