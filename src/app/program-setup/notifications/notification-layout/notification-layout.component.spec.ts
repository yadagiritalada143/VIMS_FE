import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { NotificationLayoutComponent } from './notification-layout.component';

describe('NotificationLayoutComponent', () => {
  let component: NotificationLayoutComponent;
  let fixture: ComponentFixture<NotificationLayoutComponent>;
  CommonTestingModule.setUpTestBed(NotificationLayoutComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ NotificationLayoutComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NotificationLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
