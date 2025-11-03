import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CreateCostComponentComponent } from './create-cost-component.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('CreateCostComponentComponent', () => {
  let component: CreateCostComponentComponent;
  let fixture: ComponentFixture<CreateCostComponentComponent>;
  CommonTestingModule.setUpTestBed(CreateCostComponentComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateCostComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
