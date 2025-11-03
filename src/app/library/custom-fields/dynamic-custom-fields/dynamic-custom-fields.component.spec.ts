import { ComponentFixture, TestBed } from '@angular/core/testing';
import { dynamicCustomFieldsComponent } from './dynamic-custom-fields.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('dynamicCustomFieldsComponent', () => {
  let component: dynamicCustomFieldsComponent;
  let fixture: ComponentFixture<dynamicCustomFieldsComponent>;
  CommonTestingModule.setUpTestBed(dynamicCustomFieldsComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(dynamicCustomFieldsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
