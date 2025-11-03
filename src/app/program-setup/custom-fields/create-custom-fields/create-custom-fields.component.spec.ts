import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { CreateCustomFieldsComponent } from './create-custom-fields.component';

describe('CreateCustomFieldsComponent', () => {
  let component: CreateCustomFieldsComponent;
  let fixture: ComponentFixture<CreateCustomFieldsComponent>;
  CommonTestingModule.setUpTestBed(CreateCustomFieldsComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CreateCustomFieldsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateCustomFieldsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
