import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ImpactedExpensesTableComponent } from './impacted-expenses-table.component';

describe('ImpactedExpensesTableComponent', () => {
  let component: ImpactedExpensesTableComponent;
  let fixture: ComponentFixture<ImpactedExpensesTableComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ImpactedExpensesTableComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ImpactedExpensesTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
