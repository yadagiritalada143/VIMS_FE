import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { CustomFieldOptionsFormComponent } from './custom-field-options-form.component';

describe('CustomFieldOptionsFormComponent', () => {
  let component: CustomFieldOptionsFormComponent;
  let fixture: ComponentFixture<CustomFieldOptionsFormComponent>;
  CommonTestingModule.setUpTestBed(CustomFieldOptionsFormComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CustomFieldOptionsFormComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CustomFieldOptionsFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
