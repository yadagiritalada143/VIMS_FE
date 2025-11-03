import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NotificationLogComponent } from './notification-log.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('NotificationLogComponent', () => {
  let component: NotificationLogComponent;
  let fixture: ComponentFixture<NotificationLogComponent>;
  CommonTestingModule.setUpTestBed(NotificationLogComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(NotificationLogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
