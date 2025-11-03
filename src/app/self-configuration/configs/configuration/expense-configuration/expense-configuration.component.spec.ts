import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExpenseConfigurationComponent } from './expense-configuration.component';

describe('ExpenseConfigurationComponent', () => {
  let component: ExpenseConfigurationComponent;
  let fixture: ComponentFixture<ExpenseConfigurationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ExpenseConfigurationComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ExpenseConfigurationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
