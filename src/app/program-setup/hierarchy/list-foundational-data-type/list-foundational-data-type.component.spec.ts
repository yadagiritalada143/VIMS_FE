import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { ListFoundationalDataTypeComponent } from './list-foundational-data-type.component';

describe('ListFoundationalDataTypeComponent', () => {
  let component: ListFoundationalDataTypeComponent;
  let fixture: ComponentFixture<ListFoundationalDataTypeComponent>;
  CommonTestingModule.setUpTestBed(ListFoundationalDataTypeComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ListFoundationalDataTypeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ListFoundationalDataTypeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
