import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { CommonNotificationSettingsComponent } from './common-notification-settings.component';

describe('CommonNotificationSettingsComponent', () => {
  let component: CommonNotificationSettingsComponent;
  let fixture: ComponentFixture<CommonNotificationSettingsComponent>;
  CommonTestingModule.setUpTestBed(CommonNotificationSettingsComponent);
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CommonNotificationSettingsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CommonNotificationSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
