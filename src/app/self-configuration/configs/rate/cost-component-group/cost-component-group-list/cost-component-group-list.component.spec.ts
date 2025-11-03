import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CostComponentGroupListComponent } from './cost-component-group-list.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('CostComponentGroupListComponent', () => {
  let component: CostComponentGroupListComponent;
  let fixture: ComponentFixture<CostComponentGroupListComponent>;
  CommonTestingModule.setUpTestBed(CostComponentGroupListComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(CostComponentGroupListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
