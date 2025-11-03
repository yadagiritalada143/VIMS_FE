import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { ReasonCodeCategoryComponent } from './reason-code-category.component';

describe('ReasonCodeCategoryComponent', () => {
  let component: ReasonCodeCategoryComponent;
  let fixture: ComponentFixture<ReasonCodeCategoryComponent>;
  CommonTestingModule.setUpTestBed(ReasonCodeCategoryComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ReasonCodeCategoryComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReasonCodeCategoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
