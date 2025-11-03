import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { ReOrderingCustomFieldsComponent } from './reordering-custom-fields.component';

describe('CreateCustomFieldsComponent', () => {
  let component: ReOrderingCustomFieldsComponent;
  let fixture: ComponentFixture<ReOrderingCustomFieldsComponent>;
  CommonTestingModule.setUpTestBed(ReOrderingCustomFieldsComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ReOrderingCustomFieldsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReOrderingCustomFieldsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
