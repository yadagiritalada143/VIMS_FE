import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TaxSystemListComponent } from './tax-system-list.component';

describe('TaxSystemListComponent', () => {
  let component: TaxSystemListComponent;
  let fixture: ComponentFixture<TaxSystemListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TaxSystemListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TaxSystemListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
