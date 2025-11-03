import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TaxConfigurationComponent } from './tax-configuration.component';

describe('TaxConfigurationComponent', () => {
  let component: TaxConfigurationComponent;
  let fixture: ComponentFixture<TaxConfigurationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TaxConfigurationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TaxConfigurationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
