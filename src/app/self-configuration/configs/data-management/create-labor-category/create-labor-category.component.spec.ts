import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CreateLaborCategoryComponent } from './create-labor-category.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('CreateLaborCategoryComponent', () => {
  let component: CreateLaborCategoryComponent;
  let fixture: ComponentFixture<CreateLaborCategoryComponent>;
  CommonTestingModule.setUpTestBed(CreateLaborCategoryComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateLaborCategoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
