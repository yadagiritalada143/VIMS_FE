import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { TemplateKeyDetailsComponent } from './template-key-details.component';

describe('TemplateKeyDetailsComponent', () => {
  let component: TemplateKeyDetailsComponent;
  let fixture: ComponentFixture<TemplateKeyDetailsComponent>;

  CommonTestingModule.setUpTestBed(TemplateKeyDetailsComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(TemplateKeyDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
