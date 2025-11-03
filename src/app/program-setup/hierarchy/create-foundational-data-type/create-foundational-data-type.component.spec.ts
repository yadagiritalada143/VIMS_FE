import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { CreateFoundationalDataTypeComponent } from './create-foundational-data-type.component';

describe('CreateFoundationalDataTypeComponent', () => {
  let component: CreateFoundationalDataTypeComponent;
  let fixture: ComponentFixture<CreateFoundationalDataTypeComponent>;
  CommonTestingModule.setUpTestBed(CreateFoundationalDataTypeComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateFoundationalDataTypeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
