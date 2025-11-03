import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { CustomFieldsListComponent } from './custom-fields-list.component';

describe('CustomFieldsListComponent', () => {
  let component: CustomFieldsListComponent;
  let fixture: ComponentFixture<CustomFieldsListComponent>;
  CommonTestingModule.setUpTestBed(CustomFieldsListComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CustomFieldsListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CustomFieldsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
