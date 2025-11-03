import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { EmailDesignerComponent } from './email-designer.component';

describe('EmailDesignerComponent', () => {
  let component: EmailDesignerComponent;
  let fixture: ComponentFixture<EmailDesignerComponent>;
  CommonTestingModule.setUpTestBed(EmailDesignerComponent);
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EmailDesignerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EmailDesignerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
