import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { AttachmentItemComponent } from './attachment-item.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('AttachmentItemComponent', () => {
  let component: AttachmentItemComponent;
  let fixture: ComponentFixture<AttachmentItemComponent>;
  CommonTestingModule.setUpTestBed(AttachmentItemComponent);

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ AttachmentItemComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AttachmentItemComponent);
    component = fixture.componentInstance;
    component.attachment = Object.create({});
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
