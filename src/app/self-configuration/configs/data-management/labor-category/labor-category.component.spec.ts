import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LaborCategoryComponent } from './labor-category.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('LaborCategoryComponent', () => {
  let component: LaborCategoryComponent;
  let fixture: ComponentFixture<LaborCategoryComponent>;
  CommonTestingModule.setUpTestBed(LaborCategoryComponent);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LaborCategoryComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LaborCategoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
