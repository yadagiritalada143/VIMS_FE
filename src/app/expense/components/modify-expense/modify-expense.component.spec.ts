import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ModifyExpenseComponent } from './modify-expense.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('ModifyExpenseComponent', () => {
  let component: ModifyExpenseComponent;
  let fixture: ComponentFixture<ModifyExpenseComponent>;
  CommonTestingModule.setUpTestBed(ModifyExpenseComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(ModifyExpenseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
