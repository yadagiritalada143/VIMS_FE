import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { InvoiceConfigurationListComponent } from './invoice-configuration-list.component';

describe('InvoiceConfigurationListComponent', () => {
  let component: InvoiceConfigurationListComponent;
  let fixture: ComponentFixture<InvoiceConfigurationListComponent>;
  CommonTestingModule.setUpTestBed(InvoiceConfigurationListComponent);
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ InvoiceConfigurationListComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InvoiceConfigurationListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
