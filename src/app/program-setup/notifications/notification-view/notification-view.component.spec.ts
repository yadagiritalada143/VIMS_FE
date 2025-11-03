import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { QuillModule } from 'ngx-quill';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { NotificationViewComponent } from './notification-view.component';

describe('NotificationViewComponent', () => {
  let component: NotificationViewComponent;
  let fixture: ComponentFixture<NotificationViewComponent>;
  CommonTestingModule.setUpTestBed(NotificationViewComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ NotificationViewComponent ],
      imports:[QuillModule.forRoot()]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NotificationViewComponent);
    component = fixture.componentInstance;
    component.messageForm = new UntypedFormGroup({
      content : new UntypedFormControl()
    })
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
