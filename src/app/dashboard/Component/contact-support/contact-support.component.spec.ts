import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { QuillModule } from 'ngx-quill';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { ContactSupportComponent } from './contact-support.component';

describe('ContactSupportComponent', () => {
  let component: ContactSupportComponent;
  let fixture: ComponentFixture<ContactSupportComponent>;
  CommonTestingModule.setUpTestBed(ContactSupportComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ContactSupportComponent ],
      imports : [QuillModule.forRoot()]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ContactSupportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
