import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { NewVendorDocumentComponent } from './new-vendor-document.component';

describe('NewVendorDocumentComponent', () => {
  let component: NewVendorDocumentComponent;
  let fixture: ComponentFixture<NewVendorDocumentComponent>;
  CommonTestingModule.setUpTestBed(NewVendorDocumentComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ NewVendorDocumentComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NewVendorDocumentComponent);
    component = fixture.componentInstance;
    component.newDocumentForm = new UntypedFormGroup({
      'document_number' : new UntypedFormControl()
    })
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
