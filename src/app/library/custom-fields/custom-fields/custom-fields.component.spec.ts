import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CustomFieldsComponent } from './custom-fields.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('CustomFieldsComponent', () => {
  let component: CustomFieldsComponent;
  let fixture: ComponentFixture<CustomFieldsComponent>;
  CommonTestingModule.setUpTestBed(CustomFieldsComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(CustomFieldsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
