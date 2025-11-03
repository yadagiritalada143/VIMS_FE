import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { CreateQualificationTypeComponent } from './create-qualification-type.component';

describe('CreateQualificationTypeComponent', () => {
  let component: CreateQualificationTypeComponent;
  let fixture: ComponentFixture<CreateQualificationTypeComponent>;
  CommonTestingModule.setUpTestBed(CreateQualificationTypeComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateQualificationTypeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
