import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ViewLaborCategoryComponent } from './view-labor-category.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('ViewLaborCategoryComponent', () => {
  let component: ViewLaborCategoryComponent;
  let fixture: ComponentFixture<ViewLaborCategoryComponent>;
  CommonTestingModule.setUpTestBed(ViewLaborCategoryComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewLaborCategoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
