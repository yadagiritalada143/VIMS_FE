import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { EmailTemplateHeaderComponent } from './email-template-header.component';

describe('EmailTemplateHeaderComponent', () => {
  let component: EmailTemplateHeaderComponent;
  let fixture: ComponentFixture<EmailTemplateHeaderComponent>;
  CommonTestingModule.setUpTestBed(EmailTemplateHeaderComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ EmailTemplateHeaderComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EmailTemplateHeaderComponent);
    component = fixture.componentInstance;
    fixture.componentInstance.ngOnInit();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
