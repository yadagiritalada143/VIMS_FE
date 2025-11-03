import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { EmailBasedSettingsComponent } from './email-based-settings.component';

describe('EmailBasedSettingsComponent', () => {
  let component: EmailBasedSettingsComponent;
  let fixture: ComponentFixture<EmailBasedSettingsComponent>;
  CommonTestingModule.setUpTestBed(EmailBasedSettingsComponent);
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EmailBasedSettingsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EmailBasedSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
