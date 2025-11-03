import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ViewHierarchyComponent } from './view-hierarchy.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('ViewHierarchyComponent', () => {
  let component: ViewHierarchyComponent;
  let fixture: ComponentFixture<ViewHierarchyComponent>;
  CommonTestingModule.setUpTestBed(ViewHierarchyComponent);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ViewHierarchyComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewHierarchyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
