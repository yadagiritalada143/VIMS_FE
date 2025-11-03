import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { CustomFieldTypeComponent } from './custom-field-type.component';

describe('CustomFieldTypeComponent', () => {
  let component: CustomFieldTypeComponent;
  let fixture: ComponentFixture<CustomFieldTypeComponent>;
  CommonTestingModule.setUpTestBed(CustomFieldTypeComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CustomFieldTypeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CustomFieldTypeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
