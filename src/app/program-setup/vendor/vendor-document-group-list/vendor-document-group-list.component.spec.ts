import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { VendorDocumentGroupListComponent } from './vendor-document-group-list.component';

describe('VendorDocumentGroupListComponent', () => {
  let component: VendorDocumentGroupListComponent;
  let fixture: ComponentFixture<VendorDocumentGroupListComponent>;
  CommonTestingModule.setUpTestBed(VendorDocumentGroupListComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ VendorDocumentGroupListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VendorDocumentGroupListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
