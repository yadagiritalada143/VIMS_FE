import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { CustomFieldsTabsComponent } from './custom-fields-tabs.component';

describe('ChooseCustomFieldsComponent', () => {
  let component: CustomFieldsTabsComponent;
  let fixture: ComponentFixture<CustomFieldsTabsComponent>;
  CommonTestingModule.setUpTestBed(CustomFieldsTabsComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [CustomFieldsTabsComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CustomFieldsTabsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
