import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { InvoiceViewSidepanelComponent } from './invoice-view-sidepanel.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('InvoiceViewSidepanelComponent', () => {
  let component: InvoiceViewSidepanelComponent;
  let fixture: ComponentFixture<InvoiceViewSidepanelComponent>;
  CommonTestingModule.setUpTestBed(InvoiceViewSidepanelComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(InvoiceViewSidepanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
