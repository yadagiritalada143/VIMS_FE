import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { NotificationListComponent } from './notification-list.component';

describe('NotificationListComponent', () => {
  let component: NotificationListComponent;
  let fixture: ComponentFixture<NotificationListComponent>;
  CommonTestingModule.setUpTestBed(NotificationListComponent);
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NotificationListComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NotificationListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
