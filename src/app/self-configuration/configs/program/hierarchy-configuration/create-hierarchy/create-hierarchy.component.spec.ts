import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateHierarchyComponent } from './create-hierarchy.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('CreateHierarchyComponent', () => {
  let component: CreateHierarchyComponent;
  let fixture: ComponentFixture<CreateHierarchyComponent>;
  CommonTestingModule.setUpTestBed(CreateHierarchyComponent);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CreateHierarchyComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateHierarchyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
