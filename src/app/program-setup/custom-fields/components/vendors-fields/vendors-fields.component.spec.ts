import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { VendorsFieldsComponent } from './vendors-fields.component';

describe('VendorsFieldsComponent', () => {
  let component: VendorsFieldsComponent;
  let fixture: ComponentFixture<VendorsFieldsComponent>;
  CommonTestingModule.setUpTestBed(VendorsFieldsComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ VendorsFieldsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VendorsFieldsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
