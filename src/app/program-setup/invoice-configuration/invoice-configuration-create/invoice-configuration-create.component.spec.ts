import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { InvoiceConfigurationCreateComponent } from './invoice-configuration-create.component';

describe('InvoiceConfigurationCreateComponent', () => {
  let component: InvoiceConfigurationCreateComponent;
  let fixture: ComponentFixture<InvoiceConfigurationCreateComponent>;
  CommonTestingModule.setUpTestBed(InvoiceConfigurationCreateComponent);
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ InvoiceConfigurationCreateComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InvoiceConfigurationCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
